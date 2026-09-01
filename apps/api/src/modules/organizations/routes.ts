import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/auth";
import { resolveOrgContext } from "../../middleware/org-context";
import { requirePermission, hasAnyPermission } from "../../middleware/permissions";
import { ApiError, ValidationError } from "../../lib/errors";
import {
  createMembership,
  createOrgUser,
  getOrgMemberDetail,
  getOrgOverview,
  getOrgParent,
  getOrgSettings,
  linkParentStudent,
  listMyMemberships,
  listOrgMembers,
  listOrgParents,
  listOrganizations,
  parseMembershipStatus,
  parseOrgRole,
  removeMembership,
  searchUsers,
  unlinkParentStudent,
  updateMembership,
  updateOrgSettings,
} from "./service";

const router: IRouter = Router();

/**
 * All organizations — platform administration only. Used by the admin
 * members-management UI to pick an organization to manage.
 */
router.get("/", authenticate, requirePermission("orgs.list"), async (_req, res, next) => {
  try {
    const organizations = await listOrganizations();
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
});

/**
 * Current user's ACTIVE organization memberships (for the org switcher).
 * Response shape is additive — existing /api/auth consumers are unaffected.
 */
router.get("/me/memberships", authenticate, async (req, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError("Unauthorized", 401);
    }
    const memberships = await listMyMemberships(req.userId);
    res.json({ memberships });
  } catch (error) {
    next(error);
  }
});

/**
 * User search for membership pickers. Allowed for the same callers who can
 * manage org members (platform admins, org OWNER/ADMIN members) — prevents
 * plain users from enumerating the user base. Requires at least 2 chars.
 */
router.get("/users/search", authenticate, resolveOrgContext, async (req, res, next) => {
  try {
    // CS#23.4 — layered authorization for `orgs.users_search` (§17/§30): the
    // DB grant is the primary path but can never bypass tenant scope on its
    // own — it is honored only for platform admin roles (platform-wide
    // search) or callers with a VERIFIED org context (resolveOrgContext
    // above proves an ACTIVE membership server-side; the header alone is
    // never trusted). Everyone else falls through to searchUsers'
    // membership-axis check (org OWNER/ADMIN), preserving prior behavior.
    const roles = req.userRoles ?? [];
    const hasSearchGrant =
      roles.length > 0 &&
      (await hasAnyPermission(req, "orgs.users_search")) &&
      (roles.some((r) => ["super_admin", "content_admin"].includes(r)) ||
        Boolean(req.organizationId));
    const users = await searchUsers(
      req.userRoles,
      req.membership?.role,
      String(req.query.q ?? ""),
      hasSearchGrant,
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

/** List all members of an organization (platform admin or org OWNER/ADMIN). */
router.get("/:orgId/members", authenticate, async (req, res, next) => {
  try {
    const members = await listOrgMembers(
      req.userId as string,
      req.userRoles,
      req.params.orgId,
      {
        q: typeof req.query.q === "string" ? req.query.q : undefined,
        role: typeof req.query.role === "string" ? parseOrgRole(req.query.role) : undefined,
        status: typeof req.query.status === "string" ? parseMembershipStatus(req.query.status) : undefined,
        systemRole: typeof req.query.systemRole === "string" ? req.query.systemRole : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      }
    );
    res.json({ members });
  } catch (error) {
    next(error);
  }
});

/**
 * Member detail (§7) — profile, org membership, system roles, linked
 * students/parents, enrollment + teaching counts, audit trail presence.
 * Same authorization as member management (platform admin or org OWNER/ADMIN).
 */
router.get("/:orgId/members/:userId", authenticate, async (req, res, next) => {
  try {
    const detail = await getOrgMemberDetail(
      req.userId as string,
      req.userRoles,
      req.params.orgId,
      req.params.userId
    );
    res.json({ member: detail });
  } catch (error) {
    next(error);
  }
});

/** Grant membership to an existing user (platform admin or org OWNER/ADMIN). */
router.post("/:orgId/members", authenticate, async (req, res, next) => {
  try {
    const { userId, role } = req.body ?? {};
    if (typeof userId !== "string" || userId.length === 0) {
      throw new ValidationError("userId is required");
    }
    const member = await createMembership({
      requesterId: req.userId as string,
      requesterRoles: req.userRoles,
      organizationId: req.params.orgId,
      userId,
      role: parseOrgRole(role),
    });
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

/** Update a member's role and/or status. */
router.patch("/:orgId/members/:membershipId", authenticate, async (req, res, next) => {
  try {
    const { role, status } = req.body ?? {};
    const member = await updateMembership({
      requesterId: req.userId as string,
      requesterRoles: req.userRoles,
      organizationId: req.params.orgId,
      membershipId: req.params.membershipId,
      role: role !== undefined ? parseOrgRole(role) : undefined,
      status: status !== undefined ? parseMembershipStatus(status) : undefined,
    });
    res.json({ member });
  } catch (error) {
    next(error);
  }
});

/** Soft-remove a member (status → CANCELLED; history preserved). */
router.delete("/:orgId/members/:membershipId", authenticate, async (req, res, next) => {
  try {
    const result = await removeMembership({
      requesterId: req.userId as string,
      requesterRoles: req.userRoles,
      organizationId: req.params.orgId,
      membershipId: req.params.membershipId,
    });
    res.json({ removed: result.id });
  } catch (error) {
    next(error);
  }
});

/** Organization overview metrics (§22–§23) — real DB counts, org-scoped. */
router.get("/:orgId/overview", authenticate, requirePermission("admin.stats_view"), async (req, res, next) => {
  try {
    const overview = await getOrgOverview(
      req.userId as string,
      req.userRoles,
      req.params.orgId
    );
    res.json({ overview });
  } catch (error) {
    next(error);
  }
});

/** Parents of an organization (§15) — real parent-role members with linked students. */
router.get("/:orgId/parents", authenticate, requirePermission("parents.read"), async (req, res, next) => {
  try {
    const parents = await listOrgParents(
      req.userId as string,
      req.userRoles,
      req.params.orgId
    );
    res.json({ parents });
  } catch (error) {
    next(error);
  }
});

/** Parent detail (§16). */
router.get("/:orgId/parents/:userId", authenticate, requirePermission("parents.read"), async (req, res, next) => {
  try {
    const parent = await getOrgParent(
      req.userId as string,
      req.userRoles,
      req.params.orgId,
      req.params.userId
    );
    res.json({ parent });
  } catch (error) {
    next(error);
  }
});

/**
 * Link a parent → student (§17). Both must be ACTIVE members of the SAME
 * organization; cross-tenant linking is rejected in the service layer.
 */
router.post(
  "/:orgId/parents/:parentUserId/students/:studentUserId",
  authenticate,
  requirePermission("parents.manage"),
  async (req, res, next) => {
    try {
      const link = await linkParentStudent({
        requesterId: req.userId as string,
        requesterRoles: req.userRoles,
        organizationId: req.params.orgId,
        parentUserId: req.params.parentUserId,
        studentUserId: req.params.studentUserId,
      });
      res.status(201).json({ link });
    } catch (error) {
      next(error);
    }
  }
);

/** Unlink a parent from a student (§17) — soft-revoke, history preserved. */
router.delete(
  "/:orgId/parents/:parentUserId/students/:studentUserId",
  authenticate,
  requirePermission("parents.manage"),
  async (req, res, next) => {
    try {
      const result = await unlinkParentStudent({
        requesterId: req.userId as string,
        requesterRoles: req.userRoles,
        organizationId: req.params.orgId,
        parentUserId: req.params.parentUserId,
        studentUserId: req.params.studentUserId,
      });
      res.json({ removed: result.id });
    } catch (error) {
      next(error);
    }
  }
);

/** Organization settings (§19–§21) — org-scoped; editing requires orgs.update. */
router.get("/:orgId/settings", authenticate, requirePermission("orgs.update"), async (req, res, next) => {
  try {
    const settings = await getOrgSettings(
      req.userId as string,
      req.userRoles,
      req.params.orgId
    );
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.patch("/:orgId/settings", authenticate, requirePermission("orgs.update"), async (req, res, next) => {
  try {
    const settings = await updateOrgSettings({
      requesterId: req.userId as string,
      requesterRoles: req.userRoles,
      organizationId: req.params.orgId,
      data: req.body ?? {},
    });
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * Create a user inside an organization (§24–§25) — org admins may only assign
 * teacher / student / parent roles; platform roles are rejected server-side.
 */
router.post("/:orgId/users", authenticate, requirePermission("users.create"), async (req, res, next) => {
  try {
    const created = await createOrgUser({
      requesterId: req.userId as string,
      requesterRoles: req.userRoles,
      organizationId: req.params.orgId,
      data: req.body ?? {},
    });
    res.status(201).json({ user: created });
  } catch (error) {
    next(error);
  }
});

export { router as organizationRoutes };
