// modules/admin-audit/controller.ts
// CS#14 — Admin audit log controller.
//
// Read-only query surface for the append-only audit_events table (§43).
// Access: super_admin / school_admin / content_admin (org-scoped).

import { Request, Response, NextFunction } from "express";
import { getAuthUserId } from "../../lib/validate";
import { ForbiddenError } from "../../lib/errors";
import { adminGetAuditLog, AuditFilters } from "../../lib/audit-log";

function getTenantId(req: Request): string {
  if (req.organizationId) return req.organizationId;
  // super_admin can query the platform (whole-DB) tenant via x-tenant-id
  const platformTenant = req.headers["x-tenant-id"] as string | undefined;
  if (platformTenant) return platformTenant;
  throw new ForbiddenError("An organization context is required to view the audit log");
}

export async function listAuditEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = getAuthUserId(req);
    const tenantId = getTenantId(req);

    const filters: AuditFilters = {
      userId: req.query.userId as string | undefined,
      eventTypes: req.query.eventTypes
        ? (req.query.eventTypes as string).split(",")
        : undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      cursor: req.query.cursor as string | undefined,
    };

    const result = await adminGetAuditLog(tenantId, filters);

    res.status(200).json({
      actorId,
      tenantId,
      cursor: req.query.cursor ?? null,
      hasNext: result.hasNext,
      events: result.events,
    });
  } catch (err) {
    next(err);
  }
}