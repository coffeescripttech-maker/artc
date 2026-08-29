import { prisma } from "@aratc/database";
import { ApiError, ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors";

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


export async function listOrgMembers(
  requesterId: string,
  requesterRoles: string[] | undefined,
  organizationId: string
): Promise<MembershipDTO[]> {
  await assertCanManageOrg(requesterId, requesterRoles, organizationId);

  const rows = await prisma.organizationMembership.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
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
    user: m.user,
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
  await prisma.organizationMembership.update({
    where: { id: membership.id },
    data: { status: "CANCELLED" },
  });
  return { id: membership.id };
}
