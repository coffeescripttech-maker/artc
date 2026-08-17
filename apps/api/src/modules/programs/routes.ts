import { Router, type IRouter } from "express";
import { list, getBySlug, create, update, publish, remove } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Public routes
router.get("/", list);
router.get("/:slug", getBySlug);

// Protected admin routes
router.post("/", authenticate, requireRole("content_admin", "super_admin"), create);
router.put("/:id", authenticate, requireRole("content_admin", "super_admin"), update);
router.patch(
  "/:id/publish",
  authenticate,
  requireRole("content_admin", "super_admin"),
  publish
);
router.delete("/:id", authenticate, requireRole("super_admin"), remove);

export { router as programRoutes };
