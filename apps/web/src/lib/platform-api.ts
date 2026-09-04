"use client";

import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Superadmin platform API client (Change Set #7).
// Additive only — separate from /admin/* clients; superadmin-only endpoints.
// ---------------------------------------------------------------------------

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  reviewMode: boolean;
  deleted: boolean;
  memberCount: number;
  programCount: number;
  imageUrl: string | null;
}

export interface PlatformOrgMember {
  id: string;
  role: string;
  status: string;
  createdAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PlatformOrgDetail extends PlatformOrganization {
  metadata: Record<string, unknown> | null;
  members: PlatformOrgMember[];
}

export async function fetchPlatformOrganizations(
  includeDeleted = false,
): Promise<PlatformOrganization[]> {
  const qs = includeDeleted ? "?include_deleted=true" : "";
  return (await apiRequest(`/api/platform/organizations${qs}`)) as PlatformOrganization[];
}

export async function fetchPlatformOrganization(id: string): Promise<PlatformOrgDetail> {
  return (await apiRequest(`/api/platform/organizations/${id}`)) as PlatformOrgDetail;
}

export async function createPlatformOrganization(
  name: string,
  slug: string,
  imageUrl?: string,
): Promise<PlatformOrganization> {
  return (await apiRequest("/api/platform/organizations", {
    method: "POST",
    body: JSON.stringify({ name, slug, imageUrl }),
  })) as PlatformOrganization;
}

export async function updatePlatformOrganization(
  id: string,
  data: { name?: string; settings?: Record<string, unknown>; imageUrl?: string },
): Promise<void> {
  await apiRequest(`/api/platform/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function suspendPlatformOrganization(
  id: string,
  action: "SUSPEND" | "ACTIVATE",
): Promise<void> {
  await apiRequest(`/api/platform/organizations/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

/** Soft-delete (archives) the organization. Content + history are preserved. */
export async function deletePlatformOrganization(id: string): Promise<void> {
  await apiRequest(`/api/platform/organizations/${id}`, { method: "DELETE" });
}

/**
 * Uploads an image via the existing /api/media endpoint (image mimetypes only,
 * 15MB max) and returns the public URL. Requires an authenticated platform
 * admin — the API enforces content_admin/super_admin server-side.
 */
export async function uploadOrgImage(
  contentBase64: string,
  mimeType: string,
  filename?: string,
): Promise<string> {
  const data = (await apiRequest("/api/media", {
    method: "POST",
    body: JSON.stringify({ contentBase64, mimeType, filename }),
  })) as { url: string };
  return data.url;
}

export async function invitePlatformOrgAdmin(id: string, userId: string): Promise<void> {
  await apiRequest(`/api/platform/organizations/${id}/admins`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// ---------------------------------------------------------------------------
// CS#26 — Superadmin data reset (full-platform + per-organization)
// ---------------------------------------------------------------------------

export interface ResetCounts {
  [key: string]: number;
}

export interface ResetPreview {
  scope: "full" | "organization";
  organizationId?: string;
  counts: ResetCounts;
}

export async function fetchResetPreview(orgId?: string): Promise<ResetPreview> {
  const qs = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
  return (await apiRequest(`/api/platform/admin/reset/preview${qs}`)) as ResetPreview;
}

/**
 * The reset endpoints return `{ ok, mode, deleted }` where `deleted` is the
 * array of `deleteMany` results in the exact transaction order used by the
 * backend. Map that array onto human-readable record keys so the UI can show
 * truthful per-entity deletion counts after a reset.
 */
const FULL_RESET_DELETE_ORDER = [
  "auditEvents",
  "payments",
  "subscriptions",
  "attemptAnswers",
  "attempts",
  "assessmentQuestions",
  "assessments",
  "questionExposures",
  "questionBankLinks",
  "questions",
  "passages",
  "progressRecords",
  "lessons",
  "topics",
  "modules",
  "subjects",
  "programCets",
  "examCoverages",
  "cetProfiles",
  "cetExams",
  "programs",
  "enrollments",
  "batchMembers",
  "batchTeachers",
  "batches",
  "contentVersions",
  "parentStudents",
  "learners",
  "memberships",
  "sessions",
  "userRoles",
  "users",
  "organizations",
];

const ORG_RESET_DELETE_ORDER = [
  "auditEvents",
  "attemptAnswers",
  "attempts",
  "assessmentQuestions",
  "assessments",
  "questionExposures",
  "questionBankLinks",
  "questions",
  "progressRecords",
  "lessons",
  "topics",
  "modules",
  "curriculumItems",
  "subjects",
  "programCets",
  "curriculums",
  "programs",
  "enrollments",
  "batchMembers",
  "batchTeachers",
  "batches",
  "contentVersions",
  "parentStudents",
  "learners",
  "memberships",
  "sessions",
];

function mapDeletedCounts(order: string[], deleted: unknown): ResetCounts {
  const raw = Array.isArray(deleted) ? deleted : [];
  const counts: ResetCounts = {};
  order.forEach((key, i) => {
    const entry = raw[i];
    counts[key] =
      entry && typeof entry === "object" && "count" in entry
        ? Number((entry as { count: number }).count) || 0
        : typeof entry === "number"
          ? entry
          : 0;
  });
  return counts;
}

export async function performFullReset(): Promise<{
  ok: boolean;
  mode: string;
  deleted: ResetCounts;
}> {
  const data = (await apiRequest("/api/platform/admin/reset/reset", {
    method: "POST",
    body: JSON.stringify({ confirm: "RESET" }),
  })) as { ok: boolean; mode: string; deleted: unknown };
  return { ok: data.ok, mode: data.mode, deleted: mapDeletedCounts(FULL_RESET_DELETE_ORDER, data.deleted) };
}

export async function performOrgReset(orgId: string): Promise<{
  ok: boolean;
  mode: string;
  organizationId: string;
  deleted: ResetCounts;
}> {
  const data = (await apiRequest(`/api/platform/admin/reset/orgs/${orgId}/reset`, {
    method: "POST",
    body: JSON.stringify({ confirm: "RESET" }),
  })) as { ok: boolean; mode: string; organizationId: string; deleted: unknown };
  return {
    ok: data.ok,
    mode: data.mode,
    organizationId: data.organizationId,
    deleted: mapDeletedCounts(ORG_RESET_DELETE_ORDER, data.deleted),
  };
}
