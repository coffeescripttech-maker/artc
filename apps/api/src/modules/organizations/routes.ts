import { Router, type IRouter } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { ApiError, ValidationError } from "../../lib/errors";
import {
  createMembership,
  listMyMemberships,
  listOrgMembers,
  listOrganizations,
  parseMembershipStatus,
  parseOrgRole,
  removeMembership,
  searchUsers,
  updateMembership,
} from "./service";

const router: IRouter = Router();

/**
 * All organizations — platform administration only. Used by the admin
 * members-management UI to pick an organization to manage.
 */
router.get("/", authenticate, requireRole("super_admin", "content_admin"), async (_req, res, next) => {
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
router.get("/users/search", authenticate, async (req, res, next) => {
  try {
    const users = await searchUsers(req.userRoles, req.membership?.role, String(req.query.q ?? ""));
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
      req.params.orgId
    );
    res.json({ members });
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

export { router as organizationRoutes };
