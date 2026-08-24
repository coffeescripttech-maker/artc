import { Router, type IRouter } from "express";
import { getBrand, updateBrand, getGeneral, updateGeneral } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Public — the whole app renders with the brand colors
router.get("/brand", getBrand);

// Admin-only
router.get("/general", authenticate, requireRole("content_admin", "super_admin"), getGeneral);
router.put("/brand", authenticate, requireRole("content_admin", "super_admin"), updateBrand);
router.put("/general", authenticate, requireRole("content_admin", "super_admin"), updateGeneral);

export { router as settingsRoutes };
