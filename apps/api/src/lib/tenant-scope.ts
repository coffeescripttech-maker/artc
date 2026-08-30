import { ForbiddenError, ValidationError } from "./errors";
import { CONTENT_TRANSITIONS } from "@aratc/shared";

const PLATFORM_ADMIN_ROLES = ["super_admin", "content_admin"];

/** True when the caller holds a platform-admin global role (super_admin / content_admin). */
export function hasPlatformAdminRole(roles: string[] | undefined | null): boolean {
  return roles?.some((r) => PLATFORM_ADMIN_ROLES.includes(r)) ?? false;
}

export type WorkflowAction = keyof typeof CONTENT_TRANSITIONS;

/**
 * Validates a status transition against the content state machine (§17).
 * Throws ValidationError with a clear message for illegal transitions.
 */
export function assertTransition(current: string, action: WorkflowAction): void {
  const t = CONTENT_TRANSITIONS[action];
  if (!(t.from as readonly string[]).includes(current)) {
    throw new ValidationError(
      `Cannot ${action} content in "${current}" status (allowed from: ${t.from.join(", ")})`,
    );
  }
}

/**
 * Approval-policy check (§15/§17).
 *
 * An organization requires content approval ONLY when it explicitly opts in
 * (Organization.metadata.teacher_auto_publish === false). The default is
 * direct publishing so every existing organization keeps its current
 * behavior — the review queue is opt-in per organization (§15: configurable
 * policy, never an abrupt workflow break).
 */
export function isApprovalRequired(
  resourceOrganizationId: string | null | undefined,
  orgMetadata: unknown,
  platformRoles: string[] | undefined,
): boolean {
  if (resourceOrganizationId == null) return false; // platform content
  if (platformRoles?.some((r) => PLATFORM_ADMIN_ROLES.includes(r))) return false;
  const meta = (orgMetadata ?? {}) as { teacher_auto_publish?: unknown };
  return meta.teacher_auto_publish === false;
}

/**
 * Publish guard: combines the state machine with the org approval policy.
 * Call after the ownership check (assertCanEditContent) and with the owning
 * organization's metadata loaded.
 */
export function assertCanPublish(
  currentStatus: string,
  resourceOrganizationId: string | null | undefined,
  orgMetadata: unknown,
  platformRoles: string[] | undefined,
): void {
  assertTransition(currentStatus, "PUBLISH");
  if (isApprovalRequired(resourceOrganizationId, orgMetadata, platformRoles)) {
    if (currentStatus !== "APPROVED") {
      throw new ForbiddenError(
        "This organization requires content review before publishing. Submit for review and wait for approval.",
      );
    }
  }
}

/**
 * List-scope for assessment LIST endpoints (CS#22.7 — C-2 legacy/tenant leakage).
 *
 * Complements `orgReadScope` for the assessments list, where the demo audit
 * showed unrelated records reaching student lists:
 * - Platform admins keep the unrestricted global catalog (existing admin tooling).
 * - Authenticated members are scoped to THEIR organization's assessments only —
 *   never other tenants, and never platform-orphan (`organizationId: null`)
 *   records such as the legacy "matth quiz 1".
 * - Anonymous callers see the public platform catalog (null-org) only.
 *
 * Pure function so the scope matrix is unit-testable (see assessment-list-scope.test.ts).
 */
export function assessmentListScope(
  organizationId: string | undefined,
  isPlatformAdmin: boolean,
): { organizationId: string } | { organizationId: null } | undefined {
  if (isPlatformAdmin) return undefined;
  if (organizationId) return { organizationId };
  return { organizationId: null };
}

/**
 * Org metadata shape for the approval policy flag.
 */
export function withAutoPublish(metadata: unknown, enabled: boolean): unknown {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  return { ...meta, teacher_auto_publish: enabled };
}

/**
 * Builds a Prisma where-filter for list/get scoping.
 *
 * Content is owned by an organization (organizationId set) or is
 * platform-level (organizationId IS NULL — globally visible).
 *
 * - With no org context: returns undefined (show everything) — preserves the
 *   existing behavior for callers that don't opt into tenant context.
 * - With org context: returns platform content OR the caller's own org.
 */
export function orgReadScope(
  organizationId?: string,
): { OR: Array<{ organizationId: null } | { organizationId: string }> } | undefined {
  if (!organizationId) return undefined;
  return { OR: [{ organizationId: null }, { organizationId }] };
}

/**
 * Authorization guard for content writes (§44 — enforced server-side, never
 * trusted from the frontend).
 *
 * Rules:
 * - Platform-owned content (organizationId IS NULL) may only be managed by
 *   platform admins (super_admin / content_admin).
 * - Organization content may only be managed by an active member of that
 *   organization (the caller's org context is resolved+verified by the
 *   resolveOrgContext middleware before this runs).
 * - Anything else is forbidden.
 */
export function assertCanEditContent(
  requesterOrganizationId: string | undefined,
  platformRoles: string[] | undefined,
  resourceOrganizationId: string | null | undefined,
): void {
  const isPlatformAdmin = platformRoles?.some((r) =>
    PLATFORM_ADMIN_ROLES.includes(r),
  );

  if (resourceOrganizationId == null) {
    if (!isPlatformAdmin) {
      throw new ForbiddenError(
        "Platform-owned content can only be managed by platform administrators",
      );
    }
    return;
  }

  if (requesterOrganizationId !== resourceOrganizationId) {
    throw new ForbiddenError(
      "You do not have access to content in this organization",
    );
  }
}

/**
 * True when the caller may create content within the given organization
 * context (an active membership is already verified by middleware).
 */
export function canCreateInOrg(requesterOrganizationId?: string): boolean {
  return Boolean(requesterOrganizationId);
}

/**
 * Read-scope predicate for single-resource GETs (§44).
 *
 * - Platform-owned content (organizationId IS NULL) is publicly readable —
 *   this preserves the existing public-catalog behavior.
 * - Organization-owned content is readable only by platform admins (global
 *   operators) or members of the owning organization (the caller's org
 *   context is resolved+verified by resolveOrgContext before this runs).
 *
 * Callers should respond with 404 (not 403) when this returns false, so the
 * existence of other organizations' content is never revealed.
 */
export function canReadContent(
  requesterOrganizationId: string | undefined,
  platformRoles: string[] | undefined,
  resourceOrganizationId: string | null | undefined,
): boolean {
  if (resourceOrganizationId == null) {
    return true; // platform content — public catalog
  }
  const isPlatformAdmin = platformRoles?.some((r) =>
    PLATFORM_ADMIN_ROLES.includes(r),
  );
  if (isPlatformAdmin) {
    return true;
  }
  return requesterOrganizationId === resourceOrganizationId;
}
