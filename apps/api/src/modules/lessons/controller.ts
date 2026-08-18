import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
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
