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
