import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { ForbiddenError } from "../lib/errors";
import { hasAnyPermission } from "./permissions";

const PLATFORM_CONTENT_ROLES = ["content_admin", "super_admin"];
const ORG_MANAGER_MEMBERSHIP_ROLES = ["OWNER", "ADMIN"];
// §15: teachers create content (drafts) within their org; approval/publish
// remains reserved to org managers (requireContentApprover) and the review
// queue decides what gets published in review-mode organizations.
const ORG_EDITOR_MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "TEACHER"];

/**
 * Content-approver authorization (CS#6 — §15/§17). Must run AFTER
 * `authenticate` and `resolveOrgContext`.
 *
 * Allows:
 *  - Platform content admins (content_admin / super_admin) — always.
 *  - Organization members with OWNER or ADMIN membership role — the review
 *    queue is managed by org managers, never plain TEACHER/LEARNER members.
 */
export function requireContentApprover() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.userRoles ?? [];

    if (roles.some((r) => PLATFORM_CONTENT_ROLES.includes(r))) {
      return next();
    }

    const membershipRole = req.membership?.role;
    if (
      membershipRole !== undefined &&
      ORG_MANAGER_MEMBERSHIP_ROLES.includes(membershipRole)
    ) {
      return next();
    }

    return next(
      new ForbiddenError(
        "Only organization owners/admins or platform administrators can review and approve content",
      ),
    );
  };
}

/**
 * Content-editor authorization (CS#5). Must run AFTER `authenticate` and
 * `resolveOrgContext` so req.userRoles / req.organizationId / req.membership
 * are populated (all server-side verified — §44).
 *
 * Allows:
 *  - Platform content admins (content_admin / super_admin) — always, and may
 *    operate without an org context (platform-level content).
 *  - school_admin platform role, or an org OWNER/ADMIN member — ONLY when:
 *      (a) the org-content-creation feature flag is enabled, AND
 *      (b) there is an active, verified org context on the request.
 *
 * The org-context requirement is the security boundary: an org manager can
 * never create platform-level or another organization's content.
 */
export function requireContentEditor() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.userRoles ?? [];

    // Platform content admins always pass.
    if (roles.some((r) => PLATFORM_CONTENT_ROLES.includes(r))) {
      return next();
    }

    const isOrgEditor =
      roles.includes("school_admin") ||
      (req.membership?.role !== undefined &&
        ORG_EDITOR_MEMBERSHIP_ROLES.includes(req.membership.role));

    if (
      config.enableOrgContentCreation &&
      isOrgEditor &&
      req.organizationId
    ) {
      return next();
    }

    return next(
      new ForbiddenError(
        req.organizationId
          ? "Your role cannot create content in this organization"
          : "An organization context is required to create content",
      ),
    );
  };
}

/**
 * CS#23.4 — layered content authorization. The global permission key
 * (programs.create, lessons.publish, …) is the PRIMARY mechanism; the
 * org-membership editor/approver rules above remain as a fallback so every
 * existing organization content workflow keeps working unchanged.
 *
 * Grant path scope guard: holding the permission key alone must never bypass
 * tenant scoping. A caller passes via the grant path only if it is a platform
 * content role (may manage platform-level, orgless content) OR carries an
 * active organization context (service-level assertCanEditContent then
 * enforces resource ownership). Otherwise the request falls through to the
 * membership check, preserving prior behavior exactly.
 *
 * Note: revoking one of these keys from a role takes effect for that role;
 * the platform content roles (super_admin / content_admin) remain system-level
 * content managers by design — mirroring the super_admin hard-bypass policy.
 */
export function requireContentPermission(
  permissionKey: string,
  kind: "editor" | "approver" = "editor",
) {
  const membershipCheck =
    kind === "approver" ? requireContentApprover() : requireContentEditor();
  return (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      const roles = req.userRoles;
      if (roles && roles.length > 0 && (await hasAnyPermission(req, permissionKey))) {
        const scopeOk =
          PLATFORM_CONTENT_ROLES.some((r) => roles.includes(r)) ||
          Boolean(req.organizationId);
        if (scopeOk) {
          return next();
        }
      }
      membershipCheck(req, res, next);
    })().catch(next);
  };
}
