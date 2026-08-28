import { prisma } from "@aratc/database";

// Native date helpers — avoids pulling in date-fns as a new dependency
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

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

  // --- Content Health: groupBy status for each content model ---
  const lessonsByStatusQuery = prisma.lesson.groupBy({ by: ["status"], _count: true });
  const subjectsByStatusQuery = prisma.subject.groupBy({ by: ["status"], _count: true });
  const modulesByStatusQuery = prisma.module.groupBy({ by: ["status"], _count: true });
  const topicsByStatusQuery = prisma.topic.groupBy({ by: ["status"], _count: true });
  const assessmentsByStatusQuery = prisma.assessment.groupBy({ by: ["status"], _count: true });
  const passagesByStatusQuery = prisma.passage.groupBy({ by: ["status"], _count: true });

  // --- Needs Attention: problem counts ---
  const draftLessonsCountQuery = prisma.lesson.count({ where: { status: "DRAFT" } });
  const questionsPendingReviewQuery = prisma.question.count({ where: { status: "UNDER_REVIEW" } });
  const modulesWithoutTopicsQuery = prisma.module.count({ where: { topics: { none: {} } } });
  const lessonsPendingReviewQuery = prisma.lesson.count({ where: { status: "UNDER_REVIEW" } });
  const assessmentsDraftQuery = prisma.assessment.count({ where: { status: "DRAFT" } });

  // --- Recent Lessons (8 most recently updated, with deep includes) ---
  const recentLessonsQuery = prisma.lesson.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      type: true,
      topic: {
        select: {
          name: true,
          module: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true,
                  curriculumItems: {
                    where: { curriculum: { status: "PUBLISHED" } },
                    select: {
                      curriculum: {
                        select: {
                          id: true,
                          name: true,
                          program: { select: { id: true, name: true } },
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // --- Curriculum Overview (top 3 levels: Program → Curriculum → Subject) ---
  // Curriculum has items: CurriculumItem[] → subject, so we traverse
  // through items to reach subjects and count their modules via _count.
  const curriculumOverviewQuery = prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      curriculums: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          stage: true,
          status: true,
          updatedAt: true,
          items: {
            where: { subject: { status: "PUBLISHED" } },
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  updatedAt: true,
                  modules: { select: { id: true } },
                },
              },
            },
          },
        },
      },
      learnerProfiles: {
        select: { id: true },
      },
    },
  });

  // --- Student Overview ---
  const startOfToday = startOfDay(new Date());
  const sevenDaysAgo = subDays(startOfToday, 6);

  const activeStudentsTodayQuery = prisma.progress.count({
    where: { lastActivityAt: { gte: startOfToday } },
  });
  const learningActivityTodayQuery = prisma.progress.count({
    where: { lastActivityAt: { gte: startOfToday } },
  });
  const avgScoreQuery = prisma.assessmentAttempt.aggregate({
    _avg: { percentage: true },
    where: {
      status: "COMPLETED",
      percentage: { not: null },
    },
  });
  const totalLearnerProfilesQuery = prisma.learnerProfile.count();
  const enrolledStudentsQuery = prisma.enrollment.count({
    where: { status: "ACTIVE" },
  });

  // --- 7-Day Activity Chart ---
  const attemptsLast7DaysQuery = prisma.assessmentAttempt.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
  });
  const progressLast7DaysQuery = prisma.progress.findMany({
    where: { lastActivityAt: { gte: sevenDaysAgo } },
    select: { lastActivityAt: true },
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
    lessonsByStatusRows,
    subjectsByStatusRows,
    modulesByStatusRows,
    topicsByStatusRows,
    assessmentsByStatusRows,
    passagesByStatusRows,
    draftLessonsCount,
    questionsPendingReview,
    modulesWithoutTopics,
    lessonsPendingReview,
    assessmentsDraft,
    recentLessons,
    curriculumOverview,
    activeStudentsToday,
    learningActivityToday,
    avgScoreResult,
    totalLearnerProfiles,
    enrolledStudents,
    attemptsLast7Days,
    progressLast7Days,
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
    lessonsByStatusQuery,
    subjectsByStatusQuery,
    modulesByStatusQuery,
    topicsByStatusQuery,
    assessmentsByStatusQuery,
    passagesByStatusQuery,
    draftLessonsCountQuery,
    questionsPendingReviewQuery,
    modulesWithoutTopicsQuery,
    lessonsPendingReviewQuery,
    assessmentsDraftQuery,
    recentLessonsQuery,
    curriculumOverviewQuery,
    activeStudentsTodayQuery,
    learningActivityTodayQuery,
    avgScoreQuery,
    totalLearnerProfilesQuery,
    enrolledStudentsQuery,
    attemptsLast7DaysQuery,
    progressLast7DaysQuery,
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

  // Helper: convert groupBy rows → status count object
  const rowsToStatusCounts = (rows: { status: string; _count: number }[]) => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.status] = row._count;
    }
    return {
      total: rows.reduce((sum, r) => sum + r._count, 0),
      published: map.PUBLISHED ?? 0,
      draft: map.DRAFT ?? 0,
      underReview: map.UNDER_REVIEW ?? 0,
      archived: map.ARCHIVED ?? 0,
    };
  };

  // Content Health
  const contentHealth = {
    lessons: rowsToStatusCounts(lessonsByStatusRows as any[]),
    questions: rowsToStatusCounts(questionsByStatusRows as any[]),
    subjects: rowsToStatusCounts(subjectsByStatusRows as any[]),
    modules: rowsToStatusCounts(modulesByStatusRows as any[]),
    topics: rowsToStatusCounts(topicsByStatusRows as any[]),
    assessments: rowsToStatusCounts(assessmentsByStatusRows as any[]),
    passages: rowsToStatusCounts(passagesByStatusRows as any[]),
    aggregated: {
      publishedPercent: 0,
      draftPercent: 0,
      reviewPercent: 0,
      archivedPercent: 0,
    },
  };

  // Aggregated percentages across all content models
  const allModels = [
    contentHealth.lessons,
    contentHealth.questions,
    contentHealth.subjects,
    contentHealth.modules,
    contentHealth.topics,
    contentHealth.assessments,
    contentHealth.passages,
  ];
  const totalContent = allModels.reduce((sum, m) => sum + m.total, 0) || 1;
  contentHealth.aggregated = {
    publishedPercent: Math.round((allModels.reduce((sum, m) => sum + m.published, 0) / totalContent) * 100),
    draftPercent: Math.round((allModels.reduce((sum, m) => sum + m.draft, 0) / totalContent) * 100),
    reviewPercent: Math.round((allModels.reduce((sum, m) => sum + m.underReview, 0) / totalContent) * 100),
    archivedPercent: Math.round((allModels.reduce((sum, m) => sum + m.archived, 0) / totalContent) * 100),
  };

  // Needs Attention
  const needsAttention = [
    {
      id: "draft-lessons",
      label: "Lessons in draft status",
      count: draftLessonsCount,
      severity: draftLessonsCount > 10 ? "danger" as const : "warning" as const,
      href: "/admin/lessons?status=DRAFT",
    },
    {
      id: "questions-pending-review",
      label: "Questions pending review",
      count: questionsPendingReview,
      severity: questionsPendingReview > 50 ? "danger" as const : "warning" as const,
      href: "/admin/question-bank?status=UNDER_REVIEW",
    },
    {
      id: "lessons-pending-review",
      label: "Lessons pending review",
      count: lessonsPendingReview,
      severity: lessonsPendingReview > 5 ? "warning" as const : "info" as const,
      href: "/admin/lessons?status=UNDER_REVIEW",
    },
    {
      id: "modules-no-topics",
      label: "Modules with no topics",
      count: modulesWithoutTopics,
      severity: modulesWithoutTopics > 0 ? "warning" as const : "info" as const,
      href: "/admin/modules",
    },
    {
      id: "assessments-draft",
      label: "Assessments in draft",
      count: assessmentsDraft,
      severity: assessmentsDraft > 10 ? "warning" as const : "info" as const,
      href: "/admin/assessments?status=DRAFT",
    },
  ].filter((item) => item.count > 0);

  // Curriculum Overview (transform to match spec)
  const curriculumOverviewData = curriculumOverview.map((program) => ({
    id: program.id,
    name: program.name,
    status: program.status,
    learnerCount: program.learnerProfiles.length,
    curriculums: program.curriculums.map((curr: any) => ({
      id: curr.id,
      name: curr.name,
      gradeLevel: curr.gradeLevel ?? undefined,
      stage: curr.stage,
      status: curr.status,
      lastUpdated: curr.updatedAt,
      subjects: curr.items.map((item: any) => ({
        id: item.subject.id,
        name: item.subject.name,
        moduleCount: item.subject.modules.length,
        lastUpdated: item.subject.updatedAt,
      })),
    })),
  }));

  // Recent Lessons
  const recentLessonsData = recentLessons.map((lesson: any) => {
    const subject = lesson.topic?.module?.subject;
    const module = lesson.topic?.module;
    const curriculum = lesson.topic?.module?.subject?.curriculumItems?.[0]?.curriculum;
    const program = curriculum?.program;
    const gradeLevel = curriculum?.gradeLevel;
    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      subjectName: subject?.name ?? "Unknown Subject",
      moduleName: module?.name ?? "Unknown Module",
      topicName: lesson.topic?.name ?? "Unknown Topic",
      programName: program?.name ?? "Unassigned",
      gradeLevel: gradeLevel ?? undefined,
      status: lesson.status,
      updatedAt: lesson.updatedAt,
    };
  });

  // 7-Day Activity Chart
  const dayMap: Record<string, { date: string; attempts: number; activeLearners: number }> = {};
  for (let i = 0; i <= 6; i++) {
    const d = subDays(startOfToday, i);
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { date: key, attempts: 0, activeLearners: 0 };
  }

  for (const attempt of attemptsLast7Days) {
    const key = attempt.createdAt.toISOString().split("T")[0];
    if (dayMap[key]) dayMap[key].attempts += 1;
  }
  for (const prog of progressLast7Days) {
    const key = prog.lastActivityAt.toISOString().split("T")[0];
    if (dayMap[key]) dayMap[key].activeLearners += 1;
  }

  const activityChart = Object.values(dayMap).sort((a, b) => (a.date > b.date ? 1 : -1));

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
      learnerProfiles: totalLearnerProfiles,
      activeEnrollments: enrolledStudents,
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
    contentHealth,
    needsAttention,
    curriculumOverview: curriculumOverviewData,
    recentLessons: recentLessonsData,
    studentOverview: {
      activeStudentsToday,
      learningActivityToday,
      completedAssessments: completedAttempts,
      averageScore: avgScoreResult._avg.percentage ?? 0,
      enrolledStudents,
      totalLearnerProfiles,
    },
    activityChart,
  };
}
