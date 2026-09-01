import { Router, type IRouter } from "express";
import {
  list,
  listAll,
  getById,
  create,
  update,
  publish,
  archive,
  remove,
  reorder,
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/all", listAll);
router.get("/:id", getById);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("topics.create"), create);
router.put("/:id", authenticate, requirePermission("topics.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("topics.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("topics.archive"), archive);
router.delete("/:id", authenticate, requirePermission("topics.delete"), remove);
router.put("/module/:moduleId/reorder", authenticate, requirePermission("topics.reorder"), reorder);

export { router as topicRoutes };
