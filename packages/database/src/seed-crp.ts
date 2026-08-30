/**
 * CS#22 — College Readiness Program (CRP) demo content seeder.
 *
 * Seeds the demo content package (packages/shared/src/content/crp-demo.ts)
 * into the ARC Review Center organization. IDEMPOTENT: every record is keyed
 * by a stable slug/id and inserts are skipped when the record already exists,
 * so running this script any number of times never creates duplicates.
 *
 * Usage: tsx src/seed-crp.ts
 */
import { prisma } from "./client";
import {
  CRP_ORG_SLUG,
  CRP_PROGRAM,
  CRP_CURRICULUM,
  CRP_SUBJECTS,
  CRP_MODULES,
  CRP_TOPICS,
  CRP_LESSONS,
  CRP_QUESTIONS,
  CRP_ASSESSMENTS,
  CRP_DEMO_STUDENT_EMAIL,
  CRP_TOPIC_SUBJECT,
  validateCrpSeed,
  type CrpQuestionDef,
} from "@aratc/shared";
import { ContentStatus, Prisma } from "@prisma/client";

async function main() {
  // Guard: the content definition itself must be internally consistent.
  validateCrpSeed();

  // ------------------------------------------------------------
  // 0. Organization + author
  // ------------------------------------------------------------
  const org = await prisma.organization.findUnique({ where: { slug: CRP_ORG_SLUG } });
  if (!org) throw new Error(`Organization "${CRP_ORG_SLUG}" not found — seed it first (seed.ts / demo-memberships.ts).`);

  // Questions require an author. Prefer a content admin, fall back to any admin.
  const author = (await prisma.user.findFirst({
    where: { roles: { some: { role: { name: "content_admin" } } } },
  })) ?? (await prisma.user.findFirst({
    where: { roles: { some: { role: { name: "super_admin" } } } },
  }));
  if (!author) throw new Error("No content_admin/super_admin user found — run seed.ts first.");
  console.log(`Author: ${author.email}`);
  // Non-null ids captured for nested closure use (TS loses narrowing in
  // hoisted function declarations).
  const orgId = org.id;
  const authorId = author.id;

  // ------------------------------------------------------------
  // 1. Program + Curriculum (owned by ARC Review Center)
  // ------------------------------------------------------------
  const program = await prisma.program.upsert({
    where: { slug: CRP_PROGRAM.slug },
    update: {},
    create: {
      slug: CRP_PROGRAM.slug,
      name: CRP_PROGRAM.name,
      description: CRP_PROGRAM.description,
      programType: CRP_PROGRAM.programType,
      status: "PUBLISHED",
      organizationId: org.id,
      createdById: author.id,
    },
  });

  const curriculum = await prisma.curriculum.upsert({
    where: { slug: CRP_CURRICULUM.slug },
    update: {},
    create: {
      slug: CRP_CURRICULUM.slug,
      name: CRP_CURRICULUM.name,
      description: CRP_CURRICULUM.description,
      stage: "COLLEGE",
      programId: program.id,
      organizationId: org.id,
      status: ContentStatus.PUBLISHED,
      orderIndex: 2,
    },
  });

  // ------------------------------------------------------------
  // 2. Subjects (+ curriculum items) → Modules → Topics
  // ------------------------------------------------------------
  const subjectIds = new Map<string, string>();
  for (const s of CRP_SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        name: s.name,
        description: `${s.name} track of the College Readiness Program.`,
        color: s.color,
        status: ContentStatus.PUBLISHED,
      },
    });
    subjectIds.set(s.key, subject.id);
    await prisma.curriculumItem.upsert({
      where: { curriculumId_subjectId: { curriculumId: curriculum.id, subjectId: subject.id } },
      update: {},
      create: { curriculumId: curriculum.id, subjectId: subject.id, orderIndex: s.orderIndex, isRequired: true },
    });
  }

  const moduleIds = new Map<string, string>();
  for (const m of CRP_MODULES) {
    const subjectId = subjectIds.get(m.subjectKey);
    if (!subjectId) throw new Error(`Module ${m.key}: unknown subjectKey ${m.subjectKey}`);
    const mod = await prisma.module.upsert({
      where: { slug: `crp-mod-${m.key}` },
      update: {},
      create: {
        subjectId,
        slug: `crp-mod-${m.key}`,
        name: m.name,
        description: m.description,
        orderIndex: m.orderIndex,
        status: ContentStatus.PUBLISHED,
      },
    });
    moduleIds.set(m.key, mod.id);
  }

  const topicIds = new Map<string, string>();
  for (const t of CRP_TOPICS) {
    const moduleId = moduleIds.get(t.moduleKey);
    if (!moduleId) throw new Error(`Topic ${t.key}: unknown moduleKey ${t.moduleKey}`);
    const topic = await prisma.topic.upsert({
      where: { slug: `crp-topic-${t.key}` },
      update: {},
      create: {
        moduleId,
        slug: `crp-topic-${t.key}`,
        name: t.name,
        description: t.description,
        orderIndex: t.orderIndex,
        status: ContentStatus.PUBLISHED,
      },
    });
    topicIds.set(t.key, topic.id);
  }

  // ------------------------------------------------------------
  // 3. Lessons (rich block content, org-owned, published)
  // ------------------------------------------------------------
  for (const [i, les] of CRP_LESSONS.entries()) {
    const topicId = topicIds.get(les.topicKey);
    if (!topicId) throw new Error(`Lesson ${les.slug}: unknown topicKey ${les.topicKey}`);
    await prisma.lesson.upsert({
      where: { slug: les.slug },
      update: {},
      create: {
        topicId,
        slug: les.slug,
        title: les.title,
        description: les.description,
        type: "ARTICLE",
        durationMinutes: les.durationMinutes,
        content: { blocks: les.blocks } as unknown as Prisma.InputJsonValue,
        orderIndex: i,
        status: ContentStatus.PUBLISHED,
        organizationId: org.id,
        createdById: author.id,
      },
    });
  }

  // ------------------------------------------------------------
  // 4. Questions — transformed for engine + player compatibility:
  //    TRUE_FALSE defs carry a boolean correctAnswer and no options;
  //    the player renders TF via options[], so add True/False options.
  // ------------------------------------------------------------
  function toDbQuestion(q: CrpQuestionDef) {
    let options: unknown = q.options ?? undefined;
    let correctAnswer: unknown = q.correctAnswer;
    if (q.type === "TRUE_FALSE") {
      const truth = q.correctAnswer === true;
      options = [
        { id: "true", text: "True", isCorrect: truth },
        { id: "false", text: "False", isCorrect: !truth },
      ];
      correctAnswer = [truth ? "true" : "false"];
    }
    return {
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      stem: q.stem,
      options,
      correctAnswer,
      explanation: q.explanation,
      tags: q.tags,
      status: ContentStatus.PUBLISHED,
      organizationId: orgId,
      authorId: authorId,
    };
  }

  const dbQuestions = CRP_QUESTIONS.map(toDbQuestion) as Prisma.QuestionCreateManyInput[];
  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: CRP_QUESTIONS.map((q) => q.id) } },
    select: { id: true },
  });
  const newQuestions = dbQuestions.filter((q) => !existingQuestions.some((e) => e.id === q.id));
  for (let i = 0; i < newQuestions.length; i += 500) {
    await prisma.question.createMany({ data: newQuestions.slice(i, i + 500), skipDuplicates: true });
  }

  // Question bank links (topic/subject tagging for the bank UI)
  const bankLinks = CRP_QUESTIONS.map((q) => ({
    id: `qbl-${q.id}`,
    questionId: q.id,
    subjectId: subjectIds.get(CRP_TOPIC_SUBJECT[q.topicKey]) ?? null,
    topicId: topicIds.get(q.topicKey) ?? null,
  }));
  const existingLinks = await prisma.questionBankLink.findMany({
    where: { id: { in: bankLinks.map((l) => l.id) } },
    select: { id: true },
  });
  const newLinks = bankLinks.filter((l) => !existingLinks.some((e) => e.id === l.id));
  for (let i = 0; i < newLinks.length; i += 500) {
    await prisma.questionBankLink.createMany({ data: newLinks.slice(i, i + 500), skipDuplicates: true });
  }

  // ------------------------------------------------------------
  // 5. CRP assessments + question joins (each references a subset)
  // ------------------------------------------------------------
  const allTopicIds = [...topicIds.values()];
  for (const def of CRP_ASSESSMENTS) {
    const assessment = await prisma.assessment.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        type: def.type,
        topicIds: allTopicIds,
        questionCount: def.questionCount,
        timeLimitMinutes: def.timeLimitMinutes,
        passingScore: def.passingScore,
        maxAttempts: def.maxAttempts,
        allowRetake: def.allowRetake,
        randomizeQuestions: def.randomizeQuestions,
        randomizeChoices: def.randomizeChoices,
        showExplanations: def.showExplanations,
        status: ContentStatus.PUBLISHED,
        programId: program.id,
        organizationId: org.id,
        createdById: author.id,
      },
    });

    const subset = def.questionIds
      .map((qid) => CRP_QUESTIONS.find((q) => q.id === qid))
      .filter((q): q is CrpQuestionDef => Boolean(q));
    const joins = subset.map((q, i) => ({
      id: `aq-${assessment.id}-${q.id}`,
      assessmentId: assessment.id,
      questionId: q.id,
      orderIndex: i,
      score: 1,
    }));
    const existingJoins = await prisma.assessmentQuestion.findMany({
      where: { id: { in: joins.map((j) => j.id) } },
      select: { id: true },
    });
    const newJoins = joins.filter((j) => !existingJoins.some((e) => e.id === j.id));
    for (let i = 0; i < newJoins.length; i += 500) {
      await prisma.assessmentQuestion.createMany({ data: newJoins.slice(i, i + 500), skipDuplicates: true });
    }
  }

  // ------------------------------------------------------------
  // 6. Demo student: profile + ACTIVE enrollment (real access policy)
  // ------------------------------------------------------------
  const studentUser = await prisma.user.findUnique({
    where: { email: CRP_DEMO_STUDENT_EMAIL },
    include: { learnerProfile: true },
  });
  if (!studentUser) throw new Error(`Demo student ${CRP_DEMO_STUDENT_EMAIL} not found — run seed.ts first.`);
  const learner =
    studentUser.learnerProfile ??
    (await prisma.learnerProfile.create({
      data: { userId: studentUser.id, organizationId: org.id, currentStage: "COLLEGE" },
    }));
  await prisma.learnerProfile.update({
    where: { id: learner.id },
    data: { currentProgramId: program.id, currentCurriculumId: curriculum.id, organizationId: org.id },
  });
  await prisma.enrollment.upsert({
    where: { learnerId_programId: { learnerId: learner.id, programId: program.id } },
    update: {},
    create: {
      learnerId: learner.id,
      programId: program.id,
      curriculumId: curriculum.id,
      status: "ACTIVE",
      sourceType: "ADMIN_GRANT",
      sourceId: `seed-crp:${org.slug}`,
      enrolledById: author.id,
    },
  });

  console.log(
    [
      "CRP seed complete:",
      `  program: ${program.slug} (org ${org.slug})`,
      `  curriculum: ${curriculum.slug}`,
      `  subjects: ${CRP_SUBJECTS.length}, modules: ${CRP_MODULES.length}, topics: ${CRP_TOPICS.length}, lessons: ${CRP_LESSONS.length}`,
      `  questions: ${dbQuestions.length} (${newQuestions.length} newly created)`,
      `  assessments: ${CRP_ASSESSMENTS.map((a) => `${a.slug} (${a.questionCount}q)`).join(", ")}`,
      `  enrollment: ${CRP_DEMO_STUDENT_EMAIL} -> ACTIVE`,
    ].join("\n"),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
