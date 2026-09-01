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
} from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/:id", getById);

// Protected admin routes (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("modules.create"), create);
router.put("/:id", authenticate, requirePermission("modules.update"), update);
router.patch("/:id/publish", authenticate, requirePermission("modules.publish"), publish);
router.patch("/:id/archive", authenticate, requirePermission("modules.archive"), archive);
router.delete("/:id", authenticate, requirePermission("modules.delete"), remove);
router.put("/subject/:subjectId/reorder", authenticate, requirePermission("modules.reorder"), reorder);

export { router as moduleRoutes };
