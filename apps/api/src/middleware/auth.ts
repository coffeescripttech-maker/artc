import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

interface TokenPayload {
  userId: string;
  roles: string[];
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid authorization header"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.userId = decoded.userId;
    req.userRoles = decoded.roles;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRoles) {
      return next(new ForbiddenError("Roles not available"));
    }

    const hasRole = req.userRoles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
}
