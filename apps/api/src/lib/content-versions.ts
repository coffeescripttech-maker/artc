import { prisma, Prisma } from "@aratc/database";

/**
 * Content versioning (CS#8 — architecture §18, incremental).
 *
 * Snapshots are IMMUTABLE: created at publish time and before each edit of
 * already-published content (principle 12 — published content is never
 * modified silently). App flows never update or delete version rows.
 */

export type EntityType = "LESSON" | "PROGRAM";

/** Minimal transaction/prisma client shape accepted by the snapshot helper. */
type Client = Pick<typeof prisma, "contentVersion">;

export async function snapshotContentVersion(
  db: Client,
  params: {
    entityType: EntityType;
    entityId: string;
    title: string;
    snapshot: Record<string, unknown>;
    createdById?: string | null;
  }
) {
  const last = await db.contentVersion.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  return db.contentVersion.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      title: params.title,
      snapshot: params.snapshot as Prisma.InputJsonValue,
      createdById: params.createdById ?? null,
    },
  });
}

export async function listContentVersions(entityType: EntityType, entityId: string) {
  return prisma.contentVersion.findMany({
    where: { entityType, entityId },
    orderBy: { versionNumber: "desc" },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getContentVersion(entityType: EntityType, entityId: string, versionId: string) {
  return prisma.contentVersion.findFirst({
    where: { entityType, entityId, id: versionId },
  });
}