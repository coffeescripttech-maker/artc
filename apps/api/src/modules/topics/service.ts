import { prisma } from "@aratc/database";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import {
  type ContentVisibilityOptions,
  isVisible,
  publishedOnly,
} from "../../lib/visibility";
import type { CreateTopicInput, UpdateTopicInput } from "./schemas";

export async function listTopics(
  moduleId?: string,
  opts?: ContentVisibilityOptions
) {
  const where = {
    ...(moduleId ? { moduleId } : {}),
    ...publishedOnly(opts),
  };

  return prisma.topic.findMany({
    where,
    orderBy: [{ moduleId: "asc" }, { orderIndex: "asc" }],
    include: {
      module: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } },
      _count: { select: { lessons: true } },
    },
  });
}

export async function listAllTopics(opts?: ContentVisibilityOptions) {
  return prisma.topic.findMany({
    where: publishedOnly(opts),
    orderBy: [{ moduleId: "asc" }, { orderIndex: "asc" }],
    include: {
      module: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } },
    },
  });
}

export async function getTopicById(
  id: string,
  opts?: ContentVisibilityOptions
) {
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          name: true,
          subject: { select: { id: true, name: true, slug: true } },
        },
      },
      lessons: {
        // Nested drafts are hidden from non-privileged callers as well.
        ...(opts?.includeUnpublished ? {} : { where: { status: "PUBLISHED" as const } }),
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!topic || !isVisible(topic.status, opts)) {
    throw new NotFoundError("Topic not found");
  }

  return topic;
}

export async function createTopic(input: CreateTopicInput) {
  // Verify module exists
  const module = await prisma.module.findUnique({ where: { id: input.moduleId } });
  if (!module) {
    throw new NotFoundError("Module not found");
  }

  // Generate unique slug if needed
  let slug = input.slug;
  let counter = 1;
  while (true) {
    const existing = await prisma.topic.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${input.slug}-${counter}`;
    counter++;
  }

  // Get max orderIndex if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const maxTopic = await prisma.topic.findFirst({
      where: { moduleId: input.moduleId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (maxTopic?.orderIndex ?? -1) + 1;
  }

  return prisma.topic.create({
    data: {
      moduleId: input.moduleId,
      name: input.name,
      slug,
      description: input.description,
      orderIndex,
      status: "DRAFT",
    },
  });
}

export async function updateTopic(id: string, input: UpdateTopicInput) {
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Topic not found");
  }

  return prisma.topic.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      orderIndex: input.orderIndex,
    },
  });
}

export async function publishTopic(id: string) {
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Topic not found");
  }

  return prisma.topic.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveTopic(id: string) {
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Topic not found");
  }

  return prisma.topic.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteTopic(id: string) {
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Topic not found");
  }

  return prisma.topic.delete({ where: { id } });
}

export async function reorderTopics(moduleId: string, topicIds: string[]) {
  const topics = await prisma.topic.findMany({
    where: { moduleId, id: { in: topicIds } },
  });

  if (topics.length !== topicIds.length) {
    throw new BadRequestError("Some topics don't belong to this module");
  }

  await prisma.$transaction(
    topicIds.map((id, index) =>
      prisma.topic.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return prisma.topic.findMany({
    where: { moduleId },
    orderBy: { orderIndex: "asc" },
  });
}
