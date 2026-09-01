import { Router, type IRouter } from "express";
import {
  list,
  getById,
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

// Public routes - list published passages
router.get("/", list);
router.get("/:id", getById);
router.get("/:id/stats", stats);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("passages.create"), create);
router.put("/:id", authenticate, requirePermission("passages.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("passages.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("passages.archive"), archive);
router.delete("/:id", authenticate, requirePermission("passages.delete"), remove);

export { router as passageRoutes };
