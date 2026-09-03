import { Router } from "express";
import { authenticate } from "../../../middleware/auth";
import { requirePermission } from "../../../middleware/permissions";
import { preview, fullReset, orgReset } from "./service";
import { resetSchema } from "./schemas";

export const adminResetRoutes: Router = Router();

// Superadmin-only (permission key platform.admin_reset; the service additionally
// asserts the caller holds the super_admin role — defense-in-depth).
adminResetRoutes.use(authenticate, requirePermission("platform.admin_reset"));

adminResetRoutes.get("/preview", preview);
adminResetRoutes.post("/reset", fullReset);
adminResetRoutes.post("/orgs/:orgId/reset", orgReset);