import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import { contentVisibility } from "../../lib/visibility";
import {
  listSubjects,
  getSubjectById,
  getSubjectBySlug,
  createSubject,
  updateSubject,
  publishSubject,
  archiveSubject,
  deleteSubject,
  getSubjectStats,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subjects = await listSubjects(contentVisibility(req));
    res.json(subjects);
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
    const subject = await getSubjectById(req.params.id, contentVisibility(req));
    res.json(subject);
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
    const subject = await getSubjectBySlug(req.params.slug, contentVisibility(req));
    res.json(subject);
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
    const { createSubjectSchema } = await import("./schemas.js");
    const input = validateRequest(createSubjectSchema, req.body);
    const subject = await createSubject(input);
    res.status(201).json(subject);
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
    const { updateSubjectSchema } = await import("./schemas.js");
    const input = validateRequest(updateSubjectSchema, req.body);
    const subject = await updateSubject(req.params.id, input);
    res.json(subject);
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
    const subject = await publishSubject(req.params.id);
    res.json(subject);
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
    const subject = await archiveSubject(req.params.id);
    res.json(subject);
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
    await deleteSubject(req.params.id);
    res.status(204).send();
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
    const stats = await getSubjectStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
