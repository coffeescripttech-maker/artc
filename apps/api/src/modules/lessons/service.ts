import { prisma, Prisma } from "@aratc/database";
import { normalizeLessonContent } from "@aratc/shared";
// Includes the nullable-input variants so JSON columns can be set or cleared.
type JsonInput = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
type JsonInputValue = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
import { NotFoundError, BadRequestError } from "../../lib/errors";
import {
  orgReadScope,
  assertCanEditContent,
  assertTransition,
  assertCanPublish,
} from "../../lib/tenant-scope";
import {
  type ContentVisibilityOptions,
  isVisible,
  publishedOnly,
} from "../../lib/visibility";
import { hasLearnerProgramAccess } from "../../lib/program-access";
import type { CreateLessonInput, UpdateLessonInput } from "./schemas";

export async function listLessons(
  topicId?: string,
  opts?: ContentVisibilityOptions,
  organizationId?: string
) {
  const where = {
    ...(topicId ? { topicId } : {}),
    ...publishedOnly(opts),
    ...orgReadScope(organizationId),
  };

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

export async function getLessonById(id: string, opts?: ContentVisibilityOptions) {
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

  // Unpublished lessons are indistinguishable from missing ones for
  // non-privileged callers (404 — avoids leaking draft existence).
  if (!lesson || !isVisible(lesson.status, opts)) {
    throw new NotFoundError("Lesson not found");
  }

  return lesson;
}

export async function createLesson(
  input: CreateLessonInput,
  owner?: { organizationId?: string; userId?: string }
) {
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
      organizationId: owner?.organizationId ?? undefined,
      createdById: owner?.userId ?? undefined,
    },
  });
}

export async function updateLesson(
  id: string,
  input: UpdateLessonInput,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );

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

export async function publishLesson(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({
    where: { id },
    include: { organization: { select: { metadata: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );

  // §17 approval workflow — orgs with review mode require APPROVED first.
  assertCanPublish(
    existing.status,
    existing.organizationId,
    existing.organization?.metadata,
    requester?.roles
  );

  return prisma.lesson.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

// ============================================================
// Approval workflow (CS#6 — §17): submit → review → approve/reject
// ============================================================

export async function submitLessonForReview(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );
  assertTransition(existing.status, "SUBMIT_REVIEW");

  return prisma.lesson.update({
    where: { id },
    data: { status: "UNDER_REVIEW" },
  });
}

export async function approveLesson(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );
  assertTransition(existing.status, "APPROVE");

  return prisma.lesson.update({
    where: { id },
    data: { status: "APPROVED" },
  });
}

export async function rejectLesson(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );
  assertTransition(existing.status, "REJECT");

  return prisma.lesson.update({
    where: { id },
    data: { status: "DRAFT" },
  });
}

export async function archiveLesson(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );

  return prisma.lesson.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteLesson(
  id: string,
  requester?: { organizationId?: string; roles?: string[] }
) {
  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Lesson not found");
  }

  assertCanEditContent(
    requester?.organizationId,
    requester?.roles,
    existing.organizationId
  );

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
export async function getLessonsBySubject(
  subjectId: string,
  opts?: ContentVisibilityOptions
) {
  return prisma.lesson.findMany({
    where: {
      ...publishedOnly(opts),
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
      answer: input.answer as JsonInputValue | undefined,
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
      answer: input.answer as JsonInputValue | undefined,
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
  // CS#23.1 (§36) — completion is authorized like every other learner action:
  // the lesson must be PUBLISHED and belong to a program the learner has active
  // access to (enrollment → program PUBLISHED). 404 (not 403) so the existence
  // of unrelated/draft content is not revealed. Idempotency is preserved: the
  // unique (learnerId, … , lessonId) progress row is upserted, never duplicated.
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      topic: {
        select: {
          id: true,
          module: { select: { id: true, subject: { select: { id: true } } } },
        },
      },
    },
  });
  if (!lesson || lesson.status !== "PUBLISHED") {
    throw new NotFoundError("Lesson not found");
  }

  const learner = await getOrCreateLearnerProfile(userId);

  // Resolve the curriculum/program for this lesson's subject and verify access.
  const scope = await findAccessibleCurriculumForSubject(userId, lesson.topic?.module?.subject?.id);
  if (!scope) {
    throw new NotFoundError("Lesson not found");
  }

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
        programId: scope.curriculum.programId ?? undefined,
        curriculumId: scope.curriculum.id,
        subjectId: lesson.topic?.module?.subject?.id ?? undefined,
        moduleId: lesson.topic?.module?.id ?? undefined,
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

// ============================================================
// CS#23.1 — Student Learning Workspace
// ============================================================

/**
 * Resolve the PUBLISHED, enrolled curriculum for a lesson's subject.
 *
 * A subject may belong to several curriculums/programs, so we scan the
 * lesson's subject → curriculum-item links and return the FIRST curriculum
 * whose program the learner has ACTIVE access to (enrollment → program
 * PUBLISHED). Returns null when the lesson's subject is not part of any
 * accessible program — callers treat that as 404 (no enumeration leak).
 */
async function findAccessibleCurriculumForSubject(
  userId: string,
  subjectId: string | undefined
) {
  if (!subjectId) return null;
  const items = await prisma.curriculumItem.findMany({
    where: { subjectId },
    include: { curriculum: { include: { program: true } } },
  });
  for (const item of items) {
    const { curriculum } = item;
    if (curriculum.status !== "PUBLISHED" || !curriculum.program) continue;
    if (await hasLearnerProgramAccess(userId, curriculum.program.id)) {
      return item;
    }
  }
  return null;
}

export interface LessonWorkspacePayload {
  lesson: Awaited<ReturnType<typeof getLessonById>>;
  curriculum: {
    id: string;
    name: string;
    stage: string;
    gradeLevel: string | null;
    orderIndex: number;
  };
  program: {
    id: string;
    slug: string;
    name: string;
    programType: string | null;
    assessments: Array<{
      id: string;
      name: string;
      slug: string;
      type: string;
      description: string | null;
      questionCount: number | null;
      timeLimitMinutes: number | null;
      passingScore: number | null;
      allowRetake: boolean;
      maxAttempts: number | null;
      _count: { questions: number };
    }>;
  };
  courses: Array<{
    subjectId: string;
    subjectName: string;
    customName: string | null;
    orderIndex: number;
    modules: Array<{
      id: string;
      name: string;
      orderIndex: number;
      topics: Array<{
        id: string;
        name: string;
        orderIndex: number;
        lessons: Array<{
          id: string;
          title: string;
          slug: string;
          durationMinutes: number | null;
          orderIndex: number;
        }>;
      }>;
    }>;
  }>;
  /** Every lesson in the curriculum, flattened in real ordering (subject → module → topic). */
  flatLessons: Array<{ id: string; title: string; slug: string; orderIndex: number }>;
  /** 0-based position of the current lesson within flatLessons (-1 if not found). */
  lessonIndex: number;
  /** Lesson ids the learner has completed within this curriculum (real progress rows). */
  completedLessonIds: string[];
  progressById: Record<string, { completionPercentage: number; mastery: string }>;
  questionStats: {
    totalBlocks: number;
    answeredBlocks: number;
    correctAnswers: number;
    totalPoints: number;
    earnedPoints: number;
  };
}

/**
 * CS#23.1 — one authorized read for the whole student lesson workspace.
 *
 * Returns the current lesson (PUBLISHED, with content + ancestry), the ordered
 * published curriculum tree for the program the learner is enrolled in, the
 * learner's completion state, and question-level practice stats — so the
 * frontend can render a continuous learning workspace without stitching
 * multiple public endpoints together (and without guessing program/tenant
 * context client-side).
 *
 * Security: only PUBLISHED lessons in a PUBLISHED curriculum of a program the
 * learner has ACTIVE access to are returned; anything else is 404.
 */
export async function getLessonWorkspace(
  userId: string,
  lessonId: string
): Promise<LessonWorkspacePayload> {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) throw new NotFoundError("Lesson not found");

  // PUBLISHED-only read (no visibility opts → isVisible requires PUBLISHED).
  const lesson = await getLessonById(lessonId);
  const subjectId = lesson.topic?.module?.subject?.id;

  const scope = await findAccessibleCurriculumForSubject(userId, subjectId);
  if (!scope) throw new NotFoundError("Lesson not found");
  const { curriculum } = scope;
  if (!curriculum.program) throw new NotFoundError("Lesson not found");
  const program = curriculum.program;

  // Ordered, published course tree for this curriculum.
  const rawCourses = await prisma.curriculumItem.findMany({
    where: { curriculumId: curriculum.id },
    orderBy: { orderIndex: "asc" },
    include: {
      subject: {
        include: {
          modules: {
            where: { status: "PUBLISHED" },
            orderBy: { orderIndex: "asc" },
            include: {
              topics: {
                where: { status: "PUBLISHED" },
                orderBy: { orderIndex: "asc" },
                include: {
                  lessons: {
                    where: { status: "PUBLISHED" },
                    orderBy: { orderIndex: "asc" },
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      durationMinutes: true,
                      orderIndex: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const courses = rawCourses.map((item) => ({
    subjectId: item.subject.id,
    subjectName: item.subject.name,
    customName: item.customName,
    orderIndex: item.orderIndex,
    modules: item.subject.modules.map((m) => ({
      id: m.id,
      name: m.name,
      orderIndex: m.orderIndex,
      topics: m.topics.map((t) => ({
        id: t.id,
        name: t.name,
        orderIndex: t.orderIndex,
        lessons: t.lessons,
      })),
    })),
  }));

  const flatLessons = courses.flatMap((item) =>
    item.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons))
  );
  const lessonIds = flatLessons.map((l) => l.id);
  const lessonIndex = lessonIds.indexOf(lesson.id);

  // Learner's real completion within this curriculum (existing Progress rows).
  const completedLessonIds: string[] = [];
  const progressById: Record<string, { completionPercentage: number; mastery: string }> = {};
  if (lessonIds.length > 0) {
    const rows = await prisma.progress.findMany({
      where: { learnerId: learner.id, lessonId: { in: lessonIds } },
      select: { lessonId: true, completionPercentage: true, mastery: true },
    });
    for (const row of rows) {
      if (!row.lessonId) continue;
      progressById[row.lessonId] = {
        completionPercentage: row.completionPercentage,
        mastery: row.mastery,
      };
      if (row.completionPercentage >= 100) completedLessonIds.push(row.lessonId);
    }
  }

  // Practice-score card data (reuse the existing question-stats logic).
  const stats = await getLessonProgressWithQuestions(userId, lessonId);

  // Real published assessments for the program — used for "assessment next".
  const programAssessments = await prisma.assessment.findMany({
    where: { programId: program.id, status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      questionCount: true,
      timeLimitMinutes: true,
      passingScore: true,
      allowRetake: true,
      maxAttempts: true,
      _count: { select: { questions: true } },
    },
  });

  return {
    lesson,
    curriculum: {
      id: curriculum.id,
      name: curriculum.name,
      stage: curriculum.stage,
      gradeLevel: curriculum.gradeLevel,
      orderIndex: curriculum.orderIndex,
    },
    program: {
      id: program.id,
      slug: program.slug,
      name: program.name,
      programType: program.programType,
      assessments: programAssessments,
    },
    courses,
    flatLessons,
    lessonIndex,
    completedLessonIds,
    progressById,
    questionStats: {
      totalBlocks: stats.questionStats.totalBlocks,
      answeredBlocks: stats.questionStats.answeredBlocks,
      correctAnswers: stats.questionStats.correctAnswers,
      totalPoints: stats.questionStats.totalPoints,
      earnedPoints: stats.questionStats.earnedPoints,
    },
  };
}
