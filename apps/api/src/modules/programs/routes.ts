import { Router, type IRouter } from "express";
import {
  list,
  getById,
  getBySlug,
  create,
  update,
  publish,
  submitReview,
  approve,
  reject,
  remove,
  createFromTemplate,
  generateCetExams,
} from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { resolveOrgContext } from "../../middleware/org-context";
import {
  requireContentEditor,
  requireContentApprover,
} from "../../middleware/content-editor";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/by-id/:id", getById);
router.get("/:slug", getBySlug);

// Template trigger routes — platform admins (org-wide bulk creation stays
// platform-level to avoid a school admin generating a full platform template
// into an org they don't own).
router.post("/template", authenticate, resolveOrgContext, requireRole("content_admin", "super_admin"), createFromTemplate);
router.post("/:id/cet-exams", authenticate, resolveOrgContext, requireRole("content_admin", "super_admin"), generateCetExams);

// Protected content routes — org managers may create/update/publish within
// their active org; deletes remain platform-only for safety.
router.post("/", authenticate, resolveOrgContext, requireContentEditor(), create);
router.put("/:id", authenticate, resolveOrgContext, requireContentEditor(), update);
router.patch(
  "/:id/publish",
  authenticate,
  resolveOrgContext,
  requireContentEditor(),
  publish
);
// Approval workflow (CS#6 — §17): editors submit, org approvers review.
router.patch(
  "/:id/submit-review",
  authenticate,
  resolveOrgContext,
  requireContentEditor(),
  submitReview
);
router.patch(
  "/:id/approve",
  authenticate,
  resolveOrgContext,
  requireContentApprover(),
  approve
);
router.patch(
  "/:id/reject",
  authenticate,
  resolveOrgContext,
  requireContentApprover(),
  reject
);
router.delete("/:id", authenticate, resolveOrgContext, requireRole("content_admin", "super_admin"), remove);

export { router as programRoutes };
