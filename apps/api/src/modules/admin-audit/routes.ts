import { Router, type IRouter } from "express";
import { listAuditEvents } from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// §44 — server-side enforced authorization only (CS#23.2: permission-based).
// school_admin / content_admin see their org's events;
// super_admin can use x-tenant-id to query platform-wide (whole DB).
router.get(
  "/events",
  authenticate,
  requirePermission("admin.audit_view"),
  listAuditEvents
);

export { router as adminAuditRoutes };