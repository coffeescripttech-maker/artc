import { Request, Response, NextFunction } from "express";
import { brandSettingsSchema, generalSettingsSchema } from "@aratc/shared";
import { validateRequest } from "../../lib/validate";
import {
  getBrandSettings,
  updateBrandSettings,
  getGeneralSettings,
  updateGeneralSettings,
} from "./service";

export async function getBrand(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(await getBrandSettings());
  } catch (error) {
    next(error);
  }
}

export async function updateBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(brandSettingsSchema, req.body);
    res.json(await updateBrandSettings(input));
  } catch (error) {
    next(error);
  }
}

export async function getGeneral(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(await getGeneralSettings());
  } catch (error) {
    next(error);
  }
}

export async function updateGeneral(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(generalSettingsSchema, req.body);
    res.json(await updateGeneralSettings(input));
  } catch (error) {
    next(error);
  }
}
