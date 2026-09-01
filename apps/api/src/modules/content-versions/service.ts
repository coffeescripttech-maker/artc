import type { Request, Response } from "express";
import { prisma, Prisma } from "@aratc/database";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../lib/errors";
import { auditLog, AuditEventType } from "../../lib/audit-log";
import { EntityType } from "../../lib/content-versions";
import { hasAnyPermission } from "../../middleware/permissions";

/**
 * Content versioning API (CS#10b — architecture §18).
 *
 * Snapshots are IMMUTABLE: rows in content_versions are created, never
 * updated or deleted (principle 12 — published content is never silently
 * modified). The live Program/Lesson row carries the editable state; its
 * publish history is the linear versionNumber chain in content_versions.
 *
 * Semantics:
 *  - createDraftVersion: archive the current PUBLISHED state as a snapshot
 *    (first archival only), then flip the live row to DRAFT for editing.
 *    Rejected if the resource is not currently PUBLISHED (no stacked drafts).
 *  - publishVersion: archive the (possibly edited) state as a NEW snapshot,
 *    then mark the live row PUBLISHED.
 *  - rollbackToVersion: copy-forward the target snapshot as a new head
 *    snapshot (history stays linear/immutable) and restore its title on the
 *    live row, marking it PUBLISHED.
 *  - listVersions: newest-first, cursor-paginated history.
 */

// CS#23.2 — versioning is gated by the configurable "content.versions"
// permission (defaults: school_admin, content_admin, super_admin via bypass).
async function requireVersionRole(req: Request) {
  if (!req.userId) throw new ForbiddenError("Authentication required");
  if (!(await hasAnyPermission(req, "content.versions"))) {
    throw new ForbiddenError("Insufficient permissions for versioning");
  }
}

function asEntityType(resourceType: string): EntityType {
  if (resourceType !== "PROGRAM" && resourceType !== "LESSON") {
    throw new BadRequestError("Invalid resource type");
  }
  return resourceType;
}

function resolveTenantId(req: Request): string {
  const hdr = req.headers["x-organization-id"] as string | undefined;
  if (hdr) return hdr;
  return req.userRoles?.includes("super_admin") ? "platform" : "";
}

function fireAudit(
  eventType: AuditEventType,
  tenantId: string,
  actorId: string,
  actedOn: string,
  metadata?: Record<string, unknown>,
) {
  void auditLog({ tenantId, actorId, eventType, actedOn, metadata }).catch(() => {});
}

/** Fetch the live row; loose record so Program(name)/Lesson(title) share one path. */
async function getLiveRow(type: EntityType, resourceId: string): Promise<Record<string, unknown>> {
  const row =
    type === "PROGRAM"
      ? await prisma.program.findUnique({ where: { id: resourceId } })
      : await prisma.lesson.findUnique({ where: { id: resourceId } });
  if (!row) throw new NotFoundError(`${type} ${resourceId} not found`);
  return row as unknown as Record<string, unknown>;
}

function titleOf(row: Record<string, unknown>): string {
  if (typeof row.title === "string" && row.title) return row.title;
  if (typeof row.name === "string" && row.name) return row.name;
  return "untitled";
}

function toSnapshotJson(row: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function createdByIdOf(row: Record<string, unknown>): string | null {
  return typeof row.createdById === "string" ? row.createdById : null;
}

export async function createDraftVersion(
  resourceType: string,
  resourceId: string,
  actorId: string,
): Promise<{ snapshotVersion: number | null; draft: Record<string, unknown> }> {
  const type = asEntityType(resourceType);
  const row = await getLiveRow(type, resourceId);
  if (row.status !== "PUBLISHED") {
    throw new BadRequestError("Only PUBLISHED content can enter draft versioning");
  }

  const snapshotVersion = await prisma.$transaction(async (tx) => {
    // Archive the current published state exactly once (first archival).
    const head = await tx.contentVersion.findFirst({
      where: { entityType: type, entityId: resourceId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    if (!head) {
      const created = await tx.contentVersion.create({
        data: {
          entityType: type,
          entityId: resourceId,
          versionNumber: 1,
          title: titleOf(row),
          snapshot: toSnapshotJson(row),
          createdById: createdByIdOf(row),
        },
      });
      return created.versionNumber;
    }
    return null;
  });

  // Flip the live row to DRAFT so editors can work on the next version.
  const draft =
    type === "PROGRAM"
      ? await prisma.program.update({ where: { id: resourceId }, data: { status: "DRAFT" } })
      : await prisma.lesson.update({ where: { id: resourceId }, data: { status: "DRAFT" } });

  return { snapshotVersion, draft: draft as unknown as Record<string, unknown> };
}

export async function publishVersion(
  resourceType: string,
  resourceId: string,
  actorId: string,
  tenantId: string,
): Promise<{ version: number; publishedAt: Date }> {
  const type = asEntityType(resourceType);
  const row = await getLiveRow(type, resourceId);

  const snapshot = await prisma.$transaction(async (tx) => {
    const head = await tx.contentVersion.findFirst({
      where: { entityType: type, entityId: resourceId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const version = await tx.contentVersion.create({
      data: {
        entityType: type,
        entityId: resourceId,
        versionNumber: (head?.versionNumber ?? 0) + 1,
        title: titleOf(row),
        snapshot: toSnapshotJson(row),
        createdById: actorId,
      },
    });
    if (type === "PROGRAM") {
      await tx.program.update({ where: { id: resourceId }, data: { status: "PUBLISHED" } });
    } else {
      await tx.lesson.update({ where: { id: resourceId }, data: { status: "PUBLISHED" } });
    }
    return version;
  });

  fireAudit("VERSION_PUBLISHED", tenantId, actorId, titleOf(row), {
    entityType: type,
    entityId: resourceId,
    versionNumber: snapshot.versionNumber,
  });
  return { version: snapshot.versionNumber, publishedAt: snapshot.createdAt };
}

export async function rollbackToVersion(
  resourceType: string,
  resourceId: string,
  toVersion: number,
  actorId: string,
  tenantId: string,
): Promise<{ version: number; restoredFrom: number }> {
  const type = asEntityType(resourceType);
  const target = await prisma.contentVersion.findFirst({
    where: { entityType: type, entityId: resourceId, versionNumber: toVersion },
  });
  if (!target) {
    throw new NotFoundError(`Version ${toVersion} not found for ${type} ${resourceId}`);
  }

  const restored = await prisma.$transaction(async (tx) => {
    const head = await tx.contentVersion.findFirst({
      where: { entityType: type, entityId: resourceId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    // Copy-forward: history stays linear and immutable.
    const newHead = await tx.contentVersion.create({
      data: {
        entityType: type,
        entityId: resourceId,
        versionNumber: (head?.versionNumber ?? 0) + 1,
        title: target.title,
        snapshot: (target.snapshot ?? {}) as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    if (type === "PROGRAM") {
      await tx.program.update({
        where: { id: resourceId },
        data: { status: "PUBLISHED", name: target.title },
      });
    } else {
      await tx.lesson.update({
        where: { id: resourceId },
        data: { status: "PUBLISHED", title: target.title },
      });
    }
    return newHead;
  });

  fireAudit("VERSION_ROLLBACK", tenantId, actorId, target.title, {
    entityType: type,
    entityId: resourceId,
    restoredFrom: toVersion,
    newVersion: restored.versionNumber,
  });
  return { version: restored.versionNumber, restoredFrom: toVersion };
}

export async function listVersions(
  resourceType: string,
  resourceId: string,
  limit: number,
  cursorId?: string,
): Promise<{ versions: Awaited<ReturnType<typeof prisma.contentVersion.findMany>>; hasNext: boolean }> {
  const type = asEntityType(resourceType);
  // Validate the resource exists (404 rather than an empty history).
  await getLiveRow(type, resourceId);

  const where: { entityType: EntityType; entityId: string; versionNumber?: { lt: number } } = {
    entityType: type,
    entityId: resourceId,
  };
  if (cursorId) {
    const cursor = await prisma.contentVersion.findUnique({
      where: { id: cursorId },
      select: { versionNumber: true },
    });
    if (!cursor) throw new NotFoundError(`Cursor ${cursorId} not found`);
    where.versionNumber = { lt: cursor.versionNumber };
  }

  const versions = await prisma.contentVersion.findMany({
    where,
    orderBy: { versionNumber: "desc" },
    take: limit + 1,
  });
  const hasNext = versions.length > limit;
  return { versions: hasNext ? versions.slice(0, -1) : versions, hasNext };
}

// --- Controllers (wired to routes) ------------------------------------------

export async function draftController(req: Request, res: Response) {
  await requireVersionRole(req);
  const { resourceType, resourceId } = req.params as { resourceType: string; resourceId: string };
  const result = await createDraftVersion(resourceType, resourceId, req.userId!);
  res.status(201).json({ ok: true, ...result });
}

export async function publishController(req: Request, res: Response) {
  await requireVersionRole(req);
  const { resourceType, resourceId } = req.params as { resourceType: string; resourceId: string };
  const result = await publishVersion(resourceType, resourceId, req.userId!, resolveTenantId(req));
  res.json({ ok: true, ...result });
}

export async function rollbackController(req: Request, res: Response) {
  await requireVersionRole(req);
  const { resourceType, resourceId } = req.params as {
    resourceType: string;
    resourceId: string;
    version: string;
  };
  const toVersion = Number(req.params.version);
  if (!Number.isInteger(toVersion) || toVersion < 1) {
    throw new BadRequestError("version must be a positive integer");
  }
  const result = await rollbackToVersion(
    resourceType,
    resourceId,
    toVersion,
    req.userId!,
    resolveTenantId(req),
  );
  res.json({ ok: true, ...result });
}

export async function listController(req: Request, res: Response) {
  await requireVersionRole(req);
  const { resourceType, resourceId } = req.params as { resourceType: string; resourceId: string };
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const data = await listVersions(resourceType, resourceId, limit, cursor);
  res.json(data);
}
