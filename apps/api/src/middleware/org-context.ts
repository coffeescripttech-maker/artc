import type { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { ForbiddenError } from "../lib/errors";
import { hasPlatformAdminRole } from "../lib/tenant-scope";
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

    // Resolve an authenticated userId + roles: prefer req.userId/req.userRoles
    // (set by authenticate on route-mounted requests), otherwise opportunistically
    // decode the Bearer token for global/public routes. The JWT payload carries
    // both (auth/service.ts → generateToken) — mirroring lib/visibility.ts.
    let userId: string | undefined = req.userId;
    let roles: string[] | undefined = req.userRoles;
    if (!userId || !roles) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), config.jwtSecret) as {
            userId?: string;
            roles?: string[];
          };
          userId ??= decoded.userId;
          roles ??= Array.isArray(decoded.roles) ? decoded.roles : undefined;
        } catch {
          // Invalid/expired token → anonymous; no org context attached.
          return next();
        }
      }
    }

    if (!userId) {
      return next();
    }

    req.userId = userId;
    req.userRoles ??= roles ?? [];

    // Platform-admin bypass (CS#23.1 fix): super_admin / content_admin operate
    // at the Platform layer and may act in ANY organization context without
    // requiring a local membership row (the demo seed intentionally grants them
    // none — "platform-level, no org membership required"). The header only
    // names a context; authorization comes from the platform role verified via
    // the signed JWT above — never from the client. Mirrors the existing
    // requireContentEditor / requireContentApprover / assessment scoping, which
    // all treat platform admins as authorized across all organizations.
    if (hasPlatformAdminRole(roles)) {
      req.organizationId = orgId;
      req.membership = {
        role: roles?.includes("super_admin") ? "OWNER" : "ADMIN",
      };
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

    req.organizationId = membership.organizationId;
    req.membership = { role: membership.role };
    return next();
  } catch (error) {
    return next(error);
  }
}
