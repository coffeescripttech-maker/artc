import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.statusCode,
      },
    });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    error: {
      message: "Internal server error",
      code: 500,
    },
  });
}
