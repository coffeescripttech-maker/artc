import { Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Content visibility (backend-enforced — the frontend is NOT a security boundary).
 *
 * Anonymous requests and learner-scoped roles (student, parent) may only see
 * PUBLISHED content. Privileged roles see everything, matching the previous
 * behavior the admin UI depends on.
 *
 * Most list/read routes are public (no authenticate middleware) for
 * backward compatibility, so the role signal is resolved here: prefer the
 * req.userRoles set by authenticate(), otherwise opportunistically decode
 * the Bearer token when one is presented. Invalid/absent tokens simply
 * resolve to anonymous — this NEVER grants access, only visibility scope.
 *
 * Phase 1 (org-context middleware) will replace this opportunistic decode
 * with a proper optionalAuth middleware.
 */
const PRIVILEGED_CONTENT_ROLES: ReadonlySet<string> = new Set([
  "teacher",
  "school_admin",
  "content_admin",
  "super_admin",
]);

export function getRequestRoles(req: Request): string[] {
  if (req.userRoles && req.userRoles.length > 0) {
    return req.userRoles;
  }

  const header = req.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return [];
  }

  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as {
      roles?: string[];
    };
    return Array.isArray(decoded.roles) ? decoded.roles : [];
  } catch {
    // Invalid/expired token → treated as anonymous for visibility purposes.
    return [];
  }
}

export function canViewUnpublishedContent(req: Request): boolean {
  const roles = getRequestRoles(req);
  if (roles.length === 0) {
    return false;
  }
  return roles.some((role) => PRIVILEGED_CONTENT_ROLES.has(role));
}

export interface ContentVisibilityOptions {
  /**
   * Services default to TRUE so every internal caller keeps today's behavior;
   * each public controller passes the resolved flag explicitly. The permission
   * layer (Phase 2) will centralize this decision.
   */
  includeUnpublished?: boolean;
}

/** Resolve visibility options from the request (API-boundary helper). */
export function contentVisibility(req: Request): ContentVisibilityOptions {
  return { includeUnpublished: canViewUnpublishedContent(req) };
}

/** Extra `where` fragment that restricts list queries to published content. */
export function publishedOnly(
  opts?: ContentVisibilityOptions
): { status: "PUBLISHED" } | Record<string, never> {
  return opts?.includeUnpublished ? {} : { status: "PUBLISHED" as const };
}

/** Whether a single fetched record may be returned to this caller. */
export function isVisible(
  status: string | null | undefined,
  opts?: ContentVisibilityOptions
): boolean {
  if (opts?.includeUnpublished) {
    return true;
  }
  return status === "PUBLISHED";
}