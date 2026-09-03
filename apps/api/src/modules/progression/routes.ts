import { Router, type IRouter } from "express";
import { progression, weakTopics, assessmentRecommendations, activity, programCompletion } from "./controller";
import { authenticate } from "../../middleware/auth";

const router: IRouter = Router();

// Learner's College Readiness ladder (mastery + unlock state)
router.get("/", authenticate, progression);

// CS#23.5 — deterministic program completion (enrollment-gated)
router.get("/programs/:id/completion", authenticate, programCompletion);

// Weak topics endpoint
router.get("/weak-topics", authenticate, weakTopics);

// Activity feed endpoint
router.get("/activity", authenticate, activity);

// Assessment retry recommendations
router.get("/assessments/:id/recommendations", authenticate, assessmentRecommendations);

export { router as progressionRoutes };
