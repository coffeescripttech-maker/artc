import { prisma } from "@aratc/database";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import {
  type ContentVisibilityOptions,
  isVisible,
  publishedOnly,
} from "../../lib/visibility";
import type { CreateModuleInput, UpdateModuleInput } from "./schemas";

export async function listModules(
  subjectId?: string,
  opts?: ContentVisibilityOptions
) {
  const where = {
    ...(subjectId ? { subjectId } : {}),
    ...publishedOnly(opts),
  };

  return prisma.module.findMany({
    where,
    orderBy: [{ subjectId: "asc" }, { orderIndex: "asc" }],
    include: {
      subject: { select: { id: true, name: true, slug: true } },
      _count: { select: { topics: true } },
    },
  });
}

export async function getModuleById(
  id: string,
  opts?: ContentVisibilityOptions
) {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true, slug: true, code: true } },
      topics: {
        // Nested drafts are hidden from non-privileged callers as well.
        ...(opts?.includeUnpublished ? {} : { where: { status: "PUBLISHED" as const } }),
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  if (!module || !isVisible(module.status, opts)) {
    throw new NotFoundError("Module not found");
  }

  return module;
}

export async function createModule(input: CreateModuleInput) {
  // Verify subject exists
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }

  // Generate unique slug if needed
  let slug = input.slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.module.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${input.slug}-${counter}`;
    counter++;
  }

  // Get max orderIndex if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const maxModule = await prisma.module.findFirst({
      where: { subjectId: input.subjectId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (maxModule?.orderIndex ?? -1) + 1;
  }

  return prisma.module.create({
    data: {
      subjectId: input.subjectId,
      name: input.name,
      slug,
      description: input.description,
      orderIndex,
      status: "DRAFT",
    },
  });
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Module not found");
  }

  return prisma.module.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      orderIndex: input.orderIndex,
    },
  });
}

export async function publishModule(id: string) {
  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Module not found");
  }

  return prisma.module.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveModule(id: string) {
  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Module not found");
  }

  return prisma.module.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteModule(id: string) {
  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Module not found");
  }

  return prisma.module.delete({ where: { id } });
}

export async function reorderModules(subjectId: string, moduleIds: string[]) {
  const modules = await prisma.module.findMany({
    where: { subjectId, id: { in: moduleIds } },
  });

  if (modules.length !== moduleIds.length) {
    throw new BadRequestError("Some modules don't belong to this subject");
  }

  await prisma.$transaction(
    moduleIds.map((id, index) =>
      prisma.module.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return prisma.module.findMany({
    where: { subjectId },
    orderBy: { orderIndex: "asc" },
  });
}
