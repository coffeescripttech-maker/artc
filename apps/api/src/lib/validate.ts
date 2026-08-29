import { ZodSchema, ZodTypeAny, z } from "zod";
import { Request } from "express";
import { ValidationError, UnauthorizedError } from "./errors";

/**
 * Validate request data against a Zod schema.
 * Returns the schema's OUTPUT type (post-defaults/transforms), so schemas
 * using `.default()` expose their filled-in values to callers.
 */
export function validateRequest<S extends ZodTypeAny>(
  schema: S,
  data: unknown
): z.output<S> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(", ");
    throw new ValidationError(issues);
  }

  return result.data as z.output<S>;
}

export function getAuthUserId(req: Request): string {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("User ID is required");
  }
  return userId;
}
