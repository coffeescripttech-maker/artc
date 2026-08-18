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
  addItem,
  updateItem,
  reorderItems,
  removeItem,
  stats,
} from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/slug/:slug", getBySlug);
router.get("/:id", getById);
router.get("/:id/stats", stats);

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch("/:id/publish", authenticate, requireRole("content_admin", "super_admin"), publish);
router.patch("/:id/archive", authenticate, requireRole("content_admin", "super_admin"), archive);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);

// Curriculum items
router.post("/:id/items", authenticate, requireRole("content_admin", "super_admin"), addItem);
router.put("/:id/items", authenticate, requireRole("content_admin", "super_admin"), reorderItems);
router.patch("/:id/items/:itemId", authenticate, requireRole("content_admin", "super_admin"), updateItem);
router.delete("/:id/items/:itemId", authenticate, requireRole("content_admin", "super_admin"), removeItem);

export { router as curriculumRoutes };
