import { prisma } from "@aratc/database";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { findActiveEnrollment } from "../../lib/program-access";
import { masteryFromCompletion } from "../lessons/service";

// Default mastery gate - used when not configured per program/curriculum
export const DEFAULT_GATE = 95;

/**
 * Get mastery gate for a program. Reads from Program.metadata.requireMasteryToUnlock
 * or falls back to DEFAULT_GATE.
 */
export async function getMasteryGate(programId: string | null | undefined): Promise<number> {
  if (!programId) return DEFAULT_GATE;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { metadata: true },
  });

  if (program?.metadata && typeof program.metadata === "object") {
    const meta = program.metadata as Record<string, unknown>;
    if (typeof meta.requireMasteryToUnlock === "number" && meta.requireMasteryToUnlock > 0) {
      return meta.requireMasteryToUnlock;
    }
  }

  return DEFAULT_GATE;
}

async function resolveProgramId(userId: string, programId?: string): Promise<string | null> {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });

  if (programId) return programId;
  if (learner?.currentProgramId) return learner.currentProgramId;

  if (learner) {
    // CS#9: prefer an active, unexpired enrollment (program-access policy).
    const enrollment = await findActiveEnrollment(learner.id);
    if (enrollment) return enrollment.programId;
  }

  // Fallback so the ladder shows something meaningful in demos.
  const published = await prisma.program.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
  });
  return published?.id ?? null;
}

/**
 * Assembles the learner's College Readiness ladder for a program:
 *   program -> curriculums (grades) -> subjects -> topics
 * with mastery computed from the learner's Progress rows, plus a grade-level
 * unlock gate (a grade unlocks when the previous grade is fully mastered).
 */
export async function getProgression(userId: string, programId?: string) {
  const progId = await resolveProgramId(userId, programId);
  const gate = await getMasteryGate(progId);
  if (!progId) return { program: null, gate, grades: [] };

  const program = await prisma.program.findUnique({
    where: { id: progId },
    include: {
      curriculums: {
        orderBy: [{ gradeLevel: "asc" }, { orderIndex: "asc" }],
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
            include: {
              subject: {
                include: {
                  modules: { include: { topics: { select: { id: true, name: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!program) return { program: null, gate, grades: [] };

  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  const progressRows = learner
    ? await prisma.progress.findMany({
        where: { learnerId: learner.id, lessonId: null, topicId: { not: null } },
        select: { topicId: true, completionPercentage: true, mastery: true },
      })
    : [];
  const byTopic = new Map(progressRows.map((p) => [p.topicId as string, p]));

  let prevMastered = true; // first grade is always unlocked

  const grades = program.curriculums.map((cur) => {
    const subjects = cur.items.map((item) => {
      const topics = item.subject.modules.flatMap((m) => m.topics);
      const topicViews = topics.map((t) => {
        const pr = byTopic.get(t.id);
        return {
          id: t.id,
          name: t.name,
          percent: Math.round(pr?.completionPercentage ?? 0),
          mastery: pr?.mastery ?? "NOT_STARTED",
          tracked: byTopic.has(t.id),
        };
      });
      const percent =
        topics.length > 0
          ? Math.round(topicViews.reduce((s, t) => s + t.percent, 0) / topics.length)
          : 0;
      const tracked = topicViews.filter((t) => t.tracked);
      const mastered =
        topics.length > 0 && tracked.length === topics.length && tracked.every((t) => t.mastery === "MASTERED");
      return {
        id: item.subject.id,
        name: item.customName || item.subject.name,
        percent,
        mastered,
        topicCount: topics.length,
        topics: topicViews,
      };
    });

    const percent =
      subjects.length > 0 ? Math.round(subjects.reduce((s, x) => s + x.percent, 0) / subjects.length) : 0;
    const mastered = subjects.length > 0 && subjects.every((s) => s.mastered);
    const unlocked = prevMastered;
    prevMastered = mastered; // the next grade unlocks only when this one is mastered

    return {
      curriculumId: cur.id,
      name: cur.name,
      gradeLevel: cur.gradeLevel,
      stage: cur.stage,
      percent,
      mastered,
      unlocked,
      subjects,
    };
  });

  return { program: { id: program.id, name: program.name }, gate, grades };
}

/**
 * CS#23.5 — deterministic program completion for a learner.
 *
 * Lesson-weighted rollup computed directly from real rows (no fabricated
 * percentages — see docs/analysis-cs235-progression-rollup.md):
 *   1. Published scope: PUBLISHED curriculum → items → subjects → modules →
 *      topics → lessons for the program.
 *   2. completedLessons = learner's Progress rows for those lesson ids with
 *      completionPercentage = 100.
 *   3. completionPercentage = round(completed / total * 100) → mastery band.
 *
 * Enrollment-gated (same scope as every learner read): non-enrolled,
 * expired-enrollment, and unpublished-program callers get 404 (resource hiding).
 */
export async function getProgramCompletion(userId: string, programId: string) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) throw new NotFoundError("Program not found");

  const enrollment = await findActiveEnrollment(learner.id, programId);
  if (!enrollment) throw new NotFoundError("Program not found");

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      curriculums: {
        where: { status: "PUBLISHED" },
        include: {
          items: {
            include: {
              subject: {
                include: {
                  modules: {
                    where: { status: "PUBLISHED" },
                    include: {
                      topics: {
                        where: { status: "PUBLISHED" },
                        include: {
                          lessons: {
                            where: { status: "PUBLISHED" },
                            select: { id: true },
                          },
                        },
                      },
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
  if (!program || program.status !== "PUBLISHED") throw new NotFoundError("Program not found");

  // Flatten to per-subject lesson id lists (subjectName = customName || name).
  const subjects = program.curriculums.flatMap((cur) =>
    cur.items.map((item) => ({
      subjectId: item.subject.id,
      name: item.customName || item.subject.name,
      lessonIds: item.subject.modules.flatMap((mod) =>
        mod.topics.flatMap((topic) => topic.lessons.map((l) => l.id))
      ),
    }))
  );
  const totalLessons = subjects.reduce((sum, s) => sum + s.lessonIds.length, 0);
  const allLessonIds = subjects.flatMap((s) => s.lessonIds);

  let completedSet = new Set<string>();
  if (allLessonIds.length > 0) {
    const rows = await prisma.progress.findMany({
      where: {
        learnerId: learner.id,
        lessonId: { in: allLessonIds },
        completionPercentage: 100,
      },
      select: { lessonId: true },
    });
    completedSet = new Set(rows.map((r) => r.lessonId as string));
  }

  const completedLessons = completedSet.size;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const subjectStats = subjects.map((s) => {
    const done = s.lessonIds.filter((id) => completedSet.has(id)).length;
    return {
      subjectId: s.subjectId,
      name: s.name,
      totalLessons: s.lessonIds.length,
      completedLessons: done,
      completionPercentage:
        s.lessonIds.length > 0 ? Math.round((done / s.lessonIds.length) * 100) : 0,
    };
  });

  return {
    program: { id: program.id, name: program.name },
    totalLessons,
    completedLessons,
    completionPercentage,
    mastery: masteryFromCompletion(completionPercentage),
    subjects: subjectStats,
  };
}

/** Map of curriculumId -> unlocked, for the learner's ladder in a program. */
export async function getCurriculumUnlockMap(
  userId: string,
  programId?: string
): Promise<Record<string, boolean>> {
  const prog = await getProgression(userId, programId);
  const map: Record<string, boolean> = {};
  for (const g of prog.grades) map[g.curriculumId] = g.unlocked;
  return map;
}

/**
 * Get a chronological activity feed for a learner.
 * Combines assessment attempts and topic progress updates.
 */
export async function getLearnerActivity(userId: string, limit = 20) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) return { activities: [] };

  const activities: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    percent?: number;
    link?: string;
  }[] = [];

  // Assessment attempts (completed)
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { learnerId: learner.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      completedAt: true,
      createdAt: true,
      score: true,
      maxScore: true,
      percentage: true,
      assessment: { select: { name: true, id: true } },
    },
  });

  for (const a of attempts) {
    activities.push({
      id: `attempt-${a.id}`,
      type: "ASSESSMENT",
      title: `Completed ${a.assessment.name}`,
      description: `${a.score ?? 0} of ${a.maxScore} correct`,
      timestamp: a.completedAt ?? a.createdAt,
      percent: a.percentage ?? undefined,
      link: `/dashboard/assessments/${a.assessment.id}/review?attemptId=${a.id}`,
    });
  }

  // Topic progress updates (only ones with activity) — query separately
  // because Progress is sharded across topic/lesson/subject rows without a single relation.
  const topicProgress = await prisma.progress.findMany({
    where: {
      learnerId: learner.id,
      completionPercentage: { gt: 0 },
      topicId: { not: null },
    },
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    include: { topic: true },
  });

  const lessonProgress = await prisma.progress.findMany({
    where: {
      learnerId: learner.id,
      completionPercentage: { gt: 0 },
      lessonId: { not: null },
    },
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    include: { lesson: true },
  });

  for (const p of lessonProgress) {
    const pp = p as any;
    const pct = pp.completionPercentage ?? 0;
    activities.push({
      id: `progress-${pp.id}`,
      type: "PROGRESS",
      title: `Studied ${pp.lesson?.title || "Lesson"}`,
      description: `${Math.round(pct)}% complete`,
      timestamp: pp.lastActivityAt,
      percent: pct,
      link: pp.lesson?.id ? `/dashboard/lessons/${pp.lesson.id}` : undefined,
    });
  }

  for (const p of topicProgress) {
    const pt = p as any;
    const pct = pt.completionPercentage ?? 0;
    activities.push({
      id: `progress-${pt.id}`,
      type: "PROGRESS",
      title: `Progressed in ${pt.topic?.name || "Topic"}`,
      description: `${Math.round(pct)}% complete`,
      timestamp: pt.lastActivityAt,
      percent: pct,
      link: undefined,
    });
  }

  // Merge, sort by timestamp descending, and slice
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return { activities: activities.slice(0, limit) };
}

/**
 * Enforces the progression gate: if an assessment's topics belong to a level
 * (curriculum) in the learner's ladder and none of those levels are unlocked,
 * block it. Ungated assessments (no topic→curriculum mapping) are always allowed.
 */
export async function assertAssessmentUnlocked(
  userId: string,
  assessment: { topicIds?: string[] | null; programId?: string | null }
): Promise<void> {
  const topicIds = (assessment.topicIds ?? []).filter(Boolean);
  if (topicIds.length === 0) return;

  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds } },
    include: { module: { select: { subjectId: true } } },
  });
  const subjectIds = [...new Set(topics.map((t) => t.module?.subjectId).filter(Boolean) as string[])];
  if (subjectIds.length === 0) return;

  const items = await prisma.curriculumItem.findMany({
    where: { subjectId: { in: subjectIds } },
    select: { curriculumId: true },
  });
  const curriculumIds = [...new Set(items.map((i) => i.curriculumId))];
  if (curriculumIds.length === 0) return;

  const unlockMap = await getCurriculumUnlockMap(userId, assessment.programId ?? undefined);
  const known = curriculumIds.filter((cid) => cid in unlockMap);
  if (known.length === 0) return; // not part of this ladder → ungated

  const anyUnlocked = known.some((cid) => unlockMap[cid]);
  if (!anyUnlocked) {
    throw new ForbiddenError("This level is locked. Master the previous level to unlock it.");
  }
}
