import { prisma, Prisma } from "@aratc/database";
import { hash } from "bcryptjs";
import { ApiError, ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors";
import { auditLog } from "../../lib/audit-log";

const PLATFORM_ADMIN_ROLES = ["super_admin", "content_admin"];
const ORG_MANAGER_ROLES = ["OWNER", "ADMIN"];
const ASSIGNABLE_ROLES = ["OWNER", "ADMIN", "TEACHER", "LEARNER"] as const;
const MEMBERSHIP_STATUSES = ["ACTIVE", "PENDING", "CANCELLED"] as const;

export type AssignableOrgRole = (typeof ASSIGNABLE_ROLES)[number];
export type MembershipStatusValue = (typeof MEMBERSHIP_STATUSES)[number];

export interface MembershipDTO {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    systemRoles?: string[];
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    type: string | null;
  };
}

/**
 * Can this requester manage memberships of the given organization?
 * Platform admins may manage any org; org OWNER/ADMIN members manage their own.
 */
export function canManageOrgMembers(
  requesterRoles: string[] | undefined,
  membershipRole: string | undefined
): boolean {
  if (requesterRoles?.some((role) => PLATFORM_ADMIN_ROLES.includes(role))) {
    return true;
  }
  return membershipRole !== undefined && ORG_MANAGER_ROLES.includes(membershipRole);
}

/**
 * User search backing the membership pickers. Authorization mirrors member
 * management: platform admins (any org) or org OWNER/ADMIN members. Returns
 * at most 10 matches; requires a 2+ char query to avoid full-enumeration.
 */
export async function searchUsers(
  requesterRoles: string[] | undefined,
  membershipRole: string | undefined,
  query: string
): Promise<
  Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  }>
> {
  if (!canManageOrgMembers(requesterRoles, membershipRole)) {
    throw new ForbiddenError("You are not allowed to search users");
  }
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: { select: { role: { select: { name: true } } } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 10,
  });
  return users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    roles: u.roles.map((ur) => ur.role.name),
  }));
}

/**
 * Authorization guard used by every membership operation.
 * Throws unless the requester is a platform admin or an active OWNER/ADMIN
 * member of the target organization.
 */
export async function assertCanManageOrg(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string
): Promise<void> {
  const orgExists = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!orgExists) {
    throw new NotFoundError("Organization not found");
  }

  const own = await prisma.organizationMembership.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: requesterId },
    },
  });

  if (!canManageOrgMembers(requesterRoles, own?.role)) {
    throw new ForbiddenError("You do not have permission to manage this organization's members");
  }

  if (own && own.status !== "ACTIVE") {
    throw new ForbiddenError("Your membership in this organization is not active");
  }
}

export function parseOrgRole(value: unknown): AssignableOrgRole {
  if (typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value)) {
    return value as AssignableOrgRole;
  }
  throw new ValidationError(
    `Invalid organization role. Allowed: ${ASSIGNABLE_ROLES.join(", ")}`
  );
}

export function parseMembershipStatus(value: unknown): MembershipStatusValue {
  if (typeof value === "string" && (MEMBERSHIP_STATUSES as readonly string[]).includes(value)) {
    return value as MembershipStatusValue;
  }
  throw new ValidationError(
    `Invalid membership status. Allowed: ${MEMBERSHIP_STATUSES.join(", ")}`
  );
}

/** ACTIVE memberships of the current user, with org summaries (for the org switcher). */
export async function listMyMemberships(userId: string): Promise<MembershipDTO[]> {
  const rows = await prisma.organizationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      organization: { select: { id: true, name: true, slug: true, type: true } },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    userId: m.userId,
    role: m.role,
    status: m.status,
    createdAt: m.createdAt,
    organization: m.organization,
  }));
}

/**
 * All organizations with member/program counts.
 * Platform-administration only (enforced in routes) — used by the admin
 * members-management UI to pick an organization to manage.
 */
export async function listOrganizations(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    type: string | null;
    memberCount: number;
    programCount: number;
  }>
> {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
          programs: true,
        },
      },
    },
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    type: o.type,
    memberCount: o._count.memberships,
    programCount: o._count.programs,
  }));
}


export interface OrgMemberFilters {
  q?: string;
  role?: AssignableOrgRole;
  status?: MembershipStatusValue;
  systemRole?: string;
  limit?: number;
}

export async function listOrgMembers(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string,
  filters: OrgMemberFilters = {}
): Promise<MembershipDTO[]> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);

  const q = filters.q?.trim().toLowerCase();
  const where: Prisma.OrganizationMembershipWhereInput = { organizationId };
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.systemRole) {
    where.user = { roles: { some: { role: { name: filters.systemRole } } } };
  }
  if (q) {
    where.OR = [
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { firstName: { contains: q, mode: "insensitive" } } },
      { user: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.organizationMembership.findMany({
    where,
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
    take: filters.limit ?? 500,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    userId: m.userId,
    role: m.role,
    status: m.status,
    createdAt: m.createdAt,
    user: {
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      systemRoles: m.user.roles.map((r) => r.role.name),
    },
  }));
}

export async function createMembership(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  userId: string;
  role: AssignableOrgRole;
}): Promise<MembershipDTO> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) {
    throw new ValidationError("Target user does not exist");
  }

  const existing = await prisma.organizationMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
  });
  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new ApiError("User is already an active member of this organization", 409);
    }
    // Re-activating a PENDING/CANCELLED membership instead of duplicating it.
    const revived = await prisma.organizationMembership.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", role: input.role },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    // §34 — organization role assignment is audited (grant via re-activation).
    await auditLog({
      tenantId: input.organizationId,
      actorId: input.requesterId,
      eventType: "MEMBERSHIP_GRANTED",
      targetUserId: input.userId,
      targetResourceId: revived.id,
      actedOn: revived.user?.email ?? input.userId,
      after: { role: input.role, status: "ACTIVE", reactivated: true },
    }).catch(() => {});
    return revived as MembershipDTO;
  }

  const created = await prisma.organizationMembership.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: "ACTIVE",
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  // §34 — organization role assignment is audited (new grant).
  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "MEMBERSHIP_GRANTED",
    targetUserId: input.userId,
    targetResourceId: created.id,
    actedOn: created.user?.email ?? input.userId,
    after: { role: input.role, status: "ACTIVE" },
  }).catch(() => {});
  return created as MembershipDTO;
}

export async function updateMembership(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  membershipId: string;
  role?: AssignableOrgRole;
  status?: MembershipStatusValue;
}): Promise<MembershipDTO> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);

  const membership = await prisma.organizationMembership.findUnique({
    where: { id: input.membershipId },
  });
  if (!membership || membership.organizationId !== input.organizationId) {
    throw new NotFoundError("Membership not found in this organization");
  }

  // Guard: only a platform super_admin can modify an OWNER membership.
  const requesterIsPlatformAdmin = input.requesterRoles?.includes("super_admin");
  if (membership.role === "OWNER" && !requesterIsPlatformAdmin) {
    throw new ForbiddenError("Only a platform super_admin can modify an OWNER membership");
  }

  if (input.role === undefined && input.status === undefined) {
    throw new ValidationError("Nothing to update — provide role and/or status");
  }

  const updated = await prisma.organizationMembership.update({
    where: { id: membership.id },
    data: {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  // §34 — role/status changes on an existing member are audited with the
  // before/after values (e.g. TEACHER → ADMIN) for the organization audit log.
  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "MEMBERSHIP_ROLE_CHANGED",
    targetUserId: membership.userId,
    targetResourceId: membership.id,
    actedOn: updated.user?.email ?? membership.userId,
    before: { role: membership.role, status: membership.status },
    after: { role: updated.role, status: updated.status },
  }).catch(() => {});
  return updated as MembershipDTO;
}

export async function removeMembership(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  membershipId: string;
}): Promise<{ id: string }> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);

  const membership = await prisma.organizationMembership.findUnique({
    where: { id: input.membershipId },
  });
  if (!membership || membership.organizationId !== input.organizationId) {
    throw new NotFoundError("Membership not found in this organization");
  }

  if (membership.role === "OWNER") {
    // Guard: never remove the last OWNER of an organization.
    const ownerCount = await prisma.organizationMembership.count({
      where: { organizationId: input.organizationId, role: "OWNER", status: "ACTIVE" },
    });
    const requesterIsPlatformAdmin = input.requesterRoles?.includes("super_admin");
    if (!requesterIsPlatformAdmin && ownerCount <= 1) {
      throw new ForbiddenError("Cannot remove the last OWNER of an organization");
    }
  }

  // Soft-remove: CANCELLED preserves history; the row is never deleted.
  const removed = await prisma.organizationMembership.update({
    where: { id: membership.id },
    data: { status: "CANCELLED" },
  });
  // §34 — membership revocation is audited.
  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "MEMBERSHIP_REVOKED",
    targetUserId: membership.userId,
    targetResourceId: membership.id,
    actedOn: membership.userId,
    before: { role: membership.role, status: membership.status },
    after: { status: removed.status },
  }).catch(() => {});
  return { id: membership.id };
}

// ============================================================================
// CS#23.3 — Real Tenant Administration (§4–§27)
//
// Organization Overview, Settings (metadata-backed), Parent management,
// member detail, and organization-scoped user creation. Every entry asserts
// the requester can manage the organization (platform admin or org OWNER/ADMIN).
// Parent → student linking additionally requires BOTH people to be active
// members of the SAME organization, so cross-tenant linking is impossible by
// construction — the server never trusts an organizationId from the browser.
// ============================================================================

const PARENT_SYSTEM_ROLE = "parent";

/**
 * System roles an Organization Admin may assign when creating users (§25).
 * super_admin / content_admin / school_admin are platform-level and are
 * rejected server-side no matter what the browser sends.
 */
const ORG_ASSIGNABLE_SYSTEM_ROLES = ["teacher", "student", "parent"] as const;

export interface ParentDTO {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  membershipRole: string;
  linkedStudents: Array<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  }>;
  createdAt: Date;
}

interface ParentRow {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    status: string;
    parentLinks: Array<{
      id: string;
      status: string;
      studentUserId: string;
      student: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        memberships: Array<{ organizationId: string }>;
      };
    }>;
  };
  id: string;
  organizationId: string;
  role: string;
  status: string;
  createdAt: Date;
  userId: string;
}

function toParentDTO(m: ParentRow): ParentDTO {
  return {
    id: m.id,
    userId: m.userId,
    email: m.user.email,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    phone: m.user.phoneNumber,
    status: m.user.status,
    membershipRole: m.role,
    // Org-scoping: only show student links where the student is ALSO a member
    // of this same organization. Cross-org links never leak into the list.
    linkedStudents: m.user.parentLinks
      .filter((pl) =>
        pl.student.memberships.some((ms) => ms.organizationId === m.organizationId)
      )
      .map((pl) => ({
        id: pl.id,
        userId: pl.studentUserId,
        firstName: pl.student.firstName,
        lastName: pl.student.lastName,
        email: pl.student.email,
        status: pl.status,
      })),
    createdAt: m.createdAt,
  };
}

const PARENT_MEMBER_SELECT = {
  id: true,
  organizationId: true,
  role: true,
  status: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      status: true,
      parentLinks: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          status: true,
          studentUserId: true,
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              memberships: { select: { organizationId: true } },
            },
          },
        },
      },
    },
  },
} as const;

/** Parents of an organization (§15) — real users with the parent role who are active members. */
export async function listOrgParents(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string
): Promise<ParentDTO[]> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);
  const rows = (await prisma.organizationMembership.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      user: { roles: { some: { role: { name: PARENT_SYSTEM_ROLE } } } },
    },
    select: PARENT_MEMBER_SELECT,
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
  })) as unknown as ParentRow[];
  return rows.map(toParentDTO);
}

/** Single parent detail (§16). */
export async function getOrgParent(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string,
  userId: string
): Promise<ParentDTO> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);
  const row = (await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId,
      status: "ACTIVE",
      user: { roles: { some: { role: { name: PARENT_SYSTEM_ROLE } } } },
    },
    select: PARENT_MEMBER_SELECT,
  })) as unknown as ParentRow | null;
  if (!row) {
    throw new NotFoundError("Parent not found in this organization");
  }
  return toParentDTO(row);
}

/**
 * Link a parent to a student (§17). Both must be ACTIVE members of the SAME
 * organization — a parent can never be linked to a student outside their org.
 */
export async function linkParentStudent(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  parentUserId: string;
  studentUserId: string;
}): Promise<{ id: string; parentUserId: string; studentUserId: string; status: string }> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);
  if (input.parentUserId === input.studentUserId) {
    throw new ValidationError("A parent cannot be linked to themselves");
  }

  const [parentMember, studentMember] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.parentUserId,
        },
      },
      select: {
        status: true,
        user: { select: { roles: { select: { role: { select: { name: true } } } } } },
      },
    }),
    prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.studentUserId,
        },
      },
      select: { status: true },
    }),
  ]);

  if (!parentMember || parentMember.status !== "ACTIVE") {
    throw new ValidationError("Parent must be an active member of this organization");
  }
  if (!parentMember.user.roles.some((r) => r.role.name === PARENT_SYSTEM_ROLE)) {
    throw new ValidationError("The selected user does not have the parent role");
  }
  if (!studentMember || studentMember.status !== "ACTIVE") {
    throw new ValidationError("Student must be an active member of this organization");
  }

  const link = await prisma.parentStudent.upsert({
    where: {
      parentUserId_studentUserId: {
        parentUserId: input.parentUserId,
        studentUserId: input.studentUserId,
      },
    },
    create: {
      parentUserId: input.parentUserId,
      studentUserId: input.studentUserId,
      status: "ACTIVE",
      requestedBy: "ADMIN",
    },
    update: { status: "ACTIVE", requestedBy: "ADMIN", respondedAt: null },
  });

  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "PARENT_LINKED",
    targetUserId: input.parentUserId,
    targetResourceId: link.id,
    actedOn: input.studentUserId,
    after: { parentUserId: input.parentUserId, studentUserId: input.studentUserId, requestedBy: "ADMIN" },
  }).catch(() => {});
  return { id: link.id, parentUserId: input.parentUserId, studentUserId: input.studentUserId, status: link.status };
}

/** Unlink a parent from a student — soft-revokes the link (§17). */
export async function unlinkParentStudent(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  parentUserId: string;
  studentUserId: string;
}): Promise<{ id: string }> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);
  const link = await prisma.parentStudent.findUnique({
    where: {
      parentUserId_studentUserId: {
        parentUserId: input.parentUserId,
        studentUserId: input.studentUserId,
      },
    },
  });
  if (!link) {
    throw new NotFoundError("Parent-student link not found");
  }
  // Both sides must still belong to this organization; otherwise the link is
  // not visible/manageable through this org's tenant context.
  const [parentInOrg, studentInOrg] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.parentUserId,
        },
      },
      select: { id: true },
    }),
    prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.studentUserId,
        },
      },
      select: { id: true },
    }),
  ]);
  if (!parentInOrg || !studentInOrg) {
    throw new NotFoundError("Parent or student is not a member of this organization");
  }

  const updated = await prisma.parentStudent.update({
    where: { id: link.id },
    data: { status: "REVOKED" },
  });
  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "PARENT_UNLINKED",
    targetUserId: input.parentUserId,
    targetResourceId: link.id,
    actedOn: input.studentUserId,
    before: { status: link.status },
    after: { status: updated.status },
  }).catch(() => {});
  return { id: link.id };
}

// --- Organization Overview (§22–§23) ----------------------------------------

export interface OrgOverviewDTO {
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

export async function getOrgOverview(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string
): Promise<OrgOverviewDTO> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true, type: true, status: true },
  });
  if (!org) {
    throw new NotFoundError("Organization not found");
  }

  const [members, teachers, students, parents, programs, activeEnrollments, publishedLessons, assessments] =
    await Promise.all([
      prisma.organizationMembership.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.organizationMembership.count({ where: { organizationId, status: "ACTIVE", role: "TEACHER" } }),
      prisma.organizationMembership.count({
        where: {
          organizationId,
          status: "ACTIVE",
          user: { roles: { some: { role: { name: "student" } } } },
        },
      }),
      prisma.organizationMembership.count({
        where: {
          organizationId,
          status: "ACTIVE",
          user: { roles: { some: { role: { name: PARENT_SYSTEM_ROLE } } } },
        },
      }),
      prisma.program.count({ where: { organizationId } }),
      prisma.enrollment.count({ where: { program: { organizationId }, status: "ACTIVE" } }),
      prisma.lesson.count({ where: { organizationId, status: "PUBLISHED" } }),
      prisma.assessment.count({ where: { organizationId } }),
    ]);

  return {
    organization: org,
    members,
    teachers,
    students,
    parents,
    programs,
    activeEnrollments,
    publishedLessons,
    assessments,
  };
}

// --- Organization Settings (§19–§21) ----------------------------------------

export interface OrgSettingsDTO {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  status: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  description: string;
  metadata: Record<string, unknown>;
}

const ORG_SETTINGS_META_FIELDS = ["contactEmail", "contactPhone", "address", "description"] as const;
type OrgSettingsMetaField = (typeof ORG_SETTINGS_META_FIELDS)[number];

function orgMetadata(org: { metadata: unknown }): Record<string, unknown> {
  if (org.metadata && typeof org.metadata === "object") {
    return org.metadata as Record<string, unknown>;
  }
  return {};
}

export async function getOrgSettings(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string
): Promise<OrgSettingsDTO> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    throw new NotFoundError("Organization not found");
  }
  const meta = orgMetadata(org);
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    status: org.status,
    contactEmail: (meta.contactEmail as string) ?? "",
    contactPhone: (meta.contactPhone as string) ?? "",
    address: (meta.address as string) ?? "",
    description: (meta.description as string) ?? "",
    metadata: meta,
  };
}

export async function updateOrgSettings(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  data: {
    name?: string;
    slug?: string;
    type?: string | null;
    status?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    description?: string;
  };
}): Promise<OrgSettingsDTO> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true, name: true, slug: true, type: true, status: true, metadata: true },
  });
  if (!org) {
    throw new NotFoundError("Organization not found");
  }

  const d = input.data;
  if (d.slug !== undefined && d.slug !== org.slug) {
    if (!/^[a-z0-9-]+$/.test(d.slug)) {
      throw new ValidationError("Slug may only contain lowercase letters, numbers and hyphens");
    }
    const clash = await prisma.organization.findUnique({
      where: { slug: d.slug },
      select: { id: true },
    });
    if (clash) {
      throw new ValidationError("That slug is already in use");
    }
  }

  const before = orgMetadata(org);
  const after: Record<string, unknown> = { ...before };
  for (const field of ORG_SETTINGS_META_FIELDS) {
    if (d[field as OrgSettingsMetaField] !== undefined) {
      after[field] = d[field as OrgSettingsMetaField];
    }
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.slug !== undefined ? { slug: d.slug } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.status !== undefined
        ? { status: d.status as "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED" }
        : {}),
      metadata: after as Prisma.InputJsonValue,
    },
  });

  await auditLog({
    tenantId: org.id,
    actorId: input.requesterId,
    eventType: "ORG_UPDATED",
    targetResourceId: org.id,
    actedOn: updated.name,
    before: { name: org.name, slug: org.slug, type: org.type },
    after: { name: updated.name, slug: updated.slug, type: updated.type },
  }).catch(() => {});

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    type: updated.type,
    status: updated.status,
    contactEmail: (after.contactEmail as string) ?? "",
    contactPhone: (after.contactPhone as string) ?? "",
    address: (after.address as string) ?? "",
    description: (after.description as string) ?? "",
    metadata: after,
  };
}

// --- Organization user creation (§24–§25) -----------------------------------

export async function createOrgUser(input: {
  requesterId: string;
  requesterRoles: string[] | undefined;
  organizationId: string;
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    membershipRole?: string;
  };
}): Promise<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  membershipRole: string;
}> {
  await assertCanManageOrg(input.requesterId, input.requesterRoles, input.organizationId);

  const role = input.data.role;
  if (!(ORG_ASSIGNABLE_SYSTEM_ROLES as readonly string[]).includes(role)) {
    throw new ValidationError(
      `Organization administrators can only assign roles: ${ORG_ASSIGNABLE_SYSTEM_ROLES.join(", ")}`
    );
  }
  const email = input.data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("A valid email is required");
  }
  if (!input.data.password || input.data.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (!input.data.firstName.trim() || !input.data.lastName.trim()) {
    throw new ValidationError("First and last name are required");
  }
  const membershipRole = parseOrgRole(input.data.membershipRole ?? "LEARNER");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationError("A user with this email already exists");
  }

  const passwordHash = await hash(input.data.password, 10);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: input.data.firstName.trim(),
      lastName: input.data.lastName.trim(),
      status: "ACTIVE",
      roles: { create: { role: { connect: { name: role } } } },
    },
  });

  // Students need a learner profile for enrollments/progress.
  if (role === "student") {
    await prisma.learnerProfile.create({
      data: { userId: created.id, organizationId: input.organizationId, currentStage: "ENTRANCE_EXAM" },
    });
  }

  const membership = await prisma.organizationMembership.create({
    data: {
      organizationId: input.organizationId,
      userId: created.id,
      role: membershipRole,
      status: "ACTIVE",
    },
  });

  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "USER_CREATED",
    targetUserId: created.id,
    targetResourceId: created.id,
    actedOn: email,
    after: { role },
  }).catch(() => {});
  await auditLog({
    tenantId: input.organizationId,
    actorId: input.requesterId,
    eventType: "MEMBERSHIP_GRANTED",
    targetUserId: created.id,
    targetResourceId: membership.id,
    actedOn: email,
    after: { role: membershipRole, status: "ACTIVE" },
  }).catch(() => {});

  return {
    id: created.id,
    email,
    firstName: created.firstName,
    lastName: created.lastName,
    role,
    membershipRole,
  };
}

// --- Member detail (§7) ------------------------------------------------------

export interface OrgMemberDetailDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  createdAt: Date;
  systemRoles: string[];
  membership: { id: string; role: string; status: string; createdAt: Date } | null;
  linkedStudents: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string }>;
  parents: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string }>;
  activeEnrollments: number;
  teachingAssignments: number;
  recentAuditEvents: number;
}

export async function getOrgMemberDetail(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string,
  userId: string
): Promise<OrgMemberDetailDTO> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      status: true,
      createdAt: true,
      roles: { select: { role: { select: { name: true } } } },
      memberships: {
        where: { organizationId },
        select: { id: true, role: true, status: true, createdAt: true },
        take: 1,
      },
      parentLinks: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          studentUserId: true,
          status: true,
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              memberships: { select: { organizationId: true } },
            },
          },
        },
      },
      studentLinks: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          parentUserId: true,
          status: true,
          parent: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              memberships: { select: { organizationId: true } },
            },
          },
        },
      },
    },
  });

  if (!row) {
    throw new NotFoundError("User not found");
  }

  const linkedStudents = row.parentLinks
    .filter((pl) => pl.student.memberships.some((ms) => ms.organizationId === organizationId))
    .map((pl) => ({
      id: pl.id,
      userId: pl.studentUserId,
      firstName: pl.student.firstName,
      lastName: pl.student.lastName,
      email: pl.student.email,
    }));
  const parents = row.studentLinks
    .filter((pl) => pl.parent.memberships.some((ms) => ms.organizationId === organizationId))
    .map((pl) => ({
      id: pl.id,
      userId: pl.parentUserId,
      firstName: pl.parent.firstName,
      lastName: pl.parent.lastName,
      email: pl.parent.email,
    }));

  const [activeEnrollments, teachingAssignments, recentAuditEvents] = await Promise.all([
    prisma.enrollment.count({
      where: { learner: { userId }, program: { organizationId }, status: "ACTIVE" },
    }),
    prisma.batchTeacher.count({
      where: { teacherId: userId, batch: { program: { organizationId } } },
    }),
    prisma.auditEvent.count({
      where: {
        tenantId: organizationId,
        OR: [{ targetUserId: userId }, { actorId: userId }],
      },
    }),
  ]);

  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phoneNumber: row.phoneNumber,
    status: row.status,
    createdAt: row.createdAt,
    systemRoles: row.roles.map((r) => r.role.name),
    membership: row.memberships[0] ?? null,
    linkedStudents,
    parents,
    activeEnrollments,
    teachingAssignments,
    recentAuditEvents,
  };
}