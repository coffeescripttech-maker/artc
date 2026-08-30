import type { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { ForbiddenError } from "../lib/errors";
import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Resolves the active organization context from the `x-organization-id` header.
 *
 * SECURITY (§44): the header only *names* a desired organization — it is never
 * trusted as authorization. Membership is verified server-side on every
 * request; only an ACTIVE membership attaches organization context.
 *
 * Requests without the header proceed with no organization context, which
 * keeps every pre-existing endpoint and user working unchanged.
 *
 * Authentication: prefer the req.userId set by the `authenticate` middleware
 * (already mounted on protected routes). When this middleware is mounted
 * globally — ahead of per-route authenticate — decode the Bearer token
 * opportunistically (mirroring lib/visibility.ts's pattern for public routes).
 * Invalid/absent tokens resolve to anonymous (no org context), and the header
 * is never trusted without a verified membership lookup.
 */
export async function resolveOrgContext(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerValue = req.headers["x-organization-id"];
    const orgId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!orgId) {
      // CS#22.9 note: callers without the header deliberately proceed with no
      // organization context (tested contract in org-context.test.ts). The web
      // client always attaches the header after login, so Student lists stay
      // tenant-scoped in the application. Headerless API callers (curl/probes)
      // only ever reach the public platform catalog — documented P2.
      return next();
    }

    // Resolve an authenticated userId: prefer req.userId (from authenticate()),
    // otherwise opportunistically decode the Bearer token for public routes.
    let userId: string | undefined = req.userId;
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), config.jwtSecret) as {
            userId?: string;
          };
          userId = decoded.userId;
        } catch {
          // Invalid/expired token → anonymous; no org context attached.
          return next();
        }
      }
    }

    if (!userId) {
      return next();
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: userId },
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, type: true },
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return next(new ForbiddenError("You are not an active member of this organization"));
    }

    req.userId = userId;
    req.organizationId = membership.organizationId;
    req.membership = { role: membership.role };
    req.userRoles ??= [];
    return next();
  } catch (error) {
    return next(error);
  }
}
