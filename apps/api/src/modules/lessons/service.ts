import { prisma } from "@aratc/database";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type { CreateLessonInput, UpdateLessonInput } from "./schemas";

export async function listLessons(topicId?: string) {
  const where = topicId ? { topicId } : {};

  return prisma.lesson.findMany({
    where,
    orderBy: [{ topicId: "asc" }, { orderIndex: "asc" }],
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          module: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          module: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  return lesson;
}

export async function createLesson(input: CreateLessonInput) {
  // Verify topic exists
  const topic = await prisma.topic.findUnique({ where: { id: input.topicId } });
  if (!topic) {
    throw new NotFoundError("Topic not found");
  }

  // Get max orderIndex if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const maxLesson = await prisma.lesson.findFirst({
      where: { topicId: input.topicId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (maxLesson?.orderIndex ?? -1) + 1;
  }

  return prisma.lesson.create({
    data: {
      topicId: input.topicId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      durationMinutes: input.durationMinutes,
      content: input.content ? JSON.stringify(input.content) : undefined,
      videoUrl: input.videoUrl,
      orderIndex,
      status: "DRAFT",
    },
  });
}

export async function updateLesson(id: string, input: UpdateLessonInput) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  return prisma.lesson.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      durationMinutes: input.durationMinutes,
      content: input.content ? JSON.stringify(input.content) : undefined,
      videoUrl: input.videoUrl,
      orderIndex: input.orderIndex,
    },
  });
}

export async function publishLesson(id: string) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  return prisma.lesson.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveLesson(id: string) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  return prisma.lesson.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteLesson(id: string) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  return prisma.lesson.delete({ where: { id } });
}

export async function reorderLessons(topicId: string, lessonIds: string[]) {
  const lessons = await prisma.lesson.findMany({
    where: { topicId, id: { in: lessonIds } },
  });

  if (lessons.length !== lessonIds.length) {
    throw new BadRequestError("Some lessons don't belong to this topic");
  }

  await prisma.$transaction(
    lessonIds.map((id, index) =>
      prisma.lesson.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return prisma.lesson.findMany({
    where: { topicId },
    orderBy: { orderIndex: "asc" },
  });
}

// Get lessons for a subject (all lessons across all topics in modules)
export async function getLessonsBySubject(subjectId: string) {
  return prisma.lesson.findMany({
    where: {
      topic: {
        module: {
          subjectId,
        },
      },
    },
    orderBy: [{ topicId: "asc" }, { orderIndex: "asc" }],
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          module: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

// Stats
export async function getLessonStats(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      _count: { select: { lessons: true } },
      lessons: {
        where: { status: "PUBLISHED" },
        select: {
          durationMinutes: true,
          type: true,
        },
      },
    },
  });

  if (!topic) {
    throw new NotFoundError("Topic not found");
  }

  const totalDuration = topic.lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const videoCount = topic.lessons.filter((l) => l.type === "VIDEO").length;

  return {
    totalLessons: topic._count.lessons,
    publishedLessons: topic.lessons.length,
    totalDuration,
    videoCount,
  };
}
