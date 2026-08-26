import { Request, Response, NextFunction } from "express";
import { createBatchSchema, addBatchMemberSchema } from "@aratc/shared";
import { validateRequest, getAuthUserId } from "../../lib/validate";
import {
  listMyBatches,
  createBatch,
  getBatch,
  addBatchMember,
  removeBatchMember,
  getMyReport,
} from "./service";

export async function myBatches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(await listMyBatches(getAuthUserId(req)));
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
    const input = validateRequest(createBatchSchema, req.body);
    res.status(201).json(await createBatch(getAuthUserId(req), input));
  } catch (error) {
    next(error);
  }
}

export async function myReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(await getMyReport(getAuthUserId(req)));
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
    res.json(await getBatch(req.params.id, getAuthUserId(req), req.userRoles ?? []));
  } catch (error) {
    next(error);
  }
}

export async function addMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(addBatchMemberSchema, req.body);
    res
      .status(201)
      .json(await addBatchMember(req.params.id, getAuthUserId(req), req.userRoles ?? [], input.email));
  } catch (error) {
    next(error);
  }
}

export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(
      await removeBatchMember(req.params.id, req.params.memberId, getAuthUserId(req), req.userRoles ?? [])
    );
  } catch (error) {
    next(error);
  }
}
