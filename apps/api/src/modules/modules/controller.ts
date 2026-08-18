import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  listModules,
  getModuleById,
  createModule,
  updateModule,
  publishModule,
  archiveModule,
  deleteModule,
  reorderModules,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subjectId = req.query.subjectId as string | undefined;
    const modules = await listModules(subjectId);
    res.json(modules);
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
    const module = await getModuleById(req.params.id);
    res.json(module);
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
    const { createModuleSchema } = await import("./schemas");
    const input = validateRequest(createModuleSchema, req.body);
    const module = await createModule(input);
    res.status(201).json(module);
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
    const { updateModuleSchema } = await import("./schemas");
    const input = validateRequest(updateModuleSchema, req.body);
    const module = await updateModule(req.params.id, input);
    res.json(module);
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
    const module = await publishModule(req.params.id);
    res.json(module);
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
    const module = await archiveModule(req.params.id);
    res.json(module);
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
    await deleteModule(req.params.id);
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
    const { moduleIds } = req.body;
    const { subjectId } = req.params;
    if (!Array.isArray(moduleIds)) {
      res.status(400).json({ error: "moduleIds must be an array" });
      return;
    }
    const modules = await reorderModules(subjectId, moduleIds);
    res.json(modules);
  } catch (error) {
    next(error);
  }
}
