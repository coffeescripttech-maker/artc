import { prisma, Prisma, type QuestionType } from "@aratc/database";
import { extractTextFromPdf } from "../utils/pdf";
import { callGeminiJson } from "../utils/gemini";
import { ApiError } from "../../lib/errors";
import { z } from "zod";

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
      required: [
        "totalQuestions",
        "hasAnswerKey",
        "questionTypes",
        "processingWarnings",
      ],
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
        },
        required: ["questionNumber", "type", "question", "confidence", "hasImage"],
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
  label: z.string(),
  text: z.string(),
});

const ExtractedQuestionSchema = z.object({
  questionNumber: z.coerce.number(),
  pageNumber: z.coerce.number().optional().nullable(),
  type: z.enum(QUESTION_TYPE_ENUM),
  question: z.string().min(1),
  choices: z.array(ChoiceSchema).optional().nullable(),
  correctAnswer: z.string().nullable().optional(),
  correctAnswerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  hasImage: z.boolean().optional().default(false),
  confidence: z.coerce.number().min(0).max(1).optional().default(1),
  extractionNote: z.string().nullable().optional(),
});

const DocumentSummarySchema = z.object({
  title: z.string().nullable().optional(),
  totalQuestions: z.coerce.number(),
  questionTypes: z.array(z.string()).optional().default([]),
  /** older prompt shape — tolerated, prefer questionTypes */
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
// Gemini extraction — returns the preview JSON
// ============================================================

/**
 * Sends extracted PDF text to Gemini for structured question extraction.
 * Uses Gemini Structured Output (responseMimeType: "application/json" +
 * responseSchema) so the response is guaranteed to be valid JSON.
 * Returns the structured result without writing anything to the DB.
 */
export async function previewExtraction(
  pdfText: string,
  programName?: string,
  subjectName?: string
): Promise<ExtractionResult> {
  if (!pdfText || !pdfText.trim()) {
    throw new ApiError("PDF text is empty — nothing to extract from.", 400);
  }

  const prompt = buildExtractionPrompt(programName, subjectName);

  let raw: string;
  try {
    raw = await callGeminiJson(
      pdfText,
      prompt,
      EXTRACTION_RESPONSE_SCHEMA
    );
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "AI extraction failed. Please try again.",
      502
    );
  }

  // With responseMimeType=application/json Gemini returns pure JSON, but some
  // proxies / preview builds wrap it in code fences — strip them anyway.
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError(
      "The AI returned an unexpected response format. Please try again.",
      502
    );
  }

  const result = ExtractionResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError(
      "The AI response did not match the expected question format. Please try again.",
      502
    );
  }

  // Post-process: normalize answer fields, dedupe, gather warnings.
  const { questions, droppedDuplicates } = normalizeQuestions(result.data.questions);
  const summaryIn = result.data.documentSummary;

  const processingWarnings = [...summaryIn.processingWarnings];
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

  const questionTypes =
    summaryIn.questionTypes.length > 0
      ? summaryIn.questionTypes
      : summaryIn.detectedQuestionTypes ?? [];

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
 * Light server-side cleanup so Gemini hiccups don't reach the DB:
 *  - drop exact-duplicate question text
 *  - fall back to correctAnswerText for non-choice types
 *  - convert a full-answer-text correctAnswer into its choice label
 *  - normalize True/False answer spelling
 */
function normalizeQuestions(
  raw: ExtractedQuestion[]
): { questions: ExtractedQuestion[]; droppedDuplicates: number } {
  const seen = new Set<string>();
  const questions: ExtractedQuestion[] = [];
  let droppedDuplicates = 0;

  for (const q of raw) {
    const key = q.question.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) {
      droppedDuplicates++;
      continue;
    }
    seen.add(key);

    const next: ExtractedQuestion = { ...q };

    // Non-choice questions: Gemini sometimes only fills correctAnswerText.
    if (!next.correctAnswer && next.correctAnswerText) {
      const isChoice =
        next.type === "multiple_choice" || next.type === "multiple_select";
      if (!isChoice) next.correctAnswer = next.correctAnswerText;
    }

    // Multiple-choice: an answer given as the full choice text → map to label.
    if (next.choices?.length && next.correctAnswer) {
      const answer = next.correctAnswer.trim();
      const byLabel = next.choices.find(
        (c) => c.label?.trim().toUpperCase() === answer.toUpperCase()
      );
      if (!byLabel) {
        const byText = next.choices.find(
          (c) =>
            c.text?.trim().toLowerCase() === answer.toLowerCase()
        );
        if (byText) next.correctAnswer = byText.label;
      }
      // Multiple-select: expand full-text answers to their labels.
      if (next.type === "multiple_select") {
        const parts = answer
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const labels = parts.map((p) => {
          const exact = next.choices.find((c) => c.label?.trim() === p);
          if (exact) return p;
          const byT = next.choices.find(
            (c) => c.text?.trim().toLowerCase() === p.toLowerCase()
          );
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

    questions.push(next);
  }

  return { questions, droppedDuplicates };
}

function buildExtractionPrompt(
  programName?: string,
  subjectName?: string
): string {
  return `You are an AI-powered LMS Question Extraction Engine.

Your ONLY responsibility is to extract assessment questions from the provided document and return clean, structured JSON.

Analyze the ENTIRE document before extracting questions. Answer keys are often on the LAST page — read every page first, then assign answers.

Instructions:

- Extract every question.
- Preserve the original wording exactly.
- Preserve the original question numbering.
- Detect the question type automatically:
  - multiple_choice — one correct answer from labeled options
  - multiple_select — "select all that apply", multiple correct answers
  - true_false
  - identification — short free-text answer
  - fill_in_the_blank
  - matching_type — column A / column B pairs
  - essay — long free-text answer

- Extract every answer choice exactly as written.
- Detect the correct answer using, in priority order:
  1. Answer key section (often on the last page of the document)
  2. Answer beside the question ("Answer: B")
  3. Highlighted / Bold / Coloured / Underlined answer
  4. Teacher annotations
  5. Any other explicit answer indicator
- If multiple sources conflict, prefer the answer key section.
- For multiple_select, list ALL correct letters in correctAnswer as a comma-separated string (e.g. "A,C").
- Never guess the correct answer.
- If no answer exists:
  - correctAnswer = null
  - correctAnswerText = null
  - confidence = 0
  - extractionNote = "Correct answer not found."
- Ignore: page numbers, headers, footers, logos, decorative text, copyright text, instructions to the examinee that are not questions.
- If the question references an image, graph, table, diagram, or formula: hasImage = true.
- Remove duplicate questions (same question text — keep the first occurrence).
- Preserve mathematical expressions and special symbols exactly.
- For matching_type, put each pair in choices as { "label": "1", "text": "Item — Match" }.
- Set confidence between 0 and 1: how certain you are the question AND its answer were extracted correctly.

Context: Program = "${programName ?? "unspecified"}", Subject = "${subjectName ?? "unspecified"}"

Return ONLY valid JSON matching the schema below (no markdown, no prose):

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
      "pageNumber": 1,
      "type": "multiple_choice",
      "question": "",
      "choices": [
        { "label": "A", "text": "" }
      ],
      "correctAnswer": "A",
      "correctAnswerText": "",
      "explanation": null,
      "hasImage": false,
      "confidence": 1.0,
      "extractionNote": null
    }
  ]
}`;
}

// ============================================================
// DB import — converts extracted questions to Prisma Question rows
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
        status: "DRAFT" as const,
        authorId,
      });

      bankLinkData.push({
        subjectId: subjectId ?? null,
        topicId: topicId ?? null,
      });
    } catch (err) {
      errors.push(
        `Question ${q.questionNumber}: ${
          err instanceof Error ? err.message : "unknown error"
        }`
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
      const correctLabels = q.correctAnswer
        ? q.correctAnswer.split(",").map((s) => s.trim())
        : [];
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
      // Map identification → ESSAY (short answer type in the schema)
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
