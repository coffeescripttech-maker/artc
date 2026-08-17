import { Request, Response, NextFunction } from "express";
import { createProgramSchema } from "@aratc/shared";
import { validateRequest } from "../../lib/validate";
import {
  listPrograms,
  getProgramBySlug,
  createProgram,
  updateProgram,
  publishProgram,
  deleteProgram,
} from "./service";

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const programs = await listPrograms();
    res.json(programs);
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
    const program = await getProgramBySlug(req.params.slug);
    res.json(program);
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
    const input = validateRequest(createProgramSchema, req.body);
    const program = await createProgram(input);
    res.status(201).json(program);
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
    const input = validateRequest(createProgramSchema.partial(), req.body);
    const program = await updateProgram(req.params.id, input);
    res.json(program);
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
    const program = await publishProgram(req.params.id);
    res.json(program);
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
    await deleteProgram(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
