// lib/audit-log.ts
// CS#14 — Admin audit log service (append-only, queryable)
//
// Why: §43 requires an immutable chain of high-risk operations: role/permission
// changes, membership grants, content publishes, and deletions. Events are
// written *after* the action commits, so failed actions never pollute the log
// (principle 16: log the outcome, not the attempt).
//
// Design: append-only INSERT only (no UPDATE/DELETE); each event carries an
// opaque correlation id for tracing across services. `actorId` is the user
// performing the action; `targetUserId`/`targetResourceId` identify what was
// touched. `actedOn` is a denormalised display name (cached at write time so
// renames later still read correctly in the log).
//
// Concurrency model (§2.5): each insert runs in its own Prisma transaction so
// the log is durable even if the caller's outer transaction rolls back — the
// action is committed, therefore the log is committed.

import { prisma, Prisma } from "@aratc/database";

export type AuditEventType =
  | "USER_CREATED"
  | "USER_DELETED"
  | "ROLE_GRANTED"
  | "ROLE_REVOKED"
  | "MEMBERSHIP_GRANTED"
  | "MEMBERSHIP_REVOKED"
  | "PROGRAM_PUBLISHED"
  | "PROGRAM_DELETED"
  | "LESSON_PUBLISHED"
  | "LESSON_DELETED"
  | "ENROLLMENT_GRANTED"
  | "ENROLLMENT_REVOKED"
     | "ENROLLMENT_EXPIRED"
  | "VERSION_PUBLISHED"
  | "VERSION_ROLLBACK";

export interface AuditEntryParams {
  tenantId: string;
  actorId: string;
  eventType: AuditEventType;
  targetUserId?: string;
  targetResourceId?: string;
  actedOn: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// CS#14: Best-effort audit log writer. Single insert (no transaction needed —
// a failed log write must never break the caller's flow, principle 16).
// Callers wrap this in their own try/catch if they want fire-and-forget.
export async function auditLog(params: AuditEntryParams) {
  await prisma.auditEvent.create({
    data: {
      tenantId: params.tenantId,
      actorId: params.actorId,
      eventType: params.eventType,
      targetUserId: params.targetUserId ?? null,
      targetResourceId: params.targetResourceId ?? null,
      actedOn: params.actedOn,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function getAuditEvents(opts: {
  tenantId: string;
  userId?: string;
  eventTypes?: AuditEventType[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  cursor?: string;
}) {
  const where: Prisma.AuditEventWhereInput = {
    tenantId: opts.tenantId,
  };

  if (opts.userId) {
    where.targetUserId = opts.userId;
  }

  if (opts.eventTypes && opts.eventTypes.length > 0) {
    where.eventType = { in: opts.eventTypes };
  }

  if (opts.dateFrom || opts.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = opts.dateFrom;
    if (opts.dateTo) where.createdAt.lte = opts.dateTo;
  }

  return prisma.auditEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
    include: {
      actor: { select: { id: true, email: true, firstName: true, lastName: true } },
      targetUser: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
}

export interface AuditFilters {
  userId?: string;
  eventTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

export interface AdminAuditResponse {
  events: Array<{
    id: string;
    tenantId: string;
    actor: { id: string; email: string; name: string | null };
    eventType: string;
    actedOn: string;
    targetUser: { id: string; email: string; name: string | null } | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }>;
  hasNext: boolean;
}

export async function adminGetAuditLog(
  tenantId: string,
  filters: AuditFilters
): Promise<AdminAuditResponse> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const results = await getAuditEvents({
    tenantId,
    userId: filters.userId,
    eventTypes: filters.eventTypes as AuditEventType[] | undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    limit: limit + 1,
    cursor: filters.cursor,
  });

  const hasNext = results.length > limit;
  const events = (hasNext ? results.slice(0, -1) : results).map((e) => ({
    id: e.id,
    tenantId: e.tenantId,
    actor: {
      id: e.actor.id,
      email: e.actor.email,
      name: e.actor.firstName || e.actor.lastName ? `${e.actor.firstName ?? ""} ${e.actor.lastName ?? ""}`.trim() : null,
    },
    eventType: e.eventType,
    actedOn: e.actedOn,
    targetUser: e.targetUser
      ? {
          id: e.targetUser.id,
          email: e.targetUser.email,
          name: e.targetUser.firstName || e.targetUser.lastName ? `${e.targetUser.firstName ?? ""} ${e.targetUser.lastName ?? ""}`.trim() : null,
        }
      : null,
    before: e.before ? JSON.parse(e.before) : null,
    after: e.after ? JSON.parse(e.after) : null,
    metadata: e.metadata ? JSON.parse(e.metadata) : null,
    createdAt: e.createdAt,
  }));

  return { events, hasNext };
}