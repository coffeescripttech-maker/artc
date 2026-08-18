import { z } from "zod";
import { QUESTION_TYPES, DIFFICULTY_LEVELS, CONTENT_STATUS } from "@aratc/shared";

export const createQuestionSchema = z.object({
  type: z.nativeEnum(QUESTION_TYPES),
  difficulty: z.nativeEnum(DIFFICULTY_LEVELS).default("MEDIUM"),
  stem: z.string().min(1, "Question stem is required"),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      })
    )
    .optional(),
  correctAnswer: z.any(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const linkQuestionSchema = z.object({
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  examId: z.string().optional(),
  assessmentId: z.string().optional(),
  weight: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const createQuestionWithLinkSchema = createQuestionSchema.extend({
  link: z.object({
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    examId: z.string().optional(),
    assessmentId: z.string().optional(),
    weight: z.number().int().min(1).default(1),
    notes: z.string().optional(),
  }).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type LinkQuestionInput = z.infer<typeof linkQuestionSchema>;
export type CreateQuestionWithLinkInput = z.infer<typeof createQuestionWithLinkSchema>;
