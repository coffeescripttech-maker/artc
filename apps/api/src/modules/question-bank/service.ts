import { prisma } from "@aratc/database";
import { createQuestionSchema, linkQuestionSchema } from "./schemas";
import { NotFoundError, BadRequestError } from "../../lib/errors";
import type { CreateQuestionInput, UpdateQuestionInput, LinkQuestionInput } from "./schemas";

export async function listQuestions(filters?: {
  subjectId?: string;
  topicId?: string;
  type?: string;
  difficulty?: string;
  status?: string;
}) {
  const where: any = {};

  if (filters?.subjectId) {
    where.bankLinks = { some: { subjectId: filters.subjectId } };
  }
  if (filters?.topicId) {
    where.bankLinks = { ...where.bankLinks, some: { topicId: filters.topicId } };
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.difficulty) {
    where.difficulty = filters.difficulty;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.question.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
      bankLinks: {
        include: {
          topic: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      },
      _count: { select: { bankLinks: true, assessmentQuestions: true } },
    },
  });
}

export async function listMyQuestions(userId: string) {
  return prisma.question.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      bankLinks: {
        include: {
          topic: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      },
      _count: { select: { bankLinks: true, assessmentQuestions: true } },
    },
  });
}

export async function getQuestionById(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
      bankLinks: {
        include: {
          subject: { select: { id: true, name: true, slug: true } },
          topic: { select: { id: true, name: true, slug: true } },
          cetExam: { select: { id: true, name: true, slug: true } },
          assessment: { select: { id: true, name: true, slug: true } },
        },
      },
      assessmentQuestions: {
        include: { assessment: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!question) {
    throw new NotFoundError("Question not found");
  }

  return question;
}

export async function createQuestion(input: CreateQuestionInput, authorId: string) {
  // Create question and topic links in a transaction
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        type: input.type,
        difficulty: input.difficulty,
        stem: input.stem,
        options: input.options ? JSON.stringify(input.options) : undefined,
        correctAnswer: typeof input.correctAnswer === "string" ? input.correctAnswer : JSON.stringify(input.correctAnswer),
        explanation: input.explanation,
        hint: input.hint,
        tags: input.tags ?? [],
        authorId,
        status: "DRAFT",
      },
    });

    // Link to topics if provided
    if (input.topicIds && input.topicIds.length > 0) {
      await tx.questionBankLink.createMany({
        data: input.topicIds.map((topicId) => ({
          questionId: question.id,
          topicId,
          weight: 1,
        })),
      });
    }

    return question;
  });
}

export async function updateQuestion(id: string, input: UpdateQuestionInput) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  return prisma.question.update({
    where: { id },
    data: {
      type: input.type,
      difficulty: input.difficulty,
      stem: input.stem,
      options: input.options ? JSON.stringify(input.options) : undefined,
      correctAnswer: input.correctAnswer
        ? typeof input.correctAnswer === "string"
          ? input.correctAnswer
          : JSON.stringify(input.correctAnswer)
        : undefined,
      explanation: input.explanation,
      hint: input.hint,
      tags: input.tags,
    },
  });
}

export async function reviewQuestion(id: string, reviewerId: string, status: "PUBLISHED" | "UNDER_REVIEW") {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  return prisma.question.update({
    where: { id },
    data: {
      status,
      reviewerId,
    },
  });
}

export async function publishQuestion(id: string) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  return prisma.question.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
}

export async function archiveQuestion(id: string) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  return prisma.question.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteQuestion(id: string) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  return prisma.question.delete({ where: { id } });
}

// Question Bank Links
export async function linkQuestion(questionId: string, input: LinkQuestionInput) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new NotFoundError("Question not found");
  }

  // Validate that at least one link target is provided
  if (!input.subjectId && !input.topicId && !input.examId && !input.assessmentId) {
    throw new BadRequestError("At least one link target (subjectId, topicId, examId, or assessmentId) is required");
  }

  // Check if link already exists
  const existing = await prisma.questionBankLink.findFirst({
    where: {
      questionId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      examId: input.examId,
      assessmentId: input.assessmentId,
    },
  });

  if (existing) {
    throw new BadRequestError("Question is already linked to this target");
  }

  return prisma.questionBankLink.create({
    data: {
      questionId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      examId: input.examId,
      assessmentId: input.assessmentId,
      weight: input.weight ?? 1,
      notes: input.notes,
    },
  });
}

export async function updateQuestionLink(id: string, input: Partial<LinkQuestionInput>) {
  const existing = await prisma.questionBankLink.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question link not found");
  }

  return prisma.questionBankLink.update({
    where: { id },
    data: {
      weight: input.weight,
      notes: input.notes,
    },
  });
}

export async function unlinkQuestion(id: string) {
  const existing = await prisma.questionBankLink.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Question link not found");
  }

  return prisma.questionBankLink.delete({ where: { id } });
}

export async function getQuestionsBySubject(subjectId: string) {
  return prisma.questionBankLink.findMany({
    where: { subjectId },
    include: {
      question: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { question: { createdAt: "desc" } },
  });
}

export async function getQuestionsByTopic(topicId: string) {
  return prisma.questionBankLink.findMany({
    where: { topicId },
    include: {
      question: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { question: { createdAt: "desc" } },
  });
}

export async function getQuestionsByExam(examId: string) {
  return prisma.questionBankLink.findMany({
    where: { examId },
    include: {
      question: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { question: { createdAt: "desc" } },
  });
}

export async function getQuestionsByAssessment(assessmentId: string) {
  return prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: {
      question: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { orderIndex: "asc" },
  });
}

// Stats
export async function getQuestionStats(id?: string) {
  if (id) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bankLinks: true, assessmentQuestions: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    return {
      linkedSubjects: question._count.bankLinks,
      linkedAssessments: question._count.assessmentQuestions,
    };
  }

  const total = await prisma.question.count();
  const byStatus = await prisma.question.groupBy({
    by: ["status"],
    _count: true,
  });
  const byDifficulty = await prisma.question.groupBy({
    by: ["difficulty"],
    _count: true,
  });
  const byType = await prisma.question.groupBy({
    by: ["type"],
    _count: true,
  });

  return {
    total,
    byStatus: byStatus.reduce((acc, g) => ({ ...acc, [g.status]: g._count }), {}),
    byDifficulty: byDifficulty.reduce((acc, g) => ({ ...acc, [g.difficulty]: g._count }), {}),
    byType: byType.reduce((acc, g) => ({ ...acc, [g.type]: g._count }), {}),
  };
}
