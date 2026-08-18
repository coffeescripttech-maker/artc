import { z } from "zod";

export const createModuleSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  name: z.string().min(1, "Module name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
