import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  listCurriculums,
  getCurriculumById,
  getCurriculumBySlug,
  createCurriculum,
  updateCurriculum,
  publishCurriculum,
  archiveCurriculum,
  deleteCurriculum,
  addCurriculumItem,
  updateCurriculumItem,
  reorderCurriculumItems,
  removeCurriculumItem,
  getCurriculumStats,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const programId = req.query.programId as string | undefined;
    const curriculums = await listCurriculums(programId);
    res.json(curriculums);
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
    const curriculum = await getCurriculumById(req.params.id);
    res.json(curriculum);
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
    const curriculum = await getCurriculumBySlug(req.params.slug);
    res.json(curriculum);
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
    const { createCurriculumSchema } = await import("./schemas");
    const input = validateRequest(createCurriculumSchema, req.body);
    const curriculum = await createCurriculum(input);
    res.status(201).json(curriculum);
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
    const { updateCurriculumSchema } = await import("./schemas");
    const input = validateRequest(updateCurriculumSchema, req.body);
    const curriculum = await updateCurriculum(req.params.id, input);
    res.json(curriculum);
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
    const curriculum = await publishCurriculum(req.params.id);
    res.json(curriculum);
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
    const curriculum = await archiveCurriculum(req.params.id);
    res.json(curriculum);
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
    await deleteCurriculum(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function addItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { addCurriculumItemSchema } = await import("./schemas");
    const input = validateRequest(addCurriculumItemSchema, req.body);
    const item = await addCurriculumItem(req.params.id, input);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateCurriculumItemSchema } = await import("./schemas");
    const input = validateRequest(updateCurriculumItemSchema, req.body);
    const item = await updateCurriculumItem(req.params.itemId, input);
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function reorderItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      res.status(400).json({ error: "itemIds must be an array" });
      return;
    }
    const items = await reorderCurriculumItems(req.params.id, itemIds);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function removeItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await removeCurriculumItem(req.params.itemId);
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
    const stats = await getCurriculumStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
