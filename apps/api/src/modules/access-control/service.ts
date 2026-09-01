// CS#23.2 — Access Control service: read the role/permission universe, edit a
// role's permission set (superadmin-configurable RBAC), and simulate what a
// role (optionally with an org-membership axis) would be granted.
//
// Writes are audit-logged (ROLE_PERMISSIONS_UPDATED) and invalidate the
// permission cache so changes take effect immediately.

import { prisma } from "@aratc/database";
import { ApiError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { auditLog } from "../../lib/audit-log";
import { invalidatePermissionCache } from "../../middleware/permissions";

/** Roles managed in code — their permission set cannot be edited via the UI. */
const SYSTEM_LOCKED_ROLES = ["super_admin"];

export async function listRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      _count: { select: { users: true, permissions: true } },
    },
    orderBy: { name: "asc" },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    userCount: r._count.users,
    permissionCount: r._count.permissions,
    systemLocked: SYSTEM_LOCKED_ROLES.includes(r.name),
  }));
}

export async function listPermissions() {
  const permissions = await prisma.permission.findMany({
    select: {
      key: true,
      resource: true,
      action: true,
      displayName: true,
      description: true,
      isEnforced: true,
    },
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
  return permissions;
}

export async function getRoleDetail(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      permissions: { select: { permission: { select: { key: true } } } },
      _count: { select: { users: true } },
    },
  });
  if (!role) throw new NotFoundError("Role not found");
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    userCount: role._count.users,
    permissionKeys: role.permissions.map((rp) => rp.permission.key),
    systemLocked: SYSTEM_LOCKED_ROLES.includes(role.name),
  };
}

/**
 * Replace a role's entire permission set (transactional). Refuses system
 * roles. The caller is expected to be a platform admin (route-guarded).
 */
export async function updateRolePermissions(params: {
  roleId: string;
  permissionKeys: string[];
  actorId: string;
}) {
  const role = await prisma.role.findUnique({ where: { id: params.roleId } });
  if (!role) throw new NotFoundError("Role not found");
  if (SYSTEM_LOCKED_ROLES.includes(role.name)) {
    throw new ForbiddenError(`Role "${role.name}" is system-locked and cannot be edited`);
  }
  if (!Array.isArray(params.permissionKeys)) {
    throw new ApiError("permissionKeys must be an array", 400);
  }
  const uniqueKeys = [...new Set(params.permissionKeys)];
  const known = await prisma.permission.findMany({
    where: { key: { in: uniqueKeys } },
    select: { id: true, key: true },
  });
  const unknown = uniqueKeys.filter((k) => !known.some((p) => p.key === k));
  if (unknown.length > 0) {
    throw new ApiError(`Unknown permission keys: ${unknown.join(", ")}`, 400);
  }

  const before = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permission: { select: { key: true } } },
  });
  const beforeKeys = before.map((b) => b.permission.key).sort();

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (known.length > 0) {
      await tx.rolePermission.createMany({
        data: known.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
          grantedBy: params.actorId,
        })),
      });
    }
  });
  invalidatePermissionCache();

  // Audit the outcome (log-after-commit, CS#14 principle 16).
  await auditLog({
    tenantId: "platform",
    actorId: params.actorId,
    eventType: "ROLE_PERMISSIONS_UPDATED",
    targetResourceId: role.id,
    actedOn: role.name,
    before: { permissionKeys: beforeKeys },
    after: { permissionKeys: uniqueKeys.sort() },
  });

  return { role: role.name, permissionKeys: uniqueKeys.sort() };
}

/**
 * Read-only capability catalog for the Organization Admin "Roles & Access"
 * experience (§21–§25, §50, §52). Unlike the platform editor endpoints this
 * is descriptive only: any authenticated user may read what each role CAN do,
 * but nothing here can be modified. Platform roles return their live granted
 * permission keys straight from the DB (no hard-coded matrix in the UI);
 * membership-role capabilities mirror the actual middleware enforcement
 * (middleware/content-editor.ts, organizations/service.ts).
 */
export async function listCapabilities() {
  const roles = await prisma.role.findMany({
    select: {
      name: true,
      displayName: true,
      description: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return {
    roles: roles.map((r) => ({
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      permissionKeys: r.permissions.map((rp) => rp.permission.key),
    })),
    membershipRoles: MEMBERSHIP_ROLE_CAPABILITIES,
  };
}

/**
 * Human-readable capability summaries for the organization membership axis.
 * These mirror what the middleware actually enforces — OWNER/ADMIN members
 * manage members + org content + the review queue; TEACHER members edit org
 * content drafts; LEARNER members consume enrolled content.
 */
const MEMBERSHIP_ROLE_CAPABILITIES: Array<{ role: string; capabilities: string[] }> = [
  {
    role: "OWNER",
    capabilities: [
      "Manage organization members",
      "Create, edit and publish organization content",
      "Approve content in the review queue",
      "Search users when adding members",
    ],
  },
  {
    role: "ADMIN",
    capabilities: [
      "Manage organization members",
      "Create, edit and publish organization content",
      "Approve content in the review queue",
      "Search users when adding members",
    ],
  },
  {
    role: "TEACHER",
    capabilities: [
      "Create and edit organization content drafts",
      "Manage classes and batches",
    ],
  },
  {
    role: "LEARNER",
    capabilities: [
      "Access enrolled lessons and assessments",
      "Track personal learning progress",
    ],
  },
];

/**
 * Simulate effective grants for a role. Optionally layers the org-membership
 * axis (OWNER/ADMIN/TEACHER/LEARNER) so the UI can show which capabilities
 * come from org context rather than the platform role.
 */
const ORG_AXIS_BY_MEMBERSHIP: Record<string, string[]> = {
  OWNER: ["orgs.users_search", "batches.manage"],
  ADMIN: ["orgs.users_search", "batches.manage"],
  TEACHER: ["batches.manage"],
  LEARNER: [],
};

export async function simulateRole(params: { roleName: string; membershipRole?: string }) {
  const role = await prisma.role.findUnique({ where: { name: params.roleName } });
  if (!role) throw new NotFoundError("Role not found");

  const grants = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permission: { select: { key: true, isEnforced: true } } },
  });
  const directKeys = grants.map((g) => g.permission.key);
  const isSuperAdmin = role.name === "super_admin";

  const allPermissions = await prisma.permission.findMany({ select: { key: true } });
  const allKeys = allPermissions.map((p) => p.key);

  const orgAxisKeys = params.membershipRole
    ? (ORG_AXIS_BY_MEMBERSHIP[params.membershipRole] ?? [])
    : [];

  const granted = isSuperAdmin ? allKeys : [...new Set([...directKeys, ...orgAxisKeys])];
  const denied = allKeys.filter((k) => !granted.includes(k));

  return {
    role: { id: role.id, name: role.name, displayName: role.displayName },
    membershipRole: params.membershipRole ?? null,
    orgAxisKeys,
    granted,
    denied,
    hardBypass: isSuperAdmin,
  };
}
