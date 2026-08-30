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
import { authenticate, requireRole } from "../../middleware/auth";

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

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publish);
router.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archive);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);

// Questions management
router.post("/:id/questions", authenticate, requireRole("content_admin", "super_admin"), addQ);
router.put("/:id/questions", authenticate, requireRole("content_admin", "super_admin"), reorder);
router.delete("/:id/questions/:questionId", authenticate, requireRole("content_admin", "super_admin"), removeQ);
router.post("/:id/auto-generate", authenticate, requireRole("content_admin", "super_admin"), autoGenerate);

// Attempt submission
router.post("/attempts/:attemptId/submit", authenticate, submit);
// CS#22.8 — incremental answer autosave (upsert, owner + IN_PROGRESS only)
router.patch("/attempts/:attemptId/answers", authenticate, saveAnswers);

export { router as assessmentRoutes };
