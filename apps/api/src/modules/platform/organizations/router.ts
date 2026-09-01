import { Router } from "express";
import { authenticate } from "../../../middleware/auth"; // existing authenticator (JWT bearer), reused
import { requirePermission } from "../../../middleware/permissions"; // CS#23.2 — configurable RBAC guard
import { list, create, get, update, suspend, remove, inviteAdmin } from "./service";

export const platformOrganizationsRoutes: Router = Router();

// Platform routes: authenticate → permission guard. The default catalog
// grants "platform.orgs_manage" to super_admin only (system bypass applies),
// but the guard is now permission-based so grants stay configurable.
platformOrganizationsRoutes.use(authenticate, requirePermission("platform.orgs_manage"));

platformOrganizationsRoutes.get("/", list);
platformOrganizationsRoutes.post("/", create);
platformOrganizationsRoutes.get("/:id", get);
platformOrganizationsRoutes.patch("/:id", update);
platformOrganizationsRoutes.patch("/:id/suspend", suspend);
platformOrganizationsRoutes.delete("/:id", remove);
platformOrganizationsRoutes.post("/:id/admins", inviteAdmin);
