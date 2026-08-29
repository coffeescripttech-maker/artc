import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  listPassages,
  getPassageById,
  createPassage,
  updatePassage,
  publishPassage,
  archivePassage,
  deletePassage,
  getPassageStats,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const passages = await listPassages({ status: req.query.status as string });
    res.json(passages);
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
    const passage = await getPassageById(req.params.id);
    res.json(passage);
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
    const { createPassageSchema } = await import("./schemas.js");
    const input = validateRequest(createPassageSchema, req.body);
    const passage = await createPassage(input);
    res.status(201).json(passage);
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
    const { updatePassageSchema } = await import("./schemas.js");
    const input = validateRequest(updatePassageSchema, req.body);
    const passage = await updatePassage(req.params.id, input);
    res.json(passage);
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
    const passage = await publishPassage(req.params.id);
    res.json(passage);
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
    const passage = await archivePassage(req.params.id);
    res.json(passage);
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
    await deletePassage(req.params.id);
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
    const stats = await getPassageStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
