import { prisma } from "@aratc/database";
import { createAssessmentSchema } from "./schemas";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type { CreateAssessmentInput, UpdateAssessmentInput, AddQuestionInput, AutoGenerateInput } from "./schemas";
import { gradeAnswer, getOptions, shuffle, seededShuffle, randomChoiceSeed } from "./grading";
import { assertAssessmentUnlocked } from "../progression/service";

export async function listAssessments(filters?: {
  programId?: string;
  type?: string;
  status?: string;
}) {
  const where: any = {};

  if (filters?.programId) {
    where.programId = filters.programId;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.assessment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
  });
}

export async function getAssessmentById(id: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          question: {
            select: {
              id: true,
              type: true,
              difficulty: true,
              stem: true,
              options: true,
            },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  return assessment;
}

export async function getAssessmentBySlug(slug: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { slug },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      questions: {
        where: { assessment: { status: "PUBLISHED" } }, // Only show questions for published assessments
        orderBy: { orderIndex: "asc" },
        include: {
          question: {
            select: {
              id: true,
              type: true,
              stem: true,
              options: true,
              explanation: true,
              hint: true,
            },
          },
        },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  return assessment;
}

export async function createAssessment(input: CreateAssessmentInput) {
  return prisma.assessment.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type,
      topicIds: input.topicIds ?? [],
      difficultyLevels: input.difficultyLevels ?? [],
      questionTags: input.questionTags ?? [],
      questionCount: input.questionCount,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      masteryThreshold: input.masteryThreshold,
      randomizeQuestions: input.randomizeQuestions,
      randomizeChoices: input.randomizeChoices,
      showExplanations: input.showExplanations,
      allowRetake: input.allowRetake,
      maxAttempts: input.maxAttempts ?? 1,
      scoringConfig: input.scoringConfig ? JSON.stringify(input.scoringConfig) : undefined,
      programId: input.programId,
      status: "DRAFT",
    },
  });
}

export async function updateAssessment(id: string, input: UpdateAssessmentInput) {
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Assessment not found");
  }

  return prisma.assessment.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type,
      topicIds: input.topicIds,
      difficultyLevels: input.difficultyLevels,
      questionTags: input.questionTags,
      questionCount: input.questionCount,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      masteryThreshold: input.masteryThreshold,
      randomizeQuestions: input.randomizeQuestions,
      randomizeChoices: input.randomizeChoices,
      showExplanations: input.showExplanations,
      allowRetake: input.allowRetake,
      maxAttempts: input.maxAttempts,
      scoringConfig: input.scoringConfig ? JSON.stringify(input.scoringConfig) : undefined,
      programId: input.programId,
    },
  });
}

export async function publishAssessment(id: string) {
  const existing = await prisma.assessment.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Assessment not found");
  }

  const hasPool =
    !!existing.questionCount &&
    ((existing.topicIds?.length ?? 0) > 0 ||
      (existing.questionTags?.length ?? 0) > 0 ||
      (existing.difficultyLevels?.length ?? 0) > 0);
  if (existing._count.questions === 0 && !hasPool) {
    throw new BadRequestError(
      "Cannot publish: add questions, or set a question pool (topics/tags + question count)."
    );
  }

  return prisma.assessment.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveAssessment(id: string) {
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Assessment not found");
  }

  return prisma.assessment.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteAssessment(id: string) {
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Assessment not found");
  }

  return prisma.assessment.delete({ where: { id } });
}

// Questions management
export async function addQuestion(assessmentId: string, input: AddQuestionInput) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  const question = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!question) {
    throw new NotFoundError("Question not found");
  }

  // Check if already added
  const existing = await prisma.assessmentQuestion.findFirst({
    where: { assessmentId, questionId: input.questionId },
  });
  if (existing) {
    throw new BadRequestError("Question is already in this assessment");
  }

  // Get max orderIndex if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const maxQ = await prisma.assessmentQuestion.findFirst({
      where: { assessmentId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (maxQ?.orderIndex ?? -1) + 1;
  }

  return prisma.assessmentQuestion.create({
    data: {
      assessmentId,
      questionId: input.questionId,
      orderIndex,
      score: input.score,
    },
    include: {
      question: {
        select: {
          id: true,
          type: true,
          difficulty: true,
          stem: true,
        },
      },
    },
  });
}

export async function removeQuestion(assessmentId: string, questionId: string) {
  const link = await prisma.assessmentQuestion.findFirst({
    where: { assessmentId, questionId },
  });
  if (!link) {
    throw new NotFoundError("Question not found in this assessment");
  }

  return prisma.assessmentQuestion.delete({
    where: { id: link.id },
  });
}

export async function reorderQuestions(assessmentId: string, questionIds: string[]) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  // Verify all questions belong to this assessment
  const links = await prisma.assessmentQuestion.findMany({
    where: { assessmentId, questionId: { in: questionIds } },
  });

  if (links.length !== questionIds.length) {
    throw new BadRequestError("Some questions don't belong to this assessment");
  }

  // Update order
  await prisma.$transaction(
    questionIds.map((id, index) =>
      prisma.assessmentQuestion.update({
        where: { assessmentId_questionId: { assessmentId, questionId: id } },
        data: { orderIndex: index },
      })
    )
  );

  return prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    orderBy: { orderIndex: "asc" },
    include: { question: { select: { id: true, stem: true, type: true } } },
  });
}

// Auto-generate questions
export async function autoGenerateQuestions(assessmentId: string, input: AutoGenerateInput) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  // Build question query - include all non-archived questions for flexibility
  const where: any = {
    status: { in: ["PUBLISHED", "UNDER_REVIEW", "DRAFT"] },
  };

  // If topicIds provided, filter by those topics via bankLinks
  if (input.topicIds && input.topicIds.length > 0) {
    where.OR = [
      // Questions linked to selected topics
      { bankLinks: { some: { topicId: { in: input.topicIds } } } },
      // OR questions with NO topic links (universal questions)
      { bankLinks: { none: {} } },
    ];
  }
  if (input.difficultyLevels && input.difficultyLevels.length > 0) {
    where.difficulty = { in: input.difficultyLevels };
  }
  if (input.questionTags && input.questionTags.length > 0) {
    where.tags = { hasSome: input.questionTags };
  }

  // Get ALL matching questions then shuffle and slice
  const pool = await prisma.question.findMany({ where });
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, input.questionCount);

  // Get existing question IDs in this assessment
  const existingLinks = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    select: { questionId: true },
  });
  const existingQuestionIds = new Set(existingLinks.map((l) => l.questionId));

  // Filter out questions that are already in the assessment
  const newQuestions = selected.filter((q) => !existingQuestionIds.has(q.id));

  if (newQuestions.length === 0) {
    return [];
  }

  // Get max orderIndex
  const maxOrder = await prisma.assessmentQuestion.findFirst({
    where: { assessmentId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });
  const startIndex = (maxOrder?.orderIndex ?? -1) + 1;

  // Add questions to assessment
  const addedQuestions = await prisma.$transaction(
    newQuestions.map((q, i) =>
      prisma.assessmentQuestion.create({
        data: {
          assessmentId,
          questionId: q.id,
          orderIndex: startIndex + i,
          score: 1,
        },
        include: {
          question: { select: { id: true, stem: true, type: true } },
        },
      })
    )
  );

  return addedQuestions;
}

// Learner attempts
async function getOrCreateLearnerProfile(userId: string) {
  const existing = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.learnerProfile.create({ data: { userId } });
}

/**
 * CS#19 — deterministic per-attempt randomization (roadmap §26).
 * Reconstructs full question rows in the EXACT order persisted on the attempt.
 * Prisma `in: [...]` does not preserve array order, so reorder in app code.
 */
async function reconstructOrderedQuestions(servedQuestionIds: string[]) {
  if (servedQuestionIds.length === 0) return [];
  const rows = await prisma.question.findMany({
    where: { id: { in: servedQuestionIds } },
  });
  const byId = new Map(rows.map((q) => [q.id, q]));
  return servedQuestionIds
    .map((id) => byId.get(id))
    .filter((q): q is (typeof rows)[number] => Boolean(q));
}

/**
 * Builds the SAFE player payload from served question rows.
 * When `choiceOrderSeed` is provided, choice ordering is derived from that
 * persisted seed so resuming an attempt reproduces the identical order.
 * A null/undefined seed keeps the legacy non-seeded shuffle (fresh draws).
 */
async function buildServedPayload(
  served: any[],
  randomizeChoices: boolean,
  choiceOrderSeed?: number | null
) {
  const questions = served.map((q) => {
    let opts = getOptions(q).map((o) => ({ id: o.id, text: o.text }));
    if (randomizeChoices) {
      opts = choiceOrderSeed == null ? shuffle(opts) : seededShuffle(opts, choiceOrderSeed);
    }
    return {
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      stem: q.stem,
      hint: q.hint,
      options: opts,
      passageId: q.passageId,
    };
  });

  const passageIds = [...new Set(served.map((q) => q.passageId).filter(Boolean) as string[])];
  const passages = passageIds.length > 0
    ? await prisma.passage.findMany({
        where: { id: { in: passageIds } },
        select: { id: true, title: true, content: true },
      })
    : [];

  return { questions, passages };
}

/**
 * Derive the SAFE question set for an assessment.
 * - If the assessment has a question pool (questionCount + topics/tags/difficulty),
 *   draw a fresh random sample from the question bank.
 * - Otherwise use the fixed AssessmentQuestion set.
 * Returns the served raw questions and the SAFE payload for the player.
 * When `choiceOrderSeed` is given (new/legacy-backfilled attempts), choice
 * ordering is deterministic from that seed so it can be replayed on resume.
 */
export async function getServedQuestions(
  assessment: {
    questions: { question: any }[];
    questionCount?: number | null;
    topicIds?: string[] | null;
    questionTags?: string[] | null;
    difficultyLevels?: string[] | null;
    randomizeQuestions?: boolean;
    randomizeChoices?: boolean;
  },
  choiceOrderSeed?: number | null
): Promise<{ questions: any[]; passages: any[]; served: any[] }> {
  const joined = assessment.questions.map((aq) => aq.question);
  let served = joined;
  const declaresPool =
    !!assessment.questionCount &&
    ((assessment.topicIds?.length ?? 0) > 0 ||
      (assessment.questionTags?.length ?? 0) > 0 ||
      (assessment.difficultyLevels?.length ?? 0) > 0);
  // CS#22 — the fixed AssessmentQuestion join set is authoritative when it
  // already satisfies the requested questionCount. A genuine pool assessment
  // (no joins, or fewer joins than requested) still draws a fresh random sample
  // from the question bank. Previously a small fixed-set assessment (e.g. the
  // CRP practice subset) was silently re-drawn from the whole bank when it also
  // declared topicIds — inflating the pool and shrinking its maxScore basis.
  if (declaresPool && joined.length < (assessment.questionCount ?? 0)) {
    const where: any = { status: "PUBLISHED" };
    if (assessment.topicIds?.length) where.bankLinks = { some: { topicId: { in: assessment.topicIds } } };
    if (assessment.difficultyLevels?.length) where.difficulty = { in: assessment.difficultyLevels };
    if (assessment.questionTags?.length) where.tags = { hasSome: assessment.questionTags };
    const pool = await prisma.question.findMany({ where });
    if (pool.length > 0) {
      served = shuffle(pool).slice(0, assessment.questionCount!);
    }
  }
  if (assessment.randomizeQuestions) served = shuffle(served);

  const { questions, passages } = await buildServedPayload(
    served,
    assessment.randomizeChoices === true,
    choiceOrderSeed
  );

  return { questions, passages, served };
}

export async function startAttempt(assessmentId: string, userId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { question: true },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }
  if (assessment.status !== "PUBLISHED") {
    throw new BadRequestError("Assessment is not published");
  }

  const learner = await getOrCreateLearnerProfile(userId);

  // Progression gate: block if this assessment's level is locked for the learner.
  await assertAssessmentUnlocked(userId, {
    topicIds: assessment.topicIds,
    programId: assessment.programId,
  });

  // Shared response shape (unchanged API contract — CS#19).
  const attemptPayload = (attempt: any, questions: any[], passages: any[]) => ({
    attempt,
    assessment: {
      id: assessment.id,
      name: assessment.name,
      type: assessment.type,
      timeLimitMinutes: assessment.timeLimitMinutes,
      showExplanations: assessment.showExplanations,
      passingScore: assessment.passingScore,
      masteryThreshold: assessment.masteryThreshold,
      allowRetake: assessment.allowRetake,
      scoringConfig: assessment.scoringConfig,
    },
    questions,
    passages,
  });

  // Resume in-progress attempt if one exists
  const inProgress = await prisma.assessmentAttempt.findFirst({
    where: { assessmentId, learnerId: learner.id, status: "IN_PROGRESS" },
    orderBy: { createdAt: "desc" },
  });
  if (inProgress) {
    // CS#19 — the database is the source of truth for this attempt's served
    // set. Never re-draw or reshuffle an attempt that has a persisted set.
    if (inProgress.servedQuestionIds.length > 0) {
      const served = await reconstructOrderedQuestions(inProgress.servedQuestionIds);
      const { questions, passages } = await buildServedPayload(
        served,
        assessment.randomizeChoices,
        inProgress.choiceOrderSeed
      );
      return attemptPayload(inProgress, questions, passages);
    }

    // Legacy attempt (created before CS#19): draw once, persist immediately so
    // every subsequent resume is deterministic (roadmap §26 backfill rule).
    const choiceOrderSeed = randomChoiceSeed();
    const { questions, passages, served } = await getServedQuestions(assessment, choiceOrderSeed);
    const servedQuestionIds = served.map((q) => q.id);
    // Guarded write: only backfill if no concurrent resume claimed it first.
    const claimed = await prisma.assessmentAttempt.updateMany({
      where: { id: inProgress.id, servedQuestionIds: { isEmpty: true } },
      data: { servedQuestionIds, choiceOrderSeed },
    });
    if (claimed.count === 0) {
      const winner = await prisma.assessmentAttempt.findUnique({
        where: { id: inProgress.id },
        select: { servedQuestionIds: true, choiceOrderSeed: true },
      });
      if (winner && winner.servedQuestionIds.length > 0) {
        const reServed = await reconstructOrderedQuestions(winner.servedQuestionIds);
        const payload = await buildServedPayload(
          reServed,
          assessment.randomizeChoices,
          winner.choiceOrderSeed
        );
        return attemptPayload(inProgress, payload.questions, payload.passages);
      }
    }
    return attemptPayload(inProgress, questions, passages);
  }

  const existingAttempts = await prisma.assessmentAttempt.count({
    where: { assessmentId, learnerId: learner.id },
  });
  if (!assessment.allowRetake && assessment.maxAttempts && existingAttempts >= assessment.maxAttempts) {
    throw new BadRequestError("Maximum attempts reached");
  }

  const choiceOrderSeed = randomChoiceSeed();
  const { questions, passages, served } = await getServedQuestions(assessment, choiceOrderSeed);
  const servedQuestionIds = served.map((q) => q.id);

  // Compute maxScore from per-question weights
  const servedIds = new Set(servedQuestionIds);
  let maxScore = 0;
  for (const aq of assessment.questions) {
    if (servedIds.has(aq.question.id)) {
      maxScore += aq.score ?? 1;
    }
  }
  // Fallback if no AssessmentQuestion entries (question pool)
  if (maxScore === 0) maxScore = served.length;

  // Single atomic insert — the served set is persisted together with the
  // attempt itself, so no two requests can disagree about what the attempt
  // contains (CS#19 — roadmap §26).
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      learnerId: learner.id,
      maxScore,
      status: "IN_PROGRESS",
      servedQuestionIds,
      choiceOrderSeed,
    },
  });

  return attemptPayload(attempt, questions, passages);
}

export async function submitAttempt(
  attemptId: string,
  answers: { questionId: string; answer: unknown; timeSpentSeconds?: number }[]
) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true },
  });

  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new BadRequestError("Attempt already completed");
  }

  // CS#19 — grade strictly against the persisted served set when available,
  // so "questions shown" always equals "questions graded" (roadmap §26).
  const servedIds =
    attempt.servedQuestionIds.length > 0
      ? new Set<string>(attempt.servedQuestionIds)
      : null;

  // Load per-question weights from AssessmentQuestion and scoringConfig
  const assessmentQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId: attempt.assessmentId },
    select: { questionId: true, score: true },
  });
  const questionWeights = new Map(assessmentQuestions.map((aq) => [aq.questionId, aq.score]));

  // Parse scoringConfig for potential weight overrides
  let scoringConfig: Record<string, unknown> = {};
  if (attempt.assessment.scoringConfig) {
    scoringConfig = typeof attempt.assessment.scoringConfig === "string"
      ? JSON.parse(attempt.assessment.scoringConfig)
      : (attempt.assessment.scoringConfig as Record<string, unknown>);
  }
  const configWeights = (scoringConfig.questionWeights as Record<string, number> | undefined) ?? {};

  let score = 0;
  let maxPossible = 0;
  const ops: any[] = [];

  for (const { questionId, answer, timeSpentSeconds } of answers) {
    if (servedIds && !servedIds.has(questionId)) continue; // CS#19 — not served to this attempt
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) continue;

    const result = gradeAnswer(question, answer); // true | false | null (manual)
    // Weighted score: config override → AssessmentQuestion score → default 1
    const weight = configWeights[questionId] ?? questionWeights.get(questionId) ?? 1;
    const points = result === true ? weight : 0;
    score += points;
    maxPossible += weight;

    ops.push(
      prisma.attemptAnswer.create({
        data: {
          attemptId,
          questionId,
          answer: (answer ?? null) as any, // store the raw answer object (no double-encoding)
          isCorrect: result,
          score: points,
          timeSpentSeconds: timeSpentSeconds ?? null,
        },
      })
    );
  }

  await prisma.$transaction(ops);

  // Track question exposure for anti-memorization (non-blocking)
  const questionIds = answers.map((a) => a.questionId).filter(Boolean);
  trackQuestionExposure(attempt.learnerId, questionIds).catch((err) => {
    console.error("Failed to track question exposure:", err);
  });

  // CS#19 — percentage is measured against the attempt's persisted maxScore
  // (computed from the served set at start), not just the submitted answers,
  // so unanswered served questions count toward the result basis.
  const denominator = attempt.maxScore > 0 ? attempt.maxScore : maxPossible;
  const percentage = denominator > 0 ? (score / denominator) * 100 : 0;

  // Calculate total time spent on this attempt
  const totalTimeSpent = answers.reduce((sum, a) => sum + (a.timeSpentSeconds ?? 0), 0);
  const completedAt = new Date();
  const startedAtTime = attempt.startedAt.getTime();
  const totalElapsedSeconds = Math.round((completedAt.getTime() - startedAtTime) / 1000);

  const completed = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      completedAt,
      score: score,
      percentage,
      timeSpentSeconds: totalElapsedSeconds,
    },
    include: {
      answers: {
        include: {
          question: { select: { id: true, stem: true, explanation: true, type: true } },
        },
      },
    },
  });

  // Phase 2 — persist mastery to Progress for each topic this assessment targets.
  const gate = attempt.assessment.masteryThreshold ?? attempt.assessment.passingScore ?? 75;
  const topicIds = ((attempt.assessment.topicIds as string[]) ?? []).filter(Boolean);

  for (const topicId of topicIds) {
    const existing = await prisma.progress.findFirst({
      where: { learnerId: attempt.learnerId, topicId, lessonId: null },
    });
    const best = Math.max(existing?.completionPercentage ?? 0, percentage);
    const mastery = (best >= gate ? "MASTERED" : percentage >= 70 ? "PRACTICING" : "LEARNING") as any;
    if (existing) {
      await prisma.progress.update({
        where: { id: existing.id },
        data: {
          completionPercentage: best,
          averageScore: percentage,
          mastery,
          attemptsCount: existing.attemptsCount + 1,
          lastActivityAt: new Date(),
        },
      });
    } else {
      await prisma.progress.create({
        data: {
          learnerId: attempt.learnerId,
          topicId,
          completionPercentage: percentage,
          averageScore: percentage,
          mastery,
          attemptsCount: 1,
        },
      });
    }
  }

  // Phase 2 — roll up mastery to subject and program level
  await rollupMastery(attempt.learnerId, attempt.assessment.programId, topicIds, gate);

  return completed;
}

/**
 * Roll up topic-level mastery to subject and program level.
 * Subject mastery = average of all topic masteries in that subject.
 * Program mastery = average of all subject masteries in that program.
 */
async function rollupMastery(
  learnerId: string,
  programId: string | null | undefined,
  topicIds: string[],
  gate: number
) {
  if (!topicIds.length) return;

  // Get topic → subject → module mapping
  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds } },
    include: {
      module: { include: { subject: true } },
    },
  });

  // Group topic progress by subject
  const subjectIds = [...new Set(topics.map((t) => t.module?.subjectId).filter(Boolean) as string[])];
  const progressRows = await prisma.progress.findMany({
    where: { learnerId, topicId: { in: topicIds } },
  });
  const byTopic = new Map(progressRows.map((p) => [p.topicId as string, p]));

  for (const subjectId of subjectIds) {
    const subjectTopicIds = topics
      .filter((t) => t.module?.subjectId === subjectId)
      .map((t) => t.id);

    const subjectProgress = subjectTopicIds
      .map((tid) => byTopic.get(tid))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    const avgPct =
      subjectProgress.length > 0
        ? subjectProgress.reduce((s, p) => s + p.completionPercentage, 0) / subjectProgress.length
        : 0;
    const mastery =
      avgPct >= gate
        ? "MASTERED"
        : avgPct >= 70
        ? "PRACTICING"
        : avgPct >= 50
        ? "LEARNING"
        : "NOT_STARTED";

    // Upsert via findFirst + update/create: the compound unique on
    // (learnerId, programId, curriculumId, subjectId, moduleId, topicId,
    // lessonId) contains nullable members, and Prisma's runtime rejects
    // null in a unique `where`. Matching the NULL rollup rows with a plain
    // `where` guarantees the same semantics without that validation error.
    const subjectRollupId = (
      await prisma.progress.findFirst({
        where: {
          learnerId,
          programId: programId ?? null,
          curriculumId: null,
          subjectId,
          moduleId: null,
          topicId: null,
          lessonId: null,
        },
        select: { id: true },
      })
    )?.id;

    if (subjectRollupId) {
      await prisma.progress.update({
        where: { id: subjectRollupId },
        data: {
          completionPercentage: avgPct,
          mastery,
          lastActivityAt: new Date(),
        },
      });
    } else {
      await prisma.progress.create({
        data: {
          learnerId,
          programId: programId ?? null,
          subjectId,
          completionPercentage: avgPct,
          mastery,
        },
      });
    }
  }

  // Roll up to program level
  if (programId) {
    const subjectProgressRows = await prisma.progress.findMany({
      where: { learnerId, programId, subjectId: { not: null }, moduleId: null, topicId: null, lessonId: null },
    });

    const avgPct =
      subjectProgressRows.length > 0
        ? subjectProgressRows.reduce((s, p) => s + p.completionPercentage, 0) /
          subjectProgressRows.length
        : 0;
    const mastery =
      avgPct >= gate
        ? "MASTERED"
        : avgPct >= 70
        ? "PRACTICING"
        : avgPct >= 50
        ? "LEARNING"
        : "NOT_STARTED";

    // Same null-safe upsert pattern as the subject rollup above.
    const programRollupId = (
      await prisma.progress.findFirst({
        where: {
          learnerId,
          programId,
          curriculumId: null,
          subjectId: null,
          moduleId: null,
          topicId: null,
          lessonId: null,
        },
        select: { id: true },
      })
    )?.id;

    if (programRollupId) {
      await prisma.progress.update({
        where: { id: programRollupId },
        data: {
          completionPercentage: avgPct,
          mastery,
          lastActivityAt: new Date(),
        },
      });
    } else {
      await prisma.progress.create({
        data: {
          learnerId,
          programId,
          completionPercentage: avgPct,
          mastery,
        },
      });
    }
  }
}

// Stats
export async function getAssessmentStats(id: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        select: {
          status: true,
          score: true,
          maxScore: true,
          percentage: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  const completedAttempts = assessment.attempts.filter((a) => a.status === "COMPLETED");
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / completedAttempts.length
      : 0;

  return {
    totalQuestions: assessment._count.questions,
    totalAttempts: assessment._count.attempts,
    completedAttempts: completedAttempts.length,
    averageScore: Math.round(averageScore * 100) / 100,
    passingRate:
      completedAttempts.length > 0
        ? (completedAttempts.filter((a) => (a.percentage ?? 0) >= (assessment.passingScore ?? 0)).length /
            completedAttempts.length) *
          100
        : 0,
  };
}

/**
 * Get a single assessment attempt with all answers and question details (for review).
 * Only the attempt owner can view.
 */
export async function getAttemptWithAnswers(attemptId: string, userId: string) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) return null;

  return prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, learnerId: learner.id },
    include: {
      assessment: {
        select: {
          id: true,
          name: true,
          type: true,
          timeLimitMinutes: true,
          passingScore: true,
          masteryThreshold: true,
          showExplanations: true,
          allowRetake: true,
          maxAttempts: true,
        },
      },
      answers: {
        orderBy: { questionId: "asc" }, // preserve some order; frontend can reorder
        include: {
          question: {
            select: {
              id: true,
              type: true,
              stem: true,
              difficulty: true,
              options: true,
              correctAnswer: true,
              explanation: true,
              hint: true,
            },
          },
        },
      },
    },
  });
}

// A learner's own attempts (for "my assessments" list + progress).
export async function getMyAttempts(userId: string) {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) return [];
  return prisma.assessmentAttempt.findMany({
    where: { learnerId: learner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      assessmentId: true,
      status: true,
      percentage: true,
      score: true,
      maxScore: true,
      completedAt: true,
      startedAt: true,
      assessment: {
        select: {
          id: true,
          name: true,
          type: true,
          passingScore: true,
          masteryThreshold: true,
        },
      },
    },
  });
}

// ============================================================
// RETRY ENGINE / ANTI-MEMORIZATION (Phase 3)
// ============================================================

/**
 * Track which questions a learner has seen (for anti-memorization).
 * Called after submitAttempt to record exposure.
 */
export async function trackQuestionExposure(learnerId: string, questionIds: string[]) {
  await Promise.all(
    questionIds.map((questionId) =>
      prisma.questionExposure.upsert({
        where: {
          questionId_learnerId: {
            questionId,
            learnerId,
          },
        },
        update: {
          seenCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
        create: {
          questionId,
          learnerId,
          seenCount: 1,
        },
      })
    )
  );
}

/**
 * Get questions a learner has already seen (for exclusion from retakes).
 */
export async function getSeenQuestionIds(learnerId: string): Promise<string[]> {
  const exposures = await prisma.questionExposure.findMany({
    where: { learnerId },
    select: { questionId: true },
  });
  return exposures.map((e) => e.questionId);
}

/**
 * Get questions a learner has seen with their performance.
 * Useful for analytics and targeting weak areas.
 */
export async function getLearnerQuestionHistory(learnerId: string, options?: {
  limit?: number;
  onlyIncorrect?: boolean;
}) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { learnerId, status: "COMPLETED" },
    select: { id: true },
  });
  const attemptIds = attempts.map((a) => a.id);

  const where: any = { attemptId: { in: attemptIds } };
  if (options?.onlyIncorrect) {
    where.isCorrect = false;
  }

  const answers = await prisma.attemptAnswer.findMany({
    where,
    include: {
      question: {
        select: {
          id: true,
          stem: true,
          type: true,
          difficulty: true,
          tags: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });

  return answers;
}

/**
 * Get weak topics for a learner, prioritized by lowest mastery.
 * Used for retry recommendations and targeted practice.
 */
export async function getWeakTopics(learnerId: string, programId?: string) {
  // Get the program to resolve curriculums
  let targetProgramId = programId;
  if (!targetProgramId) {
    const learner = await prisma.learnerProfile.findUnique({ where: { id: learnerId } });
    targetProgramId = learner?.currentProgramId ?? undefined;
  }

  // Get topic IDs from the program curriculum
  let topicIds: string[] = [];
  if (targetProgramId) {
    const curriculums = await prisma.curriculum.findMany({
      where: { programId: targetProgramId },
      include: {
        items: {
          include: {
            subject: {
              include: {
                modules: {
                  include: {
                    topics: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    topicIds = curriculums.flatMap((c) =>
      c.items.flatMap((item) =>
        item.subject.modules.flatMap((m) => m.topics.map((t) => t.id))
      )
    );
  }

  // Get progress for these topics
  const progressWhere: any = {
    learnerId,
    topicId: { not: null },
  };
  if (topicIds.length > 0) {
    progressWhere.topicId = { in: topicIds };
  }

  const weakTopics = await prisma.progress.findMany({
    where: progressWhere,
    include: {
      topic: {
        include: {
          module: {
            include: {
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { completionPercentage: "asc" },
    take: 5,
  });

  // Filter to actually weak topics
  return weakTopics.filter(
    (p) =>
      p.mastery === "LEARNING" ||
      p.mastery === "NOT_STARTED" ||
      (p.completionPercentage !== null && p.completionPercentage < 70)
  );
}

/**
 * Get retry recommendations for an assessment.
 * Returns weak topics, suggestions, and whether retry is allowed.
 */
export async function getRetryRecommendations(learnerId: string, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  // Get learner's attempts on this assessment
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { learnerId, assessmentId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const completedAttempts = attempts.filter((a) => a.status === "COMPLETED");
  const bestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((a) => a.percentage ?? 0))
    : 0;

  const gate = assessment.masteryThreshold ?? assessment.passingScore ?? 75;
  const isMastered = bestScore >= gate;
  const canRetry = assessment.allowRetake && (
    !assessment.maxAttempts || attempts.length < assessment.maxAttempts
  );

  // Get weak topics related to this assessment
  const weakTopics = await getWeakTopics(learnerId, assessment.programId ?? undefined);

  // Generate suggestions based on performance
  const suggestions: string[] = [];
  if (bestScore === 0 && completedAttempts.length === 0) {
    suggestions.push("Start with a diagnostic review of the foundational concepts.");
  } else if (bestScore < 50) {
    suggestions.push("Focus on understanding the core concepts before attempting again.");
    suggestions.push("Review the explanation for each question you missed.");
  } else if (bestScore < gate) {
    suggestions.push("You're close! Focus on the topics where you lost points.");
    suggestions.push("Pay attention to common mistakes and trap answers.");
  } else if (isMastered) {
    suggestions.push("Great job! Move on to more challenging assessments.");
  }

  // Check question exposure
  const seenCount = completedAttempts.reduce((sum, attempt) => {
    return sum + attempt.maxScore;
  }, 0);
  const hasLowExposure = seenCount < 10;

  return {
    assessmentId,
    isMastered,
    bestScore: Math.round(bestScore * 100) / 100,
    gate,
    canRetry,
    attemptsUsed: attempts.length,
    maxAttempts: assessment.maxAttempts,
    weakTopics: weakTopics.slice(0, 3),
    suggestions,
    hasLowExposure,
    message: isMastered
      ? `You've mastered this assessment with ${Math.round(bestScore)}%!`
      : canRetry
      ? `You scored ${Math.round(bestScore)}%. You need ${gate}% to master this. Try again!`
      : `You've reached the maximum attempts for this assessment.`,
  };
}
