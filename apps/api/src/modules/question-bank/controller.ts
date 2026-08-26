import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  listQuestions,
  listMyQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  reviewQuestion,
  publishQuestion,
  archiveQuestion,
  deleteQuestion,
  linkQuestion,
  updateQuestionLink,
  unlinkQuestion,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getQuestionsByExam,
  getQuestionsByAssessment,
  getQuestionStats,
} from "./service";

export async function mine(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const questions = await listMyQuestions(req.userId!);
    res.json(questions);
  } catch (error) {
    next(error);
  }
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = {
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      type: req.query.type as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      status: req.query.status as string | undefined,
    };
    const questions = await listQuestions(filters);
    res.json(questions);
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
    const question = await getQuestionById(req.params.id);
    res.json(question);
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
    const { createQuestionSchema } = await import("./schemas");
    const input = validateRequest(createQuestionSchema, req.body);
    const question = await createQuestion(input, req.userId!);
    res.status(201).json(question);
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
    const { updateQuestionSchema } = await import("./schemas");
    const input = validateRequest(updateQuestionSchema, req.body);
    const question = await updateQuestion(req.params.id, input);
    res.json(question);
  } catch (error) {
    next(error);
  }
}

export async function review(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body;
    if (status !== "PUBLISHED" && status !== "UNDER_REVIEW") {
      res.status(400).json({ error: "Status must be PUBLISHED or UNDER_REVIEW" });
      return;
    }
    const question = await reviewQuestion(req.params.id, req.userId!, status);
    res.json(question);
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
    const question = await publishQuestion(req.params.id);
    res.json(question);
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
    const question = await archiveQuestion(req.params.id);
    res.json(question);
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
    await deleteQuestion(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Link operations
export async function createLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { linkQuestionSchema } = await import("./schemas");
    const input = validateRequest(linkQuestionSchema, req.body);
    const link = await linkQuestion(req.params.id, input);
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
}

export async function updateLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { linkQuestionSchema } = await import("./schemas");
    const input = validateRequest(linkQuestionSchema.partial(), req.body);
    const link = await updateQuestionLink(req.params.linkId, input);
    res.json(link);
  } catch (error) {
    next(error);
  }
}

export async function removeLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await unlinkQuestion(req.params.linkId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Filtered lists
export async function bySubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const links = await getQuestionsBySubject(req.params.subjectId);
    res.json(links);
  } catch (error) {
    next(error);
  }
}

export async function byTopic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const links = await getQuestionsByTopic(req.params.topicId);
    res.json(links);
  } catch (error) {
    next(error);
  }
}

export async function byExam(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const links = await getQuestionsByExam(req.params.examId);
    res.json(links);
  } catch (error) {
    next(error);
  }
}

export async function byAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const links = await getQuestionsByAssessment(req.params.assessmentId);
    res.json(links);
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
    const stats = await getQuestionStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
