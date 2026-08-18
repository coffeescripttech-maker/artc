import { z } from "zod";
import { LESSON_TYPES } from "@aratc/shared";

export const createLessonSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  title: z.string().min(1, "Lesson title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  type: z.nativeEnum(LESSON_TYPES).default("ARTICLE"),
  durationMinutes: z.number().int().min(1).optional(),
  content: z.any().optional(), // JSON content for article/video
  videoUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
