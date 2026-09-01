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
import { authenticate } from "../../middleware/auth";
import { resolveOrgContext } from "../../middleware/org-context";
import { requirePermission } from "../../middleware/permissions";
import {
  requireContentEditor,
  requireContentApprover,
  requireContentPermission,
} from "../../middleware/content-editor";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/by-id/:id", getById);
router.get("/:slug", getBySlug);

// Template trigger routes — platform admins (org-wide bulk creation stays
// platform-level to avoid a school admin generating a full platform template
// into an org they don't own).
router.post("/template", authenticate, resolveOrgContext, requirePermission("programs.template"), createFromTemplate);
router.post("/:id/cet-exams", authenticate, resolveOrgContext, requirePermission("programs.cet_generate"), generateCetExams);

// Protected content routes — CS#23.4: global permission key is primary
// (programs.create/update/publish), org-membership editor rules remain as
// the fallback layer so existing org workflows are unchanged.
router.post("/", authenticate, resolveOrgContext, requireContentPermission("programs.create"), create);
router.put("/:id", authenticate, resolveOrgContext, requireContentPermission("programs.update"), update);
router.patch(
  "/:id/publish",
  authenticate,
  resolveOrgContext,
  requireContentPermission("programs.publish"),
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
router.delete("/:id", authenticate, resolveOrgContext, requirePermission("programs.delete"), remove);

export { router as programRoutes };
