import { prisma } from "@aratc/database";
import { createAssessmentSchema } from "./schemas";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type { CreateAssessmentInput, UpdateAssessmentInput, AddQuestionInput, AutoGenerateInput } from "./schemas";

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
      randomizeQuestions: input.randomizeQuestions,
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
      randomizeQuestions: input.randomizeQuestions,
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

  if (existing._count.questions === 0) {
    throw new BadRequestError("Cannot publish an assessment with no questions");
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

  // Build question query
  const where: any = {
    status: "PUBLISHED",
  };

  if (input.topicIds && input.topicIds.length > 0) {
    where.bankLinks = { some: { topicId: { in: input.topicIds } } };
  }
  if (input.difficultyLevels && input.difficultyLevels.length > 0) {
    where.difficulty = { in: input.difficultyLevels };
  }
  if (input.questionTags && input.questionTags.length > 0) {
    where.tags = { hasSome: input.questionTags };
  }

  // Get random questions
  const questions = await prisma.question.findMany({
    where,
    take: input.questionCount,
    orderBy: { id: "asc" }, // Random-ish but consistent for now
  });

  // Add questions to assessment
  const addedQuestions = await prisma.$transaction(
    questions.map((q, index) =>
      prisma.assessmentQuestion.create({
        data: {
          assessmentId,
          questionId: q.id,
          orderIndex: index,
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
export async function startAttempt(assessmentId: string, learnerId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { _count: { select: { questions: true } } },
  });

  if (!assessment) {
    throw new NotFoundError("Assessment not found");
  }

  if (assessment.status !== "PUBLISHED") {
    throw new BadRequestError("Assessment is not published");
  }

  // Check max attempts
  const existingAttempts = await prisma.assessmentAttempt.count({
    where: { assessmentId, learnerId },
  });

  if (assessment.maxAttempts && existingAttempts >= assessment.maxAttempts) {
    throw new BadRequestError("Maximum attempts reached");
  }

  return prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      learnerId,
      maxScore: assessment._count.questions,
      status: "IN_PROGRESS",
    },
  });
}

export async function submitAttempt(attemptId: string, answers: { questionId: string; answer: any }[]) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true, answers: true },
  });

  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new BadRequestError("Attempt already completed");
  }

  // Calculate score
  let correctCount = 0;
  const answerResults = [];

  for (const { questionId, answer } of answers) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) continue;

    const isCorrect = JSON.stringify(answer) === question.correctAnswer;
    if (isCorrect) correctCount++;

    answerResults.push(
      prisma.attemptAnswer.create({
        data: {
          attemptId,
          questionId,
          answer: JSON.stringify(answer),
          isCorrect,
          score: isCorrect ? 1 : 0,
        },
      })
    );
  }

  await prisma.$transaction(answerResults);

  const percentage = attempt.maxScore > 0 ? (correctCount / attempt.maxScore) * 100 : 0;
  const passed = percentage >= (attempt.assessment.passingScore ?? 0);

  return prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      score: correctCount,
      percentage,
    },
    include: {
      answers: { include: { question: { select: { id: true, stem: true, explanation: true } } } },
    },
  });
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
