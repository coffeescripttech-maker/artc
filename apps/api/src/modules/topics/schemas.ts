import { z } from "zod";

export const createTopicSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  name: z.string().min(1, "Topic name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
