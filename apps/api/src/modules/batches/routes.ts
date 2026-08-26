import { Router, type IRouter } from "express";
import { myBatches, create, myReport, getById, addMember, removeMember } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router: IRouter = Router();

// Literal segments BEFORE /:id — the /questions/stats ordering bug class
router.get("/my", authenticate, requireRole("teacher", "super_admin", "school_admin"), myBatches);
router.post("/", authenticate, requireRole("teacher", "super_admin", "school_admin"), create);
router.get(
  "/my/report",
  authenticate,
  requireRole("teacher", "super_admin", "school_admin"),
  myReport
);

// Single batch — service checks owner OR assigned teacher OR admin
router.get("/:id", authenticate, getById);
router.post(
  "/:id/members",
  authenticate,
  requireRole("teacher", "super_admin", "school_admin"),
  addMember
);
router.delete(
  "/:id/members/:memberId",
  authenticate,
  requireRole("teacher", "super_admin", "school_admin"),
  removeMember
);

export { router as batchRoutes };
