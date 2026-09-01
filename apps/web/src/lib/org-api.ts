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
    systemRoles?: string[];
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

export async function fetchOrgMembers(
  orgId: string,
  params: { q?: string; role?: string; status?: string; systemRole?: string } = {},
): Promise<OrgMember[]> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  if (params.systemRole) query.set("systemRole", params.systemRole);
  const qs = query.toString();
  const data = await apiRequest(
    `/api/organizations/${orgId}/members${qs ? `?${qs}` : ""}`,
  ) as {
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

// ---------------------------------------------------------------------------
// CS#23.3 — Real tenant administration clients (parents, overview, settings,
// user creation, member detail). Every call is org-scoped server-side.
// ---------------------------------------------------------------------------

export interface OrgParentStudent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface OrgParent {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  membershipRole: string;
  linkedStudents: OrgParentStudent[];
  createdAt: string;
}

export interface OrgOverview {
  organization: { id: string; name: string; slug: string; type: string | null; status: string };
  members: number;
  teachers: number;
  students: number;
  parents: number;
  programs: number;
  activeEnrollments: number;
  publishedLessons: number;
  assessments: number;
}

export interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  status: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  description: string;
}

export interface OrgMemberDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  createdAt: string;
  systemRoles: string[];
  membership: { id: string; role: string; status: string; createdAt: string } | null;
  linkedStudents: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string }>;
  parents: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string }>;
  activeEnrollments: number;
  teachingAssignments: number;
  recentAuditEvents: number;
}

export async function fetchOrgParents(orgId: string): Promise<OrgParent[]> {
  const data = await apiRequest(`/api/organizations/${orgId}/parents`) as { parents: OrgParent[] };
  return data.parents;
}

export async function fetchOrgParent(orgId: string, userId: string): Promise<OrgParent> {
  const data = await apiRequest(`/api/organizations/${orgId}/parents/${userId}`) as { parent: OrgParent };
  return data.parent;
}

export async function linkParentStudent(
  orgId: string,
  parentUserId: string,
  studentUserId: string,
): Promise<{ id: string }> {
  const data = await apiRequest(
    `/api/organizations/${orgId}/parents/${parentUserId}/students/${studentUserId}`,
    { method: "POST" },
  ) as { link: { id: string } };
  return data.link;
}

export async function unlinkParentStudent(
  orgId: string,
  parentUserId: string,
  studentUserId: string,
): Promise<string> {
  const data = await apiRequest(
    `/api/organizations/${orgId}/parents/${parentUserId}/students/${studentUserId}`,
    { method: "DELETE" },
  ) as { removed: string };
  return data.removed;
}

export async function fetchOrgOverview(orgId: string): Promise<OrgOverview> {
  const data = await apiRequest(`/api/organizations/${orgId}/overview`) as { overview: OrgOverview };
  return data.overview;
}

export async function fetchOrgSettings(orgId: string): Promise<OrgSettings> {
  const data = await apiRequest(`/api/organizations/${orgId}/settings`) as { settings: OrgSettings };
  return data.settings;
}

export async function updateOrgSettings(
  orgId: string,
  patch: Partial<Omit<OrgSettings, "id">>,
): Promise<OrgSettings> {
  const data = await apiRequest(`/api/organizations/${orgId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }) as { settings: OrgSettings };
  return data.settings;
}

export async function createOrgUser(
  orgId: string,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    membershipRole?: string;
  },
): Promise<{ id: string; email: string; firstName: string; lastName: string; role: string }> {
  const res = await apiRequest(`/api/organizations/${orgId}/users`, {
    method: "POST",
    body: JSON.stringify(data),
  }) as { user: { id: string; email: string; firstName: string; lastName: string; role: string } };
  return res.user;
}

export async function fetchOrgMemberDetail(orgId: string, userId: string): Promise<OrgMemberDetail> {
  const data = await apiRequest(`/api/organizations/${orgId}/members/${userId}`) as { member: OrgMemberDetail };
  return data.member;
}
