import { ZodSchema } from "zod";
import { Request } from "express";
import { ValidationError, UnauthorizedError } from "./errors";

export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(", ");
    throw new ValidationError(issues);
  }

  return result.data;
}

export function getAuthUserId(req: Request): string {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("User ID is required");
  }
  return userId;
}
