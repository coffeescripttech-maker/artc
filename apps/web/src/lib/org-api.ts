"use client";

import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Organization / membership API client (Change Set #3).
// Additive only — no existing API client behavior is modified.
// ---------------------------------------------------------------------------

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  type: string | null;
}

export interface MyMembership {
  id: string;
  role: string;
  organization: OrgSummary;
}

export interface OrganizationWithCounts extends OrgSummary {
  memberCount: number;
  programCount: number;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export type OrgRole = "OWNER" | "ADMIN" | "TEACHER" | "LEARNER";

const ACTIVE_ORG_KEY = "activeOrganizationId";

/** Persisted "active organization" used to send x-organization-id headers. */
export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ORG_KEY);
}

export function setActiveOrgId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id === null) {
    localStorage.removeItem(ACTIVE_ORG_KEY);
  } else {
    localStorage.setItem(ACTIVE_ORG_KEY, id);
  }
}

export async function fetchMyMemberships(): Promise<MyMembership[]> {
  const data = await apiRequest("/api/organizations/me/memberships") as {
    memberships: MyMembership[];
  };
  return data.memberships;
}

/** Platform admins only — enumerates every organization. */
export async function fetchOrganizations(): Promise<OrganizationWithCounts[]> {
  const data = await apiRequest("/api/organizations") as {
    organizations: OrganizationWithCounts[];
  };
  return data.organizations;
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  const data = await apiRequest(`/api/organizations/${orgId}/members`) as {
    members: OrgMember[];
  };
  return data.members;
}

export async function grantMembership(
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<OrgMember> {
  const data = await apiRequest(`/api/organizations/${orgId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId, role }),
  }) as { member: OrgMember };
  return data.member;
}

export async function updateMembership(
  orgId: string,
  membershipId: string,
  changes: { role?: OrgRole; status?: string },
): Promise<OrgMember> {
  const data = await apiRequest(
    `/api/organizations/${orgId}/members/${membershipId}`,
    {
      method: "PATCH",
      body: JSON.stringify(changes),
    },
  ) as { member: OrgMember };
  return data.member;
}

export async function removeMembership(
  orgId: string,
  membershipId: string,
): Promise<string> {
  const data = await apiRequest(
    `/api/organizations/${orgId}/members/${membershipId}`,
    { method: "DELETE" },
  ) as { removed: string };
  return data.removed;
}
