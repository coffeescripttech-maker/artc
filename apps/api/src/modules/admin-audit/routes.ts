import { Router, type IRouter } from "express";
import { listAuditEvents } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// §44 — server-side enforced roles only.
// school_admin / content_admin see their org's events;
// super_admin can use x-tenant-id to query platform-wide (whole DB).
router.get(
  "/events",
  authenticate,
  requireRole("super_admin", "school_admin", "content_admin"),
  listAuditEvents
);

export { router as adminAuditRoutes };