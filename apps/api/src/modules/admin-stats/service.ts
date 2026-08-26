import { prisma } from "@aratc/database";

/**
 * Real platform-wide numbers for the admin dashboard. Everything comes from
 * the database in one transaction — no mock data.
 */
export async function getOverview() {
  // Built as variables first so each groupBy gets proper type inference,
  // then executed together in one transaction.
  const totalUsersQuery = prisma.user.count();
  const usersByStatusQuery = prisma.user.groupBy({ by: ["status"], _count: true });
  const usersByRoleQuery = prisma.userRole.groupBy({ by: ["roleId"], _count: true });
  const totalProgramsQuery = prisma.program.count();
  const programsByStatusQuery = prisma.program.groupBy({ by: ["status"], _count: true });
  const totalQuestionsQuery = prisma.question.count();
  const questionsByStatusQuery = prisma.question.groupBy({ by: ["status"], _count: true });
  const totalAssessmentsQuery = prisma.assessment.count();
  const totalAttemptsQuery = prisma.assessmentAttempt.count();
  const completedAttemptsQuery = prisma.assessmentAttempt.count({ where: { status: "COMPLETED" } });
  const totalEnrollmentsQuery = prisma.enrollment.count();
  const totalBatchesQuery = prisma.batch.count();
  const pendingTeachersQuery = prisma.user.count({
    where: {
      status: "PENDING_VERIFICATION",
      roles: { some: { role: { name: "teacher" } } },
    },
  });
  const recentUsersQuery = prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      status: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });
  const recentQuestionsQuery = prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      stem: true,
      type: true,
      status: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true } },
    },
  });
  const recentAttemptsQuery = prisma.assessmentAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    where: { status: "COMPLETED" },
    select: {
      id: true,
      score: true,
      maxScore: true,
      percentage: true,
      createdAt: true,
      assessment: { select: { name: true } },
      learner: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  const recentProgramsQuery = prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
    },
  });

  const [
    totalUsers,
    usersByStatusRows,
    usersByRoleRows,
    totalPrograms,
    programsByStatusRows,
    totalQuestions,
    questionsByStatusRows,
    totalAssessments,
    totalAttempts,
    completedAttempts,
    totalEnrollments,
    totalBatches,
    pendingTeachers,
    recentUsers,
    recentQuestions,
    recentAttempts,
    recentPrograms,
  ] = await prisma.$transaction([
    totalUsersQuery,
    usersByStatusQuery,
    usersByRoleQuery,
    totalProgramsQuery,
    programsByStatusQuery,
    totalQuestionsQuery,
    questionsByStatusQuery,
    totalAssessmentsQuery,
    totalAttemptsQuery,
    completedAttemptsQuery,
    totalEnrollmentsQuery,
    totalBatchesQuery,
    pendingTeachersQuery,
    recentUsersQuery,
    recentQuestionsQuery,
    recentAttemptsQuery,
    recentProgramsQuery,
  ]);

  // Map role ids to names
  const roleIds = usersByRoleRows.map((r) => r.roleId);
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: { id: true, name: true },
  });
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const usersByRole: Record<string, number> = {};
  for (const row of usersByRoleRows) {
    const name = roleNameById.get(row.roleId) ?? "unknown";
    usersByRole[name] = row._count;
  }

  const usersByStatus: Record<string, number> = {};
  for (const row of usersByStatusRows) {
    usersByStatus[row.status] = row._count;
  }

  const programsByStatus: Record<string, number> = {};
  for (const row of programsByStatusRows) {
    programsByStatus[row.status] = row._count;
  }

  const questionsByStatus: Record<string, number> = {};
  for (const row of questionsByStatusRows) {
    questionsByStatus[row.status] = row._count;
  }

  // Recent activity — merged, createdAt desc, capped at 8
  const activity = [
    ...recentUsers.map((u) => ({
      kind: "user" as const,
      id: u.id,
      title: `${u.firstName} ${u.lastName} joined`,
      detail: u.email,
      createdAt: u.createdAt,
      extra: u.roles.map((r) => r.role.name),
    })),
    ...recentQuestions.map((q) => ({
      kind: "question" as const,
      id: q.id,
      title: `New ${q.type.replace(/_/g, " ").toLowerCase()} question`,
      detail: q.stem.slice(0, 80) + (q.stem.length > 80 ? "…" : ""),
      createdAt: q.createdAt,
      extra: q.author ? [`${q.author.firstName} ${q.author.lastName}`] : [],
    })),
    ...recentAttempts.map((a) => ({
      kind: "attempt" as const,
      id: a.id,
      title: `${a.learner.user.firstName} ${a.learner.user.lastName} completed "${a.assessment.name}"`,
      detail:
        a.percentage !== null
          ? `${a.score}/${a.maxScore} (${Math.round(a.percentage)}%)`
          : `${a.score}/${a.maxScore}`,
      createdAt: a.createdAt,
      extra: [],
    })),
    ...recentPrograms.map((p) => ({
      kind: "program" as const,
      id: p.id,
      title: `Program "${p.name}" created`,
      detail: p.status.toLowerCase(),
      createdAt: p.createdAt,
      extra: [],
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    totals: {
      users: totalUsers,
      students: usersByRole.student ?? 0,
      parents: usersByRole.parent ?? 0,
      teachers: usersByRole.teacher ?? 0,
      admins:
        (usersByRole.super_admin ?? 0) +
        (usersByRole.school_admin ?? 0) +
        (usersByRole.content_admin ?? 0),
      pendingTeachers,
      programs: totalPrograms,
      publishedPrograms: programsByStatus.PUBLISHED ?? 0,
      questions: totalQuestions,
      publishedQuestions: questionsByStatus.PUBLISHED ?? 0,
      assessments: totalAssessments,
      attempts: totalAttempts,
      completedAttempts,
      enrollments: totalEnrollments,
      batches: totalBatches,
    },
    usersByStatus,
    questionsByStatus,
    programsByStatus,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      status: u.status,
      createdAt: u.createdAt,
      roles: u.roles.map((r) => r.role.name),
    })),
    recentActivity: activity,
  };
}
