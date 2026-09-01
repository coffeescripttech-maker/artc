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
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/slug/:slug", getBySlug);
router.get("/:id", getById);
router.get("/:id/stats", stats);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("curriculum.create"), create);
router.put("/:id", authenticate, requirePermission("curriculum.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("curriculum.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("curriculum.archive"), archive);
router.delete("/:id", authenticate, requirePermission("curriculum.delete"), remove);

// Curriculum items
router.post("/:id/items", authenticate, requirePermission("curriculum.items_manage"), addItem);
router.put("/:id/items", authenticate, requirePermission("curriculum.items_manage"), reorderItems);
router.patch("/:id/items/:itemId", authenticate, requirePermission("curriculum.items_manage"), updateItem);
router.delete("/:id/items/:itemId", authenticate, requirePermission("curriculum.items_manage"), removeItem);

export { router as curriculumRoutes };
