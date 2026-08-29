import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@aratc/database";
import { validateRequest } from "../../../lib/validate";
import { ApiError, NotFoundError } from "../../../lib/errors";
import {
  createOrgSchema,
  updateOrgSchema,
  suspendOrgSchema,
  deleteOrgSchema,
  inviteAdminSchema,
} from './schemas';

// === Platform Organizations Service (superadmin-only) ===
// All handlers hard-checked by requirePlatformAdmin before reaching here.

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const includeDeleted = req.query.include_deleted === "true";
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        metadata: true,
        _count: {
          select: { memberships: true, programs: true, lessons: true },
        },
      },
      orderBy: { name: "asc" },
    });
        return res.json(
      orgs
        .map((o) => {
          const metadata = (o.metadata ?? {}) as Record<string, unknown>;
          return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            status: o.status,
            reviewMode: metadata.teacher_auto_publish === false,
            deleted: typeof metadata.deletedAt === "string",
            memberCount: o._count.memberships,
            programCount: o._count.programs,
            imageUrl: typeof metadata.imageUrl === "string" ? metadata.imageUrl : null,
          };
        })
        .filter((o) => includeDeleted || !o.deleted),
    );
  } catch (e) {
    next(e);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            createdAt: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    if (!org) throw new NotFoundError(`Organization ${id} not found`);
    const metadata = (org.metadata ?? {}) as Record<string, unknown>;
    return res.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      metadata: org.metadata,
      reviewMode: metadata.teacher_auto_publish === false,
      deleted: typeof metadata.deletedAt === "string",
      imageUrl: typeof metadata.imageUrl === "string" ? metadata.imageUrl : null,
      members: org.memberships,
    });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = validateRequest(createOrgSchema, req.body);
    const existing = await prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ApiError('Organization with this slug already exists', 409);
    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        metadata: {
          ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
          ...(data.settings ?? {}),
        } as Prisma.InputJsonValue,
      },
    });
    return res.status(201).json({ id: org.id, name: org.name, slug: org.slug });
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = validateRequest(updateOrgSchema, { ...req.params, ...req.body });
    // Merge into the existing metadata so unrelated keys (e.g.
    // teacher_auto_publish) are never clobbered by an image update.
    const existing = await prisma.organization.findUnique({
      where: { id: data.id },
      select: { metadata: true },
    });
    const metadata = { ...((existing?.metadata ?? {}) as Record<string, unknown>) };
    if (data.settings) Object.assign(metadata, data.settings);
    if (data.imageUrl !== undefined) {
      if (data.imageUrl) metadata.imageUrl = data.imageUrl;
      else delete metadata.imageUrl;
    }

    const org = await prisma.organization.update({
      where: { id: data.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    return res.json({ id: org.id, name: org.name, slug: org.slug, metadata: org.metadata });
  } catch (e: any) {
    if (e?.code === 'P2025') throw new NotFoundError('Organization not found');
    next(e);
  }
}

export async function suspend(req: Request, res: Response, next: NextFunction) {
  try {
    const data = validateRequest(suspendOrgSchema, { ...req.params, ...req.body });
    // Organization.status uses the existing ContentStatus enum (no SUSPENDED
    // value exists), so suspension maps to ARCHIVED and activation to PUBLISHED.
    // Activating a DELETED org restores it (clears the deletedAt marker).
    let metadata: Record<string, unknown> | undefined;
    if (data.action === "ACTIVATE") {
      const existing = await prisma.organization.findUnique({
        where: { id: data.id },
        select: { metadata: true },
      });
      metadata = { ...((existing?.metadata ?? {}) as Record<string, unknown>) };
      delete metadata.deletedAt;
    }
    const nextStatus = data.action === "SUSPEND" ? "ARCHIVED" : "PUBLISHED";
    const org = await prisma.organization.update({
      where: { id: data.id },
      data: {
        status: nextStatus,
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });
    return res.json({ id: org.id, status: org.status, suspended: org.status === "ARCHIVED" });
  } catch (e: any) {
    if (e?.code === "P2025") throw new NotFoundError("Organization not found");
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = validateRequest(deleteOrgSchema, req.params);
    // Soft delete: mark deletedAt (recoverable) + archive status. Data is never
    // destroyed; activating the org clears the marker and restores it.
    const existing = await prisma.organization.findUnique({
      where: { id: data.id },
      select: { metadata: true },
    });
    const metadata = { ...((existing?.metadata ?? {}) as Record<string, unknown>) };
    metadata.deletedAt = new Date().toISOString();
    await prisma.organization.update({
      where: { id: data.id },
      data: { status: 'ARCHIVED', metadata: metadata as Prisma.InputJsonValue },
    });
    return res.status(204).send();
  } catch (e: any) {
    if (e?.code === 'P2025') throw new NotFoundError('Organization not found');
    next(e);
  }
}

export async function inviteAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const data = validateRequest(inviteAdminSchema, { ...req.params, ...req.body });
    const target = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!target) throw new NotFoundError(`User ${data.userId} not found`);

    const membership = await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: data.id, userId: data.userId } },
      create: { organizationId: data.id, userId: data.userId, role: data.membershipRole, status: 'ACTIVE' },
      update: { role: data.membershipRole, status: 'ACTIVE' },
    });
    return res.status(201).json({
      id: membership.id,
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      status: membership.status,
    });
  } catch (e) {
    next(e);
  }
}
