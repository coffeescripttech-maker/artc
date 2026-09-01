import { Router, type IRouter } from "express";
import { myBatches, create, myReport, getById, addMember, removeMember } from "./controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

const router: IRouter = Router();

// Literal segments BEFORE /:id — the /questions/stats ordering bug class
// CS#23.2 — all batch routes gated behind the configurable batches.manage
// permission (defaults: teacher, school_admin, super_admin).
const manageBatches = requirePermission("batches.manage");
router.get("/my", authenticate, manageBatches, myBatches);
router.post("/", authenticate, manageBatches, create);
router.get("/my/report", authenticate, manageBatches, myReport);

// Single batch — service checks owner OR assigned teacher OR admin
router.get("/:id", authenticate, getById);
router.post("/:id/members", authenticate, manageBatches, addMember);
router.delete("/:id/members/:memberId", authenticate, manageBatches, removeMember);

export { router as batchRoutes };
