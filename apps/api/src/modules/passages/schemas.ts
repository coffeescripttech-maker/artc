import { z } from "zod";
import { CONTENT_STATUS } from "@aratc/shared";

export const createPassageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const updatePassageSchema = createPassageSchema.partial();

export type CreatePassageInput = z.infer<typeof createPassageSchema>;
export type UpdatePassageInput = z.infer<typeof updatePassageSchema>;
