import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";
import { listProgramEnrollments, createEnrollment, updateEnrollment, listMyEnrollments } from "./service";

export const enrollmentRoutes: Router = Router();

// CS#23.5 — all enrollment management routes flow the established pipeline:
// authenticate → requirePermission → organization scope (service) → resource
// ownership (service). Legacy hard-coded requireRoles arrays were removed;
// grants live in the RBAC catalog (enrollments.read / enrollments.manage).
enrollmentRoutes.use(authenticate);

// Student-facing: a learner's own enrollments (dashboard track).
// Self-scoped by authentication alone (§12 resource rule) — no permission
// gate beyond authentication, and only the caller's own rows are returned.
// Declared before /programs/:programId/enrollments so "my" is never
// captured as a programId parameter.
enrollmentRoutes.get("/my/enrollments", listMyEnrollments);

enrollmentRoutes.get(
  "/programs/:programId/enrollments",
  requirePermission("enrollments.read"),
  listProgramEnrollments
);
enrollmentRoutes.post(
  "/programs/:programId/enrollments",
  requirePermission("enrollments.manage"),
  createEnrollment
);
enrollmentRoutes.patch(
  "/enrollments/:id",
  requirePermission("enrollments.manage"),
  updateEnrollment
);