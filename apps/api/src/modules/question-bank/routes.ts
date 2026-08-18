import { Router, type IRouter } from "express";
import {
  list,
  getById,
  create,
  update,
  review,
  publish,
  archive,
  remove,
  createLink,
  updateLink,
  removeLink,
  bySubject,
  byTopic,
  byExam,
  byAssessment,
  stats,
} from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Public routes (for published questions)
router.get("/", list);
router.get("/:id", getById);
router.get("/:id/stats", stats);

// Questions by context
router.get("/subject/:subjectId", bySubject);
router.get("/topic/:topicId", byTopic);
router.get("/exam/:examId", byExam);
router.get("/assessment/:assessmentId", byAssessment);

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch("/:id/review", authenticate, requireRole("content_admin", "super_admin"), review);
router.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publish);
router.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archive);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);

// Question links
router.post("/:id/links", authenticate, requireRole("content_admin", "super_admin"), createLink);
router.patch("/links/:linkId", authenticate, requireRole("content_admin", "super_admin"), updateLink);
router.delete("/links/:linkId", authenticate, requireRole("content_admin", "super_admin"), removeLink);

export { router as questionBankRoutes };
