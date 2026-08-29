import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { listProgramEnrollments, createEnrollment, updateEnrollment } from "./service";

export const enrollmentRoutes: Router = Router();

// All enrollment routes require authentication; fine-grained role checks are
// enforced per-handler in the service (view vs manage permission sets).
enrollmentRoutes.use(authenticate);

enrollmentRoutes.get("/programs/:programId/enrollments", listProgramEnrollments);
enrollmentRoutes.post("/programs/:programId/enrollments", createEnrollment);
enrollmentRoutes.patch("/enrollments/:id", updateEnrollment);