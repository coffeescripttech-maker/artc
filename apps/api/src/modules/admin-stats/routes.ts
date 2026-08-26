import { Router, type IRouter } from "express";
import { overview } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

router.get(
  "/overview",
  authenticate,
  requireRole("super_admin", "school_admin", "content_admin"),
  overview
);

export { router as adminStatsRoutes };
