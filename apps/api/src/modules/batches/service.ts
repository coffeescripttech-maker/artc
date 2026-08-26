import { prisma } from "@aratc/database";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import type { CreateBatchInput } from "@aratc/shared";

/**
 * Access check for a single batch: the requesting user must be the owner,
 * an assigned teacher, or an admin (any admin role). Returns the batch
 * (with members) or throws.
 */
async function getBatchForUser(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      members: {
        include: {
          learner: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      teachers: {
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      program: { select: { id: true, name: true } },
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!batch) {
    throw new NotFoundError("Class not found");
  }

  return batch;
}

function isAdmin(userRoles: string[]): boolean {
  return userRoles.some((r) => r === "super_admin" || r === "school_admin" || r === "content_admin");
}

function canAccess(batch: { ownerId: string; teachers: { teacherId: string }[] }, userId: string, userRoles: string[]): boolean {
  return (
    batch.ownerId === userId ||
    isAdmin(userRoles) ||
    batch.teachers.some((t) => t.teacherId === userId)
  );
}

// ============================================================
// My batches (owner OR assigned teacher)
// ============================================================

export async function listMyBatches(userId: string) {
  const batches = await prisma.batch.findMany({
    where: {
      OR: [{ ownerId: userId }, { teachers: { some: { teacherId: userId } } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      program: { select: { id: true, name: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, teachers: true } },
    },
  });

  return batches.map((batch) => ({
    id: batch.id,
    name: batch.name,
    description: batch.description,
    program: batch.program,
    owner: batch.owner,
    isOwner: batch.ownerId === userId,
    memberCount: batch._count.members,
    teacherCount: batch._count.teachers,
    startDate: batch.startDate,
    endDate: batch.endDate,
    createdAt: batch.createdAt,
  }));
}

export async function createBatch(userId: string, input: CreateBatchInput) {
  const program = await prisma.program.findUnique({ where: { id: input.programId } });
  if (!program) {
    throw new BadRequestError("The selected program does not exist");
  }

  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  const endDate = input.endDate
    ? new Date(input.endDate)
    : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

  if (endDate < startDate) {
    throw new BadRequestError("End date must be after the start date");
  }

  return prisma.batch.create({
    data: {
      name: input.name,
      description: input.description || null,
      programId: input.programId,
      ownerId: userId,
      startDate,
      endDate,
    },
    include: {
      program: { select: { id: true, name: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, teachers: true } },
    },
  });
}

// ============================================================
// Single batch
// ============================================================

export async function getBatch(batchId: string, userId: string, userRoles: string[]) {
  const batch = await getBatchForUser(batchId);

  if (!canAccess(batch, userId, userRoles)) {
    throw new NotFoundError("Class not found");
  }

  return {
    id: batch.id,
    name: batch.name,
    description: batch.description,
    program: batch.program,
    owner: batch.owner,
    isOwner: batch.ownerId === userId,
    startDate: batch.startDate,
    endDate: batch.endDate,
    teachers: batch.teachers.map((t) => t.teacher),
    members: batch.members.map((m) => ({
      id: m.id,
      joinedAt: m.joinedAt,
      learnerId: m.learnerId,
      user: m.learner.user,
      currentGradeLevel: m.learner.currentGradeLevel,
    })),
  };
}

export async function addBatchMember(
  batchId: string,
  userId: string,
  userRoles: string[],
  email: string
) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { teachers: { select: { teacherId: true } } },
  });
  if (!batch) {
    throw new NotFoundError("Class not found");
  }
  if (!canAccess(batch, userId, userRoles)) {
    throw new NotFoundError("Class not found");
  }

  const student = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: { include: { role: true } },
      learnerProfile: true,
    },
  });
  if (!student) {
    throw new BadRequestError("No account found with that email address");
  }
  if (!student.roles.some((ur) => ur.role.name === "student")) {
    throw new BadRequestError("That account is not a student account");
  }
  if (!student.learnerProfile) {
    throw new BadRequestError("That student does not have a learner profile yet");
  }

  const existing = await prisma.batchMember.findUnique({
    where: { batchId_learnerId: { batchId, learnerId: student.learnerProfile.id } },
  });
  if (existing) {
    throw new BadRequestError("That student is already in this class");
  }

  const member = await prisma.batchMember.create({
    data: { batchId, learnerId: student.learnerProfile.id },
    include: {
      learner: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
        },
      },
    },
  });

  return {
    id: member.id,
    joinedAt: member.joinedAt,
    learnerId: member.learnerId,
    user: member.learner.user,
    currentGradeLevel: member.learner.currentGradeLevel,
  };
}

export async function removeBatchMember(
  batchId: string,
  memberId: string,
  userId: string,
  userRoles: string[]
) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { teachers: { select: { teacherId: true } } },
  });
  if (!batch) {
    throw new NotFoundError("Class not found");
  }
  if (!canAccess(batch, userId, userRoles)) {
    throw new NotFoundError("Class not found");
  }

  const member = await prisma.batchMember.findFirst({ where: { id: memberId, batchId } });
  if (!member) {
    throw new NotFoundError("Student not found in this class");
  }

  await prisma.batchMember.delete({ where: { id: memberId } });
  return { id: memberId };
}

// ============================================================
// Report aggregates (teacher class reports)
// ============================================================

export async function getMyReport(userId: string) {
  const batches = await prisma.batch.findMany({
    where: {
      OR: [{ ownerId: userId }, { teachers: { some: { teacherId: userId } } }],
    },
    include: {
      program: { select: { id: true, name: true } },
      members: { select: { learnerId: true } },
    },
  });

  const totalStudents = batches.reduce((sum, b) => sum + b.members.length, 0);

  // All learner ids across the teacher's batches
  const learnerIds = batches.flatMap((b) => b.members.map((m) => m.learnerId));

  // COMPLETED attempts by those learners
  const attempts =
    learnerIds.length > 0
      ? await prisma.assessmentAttempt.findMany({
          where: { learnerId: { in: learnerIds }, status: "COMPLETED" },
          select: { learnerId: true, percentage: true, createdAt: true },
        })
      : [];

  const avgScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / attempts.length
      : null;

  // Active learners = members with activity (any attempt) in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentLearnerIds = new Set(
    attempts
      .filter((a) => new Date(a.createdAt).getTime() >= thirtyDaysAgo.getTime())
      .map((a) => a.learnerId)
  );

  const perBatch = await Promise.all(
    batches.map(async (batch) => {
      const batchLearnerIds = new Set(batch.members.map((m) => m.learnerId));
      const batchAttempts = attempts.filter((a) => batchLearnerIds.has(a.learnerId));
      const batchAvg =
        batchAttempts.length > 0
          ? batchAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / batchAttempts.length
          : null;
      const activeLearners = batch.members.filter((m) => recentLearnerIds.has(m.learnerId)).length;

      return {
        batchId: batch.id,
        name: batch.name,
        programName: batch.program.name,
        memberCount: batch.members.length,
        attemptsCompleted: batchAttempts.length,
        avgScore: batchAvg !== null ? Math.round(batchAvg * 100) / 100 : null,
        activeLearners,
      };
    })
  );

  return {
    totalBatches: batches.length,
    totalStudents,
    attemptsCompleted: attempts.length,
    avgScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
    perBatch,
  };
}
