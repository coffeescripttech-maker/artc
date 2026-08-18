import { z } from "zod";
import { EDUCATIONAL_STAGES, GRADE_LEVELS, CONTENT_STATUS } from "@aratc/shared";

export const createCurriculumSchema = z.object({
  name: z.string().min(1, "Curriculum name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  stage: z.nativeEnum(EDUCATIONAL_STAGES),
  gradeLevel: z.nativeEnum(GRADE_LEVELS).optional(),
  programId: z.string().min(1, "Program ID is required"),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateCurriculumSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  stage: z.nativeEnum(EDUCATIONAL_STAGES).optional(),
  gradeLevel: z.nativeEnum(GRADE_LEVELS).optional(),
  orderIndex: z.number().int().min(0).optional(),
  status: z.nativeEnum(CONTENT_STATUS).optional(),
});

export const addCurriculumItemSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  orderIndex: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  customName: z.string().optional(),
});

export const updateCurriculumItemSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  customName: z.string().optional(),
});

export type CreateCurriculumInput = z.infer<typeof createCurriculumSchema>;
export type UpdateCurriculumInput = z.infer<typeof updateCurriculumSchema>;
export type AddCurriculumItemInput = z.infer<typeof addCurriculumItemSchema>;
export type UpdateCurriculumItemInput = z.infer<typeof updateCurriculumItemSchema>;
