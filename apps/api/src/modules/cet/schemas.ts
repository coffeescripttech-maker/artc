import { z } from "zod";
import { EXAM_TYPES, CONTENT_STATUS, EDUCATIONAL_STAGES, GRADE_LEVELS } from "@aratc/shared";

// University schemas
export const createUniversitySchema = z.object({
  name: z.string().min(1, "University name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  acronym: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  status: z.nativeEnum(CONTENT_STATUS).default("PUBLISHED"),
});

export const updateUniversitySchema = createUniversitySchema.partial();

// Exam schemas
export const createExamSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  examType: z.nativeEnum(EXAM_TYPES),
  conductingBody: z.string().optional(),
  website: z.string().url().optional(),
});

export const updateExamSchema = createExamSchema.partial();

// Profile schemas
export const createProfileSchema = z.object({
  cetExamId: z.string().min(1, "CET Exam ID is required"),
  name: z.string().min(1, "Profile name is required"),
  description: z.string().optional(),
  totalQuestions: z.number().int().min(1).optional(),
  timeLimitMinutes: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  difficultyDistribution: z
    .object({
      EASY: z.number().min(0).max(100).optional(),
      MEDIUM: z.number().min(0).max(100).optional(),
      HARD: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

// Coverage schemas
export const addCoverageSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  percentage: z.number().min(0).max(100),
  questionCount: z.number().int().min(0).optional(),
  topicCoverage: z.record(z.number()).optional(),
});

export const updateCoverageSchema = z.object({
  percentage: z.number().min(0).max(100).optional(),
  questionCount: z.number().int().min(0).optional(),
  topicCoverage: z.record(z.number()).optional(),
});

// Program CET schemas
export const linkProgramExamSchema = z.object({
  cetExamId: z.string().min(1, "CET Exam ID is required"),
  priority: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export type CreateUniversityInput = z.infer<typeof createUniversitySchema>;
export type UpdateUniversityInput = z.infer<typeof updateUniversitySchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddCoverageInput = z.infer<typeof addCoverageSchema>;
export type UpdateCoverageInput = z.infer<typeof updateCoverageSchema>;
export type LinkProgramExamInput = z.infer<typeof linkProgramExamSchema>;
