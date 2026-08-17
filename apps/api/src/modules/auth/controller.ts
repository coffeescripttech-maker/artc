import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "@aratc/shared";
import { validateRequest } from "../../lib/validate";
import { registerUser, loginUser, getCurrentUser } from "./service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(registerSchema, req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRequest(loginSchema, req.body);
    const result = await loginUser(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: { message: "Unauthorized", code: 401 } });
      return;
    }
    const user = await getCurrentUser(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
}
