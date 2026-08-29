import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../lib/errors';

/**
 * Superadmin-only route guard for /platform/*  routes.
 *
 * This is intentionally SEPARATE from resolveOrgContext / requireContentEditor.
 * It hard-checks roles.includes('super_admin') and does NOT depend on an org
 * membership, because the superadmin manages *all* organizations including
 * ones they are not a member of.
 */
export function requirePlatformAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const roles: string[] = req.userRoles ?? (req as any).user?.roles ?? [];
  if (!roles.includes('super_admin')) {
    return next(new ForbiddenError('Platform admin access required'));
  }
  next();
}
