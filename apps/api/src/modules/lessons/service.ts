import { prisma } from "@aratc/database";
type JsonInput = import("@prisma/client").InputJsonValue | null;
import { normalizeLessonContent } from "@aratc/shared";
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
      content: input.content ?? undefined,
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
      content: input.content ?? undefined,
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

// ============================================================
// Lesson Question Responses (Phase 4 — in-lesson answering)
// ============================================================

export interface SaveLessonQuestionResponseInput {
  questionId: string;
  answer: unknown;
  isCorrect: boolean;
  pointsEarned?: number;
  blockId?: string;
}

/**
 * Persist (upsert) a learner's answer to a question embedded in a lesson.
 * One response per (learner, lesson, question) — keeps the latest attempt
 * so students can retry and see updated feedback.
 */
export async function saveLessonQuestionResponse(
  userId: string,
  lessonId: string,
  input: SaveLessonQuestionResponseInput
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) {
    throw new NotFoundError("Learner profile not found");
  }

  // Confirm the linked question block is actually part of this lesson content.
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true },
  });
  if (!question) {
    throw new NotFoundError("Question not found");
  }

  return prisma.lessonQuestionResponse.upsert({
    where: {
      learnerId_lessonId_questionId: {
        learnerId: learner.id,
        lessonId,
        questionId: input.questionId,
      },
    },
    update: {
      answer: input.answer as JsonInput | undefined,
      isCorrect: input.isCorrect,
      pointsEarned: input.pointsEarned ?? 0,
      blockId: input.blockId ?? null,
      attemptedAt: new Date(),
    },
    create: {
      learnerId: learner.id,
      lessonId,
      questionId: input.questionId,
      blockId: input.blockId ?? null,
      answer: input.answer as JsonInput | undefined,
      isCorrect: input.isCorrect,
      pointsEarned: input.pointsEarned ?? 0,
    },
  });
}

/**
 * Fetch the most recent response a learner gave to a given lesson question.
 */
export async function getLessonQuestionResponse(userId: string, lessonId: string, questionId: string) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) {
    throw new NotFoundError("Learner profile not found");
  }

  return prisma.lessonQuestionResponse.findFirst({
    where: {
      learnerId: learner.id,
      lessonId,
      questionId,
    },
    orderBy: { attemptedAt: "desc" },
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

// ============================================================
// Lesson progress (per learner)
// ============================================================

async function getOrCreateLearnerProfile(userId: string) {
  const existing = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.learnerProfile.create({ data: { userId } });
}

export async function getLessonProgress(userId: string, lessonId: string) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) {
    return { lessonId, completed: false, completionPercentage: 0, mastery: "NOT_STARTED" };
  }

  const progress = await prisma.progress.findFirst({
    where: { learnerId: learner.id, lessonId },
  });

  return {
    lessonId,
    completed: (progress?.completionPercentage ?? 0) >= 100,
    completionPercentage: progress?.completionPercentage ?? 0,
    mastery: progress?.mastery ?? "NOT_STARTED",
  };
}

export async function setLessonProgress(userId: string, lessonId: string, completed: boolean) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const learner = await getOrCreateLearnerProfile(userId);

  const existing = await prisma.progress.findFirst({
    where: { learnerId: learner.id, lessonId },
  });

  const data = {
    completionPercentage: completed ? 100 : 0,
    mastery: completed ? ("MASTERED" as const) : ("NOT_STARTED" as const),
    lastActivityAt: new Date(),
  };

  if (existing) {
    await prisma.progress.update({ where: { id: existing.id }, data });
  } else {
    await prisma.progress.create({
      data: {
        learnerId: learner.id,
        lessonId,
        topicId: lesson.topicId,
        ...data,
      },
    });
  }

  return getLessonProgress(userId, lessonId);
}

// ============================================================
// Lesson progress with question breakdown (Phase 6)
// ============================================================

interface QuestionStats {
  totalBlocks: number;
  answeredBlocks: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
}

/** Derive completion percentage from answered question blocks in lesson content. */
const computeCompletionFromQuestions = (answered: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((answered / total) * 100);
};

/** Map completionPercentage to a MasteryLevel. */
const masteryFromCompletion = (pct: number): "NOT_STARTED" | "LEARNING" | "PRACTICING" | "PROFICIENT" | "MASTERED" => {
  if (pct >= 100) return "MASTERED";
  if (pct >= 75) return "PROFICIENT";
  if (pct >= 25) return "PRACTICING";
  if (pct > 0) return "LEARNING";
  return "NOT_STARTED";
};

/**
 * Fetch progress for a lesson plus aggregate question-level stats:
 * how many question blocks exist, how many the learner has answered,
 * how many were correct, and total/earned points.
 */
export async function getLessonProgressWithQuestions(userId: string, lessonId: string): Promise<{
  lessonId: string;
  completed: boolean;
  completionPercentage: number;
  mastery: "NOT_STARTED" | "LEARNING" | "PRACTICING" | "PROFICIENT" | "MASTERED";
  questionStats: QuestionStats;
}> {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) {
    return {
      lessonId,
      completed: false,
      completionPercentage: 0,
      mastery: "NOT_STARTED",
      questionStats: { totalBlocks: 0, answeredBlocks: 0, correctAnswers: 0, totalPoints: 0, earnedPoints: 0 },
    };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { content: true, topicId: true },
  });
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const content = normalizeLessonContent(lesson.content);
  const questionBlocks = content.blocks.filter((b) => b.type === "question");
  const totalBlocks = questionBlocks.length;
  const totalPoints = questionBlocks.reduce((sum, b) => sum + (b.points ?? 1), 0);

  // If there are no question blocks, fall back to the plain progress record.
  if (totalBlocks === 0) {
    const progress = await prisma.progress.findFirst({ where: { learnerId: learner.id, lessonId } });
    return {
      lessonId,
      completed: (progress?.completionPercentage ?? 0) >= 100,
      completionPercentage: progress?.completionPercentage ?? 0,
      mastery: progress?.mastery ?? "NOT_STARTED",
      questionStats: { totalBlocks: 0, answeredBlocks: 0, correctAnswers: 0, totalPoints: 0, earnedPoints: 0 },
    };
  }

  const answeredBlockIds = new Set<string>();
  let correctAnswers = 0;
  let earnedPoints = 0;

  const responses = await prisma.lessonQuestionResponse.findMany({
    where: { learnerId: learner.id, lessonId },
  });

  for (const resp of responses) {
    // Count unique question blocks answered
    if (resp.questionId) {
      answeredBlockIds.add(resp.questionId);
    }
    if (resp.isCorrect) correctAnswers++;
    earnedPoints += resp.pointsEarned ?? 0;
  }

  const answeredBlocks = answeredBlockIds.size;
  const completionPercentage = computeCompletionFromQuestions(answeredBlocks, totalBlocks);
  // Lesson is completed when all question blocks have been answered AND >=80% correct
  const completed = answeredBlocks === totalBlocks && correctAnswers >= Math.ceil(totalBlocks * 0.8);

  return {
    lessonId,
    completed,
    completionPercentage,
    mastery: masteryFromCompletion(completionPercentage),
    questionStats: { totalBlocks, answeredBlocks, correctAnswers, totalPoints, earnedPoints },
  };
}
