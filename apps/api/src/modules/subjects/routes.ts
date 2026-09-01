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
  stats,
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/slug/:slug", getBySlug);
router.get("/:id", getById);
router.get("/:id/stats", stats);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("subjects.create"), create);
router.put("/:id", authenticate, requirePermission("subjects.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("subjects.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("subjects.archive"), archive);
router.delete("/:id", authenticate, requirePermission("subjects.delete"), remove);

export { router as subjectRoutes };
