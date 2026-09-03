import { Request, Response, NextFunction } from "express";
import { getAuthUserId } from "../../lib/validate";
import { getProgression, getLearnerActivity, getProgramCompletion } from "./service";
import { getWeakTopics } from "../assessments/service";
import { getRetryRecommendations } from "../assessments/service";
import { prisma } from "@aratc/database";

export async function progression(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const programId = req.query.programId as string | undefined;
    const result = await getProgression(userId, programId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /progression/program-completion
 * Deterministic lesson-weighted completion for a program (CS#23.5).
 * Enrollment-gated: non-enrolled/unpublished → 404.
 */
export async function programCompletion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const programId = req.params.id;
    if (!programId) {
      res.status(400).json({ error: { code: "MISSING_PROGRAM_ID", message: "Program id is required" } });
      return;
    }
    const result = await getProgramCompletion(userId, programId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /progression/weak-topics
 * Get prioritized weak topics for the authenticated learner.
 */
export async function weakTopics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const programId = req.query.programId as string | undefined;

    const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
    if (!learner) {
      res.json({ topics: [], message: "No learner profile found" });
      return;
    }

    const topics = await getWeakTopics(learner.id, programId);
    res.json({ topics });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /progression/assessments/:id/recommendations
 * Get retry recommendations for a specific assessment.
 */
export async function assessmentRecommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const assessmentId = req.params.id;

    const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
    if (!learner) {
      res.status(401).json({ error: "No learner profile found" });
      return;
    }

    const recommendations = await getRetryRecommendations(learner.id, assessmentId);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /progression/activity
 * Get a chronological activity feed for the authenticated learner.
 */
export async function activity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await getLearnerActivity(userId, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
