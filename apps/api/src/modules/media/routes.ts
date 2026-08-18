import { Router, type IRouter } from "express";
import { uploadMedia } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Admin-only media upload
router.post("/", authenticate, requireRole("content_admin", "super_admin"), uploadMedia);

export { router as mediaRoutes };
