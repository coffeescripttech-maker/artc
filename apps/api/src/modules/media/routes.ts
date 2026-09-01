import { Router, type IRouter } from "express";
import { uploadMedia } from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Admin-only media upload (CS#23.2 — permission-based RBAC)
router.post("/", authenticate, requirePermission("media.upload"), uploadMedia);

export { router as mediaRoutes };
