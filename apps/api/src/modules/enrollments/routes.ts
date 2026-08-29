import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { listProgramEnrollments, createEnrollment, updateEnrollment, listMyEnrollments } from "./service";

export const enrollmentRoutes: Router = Router();

// All enrollment routes require authentication; fine-grained role checks are
// enforced per-handler in the service (view vs manage permission sets).
enrollmentRoutes.use(authenticate);

// Student-facing: a learner's own enrollments (dashboard track).
// Declared before /programs/:programId/enrollments so "my" is never
// captured as a programId parameter.
enrollmentRoutes.get("/my/enrollments", listMyEnrollments);

enrollmentRoutes.get("/programs/:programId/enrollments", listProgramEnrollments);
enrollmentRoutes.post("/programs/:programId/enrollments", createEnrollment);
enrollmentRoutes.patch("/enrollments/:id", updateEnrollment);