import { z } from "zod";
import { ASSESSMENT_TYPES, DIFFICULTY_LEVELS, CONTENT_STATUS } from "@aratc/shared";

export const createAssessmentSchema = z.object({
  name: z.string().min(1, "Assessment name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  type: z.nativeEnum(ASSESSMENT_TYPES).default("QUIZ"),

  // Content filtering criteria
  topicIds: z.array(z.string()).optional(),
  difficultyLevels: z.array(z.nativeEnum(DIFFICULTY_LEVELS)).optional(),
  questionTags: z.array(z.string()).optional(),

  // Configuration
  questionCount: z.number().int().min(1).optional(),
  timeLimitMinutes: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  randomizeQuestions: z.boolean().default(false),
  showExplanations: z.boolean().default(true),
  allowRetake: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).default(1).optional(),
  scoringConfig: z.any().optional(),

  // Reference
  programId: z.string().optional(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const addQuestionSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  orderIndex: z.number().int().min(0).optional(),
  score: z.number().int().min(0).default(1),
});

export const autoGenerateSchema = z.object({
  topicIds: z.array(z.string()).optional(),
  difficultyLevels: z.array(z.nativeEnum(DIFFICULTY_LEVELS)).optional(),
  questionTags: z.array(z.string()).optional(),
  questionCount: z.number().int().min(1),
  difficultyDistribution: z
    .object({
      EASY: z.number().min(0).max(100).optional(),
      MEDIUM: z.number().min(0).max(100).optional(),
      HARD: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type AutoGenerateInput = z.infer<typeof autoGenerateSchema>;
