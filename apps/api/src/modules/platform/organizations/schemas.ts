import { z } from 'zod';

// === Schema definitions for platform/organizations endpoints ===

export const listOrgsSchema = z.object({});

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  // settings JSON — currently supports teacher_auto_publish
  settings: z.record(z.unknown()).optional(),
  // optional thumbnail/logo (URL). Uploaded via /api/media, then stored here.
  imageUrl: z.string().optional(),
});

export const getOrgSchema = z.object({
  id: z.string().min(1),
});

export const updateOrgSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  settings: z.record(z.unknown()).optional(),
  // empty string clears the image
  imageUrl: z.string().optional(),
});

export const suspendOrgSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["SUSPEND", "ACTIVATE"]),
});

export const deleteOrgSchema = z.object({
  id: z.string().min(1),
});

export const inviteAdminSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  membershipRole: z.enum(['OWNER', 'ADMIN']).default('ADMIN'),
});
