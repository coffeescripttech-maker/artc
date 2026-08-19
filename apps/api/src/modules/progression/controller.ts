import { Request, Response, NextFunction } from "express";
import { getAuthUserId } from "../../lib/validate";
import { getProgression } from "./service";

export async function progression(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const programId = req.query.programId as string | undefined;
    const result = await getProgression(userId, programId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
