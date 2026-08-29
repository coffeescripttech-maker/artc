import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { ForbiddenError } from "../lib/errors";

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
