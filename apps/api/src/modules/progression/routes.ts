import { Router, type IRouter } from "express";
import { progression } from "./controller";
import { authenticate } from "../../middleware/auth";

const router: IRouter = Router();

// Learner's College Readiness ladder (mastery + unlock state)
router.get("/", authenticate, progression);

export { router as progressionRoutes };
