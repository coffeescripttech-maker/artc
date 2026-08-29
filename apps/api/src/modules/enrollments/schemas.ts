import { z } from "zod";

export const listEnrollmentsSchema = z.object({
  programId: z.string().min(1),
});

export const createEnrollmentSchema = z.object({
  programId: z.string().min(1),
  // Accept either a learner-profile id or a user id; the service resolves it.
  learnerProfileId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  curriculumId: z.string().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateEnrollmentSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "SUSPENDED"]).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});