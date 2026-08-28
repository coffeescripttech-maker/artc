import { prisma, Prisma, type QuestionType } from "@aratc/database";
import {
  extractTextFromPdf,
  extractPdfWithBlocks,
  buildStructuredPdfContext,
  detectScannedPages,
  type PdfParsedDocument,
} from "../utils/pdf";
import { callGeminiJson, pdfInlineSizeLimit } from "../utils/gemini";
import { renderPdfPage, renderPdfImageRegion } from "../utils/pdf-render";
import {
  parsePdfWithMinerU,
  mineruAvailable,
  type MineruImage,
  type MineruParseResult,
} from "../utils/mineru";
import { ApiError } from "../../lib/errors";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// ============================================================
// Gemini Structured Output schema (sent alongside responseMimeType)
// ============================================================

export const QUESTION_TYPE_ENUM = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "identification",
  "fill_in_the_blank",
  "matching_type",
  "essay",
] as const;

const EXTRACTION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    documentSummary: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        totalQuestions: { type: "INTEGER" },
        questionTypes: { type: "ARRAY", items: { type: "STRING" } },
        hasAnswerKey: { type: "BOOLEAN" },
        processingWarnings: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
      required: ["totalQuestions", "hasAnswerKey", "questionTypes", "processingWarnings"],
    },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionNumber: { type: "INTEGER" },
          pageNumber: { type: "INTEGER" },
          type: { type: "STRING", enum: QUESTION_TYPE_ENUM },
          question: { type: "STRING" },
          choices: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING" },
                text: { type: "STRING" },
              },
              required: ["label", "text"],
            },
          },
          correctAnswer: { type: "STRING" },
          correctAnswerText: { type: "STRING" },
          explanation: { type: "STRING" },
          hasImage: { type: "BOOLEAN" },
          confidence: { type: "NUMBER" },
          extractionNote: { type: "STRING" },
          imageBox: {
            type: "OBJECT",
            properties: {
              x: { type: "NUMBER" },
              y: { type: "NUMBER" },
              width: { type: "NUMBER" },
              height: { type: "NUMBER" },
            },
            required: ["x", "y", "width", "height"],
          },
          imageBoxes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                x: { type: "NUMBER" },
                y: { type: "NUMBER" },
                width: { type: "NUMBER" },
                height: { type: "NUMBER" },
              },
              required: ["x", "y", "width", "height"],
            },
          },
          /** Budget mode: AI references a parser-detected image by id; the
           *  backend attaches the real bounding box. */
          imageId: { type: "STRING" },
          /** Budget mode: multiple parser-detected images referenced by id
           *  (e.g. ["page5-image1", "page5-image2"]). */
          imageIds: { type: "ARRAY", items: { type: "STRING" } },
          /** How confident the AI is that the referenced image(s) belong to
           *  this question (0-1). Admin-review/debug signal only. */
          imageMappingConfidence: { type: "NUMBER" },
          /** Why the AI associated the image(s) with this question â€” text
           *  reference, position between stem and choices, visual content.
           *  Admin-review/debug signal only; never shown to students. */
  imageMappingReason: { type: "STRING" },
          originalQuestionNumber: { type: "STRING" },
        },
        required: ["questionNumber", "type", "confidence", "hasImage"],
      },
    },
  },
  required: ["documentSummary", "questions"],
};

// ============================================================
// Zod schemas for post-parse validation (lenient on the fields the AI
// omits, strict on what the import pipeline needs)
// ============================================================

const ChoiceSchema = z.object({
  label: z.string().catch(""),
  text: z.string().catch(""),
});

const ImageBoxSchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  width: z.coerce.number(),
  height: z.coerce.number(),
});

/**
 * Maps common AI type-label variants back to the canonical QUESTION_TYPE_ENUM
 * so a slightly-off label ("matching", "multiple choice") doesn't abort the
 * whole extraction. Returns the canonical value or null when unrecognized.
 */
function coerceQuestionType(value: unknown): (typeof QUESTION_TYPE_ENUM)[number] | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase().replace(/[-\s/]+/g, "_");
  switch (v) {
    case "multiple_choice":
    case "multiple_choice_question":
    case "multiple_choice(mcq)":
    case "mcq":
    case "choice":
    case "single_choice":
      return "multiple_choice";
    case "multiple_select":
    case "multiple_selection":
    case "select_all":
    case "select_all_that_apply":
    case "multi_select":
    case "checkbox":
    case "checkboxes":
      return "multiple_select";
    case "true_false":
    case "true_or_false":
    case "tf":
    case "boolean":
      return "true_false";
    case "identification":
    case "identify":
    case "short_answer":
    case "short_response":
      return "identification";
    case "fill_in_the_blank":
    case "fill_in_the_blanks":
    case "fill_blank":
    case "blank":
    case "completion":
    case "cloze":
      return "fill_in_the_blank";
    case "matching_type":
    case "matching":
    case "match":
    case "matching_question":
      return "matching_type";
    case "essay":
    case "long_answer":
    case "long_response":
    case "open_ended":
    case "written":
    case "subjective":
      return "essay";
    default:
      return null;
  }
}

/** Coerces hasImage from common non-boolean AI values into a clean boolean. */
function coerceHasImage(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string")
    return ["true", "1", "yes", "y", "on"].includes(value.trim().toLowerCase());
  if (typeof value === "number") return value > 0;
  return false;
}

const ExtractedQuestionSchema = z.object({
  questionNumber: z.coerce.number(),
  originalQuestionNumber: z.string().nullable().optional(),
  pageNumber: z.coerce.number().optional().nullable(),
  type: z
    .preprocess(
      (val) => {
        const mapped = coerceQuestionType(val);
        return mapped ?? val;
      },
      z.enum(QUESTION_TYPE_ENUM).catch("multiple_choice")
    ),
  question: z.string().optional().default(""),
  choices: z.array(ChoiceSchema).optional().nullable().catch(null),
  correctAnswer: z.string().nullable().optional(),
  correctAnswerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  hasImage: z.preprocess((val) => coerceHasImage(val), z.boolean()).optional().default(false),
  confidence: z.coerce.number().min(0).max(1).optional().default(1),
  extractionNote: z.string().nullable().optional(),
  /** Bounding box of the single image on its page, as percentages (0-100). */
  imageBox: ImageBoxSchema.nullable().optional().catch(null),
  /** Multiple bounding boxes when a question depends on several visual regions. */
  imageBoxes: z.array(ImageBoxSchema).optional().default([]).catch([]),
  /** Budget mode: reference to a parser-detected image (e.g. "page3-image1").
   *  The backend resolves this to a real bounding box â€” the AI never computes
   *  coordinates itself. */
  imageId: z.string().nullable().optional(),
  /** Budget mode: multiple parser-detected image references. The backend
   *  resolves each id to a real bounding box. */
  imageIds: z.array(z.string()).optional().default([]).catch([]),
  /** AI's confidence (0-1) that the referenced image(s) belong to this
   *  question. Admin-review/debug signal only. */
  imageMappingConfidence: z.coerce.number().min(0).max(1).nullable().optional(),
  /** Why the AI associated the image(s) with this question. Admin-review/
   *  debug signal only; never shown to students. */
  imageMappingReason: z.string().nullable().optional(),
  /** URL to the rendered page image (set during preview for hasImage questions). */
  mediaUrl: z.string().nullish(),
  /** Structured flags set by the backend normalizer (e.g. "stem-missing",
   *  "duplicate"). Admin-review/debug signal only. */
  extractionIssues: z.array(z.string()).optional().default([]),
});

const DocumentSummarySchema = z.object({
  title: z.string().nullable().optional(),
  totalQuestions: z.coerce.number(),
  questionTypes: z.array(z.string()).optional().default([]),
  /** older prompt shape â€” tolerated, prefer questionTypes */
  detectedQuestionTypes: z.array(z.string()).optional(),
  hasAnswerKey: z.boolean().optional().default(false),
  answerKeyLocation: z.string().nullable().optional(),
  processingWarnings: z.array(z.string()).optional().default([]),
});

const ExtractionResultSchema = z.object({
  documentSummary: DocumentSummarySchema,
  questions: z.array(ExtractedQuestionSchema),
});

type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ExtractionResult = {
  documentSummary: {
    title: string | null;
    totalQuestions: number;
    questionTypes: string[];
    hasAnswerKey: boolean;
    answerKeyLocation: string | null;
    processingWarnings: string[];
  };
  questions: ExtractedQuestion[];
};

/**
 * Tolerant parse of the Gemini JSON result. Returns a best-effort
 * documentSummary + questions array. Items that fail the per-question schema
 * are dropped individually (and counted) instead of aborting the whole
 * extraction — so a single malformed question never wipes out the rest.
 */
function parseExtractionResultTolerant(raw: unknown): {
  documentSummary: z.infer<typeof DocumentSummarySchema>;
  questions: ExtractedQuestion[];
  dropped: string[];
} {
  const dropped: string[] = [];
  let doc: z.infer<typeof DocumentSummarySchema>;

  // documentSummary: best-effort, fall back to a sensible empty construct.
  const rawDoc =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).documentSummary
      : undefined;
  const docParse = DocumentSummarySchema.safeParse(rawDoc ?? {});
  doc = docParse.success
    ? docParse.data
    : {
        title: null,
        totalQuestions: 0,
        questionTypes: [],
        hasAnswerKey: false,
        answerKeyLocation: null,
        processingWarnings: [],
      };

  // questions: per-item parse, skipping only the truly broken ones.
  const rawQs =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).questions
      : undefined;
  const questions: ExtractedQuestion[] = [];
  if (Array.isArray(rawQs)) {
    for (const item of rawQs) {
      const parsed = ExtractedQuestionSchema.safeParse(item);
      if (parsed.success) {
        questions.push(parsed.data);
      } else {
        const reason = parsed.error?.issues?.[0]?.message || "malformed item";
        dropped.push(reason);
      }
    }

    // If the whole array failed schema but items exist, try to salvage.
    if (questions.length === 0 && rawQs.length > 0) {
      const salvaged = rawQs
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const r = ExtractedQuestionSchema.safeParse({
            questionNumber: 0,
            type: "multiple_choice",
            question: "",
            confidence: 0,
            hasImage: false,
            ...(item as object),
          });
          return r.success ? r.data : null;
        })
        .filter((q): q is ExtractedQuestion => q !== null);
      // Only use salvaged if it recovered at least something.
      if (salvaged.length > 0) {
        questions.push(...salvaged);
      }
    }
  }

  return { documentSummary: doc, questions, dropped };
}

// ============================================================
// Text extraction from PDF
// ============================================================

/**
 * Extracts text content from a PDF file buffer.
 * Uses unpdf for fast, serverless-friendly extraction (in-memory only).
 */
export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  return extractTextFromPdf(fileBuffer);
}

// ============================================================
// Gemini extraction â€” returns the preview JSON
// ============================================================

/**
 * Sends extracted PDF text to Gemini for structured question extraction.
 * Uses Gemini Structured Output (responseMimeType: "application/json" +
 * responseSchema) so the response is guaranteed to be valid JSON.
 *
 * When an optional `pdfBuffer` is supplied (the original uploaded file), it is
 * attached as inline data so Gemini can read images, diagrams, graphs, tables,
 * and formulas that the text extraction missed. PDFs above the inline size
 * limit are processed text-only and a warning is surfaced in the result.
 */
export async function previewExtraction(
  pdfText: string,
  programName?: string,
  subjectName?: string,
  pdfBuffer?: Buffer
): Promise<ExtractionResult> {
  if (!pdfText || !pdfText.trim()) {
    throw new ApiError("PDF text is empty â€” nothing to extract from.", 400);
  }

  const prompt = buildExtractionPrompt(programName, subjectName);

  // Attach the original PDF when it fits the inline-data ceiling so Gemini
  // can see diagrams/images/formulas the text layer omits.
  const tooLargeForVision = !!pdfBuffer && pdfBuffer.length > pdfInlineSizeLimit();
  const attachPdf = pdfBuffer && pdfBuffer.length > 0 && !tooLargeForVision ? pdfBuffer : undefined;

  let raw: string;
  try {
    raw = await callGeminiJson(pdfText, prompt, EXTRACTION_RESPONSE_SCHEMA, attachPdf);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "AI extraction failed. Please try again.",
      502
    );
  }

  // With responseMimeType=application/json Gemini returns pure JSON, but some
  // proxies / preview builds wrap it in code fences â€” strip them anyway.
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError("The AI returned an unexpected response format. Please try again.", 502);
  }

    // Tolerant parse: keep the whole extraction even if a few questions are
  // malformed. Log diagnostics when a question had to be dropped so the
  // schemas/prompt can be tightened later.
  const tolerated = parseExtractionResultTolerant(parsed);
  if (tolerated.dropped.length > 0) {
    if (process.env.DEBUG_PDF === "1" || process.env.DEBUG_EXTRACTION === "1") {
      console.warn(
        "[extraction-schema] dropped questions:",
        JSON.stringify(tolerated.dropped, null, 2)
      );
    }
  }
  if (!tolerated.documentSummary || !Array.isArray(tolerated.questions)) {
    throw new ApiError(
      "The AI response did not match the expected question format. Please try again.",
      502
    );
  }

    // Post-process: normalize answer fields, dedupe, gather warnings.
  const { questions, droppedDuplicates, flaggedDuplicates, emptyStems } =
    normalizeQuestions(tolerated.questions);
  const summaryIn = tolerated.documentSummary;

  const processingWarnings = [...summaryIn.processingWarnings];
  if (tooLargeForVision) {
    processingWarnings.unshift(
      `PDF exceeds ${Math.round(
        pdfInlineSizeLimit() / (1024 * 1024)
      )}MB â€” images and diagrams were not analyzed; processed text only.`
    );
  }
  if (tolerated.dropped.length > 0) {
    processingWarnings.push(
      `${tolerated.dropped.length} question${tolerated.dropped.length === 1 ? "" : "s"} skipped because the AI format was unreadable — review the PDF and try again for those.`
    );
  }
  if (droppedDuplicates > 0) {
    processingWarnings.push(
      `${droppedDuplicates} duplicate question${droppedDuplicates === 1 ? "" : "s"} removed`
    );
  }
  if (emptyStems > 0) {
    processingWarnings.push(
      `${emptyStems} question${emptyStems === 1 ? "" : "s"} had missing text stems â€” review before importing`
    );
  }
  if (flaggedDuplicates > 0) {
    processingWarnings.push(
      `${flaggedDuplicates} possible duplicate${flaggedDuplicates === 1 ? "" : "s"} flagged for review`
    );
  }
  if (summaryIn.totalQuestions > questions.length) {
    processingWarnings.push(
      `Expected ${summaryIn.totalQuestions} questions, extracted ${questions.length} after deduplication`
    );
  }

  // Render PDF pages for image-based questions so the teacher (and later
  // students) can see the actual diagram/graph/table. We render just the
  // specific image region when Gemini gives us a bounding box; otherwise
  // we fall back to rendering the full page.
  const imageQuestions = questions.filter((q) => q.hasImage && q.pageNumber);
  if (process.env.DEBUG_PDF === "1") {
    console.log("[preview-service] imageQuestions:", imageQuestions.length);
    console.log(
      "[preview-service] pdfBuffer:",
      pdfBuffer?.length,
      "bytes, tooLarge:",
      tooLargeForVision
    );
    imageQuestions.forEach((q) =>
      console.log(
        "[preview-service] image Q:",
        q.questionNumber,
        "page:",
        q.pageNumber,
        "imageBox:",
        q.imageBox ? JSON.stringify(q.imageBox) : "none"
      )
    );
  }
  if (pdfBuffer && pdfBuffer.length > 0 && imageQuestions.length > 0 && !tooLargeForVision) {
    const uploadDir = path.resolve(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const baseUrl = process.env.API_URL || "http://localhost:4000";

    for (const q of imageQuestions) {
      const pageNum = q.pageNumber!;
      try {
        let png: Buffer | null;

        if (q.imageBox) {
          // Crop to just the diagram/image region identified by Gemini.
          png = await renderPdfImageRegion(pdfBuffer, pageNum, q.imageBox, 2);
          if (process.env.DEBUG_PDF === "1") {
            console.log(
              `[preview-service] Cropped page ${pageNum} for Q${q.questionNumber}, imageBox:`,
              q.imageBox,
              "â†’",
              png?.length ?? 0,
              "bytes"
            );
          }
        } else {
          // No bounding box â€” fall back to full page render.
          png = await renderPdfPage(pdfBuffer, pageNum, 2);
          if (process.env.DEBUG_PDF === "1") {
            console.log(
              `[preview-service] Rendered full page ${pageNum} for Q${q.questionNumber} â†’`,
              png?.length ?? 0,
              "bytes"
            );
          }
        }

        if (!png) continue;

        const filename = `pdf-image-${q.questionNumber}-${crypto.randomBytes(6).toString("hex")}.png`;
        await fs.writeFile(path.join(uploadDir, filename), png);
        q.mediaUrl = `${baseUrl.replace(/\/$/, "")}/uploads/${filename}`;
      } catch (err) {
        // Rendering failure for one page shouldn't fail the whole extraction.
        processingWarnings.push(
          `Could not render page ${pageNum} as image: ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }
    }
  }

  const questionTypes =
    summaryIn.questionTypes.length > 0
      ? summaryIn.questionTypes
      : (summaryIn.detectedQuestionTypes ?? []);

  return {
    documentSummary: {
      title: summaryIn.title ?? null,
      totalQuestions: questions.length,
      questionTypes,
      hasAnswerKey: summaryIn.hasAnswerKey,
      answerKeyLocation: summaryIn.answerKeyLocation ?? null,
      processingWarnings,
    },
    questions,
  };
}

/**
 * Enhanced extraction that uses block-level PDF parsing to provide Gemini
 * with structured text blocks (with bounding boxes) and detected images.
 *
 * Workflow:
 * 1. PyMuPDF-style block extraction via pdfjs â†’ text blocks + image bboxes + page dims
 * 2. Build a structured context string with positional information
 * 3. Send text + structure + visual PDF to Gemini â†’ questions with precise imageBox coords
 * 4. Render only the specific image regions for hasImage questions
 * 5. Validate with Zod
 */
export async function previewExtractionSmart(
  pdfBuffer: Buffer,
  programName?: string,
  subjectName?: string
): Promise<ExtractionResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new ApiError("PDF buffer is required for smart extraction.", 400);
  }

  // Step 1: Parse PDF structure (text blocks + image bounding boxes).
  let parsedDoc;
  try {
    parsedDoc = await extractPdfWithBlocks(pdfBuffer);
  } catch (err) {
    throw new ApiError(
      `Failed to parse PDF structure: ${err instanceof Error ? err.message : "unknown error"}`,
      422
    );
  }

  const prompt = buildExtractionPrompt(programName, subjectName);

  // Build a combined text + structure context for Gemini.
  const structuredContext = buildStructuredPdfContext(parsedDoc);
  const combinedText = `${parsedDoc.fullText}\n\n=== BLOCK-LEVEL STRUCTURE ===\n${structuredContext}`;

  // Step 2: Call Gemini with text + structure + visual PDF attached.
  const tooLargeForVision = pdfBuffer.length > pdfInlineSizeLimit();
  const attachPdf = pdfBuffer.length > 0 && !tooLargeForVision ? pdfBuffer : undefined;

  let raw: string;
  try {
    raw = await callGeminiJson(combinedText, prompt, EXTRACTION_RESPONSE_SCHEMA, attachPdf);
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "AI extraction failed.", 502);
  }

  // Step 3: Parse and validate.
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError("AI returned malformed JSON.", 502);
  }

  // Tolerant parse — a few malformed questions shouldn't abort extraction.
  const tolerated = parseExtractionResultTolerant(parsed);
  if (tolerated.dropped.length > 0) {
    if (process.env.DEBUG_PDF === "1" || process.env.DEBUG_EXTRACTION === "1") {
      console.warn(
        "[extraction-schema-smart] dropped questions:",
        JSON.stringify(tolerated.dropped, null, 2)
      );
    }
  }
  if (!tolerated.documentSummary || !Array.isArray(tolerated.questions)) {
    throw new ApiError("AI response did not match expected schema.", 502);
  }

    // Step 4: Normalize questions (dedup, answer normalization).
  const { questions, droppedDuplicates, flaggedDuplicates, emptyStems } =
    normalizeQuestions(tolerated.questions);
  const summaryIn = tolerated.documentSummary;

  const processingWarnings = [...summaryIn.processingWarnings];
  if (tooLargeForVision) {
    processingWarnings.unshift(
      `PDF exceeds ${Math.round(pdfInlineSizeLimit() / (1024 * 1024))}MB â€” images not analyzed.`
    );
  }
  if (tolerated.dropped.length > 0) {
    processingWarnings.push(
      `${tolerated.dropped.length} question${tolerated.dropped.length === 1 ? "" : "s"} skipped because the AI format was unreadable — review the PDF and try again for those.`
    );
  }
  if (droppedDuplicates > 0) {
    processingWarnings.push(
      `${droppedDuplicates} duplicate question${droppedDuplicates === 1 ? "" : "s"} removed`
    );
  }
  if (emptyStems > 0) {
    processingWarnings.push(
      `${emptyStems} question${emptyStems === 1 ? "" : "s"} had missing text stems â€” review before importing`
    );
  }
  if (flaggedDuplicates > 0) {
    processingWarnings.push(
      `${flaggedDuplicates} possible duplicate${flaggedDuplicates === 1 ? "" : "s"} flagged for review`
    );
  }
  if (summaryIn.totalQuestions > questions.length) {
    processingWarnings.push(
      `Expected ${summaryIn.totalQuestions} questions, extracted ${questions.length} after deduplication`
    );
  }

  // Step 5: Render image regions for hasImage questions.
  await renderImageRegions(questions, pdfBuffer, processingWarnings);

  return {
    documentSummary: {
      title: summaryIn.title ?? null,
      totalQuestions: questions.length,
      questionTypes:
        summaryIn.questionTypes.length > 0
          ? summaryIn.questionTypes
          : (summaryIn.detectedQuestionTypes ?? []),
      hasAnswerKey: summaryIn.hasAnswerKey,
      answerKeyLocation: summaryIn.answerKeyLocation ?? null,
      processingWarnings,
    },
    questions,
  };
}

/**
 * Budget (structured) extraction â€” the cost-saving workflow.
 *
 * Instead of uploading the PDF to Gemini (vision tokens are the expensive
 * part), this mode:
 *   1. Parses the PDF locally (pdfjs â€” the Node equivalent of PyMuPDF):
 *      pages, text blocks with coordinates, images with ids + bounding boxes.
 *   2. Detects scanned pages (little/no text) and warns â€” those need vision/OCR.
 *   3. Sends ONLY the structured text context to Gemini (text-only call).
 *   4. The AI references images by id ("page3-image1"); the backend attaches
 *      the real bounding boxes from the parsed document.
 *   5. Renders the referenced image regions locally for preview/media.
 *
 * An optional `editedText` (the admin-reviewed text from step 2) overrides the
 * parser's raw text as the primary source so manual fixes are respected.
 */
export async function previewExtractionStructured(
  pdfBuffer: Buffer,
  programName?: string,
  subjectName?: string,
  editedText?: string
): Promise<ExtractionResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new ApiError("PDF buffer is required for structured extraction.", 400);
  }

  // Step 1: Parse PDF structure locally (text blocks + image bboxes + ids).
  let parsedDoc: PdfParsedDocument;
  try {
    parsedDoc = await extractPdfWithBlocks(pdfBuffer);
  } catch (err) {
    throw new ApiError(
      `Failed to parse PDF structure: ${err instanceof Error ? err.message : "unknown error"}`,
      422
    );
  }

  const baseText = editedText && editedText.trim() ? editedText : parsedDoc.fullText;
  if (!baseText.trim()) {
    throw new ApiError(
      "No extractable text found in this PDF. It may be a scanned document â€” use Smart mode (vision) instead.",
      422
    );
  }

  const prompt = buildExtractionPrompt(programName, subjectName, { budgetMode: true });

  // Step 2: Build the structured context (text + blocks + image ids).
  const structuredContext = buildStructuredPdfContext(parsedDoc);
  const combinedText = `${baseText}\n\n=== BLOCK-LEVEL STRUCTURE ===\n${structuredContext}`;

  // Step 3: Text-only Gemini call â€” NO PDF attachment (this is the saving).
  let raw: string;
  try {
    raw = await callGeminiJson(combinedText, prompt, EXTRACTION_RESPONSE_SCHEMA);
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "AI extraction failed.", 502);
  }

  // Step 4: Parse and validate.
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError("AI returned malformed JSON.", 502);
  }

  // Tolerant parse — a few malformed questions shouldn't abort extraction.
  const tolerated = parseExtractionResultTolerant(parsed);
  if (tolerated.dropped.length > 0) {
    if (process.env.DEBUG_PDF === "1" || process.env.DEBUG_EXTRACTION === "1") {
      console.warn(
        "[extraction-schema-budget] dropped questions:",
        JSON.stringify(tolerated.dropped, null, 2)
      );
    }
  }
  if (!tolerated.documentSummary || !Array.isArray(tolerated.questions)) {
    throw new ApiError("AI response did not match expected schema.", 502);
  }

    // Step 5: Normalize (dedup, answer normalization).
  const { questions, droppedDuplicates, flaggedDuplicates, emptyStems } =
    normalizeQuestions(tolerated.questions);
  const summaryIn = tolerated.documentSummary;

  const processingWarnings = [...summaryIn.processingWarnings];

  if (tolerated.dropped.length > 0) {
    processingWarnings.push(
      `${tolerated.dropped.length} question${tolerated.dropped.length === 1 ? "" : "s"} skipped because the AI format was unreadable — review the PDF and try again for those.`
    );
  }

  const scannedPages = detectScannedPages(parsedDoc);
  if (scannedPages.length > 0) {
    processingWarnings.unshift(
      `Scanned/image-only pages detected (${scannedPages.join(", ")}) â€” their content was NOT read. Re-run in Smart mode to capture them.`
    );
  }
  if (droppedDuplicates > 0) {
    processingWarnings.push(
      `${droppedDuplicates} duplicate question${droppedDuplicates === 1 ? "" : "s"} removed`
    );
  }
  if (emptyStems > 0) {
    processingWarnings.push(
      `${emptyStems} question${emptyStems === 1 ? "" : "s"} had missing text stems â€” review before importing`
    );
  }
  if (flaggedDuplicates > 0) {
    processingWarnings.push(
      `${flaggedDuplicates} possible duplicate${flaggedDuplicates === 1 ? "" : "s"} flagged for review`
    );
  }
  if (summaryIn.totalQuestions > questions.length) {
    processingWarnings.push(
      `Expected ${summaryIn.totalQuestions} questions, extracted ${questions.length} after deduplication`
    );
  }

  // Step 6: Resolve image references to real bounding boxes. The backend
  // owns the coordinates â€” the AI only ever supplies imageId/imageIds.
  // Every reference is validated against the parsed document; unknown ids
  // are dropped with a warning (never trusted blindly).
  const imageIndex = new Map<
    string,
    { pageNumber: number; bbox: { x: number; y: number; width: number; height: number } }
  >();
  for (const page of parsedDoc.pages) {
    for (const img of page.images) {
      imageIndex.set(img.id, { pageNumber: page.pageNumber + 1, bbox: img.bbox });
    }
  }

  for (const q of questions) {
    // Collect all referenced ids (single + multi), preserving order, deduped.
    const referencedIds = [...new Set([...(q.imageIds ?? []), ...(q.imageId ? [q.imageId] : [])])];
    if (referencedIds.length === 0) continue;

    const resolved: {
      pageNumber: number;
      bbox: { x: number; y: number; width: number; height: number };
    }[] = [];
    for (const id of referencedIds) {
      const found = imageIndex.get(id);
      if (found) {
        resolved.push(found);
      } else {
        processingWarnings.push(
          `Q${q.questionNumber} referenced image "${id}" which was not found in the document â€” image skipped.`
        );
      }
    }

    if (resolved.length > 0) {
      // Primary image = the first resolved reference (drives pageNumber +
      // imageBox for backwards compatibility); extras go into imageBoxes.
      const [primary, ...rest] = resolved;
      q.pageNumber = primary.pageNumber;
      q.imageBox = primary.bbox;
      q.imageBoxes = rest.map((r) => r.bbox);
      q.hasImage = true;
    } else {
      q.hasImage = false;
    }
  }

  // Step 7: Render image regions locally for preview/media.
  await renderImageRegions(questions, pdfBuffer, processingWarnings);

  return {
    documentSummary: {
      title: summaryIn.title ?? null,
      totalQuestions: questions.length,
      questionTypes:
        summaryIn.questionTypes.length > 0
          ? summaryIn.questionTypes
          : (summaryIn.detectedQuestionTypes ?? []),
      hasAnswerKey: summaryIn.hasAnswerKey,
      answerKeyLocation: summaryIn.answerKeyLocation ?? null,
      processingWarnings,
    },
    questions,
  };
}

/**
 * MinerU extraction â€” highest-fidelity LOCAL parsing, cheapest AI call.
 *
 * Workflow:
 * 1. MinerU (self-hosted HTTP service or local CLI) parses the PDF locally:
 *    layout-aware Markdown, OCR for scanned pages, tables â†’ HTML, formulas
 *    â†’ LaTeX, figures extracted with captions.
 * 2. The Markdown + an image index (stable ids like "page3-image1") are sent
 *    to Gemini as TEXT ONLY â€” no vision, no PDF attachment (the saving).
 * 3. The AI references figures by id only (imageId/imageIds + mapping
 *    confidence); the backend validates every id and attaches the real
 *    figure bytes MinerU already extracted.
 */
export async function previewExtractionMinerU(
  pdfBuffer: Buffer,
  programName?: string,
  subjectName?: string
): Promise<ExtractionResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new ApiError("PDF buffer is required for MinerU extraction.", 400);
  }
  if (!(await mineruAvailable())) {
    throw new ApiError(
      "MinerU is not enabled on this server. Set MINERU_ENABLED=true and configure MINERU_API_URL (or install the MinerU CLI), then try again.",
      501
    );
  }

  // Step 1: High-fidelity local parse (OCR/tables/formulas/figures).
  let parsed: MineruParseResult;
  try {
    parsed = await parsePdfWithMinerU(pdfBuffer);
  } catch (err) {
    throw new ApiError(
      `MinerU parsing failed: ${err instanceof Error ? err.message : "unknown error"}`,
      502
    );
  }

  if (!parsed.markdown.trim()) {
    throw new ApiError(
      "MinerU could not extract readable content from this PDF. Try Smart mode (vision) instead.",
      422
    );
  }

  // Step 2: Image index â€” the AI references figures by id, never coordinates.
  const imageIndex = new Map<string, MineruImage>();
  for (const img of parsed.images) {
    imageIndex.set(img.id, img);
  }
  const imageContextLines = parsed.images.map(
    (img) =>
      `  [IMAGE id="${img.id}"] page=${img.pageNumber}` +
      (img.caption ? ` caption="${img.caption}"` : "")
  );

  const prompt = buildExtractionPrompt(programName, subjectName, { budgetMode: true });
  const combinedText =
    `${parsed.markdown}\n\n=== EXTRACTED FIGURES INDEX ===\n` +
    (imageContextLines.length > 0 ? imageContextLines.join("\n") : "  (no figures extracted)");

  // Step 3: Text-only Gemini call â€” NO PDF attachment (this is the saving).
  let raw: string;
  try {
    raw = await callGeminiJson(combinedText, prompt, EXTRACTION_RESPONSE_SCHEMA);
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "AI extraction failed.", 502);
  }

  // Step 4: Parse and validate.
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let aiResult: unknown;
  try {
    aiResult = JSON.parse(cleaned);
  } catch {
    throw new ApiError("AI returned malformed JSON.", 502);
  }
  // Tolerant parse — a few malformed questions shouldn't abort extraction.
  const tolerated = parseExtractionResultTolerant(aiResult);
  if (tolerated.dropped.length > 0) {
    if (process.env.DEBUG_PDF === "1" || process.env.DEBUG_EXTRACTION === "1") {
      console.warn(
        "[extraction-schema-mineru] dropped questions:",
        JSON.stringify(tolerated.dropped, null, 2)
      );
    }
  }
  if (!tolerated.documentSummary || !Array.isArray(tolerated.questions)) {
    throw new ApiError("AI response did not match expected schema.", 502);
  }

  // Step 5: Normalize (dedup, answer normalization).
  const { questions, droppedDuplicates } = normalizeQuestions(tolerated.questions);
  const summaryIn = tolerated.documentSummary;

  const processingWarnings = [...summaryIn.processingWarnings];
  processingWarnings.unshift(
    `Parsed locally with MinerU (${parsed.transport}) â€” ${parsed.pages} page(s), ${parsed.images.length} figure(s) extracted.`
  );
  processingWarnings.push(...parsed.warnings);
  if (tolerated.dropped.length > 0) {
    processingWarnings.push(
      `${tolerated.dropped.length} question${tolerated.dropped.length === 1 ? "" : "s"} skipped because the AI format was unreadable — review the PDF and try again for those.`
    );
  }
  if (droppedDuplicates > 0) {
    processingWarnings.push(
      `${droppedDuplicates} duplicate question${droppedDuplicates === 1 ? "" : "s"} removed`
    );
  }
  if (summaryIn.totalQuestions > questions.length) {
    processingWarnings.push(
      `Expected ${summaryIn.totalQuestions} questions, extracted ${questions.length} after deduplication`
    );
  }

  // Step 6: Resolve image references â€” every id is validated against the
  // MinerU image index; unknown ids are dropped with a warning (never
  // trusted blindly).
  const uploadDir = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const baseUrl = process.env.API_URL || "http://localhost:4000";

  for (const q of questions) {
    const referencedIds = [...new Set([...(q.imageIds ?? []), ...(q.imageId ? [q.imageId] : [])])];
    if (referencedIds.length === 0) continue;

    const resolved: MineruImage[] = [];
    for (const id of referencedIds) {
      const found = imageIndex.get(id);
      if (found) {
        resolved.push(found);
      } else {
        processingWarnings.push(
          `Q${q.questionNumber} referenced image "${id}" which was not found in the document â€” image skipped.`
        );
      }
    }

    if (resolved.length === 0) {
      q.hasImage = false;
      continue;
    }

    // Primary image drives pageNumber/imageBox (backwards compatible);
    // extras go into imageBoxes.
    const [primary, ...rest] = resolved;
    q.pageNumber = primary.pageNumber;
    if (primary.bbox) {
      q.imageBox = primary.bbox;
      const extraBoxes = rest
        .map((r) => r.bbox)
        .filter((b): b is { x: number; y: number; width: number; height: number } => !!b);
      if (extraBoxes.length > 0) q.imageBoxes = extraBoxes;
    }
    q.hasImage = true;

    // MinerU already extracted the real figure bytes â€” write the first one
    // with bytes for preview/media (no PDF re-rendering needed).
    const imageBytes =
      resolved.find((img) => img.bytes && img.bytes.length > 0)?.bytes ?? null;
    if (imageBytes) {
      try {
        const ext = imageBytes[0] === 0x89 ? "png" : "jpg";
        const filename = `pdf-image-${q.questionNumber}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
        await fs.writeFile(path.join(uploadDir, filename), imageBytes);
        q.mediaUrl = `${baseUrl.replace(/\/$/, "")}/uploads/${filename}`;
      } catch (err) {
        processingWarnings.push(
          `Failed to save image for Q${q.questionNumber}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }
    } else {
      processingWarnings.push(
        `Q${q.questionNumber}: figure matched but MinerU returned no image bytes.`
      );
    }
  }

  return {
    documentSummary: {
      title: summaryIn.title ?? null,
      totalQuestions: questions.length,
      questionTypes:
        summaryIn.questionTypes.length > 0
          ? summaryIn.questionTypes
          : (summaryIn.detectedQuestionTypes ?? []),
      hasAnswerKey: summaryIn.hasAnswerKey,
      answerKeyLocation: summaryIn.answerKeyLocation ?? null,
      processingWarnings,
    },
    questions,
  };
}

/**
 * Renders image regions for questions marked hasImage.
 * Uses imageBox when available; falls back to individual imageBoxes;
 * ultimately falls back to full page render.
 */
async function renderImageRegions(
  questions: ExtractedQuestion[],
  pdfBuffer: Buffer,
  processingWarnings: string[]
): Promise<void> {
  const imageQuestions = questions.filter((q) => q.hasImage && q.pageNumber);

  if (process.env.DEBUG_PDF === "1") {
    console.log("[preview-service] imageQuestions:", imageQuestions.length);
    console.log("[preview-service] pdfBuffer:", pdfBuffer?.length, "bytes");
    imageQuestions.forEach((q) =>
      console.log(
        "[preview-service] image Q:",
        q.questionNumber,
        "page:",
        q.pageNumber,
        "imageBox:",
        q.imageBox ? JSON.stringify(q.imageBox) : "none",
        "imageBoxes:",
        q.imageBoxes?.length ?? 0
      )
    );
  }

  if (!pdfBuffer || pdfBuffer.length === 0 || imageQuestions.length === 0) return;

  const uploadDir = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const baseUrl = process.env.API_URL || "http://localhost:4000";

  for (const q of imageQuestions) {
    const pageNum = q.pageNumber!;
    try {
      let png: Buffer | null = null;

      if (q.imageBoxes && q.imageBoxes.length > 0) {
        // Multiple visuals: render the largest one.
        const largest = q.imageBoxes.reduce((max, curr) =>
          curr.width * curr.height > max.width * max.height ? curr : max
        );
        png = await renderPdfImageRegion(pdfBuffer, pageNum, largest, 3);
      } else if (q.imageBox) {
        png = await renderPdfImageRegion(pdfBuffer, pageNum, q.imageBox, 3);
      } else {
        png = await renderPdfPage(pdfBuffer, pageNum, 3);
      }

      if (!png) {
        processingWarnings.push(`Could not render image for Q${q.questionNumber}`);
        continue;
      }

      const filename = `pdf-image-${q.questionNumber}-${crypto.randomBytes(6).toString("hex")}.png`;
      await fs.writeFile(path.join(uploadDir, filename), png);
      q.mediaUrl = `${baseUrl.replace(/\/$/, "")}/uploads/${filename}`;
    } catch (err) {
      processingWarnings.push(
        `Failed to render Q${q.questionNumber} image: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }
}

/**
 * Light server-side cleanup so Gemini hiccups don't reach the DB:
 *  - flag (but preserve) questions with empty stems for admin review
 *  - flag possible duplicates instead of silently dropping them
 *  - fall back to correctAnswerText for non-choice types
 *  - convert a full-answer-text correctAnswer into its choice label
 *  - normalize True/False answer spelling
 */
function normalizeQuestions(raw: ExtractedQuestion[]): {
  questions: ExtractedQuestion[];
  droppedDuplicates: number;
  flaggedDuplicates: number;
  emptyStems: number;
} {
  const seen = new Map<string, number>(); // key -> first index
  const questions: ExtractedQuestion[] = [];
  let droppedDuplicates = 0;
  let flaggedDuplicates = 0;
  let emptyStems = 0;

  for (const q of raw) {
    const key = q.question.toLowerCase().replace(/\s+/g, " ").trim();

    // Preserve ALL questions. Flag (rather than drop) problematic ones so the
    // admin can review and repair them.
    const next: ExtractedQuestion = { ...q };
    const issues: string[] = [];

    // Empty / missing question stem â€” flag it but keep the question so the
    // admin can fill it in. Do not dedupe against empty stems (they collide).
    if (!next.question || !next.question.trim()) {
      emptyStems++;
      next.question = "";
      const existingNote = next.extractionNote ? `${next.extractionNote}; ` : "";
      next.extractionNote = `${existingNote}Question text stem is missing from the document.`.trim();
      issues.push("stem-missing");
      // Push even though no dedup key â€” skip the dedup block below.
      // We still run the answer-normalization steps below.
    } else {
      // Dedup: flag near-duplicates but preserve the FIRST occurrence.
      if (seen.has(key)) {
        flaggedDuplicates++;
        const firstIdx = seen.get(key)!;
        const existingNote = next.extractionNote ? `${next.extractionNote}; ` : "";
        next.extractionNote = `${existingNote}Possible duplicate of Q${firstIdx + 1}`.trim();
        issues.push("duplicate");
        // Still push to questions[] so the admin can decide â€” it is NOT dropped.
        seen.set(key, questions.length); // update to latest index
      } else {
        seen.set(key, questions.length);
      }
    }

    // Non-choice questions: Gemini sometimes only fills correctAnswerText.
    if (!next.correctAnswer && next.correctAnswerText) {
      const isChoice = next.type === "multiple_choice" || next.type === "multiple_select";
      if (!isChoice) next.correctAnswer = next.correctAnswerText;
    }

    // Multiple-choice: an answer given as the full choice text â†’ map to label.
    const choices = next.choices;
    if (choices && choices.length > 0 && next.correctAnswer) {
      const answer = next.correctAnswer.trim();
      const byLabel = choices.find((c) => c.label?.trim().toUpperCase() === answer.toUpperCase());
      if (!byLabel) {
        const byText = choices.find((c) => c.text?.trim().toLowerCase() === answer.toLowerCase());
        if (byText) next.correctAnswer = byText.label;
      }
      // Multiple-select: expand full-text answers to their labels.
      if (next.type === "multiple_select") {
        const parts = answer
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const labels = parts.map((p) => {
          const exact = choices.find((c) => c.label?.trim() === p);
          if (exact) return p;
          const byT = choices.find((c) => c.text?.trim().toLowerCase() === p.toLowerCase());
          return byT?.label ?? p;
        });
        next.correctAnswer = labels.join(",");
      }
    }

    // True/False: collapse A/B/T/F into canonical true/false.
    if (next.type === "true_false" && next.correctAnswer) {
      const a = next.correctAnswer.trim().toLowerCase();
      if (["true", "t", "a"].includes(a)) next.correctAnswer = "true";
      else if (["false", "f", "b"].includes(a)) next.correctAnswer = "false";
    }

    // Attach a structured issues array for the frontend to act on.
    if (issues.length > 0) {
      (next as any).extractionIssues = issues;
    }

    questions.push(next);
  }

  return { questions, droppedDuplicates, flaggedDuplicates, emptyStems };
}

function buildExtractionPrompt(
  programName?: string,
  subjectName?: string,
  options?: { budgetMode?: boolean }
): string {
  const sourcePriority = options?.budgetMode
    ? `
IMPORTANT SOURCE PRIORITY (BUDGET / STRUCTURED MODE):

1. No original PDF is attached to this request. The BLOCK-LEVEL STRUCTURE
   section is the authoritative source: it lists every text block with its
   page position and every detected image with a stable id and bounding box.
2. Use block positions (top-to-bottom, left-to-right) to reconstruct the
   visual reading order when the raw text order conflicts with the layout.
3. Never invent missing text, choices, answers, formulas, diagrams, or explanations.
4. Pages flagged as scanned could not be read â€” do not guess their content.
`
    : `
IMPORTANT SOURCE PRIORITY:

1. The original PDF visual content is the authoritative source.
2. The extracted text layer is supplemental.
3. If extracted text is incomplete, incorrectly ordered, garbled, or missing content, inspect the original PDF visually.
4. Never invent missing text, choices, answers, formulas, diagrams, or explanations.
`;

  const imageInstructions = options?.budgetMode
    ? `
If a question references a visual that is not visible in the structured text, set hasImage=true only when a detected [IMAGE] entry clearly belongs to it.

When hasImage=true, DO NOT compute or fabricate imageBox coordinates.

Instead, reference the detected image by its id from the BLOCK-LEVEL STRUCTURE:

"imageId": "page3-image1"

For questions that depend on MULTIPLE visuals (e.g. "Study Figures 1 and 2"),
list every referenced image id:

"imageIds": ["page5-image1", "page5-image2"]

(If only one image is referenced, use imageId and leave imageIds as an empty array.)

ALWAYS include an image-mapping confidence and reason:

"imageMappingConfidence": 0.96
"imageMappingReason": "Question explicitly references the diagram below and page3-image1 is positioned between the question stem and its choices."

Base the confidence on:
1. Explicit text reference ("Study the diagram below...", "Refer to Figure 1...") â†’ high (0.9-1.0)
2. Position (image sits between the question stem and its choices) â†’ medium-high (0.7-0.9)
3. Weak/unclear association â†’ low (<0.5) and explain the doubt in the reason.

The reason and confidence are internal admin-review/debug signals â€” they are
never shown to students.

The backend attaches the real bounding box and validates every id. If no
detected image clearly belongs to the question, set hasImage=false and explain
in extractionNote.
`
    : `
If a question references a visual that is not visible in the extracted text, inspect the original PDF.

When hasImage=true, provide:

"imageBox": {
  "x": 0,
  "y": 0,
  "width": 0,
  "height": 0
}

Coordinates MUST be percentages of the PDF page dimensions:

x = distance from left edge
y = distance from top edge
width = image width
height = image height

All values must be between 0 and 100.

Example:

"imageBox": {
  "x": 12.5,
  "y": 35.2,
  "width": 74.0,
  "height": 28.5
}

If the exact bounding box cannot be reliably determined:

"imageBox": null

Do NOT fabricate coordinates.
`;

  return `
You are an AI-powered LMS Assessment Question Extraction Engine.

Your task is to extract assessment questions from the provided PDF document and return ONLY valid JSON.

The original PDF document is attached alongside this prompt when available.

You may also receive extracted PDF text generated by a PDF parser such as PyMuPDF.
${sourcePriority}

The PDF may contain:
- Multiple-choice questions
- Multiple-select questions
- True/False questions
- Identification questions
- Fill-in-the-blank questions
- Matching-type questions
- Essay questions
- Images
- Graphs
- Tables
- Diagrams
- Mathematical formulas
- Answer keys
- Teacher annotations

==================================================
DOCUMENT ANALYSIS
==================================================

Read and analyze the ENTIRE document before extracting questions.

Do NOT extract questions page-by-page independently without considering the full document.

Answer keys may appear:
- On the final page
- On a separate page
- At the end of a section
- In a table
- As a compact sequence such as:
  1-A
  2-C
  3-B
- As:
  1. A
  2. C
  3. B
- As:
  1 A, 2 C, 3 B
- Or using other explicit answer-key formats.

You MUST inspect the entire document before determining correct answers.

==================================================
QUESTION EXTRACTION
==================================================

Extract EVERY assessment question in the document.

Preserve the original wording as closely as possible.

Do NOT:
- Rewrite questions
- Simplify wording
- Correct grammar
- Change terminology
- Translate content
- Summarize questions
- Generate missing content

Preserve:
- Mathematical expressions
- Units
- Symbols
- Scientific notation
- Superscripts/subscripts when recoverable
- Punctuation
- Question numbering
- Lettered choices
- Numbered choices
- Special characters

Preserve the original question number whenever one exists.

If numbering is:
1.
2.
3.

return:

"questionNumber": 1

If numbering is:
Q1
Q2
Q3

return:

"questionNumber": 1

If the document uses section-based numbering such as:
A-1
A-2

preserve the original numbering in:

"originalQuestionNumber": "A-1"

and use a numeric questionNumber only when a reliable numeric sequence exists.

==================================================
QUESTION TYPE DETECTION
==================================================

Automatically classify each question as exactly one of:

"multiple_choice"

"multiple_select"

"true_false"

"identification"

"fill_in_the_blank"

"matching_type"

"essay"

Use the actual structure and wording of the question.

MULTIPLE CHOICE:
One correct answer from labeled choices.

MULTIPLE SELECT:
Question explicitly requires more than one answer, such as:
- Select all that apply
- Choose all correct answers
- Which of the following are correct?

TRUE/FALSE:
The student chooses True or False.

IDENTIFICATION:
Short free-text response where the student identifies a term, concept, person, object, etc.

FILL IN THE BLANK:
Question contains one or more explicit blanks.

MATCHING TYPE:
Contains two or more sets/columns of items intended to be matched.

ESSAY:
Requires an extended written response.

Do NOT classify a question as multiple_select merely because several choices appear correct.

==================================================
ANSWER CHOICES
==================================================

Extract EVERY answer choice exactly as it appears.

For example:

A. Photosynthesis
B. Respiration
C. Digestion
D. Circulation

must become:

"choices": [
  {
    "label": "A",
    "text": "Photosynthesis"
  },
  {
    "label": "B",
    "text": "Respiration"
  },
  {
    "label": "C",
    "text": "Digestion"
  },
  {
    "label": "D",
    "text": "Circulation"
  }
]

Do not invent missing choices.

If a choice is partially unreadable, preserve the readable text and explain the problem in extractionNote.

==================================================
CORRECT ANSWER DETECTION
==================================================

Determine the correct answer using this priority:

1. Explicit answer key
2. Explicit answer beside or underneath the question
3. Explicit teacher annotation
4. Clearly marked answer such as highlighted, bold, colored, circled, checked, or underlined
5. Other explicit answer indicator

NEVER determine an answer solely from your own subject knowledge when the document does not explicitly provide an answer.

The purpose of this system is extraction, NOT solving questions.

If an answer key exists, use it as the authoritative answer source.

If multiple answer sources conflict:

- Prefer the answer key.
- Set confidence lower if the conflict is significant.
- Describe the conflict in extractionNote.

For multiple_choice:

"correctAnswer": "A"

For multiple_select:

"correctAnswer": "A,C"

The letters must be comma-separated and ordered according to their appearance.

For true_false:

"correctAnswer": "True"

or

"correctAnswer": "False"

For identification, fill_in_the_blank, or essay:

Use the exact answer provided by the document.

If no answer is explicitly provided:

"correctAnswer": null

"correctAnswerText": null

"confidence": 0

"extractionNote": "Correct answer not found."

==================================================
ANSWER KEY MAPPING
==================================================

When an answer key is present, carefully map answer-key entries to question numbers.

Example:

ANSWER KEY
1. B
2. C
3. A

means:

Question 1 â†’ B
Question 2 â†’ C
Question 3 â†’ A

Do NOT shift answers because of:
- Page breaks
- Section headings
- Missing question numbers
- Questions beginning on one page and continuing onto another
- Two-column layouts

If the answer key cannot be reliably mapped to a question, do not guess.

==================================================
IMAGES, GRAPHS, TABLES AND DIAGRAMS
==================================================

Set:

"hasImage": true

ONLY when the question contains or directly depends on a visual element such as:

- Photograph
- Illustration
- Diagram
- Graph
- Chart
- Figure
- Map
- Geometry drawing
- Scientific diagram
- Visual table
- Flowchart
- Image-based data

A normal text-only table does NOT automatically require hasImage=true unless the question depends on the table's visual structure.

${imageInstructions}

==================================================
MULTIPLE VISUALS
==================================================

If a question depends on multiple images, diagrams, graphs, or visual regions, use:

"imageBoxes": [
  {
    "x": 10,
    "y": 20,
    "width": 30,
    "height": 25
  },
  {
    "x": 55,
    "y": 20,
    "width": 30,
    "height": 25
  }
]

If only one visual exists, populate imageBox and leave imageBoxes as an empty array.

==================================================
MATCHING TYPE
==================================================

For matching-type questions, preserve both sides of the matching exercise.

Example:

Column A:
1. Photosynthesis
2. Respiration

Column B:
A. Produces glucose
B. Releases energy

Return choices representing the matching items.

Example:

"choices": [
  {
    "label": "1",
    "text": "Photosynthesis â€” Produces glucose"
  },
  {
    "label": "2",
    "text": "Respiration â€” Releases energy"
  }
]

Do not invent pairings.

If the answer key provides the correct matching separately, preserve the original items and store the answer mapping in correctAnswer.

==================================================
DUPLICATE QUESTIONS
==================================================

Remove duplicate questions.

Two questions are considered duplicates when their question text is materially identical.

If duplicates exist:

- Keep the first occurrence.
- Keep its original page number.
- Ignore later duplicate occurrences.

Do not remove questions merely because they have similar wording.

==================================================
HEADERS AND NON-QUESTION CONTENT
==================================================

Ignore:

- Page numbers
- Headers
- Footers
- Logos
- School branding
- Copyright notices
- Decorative text
- Watermarks
- Repeated document titles
- Student instructions that are not questions
- General directions that are not individually assessable questions

However, preserve instructions when they are required to interpret a question.

==================================================
QUESTION CONTINUATION
==================================================

A question may continue across multiple pages or columns.

Combine the complete question into a single question object.

Do NOT create separate questions simply because:
- The question starts on one page and continues on another.
- Choices continue on another page.
- A diagram appears on another page.

Use the page where the question begins as pageNumber.

==================================================
TWO-COLUMN AND COMPLEX LAYOUTS
==================================================

Respect the document's visual reading order.

For two-column pages:

1. Determine the correct reading order.
2. Do not merge text from unrelated columns.
3. Keep each question with its corresponding choices.
4. Do not assume that PDF text extraction order equals visual reading order.

When the text layer conflicts with visual layout, trust the visual PDF.

==================================================
OCR AND GARBLED TEXT
==================================================

If extracted text contains obvious OCR/PDF parsing errors:

- Inspect the original PDF.
- Recover the correct text when clearly readable.
- Do not silently invent corrections.

Examples of common errors:

"O" vs "0"

"l" vs "1"

"rn" vs "m"

Missing mathematical symbols

Broken equations

Incorrect superscripts

If the original PDF is still unreadable, preserve the best available text and lower confidence.

==================================================
MATHEMATICAL CONTENT
==================================================

Preserve mathematical expressions exactly whenever possible.

Do not convert:

xÂ²

into:

x^2

unless the original source itself uses that notation.

Do not solve equations.

Do not simplify formulas.

Do not change mathematical notation.

==================================================
EXPLANATIONS
==================================================

Only extract an explanation when the document explicitly provides one.

NEVER generate an explanation from your own knowledge.

If no explanation exists:

"explanation": null

==================================================
CONFIDENCE
==================================================

Set confidence between 0 and 1.

Confidence represents confidence that:

1. The question was extracted correctly.
2. The question type was classified correctly.
3. The answer mapping, if present, was extracted correctly.

Suggested interpretation:

0.95â€“1.00:
Clear question, choices, and answer.

0.80â€“0.94:
Minor formatting uncertainty.

0.60â€“0.79:
Some text/layout uncertainty.

0.30â€“0.59:
Significant OCR/layout/answer uncertainty.

0.00:
No reliable extraction or answer.

Do not use confidence to compensate for guessing.

==================================================
EXTRACTION NOTES
==================================================

Use extractionNote to describe meaningful problems such as:

- "Question text partially unreadable."
- "Choice C appears partially cropped."
- "Answer key entry could not be mapped reliably."
- "Visual diagram detected but exact bounding box could not be determined."
- "Question continues onto the next page."
- "Answer key conflicts with an inline answer marker."

Use null when there are no extraction issues.

==================================================
DOCUMENT SUMMARY
==================================================

Return:

"documentSummary": {
  "title": "",
  "totalQuestions": 0,
  "questionTypes": [],
  "hasAnswerKey": false,
  "processingWarnings": []
}

title:
Use the document's actual title when available.

totalQuestions:
Must equal the number of objects in questions.

questionTypes:
Return only the types actually detected.

Example:

[
  "multiple_choice",
  "true_false",
  "essay"
]

hasAnswerKey:
true only if an explicit answer key exists.

processingWarnings:
Include document-level issues such as:

- "PDF text layer is incomplete."
- "Several pages contain scanned images."
- "Some mathematical formulas could not be reliably extracted."
- "Answer key detected but some entries could not be mapped."
- "Several question images have uncertain bounding boxes."

==================================================
CONTEXT
==================================================

Program:
"${programName ?? "unspecified"}"

Subject:
"${subjectName ?? "unspecified"}"

These values are CONTEXT ONLY.

Do not add, modify, or infer curriculum information from them.

==================================================
OUTPUT REQUIREMENTS
==================================================

Return ONLY valid JSON.

Do NOT return:
- Markdown
- Code fences
- Explanations outside JSON
- Comments
- Additional properties outside the schema

Use this exact schema:

{
  "documentSummary": {
    "title": "",
    "totalQuestions": 0,
    "questionTypes": [],
    "hasAnswerKey": false,
    "processingWarnings": []
  },
  "questions": [
    {
      "questionNumber": 1,
      "originalQuestionNumber": "1",
      "pageNumber": 1,
      "type": "multiple_choice",
      "question": "",
      "choices": [
        {
          "label": "A",
          "text": ""
        }
      ],
      "correctAnswer": "A",
      "correctAnswerText": "",
      "explanation": null,
      "hasImage": false,
      "imageBox": null,
      "imageBoxes": [],
      "confidence": 1.0,
      "extractionNote": null
    }
  ]
}

FINAL RULE:

When uncertain, preserve the source and lower confidence.

NEVER hallucinate missing questions, choices, answers, explanations, images, or bounding boxes.
`;
}

// ============================================================
// DB import â€” converts extracted questions to Prisma Question rows
// ============================================================

const BulkImportInputSchema = z.object({
  questions: z.array(ExtractedQuestionSchema),
  programId: z.string(),
  subjectId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  authorId: z.string(),
});

type BulkImportInput = z.infer<typeof BulkImportInputSchema>;

/**
 * Imports a batch of extracted questions into the database.
 * Questions are created as DRAFT so they go through the normal
 * review/publish flow before reaching students.
 */
export async function importQuestions(input: BulkImportInput): Promise<{
  created: number;
  skipped: number;
  errors: string[];
}> {
  const validated = BulkImportInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError(
      `Invalid import payload: ${validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
      400
    );
  }
  const { questions, subjectId, topicId, authorId } = validated.data;

  const errors: string[] = [];
  const questionData: any[] = [];
  const bankLinkData: any[] = [];

  for (const q of questions) {
    try {
      const { prismaType, optionsJson, correctAnswerJson } = mapToPrisma(q);

      questionData.push({
        type: prismaType,
        difficulty: "MEDIUM" as const,
        stem: q.question,
        options: optionsJson ?? Prisma.JsonNull,
        correctAnswer: correctAnswerJson ?? Prisma.JsonNull,
        explanation: q.explanation ?? undefined,
        tags: ["imported", "from-pdf"],
        mediaUrl: q.mediaUrl ?? null,
        status: "DRAFT" as const,
        authorId,
      });

      bankLinkData.push({
        subjectId: subjectId ?? null,
        topicId: topicId ?? null,
      });
    } catch (err) {
      errors.push(
        `Question ${q.questionNumber}: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  let created = 0;

  // Create question + bank link row-by-row (create() returns the generated id)
  // in chunked transactions so large imports don't hit transaction timeouts.
  for (let i = 0; i < questionData.length; i += 100) {
    const end = Math.min(i + 100, questionData.length);

    await prisma.$transaction(async (tx) => {
      for (let j = i; j < end; j++) {
        const question = await tx.question.create({
          data: questionData[j],
          select: { id: true },
        });
        await tx.questionBankLink.create({
          data: {
            questionId: question.id,
            subjectId: bankLinkData[j].subjectId,
            topicId: bankLinkData[j].topicId,
          },
        });
        created++;
      }
    });
  }

  return { created, skipped: errors.length, errors };
}

/**
 * Maps the extraction JSON question type to the Prisma QuestionType enum
 * and converts choices/correctAnswer to the JSON format stored in the DB.
 */
function mapToPrisma(q: ExtractedQuestion): {
  prismaType: QuestionType;
  optionsJson: any;
  correctAnswerJson: any;
} {
  switch (q.type) {
    case "multiple_choice": {
      const choices = q.choices || [];
      const optionsJson = choices.map((c) => ({
        id: c.label,
        text: c.text,
        isCorrect: c.label === q.correctAnswer,
      }));
      return {
        prismaType: "MULTIPLE_CHOICE" as QuestionType,
        optionsJson,
        correctAnswerJson: q.correctAnswer ? { optionId: q.correctAnswer } : null,
      };
    }

    case "multiple_select": {
      const correctLabels = q.correctAnswer ? q.correctAnswer.split(",").map((s) => s.trim()) : [];
      const choices = q.choices || [];
      const optionsJson = choices.map((c) => ({
        id: c.label,
        text: c.text,
        isCorrect: correctLabels.includes(c.label),
      }));
      return {
        prismaType: "MULTIPLE_SELECT" as QuestionType,
        optionsJson,
        correctAnswerJson: q.correctAnswer ? { optionIds: correctLabels } : null,
      };
    }

    case "true_false": {
      const answer = (q.correctAnswer || "").trim().toLowerCase();
      const tfAnswer = answer === "true" || answer === "t" || answer === "a";
      return {
        prismaType: "TRUE_FALSE" as QuestionType,
        optionsJson: undefined,
        correctAnswerJson: tfAnswer,
      };
    }

    case "identification": {
      // Map identification â†’ ESSAY (short answer type in the schema)
      return {
        prismaType: "ESSAY" as QuestionType,
        optionsJson: undefined,
        correctAnswerJson: q.correctAnswer ?? null,
      };
    }

    case "fill_in_the_blank": {
      return {
        prismaType: "FILL_IN_THE_BLANK" as QuestionType,
        optionsJson: undefined,
        correctAnswerJson: q.correctAnswer ?? null,
      };
    }

    case "matching_type": {
      const optionsJson = (q.choices || []).map((c) => ({
        id: c.label,
        text: c.text,
      }));
      return {
        prismaType: "MATCHING" as QuestionType,
        optionsJson,
        correctAnswerJson: q.correctAnswer ?? null,
      };
    }

    case "essay": {
      return {
        prismaType: "ESSAY" as QuestionType,
        optionsJson: undefined,
        correctAnswerJson: null,
      };
    }

    default:
      throw new Error(`Unsupported question type: ${q.type}`);
  }
}
