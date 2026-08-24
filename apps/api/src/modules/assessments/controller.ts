import { Request, Response, NextFunction } from "express";
import { validateRequest, getAuthUserId } from "../../lib/validate";
import {
  listAssessments,
  getAssessmentById,
  getAssessmentBySlug,
  createAssessment,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  deleteAssessment,
  addQuestion,
  removeQuestion,
  reorderQuestions,
  autoGenerateQuestions,
  startAttempt,
  submitAttempt,
  getAssessmentStats,
  getMyAttempts,
  getRetryRecommendations,
  getAttemptWithAnswers,
} from "./service";
import { prisma } from "@aratc/database";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = {
      programId: req.query.programId as string | undefined,
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
    };
    const assessments = await listAssessments(filters);
    res.json(assessments);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await getAssessmentById(req.params.id);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await getAssessmentBySlug(req.params.slug);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createAssessmentSchema } = await import("./schemas");
    const input = validateRequest(createAssessmentSchema, req.body);
    const assessment = await createAssessment(input);
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateAssessmentSchema } = await import("./schemas");
    const input = validateRequest(updateAssessmentSchema, req.body);
    const assessment = await updateAssessment(req.params.id, input);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function publish(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await publishAssessment(req.params.id);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function archive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await archiveAssessment(req.params.id);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteAssessment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Questions management
export async function addQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { addQuestionSchema } = await import("./schemas");
    const input = validateRequest(addQuestionSchema, req.body);
    const question = await addQuestion(req.params.id, input);
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
}

export async function removeQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await removeQuestion(req.params.id, req.params.questionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function reorder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      res.status(400).json({ error: "questionIds must be an array" });
      return;
    }
    const questions = await reorderQuestions(req.params.id, questionIds);
    res.json(questions);
  } catch (error) {
    next(error);
  }
}

export async function autoGenerate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { autoGenerateSchema } = await import("./schemas");
    const input = validateRequest(autoGenerateSchema, req.body);
    const questions = await autoGenerateQuestions(req.params.id, input);
    res.status(201).json(questions);
  } catch (error) {
    next(error);
  }
}

// Learner operations
export async function myAttempts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const attempts = await getMyAttempts(userId);
    res.json(attempts);
  } catch (error) {
    next(error);
  }
}

export async function start(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const result = await startAttempt(req.params.id, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function submit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: "answers must be an array" });
      return;
    }
    const attempt = await submitAttempt(req.params.attemptId, answers);
    res.json(attempt);
  } catch (error) {
    next(error);
  }
}

export async function stats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getAssessmentStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function recommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
    if (!learner) {
      res.status(401).json({ error: "No learner profile found" });
      return;
    }
    const result = await getRetryRecommendations(learner.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const attempt = await getAttemptWithAnswers(req.params.id, userId);
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }
    res.json(attempt);
  } catch (error) {
    next(error);
  }
}
