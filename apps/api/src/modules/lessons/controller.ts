import { Request, Response, NextFunction } from "express";
import { validateRequest, getAuthUserId } from "../../lib/validate";
import {
  listLessons,
  getLessonById,
  createLesson,
  updateLesson,
  publishLesson,
  archiveLesson,
  deleteLesson,
  reorderLessons,
  getLessonsBySubject,
  getLessonStats,
  getLessonProgress,
  setLessonProgress,
  saveLessonQuestionResponse,
  getLessonQuestionResponse,
  getLessonProgressWithQuestions,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topicId = req.query.topicId as string | undefined;
    const lessons = await listLessons(topicId);
    res.json(lessons);
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
    const lesson = await getLessonById(req.params.id);
    // Published lessons are safe to cache on shared caches/CDNs; browsers still
    // revalidate (max-age=0) so admins see fresh content right after editing.
    if ((lesson as { status?: string }).status === "PUBLISHED") {
      res.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    } else {
      res.set("Cache-Control", "no-store");
    }
    res.json(lesson);
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
    const { createLessonSchema } = await import("./schemas");
    const input = validateRequest(createLessonSchema, req.body);
    const lesson = await createLesson(input);
    res.status(201).json(lesson);
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
    const { updateLessonSchema } = await import("./schemas");
    const input = validateRequest(updateLessonSchema, req.body);
    const lesson = await updateLesson(req.params.id, input);
    res.json(lesson);
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
    const lesson = await publishLesson(req.params.id);
    res.json(lesson);
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
    const lesson = await archiveLesson(req.params.id);
    res.json(lesson);
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
    await deleteLesson(req.params.id);
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
    const { lessonIds } = req.body;
    const { topicId } = req.params;
    if (!Array.isArray(lessonIds)) {
      res.status(400).json({ error: "lessonIds must be an array" });
      return;
    }
    const lessons = await reorderLessons(topicId, lessonIds);
    res.json(lessons);
  } catch (error) {
    next(error);
  }
}

export async function bySubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lessons = await getLessonsBySubject(req.params.subjectId);
    res.json(lessons);
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
    const stats = await getLessonStats(req.params.topicId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function getProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const progress = await getLessonProgress(userId, req.params.id);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}

export async function getProgressWithQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const progress = await getLessonProgressWithQuestions(userId, req.params.id);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}

export async function setProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const completed = Boolean(req.body?.completed);
    const progress = await setLessonProgress(userId, req.params.id, completed);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// Lesson question responses (Phase 4 — in-lesson answering)
// ============================================================

export async function saveQuestionResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const lessonId = req.params.id;
    const questionId = req.params.questionId;
    const { answer, isCorrect, pointsEarned, blockId } = req.body ?? {};

    if (isCorrect === undefined || isCorrect === null) {
      res.status(400).json({ error: "isCorrect is required" });
      return;
    }

    const response = await saveLessonQuestionResponse(userId, lessonId, {
      questionId,
      answer,
      isCorrect: Boolean(isCorrect),
      pointsEarned: pointsEarned != null ? Number(pointsEarned) : 0,
      blockId,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const lessonId = req.params.id;
    const questionId = req.params.questionId;

    const response = await getLessonQuestionResponse(userId, lessonId, questionId);
    if (!response) {
      res.status(404).json({ error: "No response recorded" });
      return;
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
}
