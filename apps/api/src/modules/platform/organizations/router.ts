import { Router } from "express";
import { authenticate } from "../../../middleware/auth"; // existing authenticator (JWT bearer), reused
import { requirePlatformAdmin } from "../../../middleware/platform-admin";
import { list, create, get, update, suspend, remove, inviteAdmin } from "./service";

export const platformOrganizationsRoutes: Router = Router();

// All platform routes: authenticate → platform-admin only.
platformOrganizationsRoutes.use(authenticate, requirePlatformAdmin);

platformOrganizationsRoutes.get("/", list);
platformOrganizationsRoutes.post("/", create);
platformOrganizationsRoutes.get("/:id", get);
platformOrganizationsRoutes.patch("/:id", update);
platformOrganizationsRoutes.patch("/:id/suspend", suspend);
platformOrganizationsRoutes.delete("/:id", remove);
platformOrganizationsRoutes.post("/:id/admins", inviteAdmin);
