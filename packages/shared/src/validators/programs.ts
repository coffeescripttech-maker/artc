import { z } from "zod";
import { EDUCATIONAL_STAGES, GRADE_LEVELS } from "../constants";

export const createProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  stage: z.nativeEnum(EDUCATIONAL_STAGES),
  gradeLevel: z.nativeEnum(GRADE_LEVELS).optional(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
