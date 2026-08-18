import { Router, type IRouter } from "express";
import {
  list,
  getById,
  create,
  update,
  publish,
  archive,
  remove,
  reorder,
  bySubject,
  stats,
} from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/:id", getById);
router.get("/topic/:topicId/stats", stats);

// Filter by subject
router.get("/subject/:subjectId", bySubject);

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publish);
router.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archive);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);
router.put("/topic/:topicId/reorder", authenticate, requireRole("content_admin", "super_admin"), reorder);

export { router as lessonRoutes };
