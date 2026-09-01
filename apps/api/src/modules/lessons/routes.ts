import { Router, type IRouter } from "express";
import {
  list,
  getById,
  create,
  update,
  publish,
  submitReview,
  approve,
  reject,
  archive,
  remove,
  reorder,
  bySubject,
  stats,
  getProgress,
  setProgress,
  getProgressWithQuestions,
  saveQuestionResponse,
  getQuestionResponse,
  getWorkspace,
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { resolveOrgContext } from "../../middleware/org-context";
import { requirePermission } from "../../middleware/permissions";
import {
  requireContentEditor,
  requireContentApprover,
} from "../../middleware/content-editor";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/:id", getById);
router.get("/topic/:topicId/stats", stats);

// Filter by subject
router.get("/subject/:subjectId", bySubject);

// CS#23.1 — authorized student learning workspace (maps the lesson to the
// enrolled program's ordered curriculum + the learner's completion state).
router.get("/:id/workspace", authenticate, getWorkspace);

// Learner progress (authenticated)
router.get("/:id/progress", authenticate, getProgress);
router.get("/:id/progress/questions", authenticate, getProgressWithQuestions);
router.put("/:id/progress", authenticate, setProgress);

// Lesson question responses (authenticated learners) — must be registered
// before any "/:id"-level catch-all that could swallow ":id" = "questions".
router.post("/:id/questions/:questionId/respond", authenticate, requirePermission("lessons.questions_respond"), saveQuestionResponse);
router.get("/:id/questions/:questionId/response", authenticate, getQuestionResponse);

// Protected content routes — org managers may create/update/publish within
// their active org; deletes remain super_admin-only for safety.
router.post("/", authenticate, resolveOrgContext, requireContentEditor(), create);
router.put("/:id", authenticate, resolveOrgContext, requireContentEditor(), update);
router.patch("/:id/publish", authenticate, resolveOrgContext, requireContentEditor(), publish);
// Approval workflow (CS#6 — §17): editors submit, org approvers review.
router.patch("/:id/submit-review", authenticate, resolveOrgContext, requireContentEditor(), submitReview);
router.patch("/:id/approve", authenticate, resolveOrgContext, requireContentApprover(), approve);
router.patch("/:id/reject", authenticate, resolveOrgContext, requireContentApprover(), reject);
router.patch("/:id/archive", authenticate, resolveOrgContext, requireContentEditor(), archive);
router.delete("/:id", authenticate, resolveOrgContext, requirePermission("lessons.delete"), remove);
router.put("/topic/:topicId/reorder", authenticate, resolveOrgContext, requirePermission("lessons.reorder"), reorder);

export { router as lessonRoutes };
