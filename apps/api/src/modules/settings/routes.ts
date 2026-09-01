import { Router, type IRouter } from "express";
import { getBrand, updateBrand, getGeneral, updateGeneral } from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Public — the whole app renders with the brand colors
router.get("/brand", getBrand);

// Admin-only (CS#23.2 — permission-based RBAC)
router.get("/general", authenticate, requirePermission("settings.read"), getGeneral);
router.put("/brand", authenticate, requirePermission("settings.brand_update"), updateBrand);
router.put("/general", authenticate, requirePermission("settings.update"), updateGeneral);

export { router as settingsRoutes };
