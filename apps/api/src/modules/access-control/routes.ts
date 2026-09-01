import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";
import {
  listCapabilities,
  listRoles,
  listPermissions,
  getRoleDetail,
  updateRolePermissions,
  simulateRole,
} from "./service";
import { NotFoundError } from "../../lib/errors";

const router: IRouter = Router();

// Every access-control surface is platform-admin territory. The default
// catalog grants "platform.orgs_manage" to super_admin only, but the guard is
// permission-based so it stays configurable (CS#23.2).
const guard = [authenticate, requirePermission("platform.orgs_manage")];

function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/roles", ...guard, wrap(async (req, res) => {
  res.json({ roles: await listRoles() });
}));

router.get("/permissions", ...guard, wrap(async (req, res) => {
  res.json({ permissions: await listPermissions() });
}));

// §23/§50/§52 — read-only capability catalog. Deliberately NOT behind the
// platform guard: Organization Admins need to SEE what each role can do
// (in the Members / Roles & Access views) but can never edit it. This
// endpoint is descriptive only — all mutations remain behind `guard`.
router.get("/capabilities", authenticate, wrap(async (_req, res) => {
  res.json(await listCapabilities());
}));

router.get("/roles/:id", ...guard, wrap(async (req, res) => {
  res.json({ role: await getRoleDetail(req.params.id) });
}));

router.put("/roles/:id/permissions", ...guard, wrap(async (req, res) => {
  const result = await updateRolePermissions({
    roleId: req.params.id,
    permissionKeys: req.body?.permissionKeys,
    actorId: req.userId as string,
  });
  res.json(result);
}));

router.post("/simulate", ...guard, wrap(async (req, res) => {
  const { roleName, membershipRole } = req.body ?? {};
  if (typeof roleName !== "string" || roleName.length === 0) {
    throw new NotFoundError("roleName is required");
  }
  const result = await simulateRole({ roleName, membershipRole });
  res.json(result);
}));

export { router as accessControlRoutes };
