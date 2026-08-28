// Temporary smoke test for the tolerant question parser.
// Run: pnpm exec tsx src/modules/question-import/parser-smoke.ts
import { z } from "zod";

const QUESTION_TYPE_ENUM = [
  "multiple_choice", "multiple_select", "true_false", "identification",
  "fill_in_the_blank", "matching_type", "essay",
] as const;

const ChoiceSchema = z.object({ label: z.string().catch(""), text: z.string().catch("") });
const ImageBoxSchema = z.object({ x: z.coerce.number(), y: z.coerce.number(), width: z.coerce.number(), height: z.coerce.number() });

function coerceQuestionType(value: unknown): (typeof QUESTION_TYPE_ENUM)[number] | null {
  if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase().replace(/[-\s/]+/g, "_");
  switch (v) {
    case "multiple_choice": case "multiple_choice_question": case "mcq": case "choice": case "single_choice": return "multiple_choice";
    case "multiple_select": case "multiple_selection": case "select_all": case "multi_select": case "checkbox": case "checkboxes": return "multiple_select";
    case "true_false": case "true_or_false": case "tf": case "boolean": return "true_false";
    case "identification": case "identify": case "short_answer": case "short_response": return "identification";
    case "fill_in_the_blank": case "fill_blank": case "blank": case "completion": case "cloze": return "fill_in_the_blank";
    case "matching_type": case "matching": case "match": case "matching_question": return "matching_type";
    case "essay": case "long_answer": case "open_ended": case "written": case "subjective": return "essay";
    default: return null;
  }
}
function coerceHasImage(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "y", "on"].includes(value.trim().toLowerCase());
  if (typeof value === "number") return value > 0;
  return false;
}

const ExtractedQuestionSchema = z.object({
  questionNumber: z.coerce.number(),
  originalQuestionNumber: z.string().nullable().optional(),
  pageNumber: z.coerce.number().optional().nullable(),
  type: z.preprocess((val) => coerceQuestionType(val) ?? val, z.enum(QUESTION_TYPE_ENUM).catch("multiple_choice")),
  question: z.string().optional().default(""),
  choices: z.array(ChoiceSchema).optional().nullable().catch(null),
  correctAnswer: z.string().nullable().optional(),
  correctAnswerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  hasImage: z.preprocess((val) => coerceHasImage(val), z.boolean()).optional().default(false),
  confidence: z.coerce.number().min(0).max(1).optional().default(1),
  extractionNote: z.string().nullable().optional(),
  imageBox: ImageBoxSchema.nullable().optional().catch(null),
  imageBoxes: z.array(ImageBoxSchema).optional().default([]).catch([]),
  imageId: z.string().nullable().optional(),
  imageIds: z.array(z.string()).optional().default([]).catch([]),
  imageMappingConfidence: z.coerce.number().min(0).max(1).nullable().optional(),
  imageMappingReason: z.string().nullable().optional(),
  mediaUrl: z.string().nullish(),
  extractionIssues: z.array(z.string()).optional().default([]),
});

const DocumentSummarySchema = z.object({
  title: z.string().nullable().optional(),
  totalQuestions: z.coerce.number(),
  questionTypes: z.array(z.string()).optional().default([]),
  hasAnswerKey: z.boolean().optional().default(false),
  answerKeyLocation: z.string().nullable().optional(),
  processingWarnings: z.array(z.string()).optional().default([]),
});

function parseExtractionResultTolerant(raw: unknown): { documentSummary: any; questions: any[]; dropped: string[] } {
  const dropped: string[] = [];
  let doc: any;
  const rawDoc = raw && typeof raw === "object" ? (raw as any).documentSummary : undefined;
  const docParse = DocumentSummarySchema.safeParse(rawDoc ?? {});
  doc = docParse.success ? docParse.data : { title: null, totalQuestions: 0, questionTypes: [], hasAnswerKey: false, answerKeyLocation: null, processingWarnings: [] };

  const rawQs = raw && typeof raw === "object" ? (raw as any).questions : undefined;
  const questions: any[] = [];
  if (Array.isArray(rawQs)) {
    for (const item of rawQs) {
      const parsed = ExtractedQuestionSchema.safeParse(item);
      if (parsed.success) questions.push(parsed.data);
      else dropped.push(parsed.error?.issues?.[0]?.message || "malformed item");
    }
    if (questions.length === 0 && rawQs.length > 0) {
      const salvaged = rawQs
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const r = ExtractedQuestionSchema.safeParse({ questionNumber: 0, type: "multiple_choice", question: "", confidence: 0, hasImage: false, ...(item as any) });
          return r.success ? r.data : null;
        })
        .filter((q): q is any => q !== null);
      if (salvaged.length > 0) questions.push(...salvaged);
    }
  }
  return { documentSummary: doc, questions, dropped };
}

// ---- Test cases ----
const malformedTypes = [
  { questionNumber: 1, type: "Matching", question: "Match column A to B", confidence: 0.8, hasImage: false },
  { questionNumber: 2, type: "true / false", question: "Water boils at 100C", confidence: 0.9, hasImage: "yes" },
  { questionNumber: 3, type: "essay", question: "Explain", confidence: "0.5", hasImage: "no" },
  { questionNumber: 4, type: "fill in the blank", question: "The capital of France is ___", confidence: 1, hasImage: false },
  { questionNumber: 5, type: "mcq", question: "Which is a planet?", choices: [{ label: "A", text: "Sun" }, { label: "B", text: "Mars" }], correctAnswer: "B", confidence: 0.7, hasImage: false },
  { questionNumber: 6, type: 123, question: "Type as number should be caught", confidence: 0.4, hasImage: false },
];

const res = parseExtractionResultTolerant({ documentSummary: { totalQuestions: 6, questionTypes: [], hasAnswerKey: true, processingWarnings: [] }, questions: malformedTypes });

console.log("=== Tolerant parser results ===");
console.log("Recovered:", res.questions.length, "/ 6");
console.log("Dropped reasons:", JSON.stringify(res.dropped));
for (const q of res.questions) {
  console.log(`Q${q.questionNumber} type=${q.type} hasImage=${q.hasImage} confidence=${q.confidence}`);
}

// Assertions
let pass = 0, fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.error(`FAIL ${name}`); }
}

check("recovered 5 or more", res.questions.length >= 5);
const q2 = res.questions.find((q) => q.questionNumber === 2);
check("true_false type coerced", q2?.type === "true_false");
check("hasImage string 'yes' coerced true", q2?.hasImage === true);
const q3 = res.questions.find((q) => q.questionNumber === 3);
check("essay type kept", q3?.type === "essay");
check("confidence string coerced to 0.5", q3?.confidence === 0.5);
const q5 = res.questions.find((q) => q.questionNumber === 5);
check("mcq → multiple_choice", q5?.type === "multiple_choice");
check("choices preserved", Array.isArray(q5?.choices) && q5.choices.length === 2);
const q6 = res.questions.find((q) => q.questionNumber === 6);
check("numeric type caught → default multiple_choice", q6?.type === "multiple_choice");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("SMOKE OK");