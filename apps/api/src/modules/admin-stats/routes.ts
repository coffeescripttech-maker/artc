import { Router, type IRouter } from "express";
import { overview } from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

router.get(
  "/overview",
  authenticate,
  requirePermission("admin.stats_view"),
  overview
);

export { router as adminStatsRoutes };
