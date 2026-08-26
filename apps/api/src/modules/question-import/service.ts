import { prisma, Prisma, type QuestionType } from "@aratc/database";
import { extractTextFromPdf } from "../utils/pdf";
import { callGemini } from "../utils/gemini";
import { ApiError } from "../../lib/errors";
import { z } from "zod";

// ============================================================
// Schemas matching the extraction preview JSON
// ============================================================

const ChoiceSchema = z.object({
  label: z.string(),
  text: z.string(),
});

const ExtractedQuestionSchema = z.object({
  questionNumber: z.coerce.number(),
  pageNumber: z.coerce.number().optional().nullable(),
  type: z.enum([
    "multiple_choice",
    "multiple_select",
    "true_false",
    "identification",
    "fill_in_the_blank",
    "matching_type",
    "essay",
  ]),
  question: z.string().min(1),
  choices: z.array(ChoiceSchema).optional().nullable(),
  correctAnswer: z.string().nullable().optional(),
  correctAnswerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  hasImage: z.boolean().optional().default(false),
  confidence: z.coerce.number().min(0).max(1).optional().default(1),
  extractionNote: z.string().nullable().optional(),
});

const ExtractionResultSchema = z.object({
  documentSummary: z.object({
    totalQuestions: z.coerce.number(),
    detectedQuestionTypes: z.array(z.string()).optional().default([]),
    hasAnswerKey: z.boolean().optional().default(false),
    answerKeyLocation: z.string().nullable().optional(),
    processingWarnings: z.array(z.string()).optional().default([]),
  }),
  questions: z.array(ExtractedQuestionSchema),
});

type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ============================================================
// Text extraction from PDF
// ============================================================

/**
 * Extracts text content from a PDF file buffer.
 * Uses unpdf for fast, serverless-friendly extraction.
 */
export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  return extractTextFromPdf(fileBuffer);
}

// ============================================================
// Gemini extraction — returns the preview JSON
// ============================================================

/**
 * Sends extracted PDF text to Gemini with the preview extraction prompt.
 * Returns the structured JSON result without writing anything to the DB.
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
    raw = await callGemini(pdfText, prompt);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "AI extraction failed. Please try again.",
      502
    );
  }

  // Gemini may wrap JSON in backticks or add leading text — strip that
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

  return result.data;
}

function buildExtractionPrompt(programName?: string, subjectName?: string): string {
  return `You are an AI-powered LMS Question Extraction Engine.

Your ONLY responsibility is to extract assessment questions from the provided document and return clean, structured JSON for preview before database import.

Analyze the entire document and extract every assessment question.

Support the following question types:
- multiple_choice
- true_false
- identification
- fill_in_the_blank
- matching_type
- essay

Extraction rules:
1. Read the entire document before extracting.
2. Preserve the original wording exactly.
3. Extract every question.
4. Ignore: page numbers, headers, footers, logos, copyright text, decorative elements, table of contents, document titles, instructions not belonging to a question.
5. Preserve the original question numbering.
6. Extract choices exactly as written.
7. Determine the correct answer using this priority:
   - Priority 1: Answer Key section
   - Priority 2: "Answer: X"
   - Priority 3: Highlighted/Bold/Colored/Underlined answer
   - Priority 4: Teacher annotations
   - Priority 5: Other explicit indicators
   Never guess. If no evidence exists: correctAnswer = null, correctAnswerText = null, confidence = 0, extractionNote = "Correct answer not found."
8. Detect duplicate questions. If duplicates exist, keep only one.
9. If the question depends on an image, diagram, graph, table or formula: hasImage = true.
10. Preserve mathematical expressions exactly.
11. Preserve special symbols.
12. Preserve line breaks only when necessary.

Context: Subject = "${subjectName ?? "unspecified"}", Program = "${programName ?? "unspecified"}"

Return ONLY valid JSON. Do NOT use Markdown. Do NOT explain anything.

The root must be:

{
  "documentSummary": {
    "totalQuestions": 0,
    "detectedQuestionTypes": [],
    "hasAnswerKey": false,
    "answerKeyLocation": null,
    "processingWarnings": []
  },
  "questions": []
}

Question Schema:
{
  "questionNumber": 1,
  "pageNumber": 1,
  "type": "multiple_choice",
  "question": "",
  "choices": [
    { "label": "A", "text": "" },
    { "label": "B", "text": "" },
    { "label": "C", "text": "" },
    { "label": "D", "text": "" }
  ],
  "correctAnswer": "A",
  "correctAnswerText": "",
  "explanation": null,
  "hasImage": false,
  "confidence": 1.0,
  "extractionNote": null
}

For matching_type, choices should contain pairs like:
  { "label": "1", "text": "Term — Definition" }
`;
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
      const tfAnswer = answer === "true" || answer === "a" || answer === "t";
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
      // Matching pairs stored as options with correct answer being the match key
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
