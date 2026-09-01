import { Router, type IRouter } from "express";
import {
  list,
  getById,
  getBySlug,
  create,
  update,
  publish,
  archive,
  remove,
  addQ,
  removeQ,
  reorder,
  autoGenerate,
  start,
  submit,
  saveAnswers,
  stats,
  myAttempts,
  recommendations,
  getAttempt,
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public routes (for students taking assessments)
router.get("/", list);
router.get("/me/attempts", authenticate, myAttempts);
router.get("/slug/:slug", getBySlug);
router.get("/:id/stats", stats);
router.get("/:id/recommendations", authenticate, recommendations);
router.get("/attempts/:attemptId", authenticate, getAttempt);
router.get("/:id", getById);

// Learner routes (authenticated students)
router.post("/:id/start", authenticate, start);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("assessments.create"), create);
router.put("/:id", authenticate, requirePermission("assessments.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("assessments.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("assessments.archive"), archive);
router.delete("/:id", authenticate, requirePermission("assessments.delete"), remove);

// Questions management
router.post("/:id/questions", authenticate, requirePermission("assessments.questions_manage"), addQ);
router.put("/:id/questions", authenticate, requirePermission("assessments.questions_manage"), reorder);
router.delete("/:id/questions/:questionId", authenticate, requirePermission("assessments.questions_manage"), removeQ);
router.post("/:id/auto-generate", authenticate, requirePermission("assessments.auto_generate"), autoGenerate);

// Attempt submission
router.post("/attempts/:attemptId/submit", authenticate, submit);
// CS#22.8 — incremental answer autosave (upsert, owner + IN_PROGRESS only)
router.patch("/attempts/:attemptId/answers", authenticate, saveAnswers);

export { router as assessmentRoutes };
