// CS#23.2 — Enterprise RBAC middleware.
//
// Effective permissions are resolved from the DATABASE (role_permissions join
// table) using the role NAMES carried in the verified JWT. Deliberate design:
// roles live in the token, but grants live in the DB — so a superadmin editing
// a role's permissions takes effect without re-issuing any tokens.
//
// super_admin hard-bypasses every check (SYSTEM role, mirrors the old
// PLATFORM_ADMIN_ROLES behavior) — this guarantees the platform owner can
// never be locked out by a bad grant edit.
//
// A short-TTL in-memory cache keeps the hot path at zero DB cost; it is
// invalidated whenever the access-control API mutates a role's grants.

import type { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { ForbiddenError } from "../lib/errors";

const CACHE_TTL_MS = 30_000;

const cache = new Map<string, { permissions: Set<string>; expiresAt: number }>();

export function invalidatePermissionCache(): void {
  cache.clear();
}

/**
 * Effective permission keys for a set of role names. Returns an empty set for
 * anonymous/role-less callers. The super_admin bypass is handled by callers
 * (requirePermission) rather than here so denied lists stay meaningful.
 */
export async function getEffectivePermissions(
  roleNames: string[] | undefined | null
): Promise<Set<string>> {
  if (!roleNames || roleNames.length === 0) return new Set();

  const cacheKey = [...roleNames].sort().join("|");
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.permissions;

  const grants = await prisma.rolePermission.findMany({
    where: { role: { name: { in: roleNames } } },
    select: { permission: { select: { key: true } } },
  });
  const permissions = new Set(grants.map((g) => g.permission.key));
  cache.set(cacheKey, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
  return permissions;
}

/**
 * True when the request's roles grant ANY of the given keys. super_admin
 * always passes (hard system bypass — see file header).
 */
export async function hasAnyPermission(
  req: Request,
  ...keys: string[]
): Promise<boolean> {
  const roles = req.userRoles;
  if (!roles || roles.length === 0) return false;
  if (roles.includes("super_admin")) return true;
  const permissions = await getEffectivePermissions(roles);
  return keys.some((k) => permissions.has(k));
}

/**
 * Route middleware: grants access when the caller holds ANY of the keys.
 * Usage: router.post("/", authenticate, requirePermission("programs.create"), create)
 */
export function requirePermission(...keys: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userRoles) {
        return next(new ForbiddenError("Roles not available"));
      }
      const allowed = await hasAnyPermission(req, ...keys);
      if (!allowed) {
        return next(new ForbiddenError("Insufficient permissions"));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
