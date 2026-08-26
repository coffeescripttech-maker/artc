import { Request, Response, NextFunction } from "express";
import { getOverview } from "./service";

export async function overview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(await getOverview());
  } catch (error) {
    next(error);
  }
}
