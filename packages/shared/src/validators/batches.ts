import { z } from "zod";

export const createBatchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Class name is required")
    .max(100, "Class name must be 100 characters or fewer"),
  programId: z
    .string()
    .trim()
    .min(1, "Program is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be a valid date (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be a valid date (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
});

export const addBatchMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email address is required"),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type AddBatchMemberInput = z.infer<typeof addBatchMemberSchema>;
