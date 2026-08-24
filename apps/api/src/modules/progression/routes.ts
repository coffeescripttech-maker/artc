import { Router, type IRouter } from "express";
import { progression, weakTopics, assessmentRecommendations, activity } from "./controller";
import { authenticate } from "../../middleware/auth";

const router: IRouter = Router();

// Learner's College Readiness ladder (mastery + unlock state)
router.get("/", authenticate, progression);

// Weak topics endpoint
router.get("/weak-topics", authenticate, weakTopics);

// Activity feed endpoint
router.get("/activity", authenticate, activity);

// Assessment retry recommendations
router.get("/assessments/:id/recommendations", authenticate, assessmentRecommendations);

export { router as progressionRoutes };
