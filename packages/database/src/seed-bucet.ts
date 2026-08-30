/**
 * CS#20 — BUCET Reviewer + CBT Mock Exam demo content seeder.
 *
 * Seeds the demo content package (packages/shared/src/content/bucet-demo.ts)
 * into the ARC Review Center organization. IDEMPOTENT: every record is keyed
 * by a stable slug/id and inserts are skipped when the record already exists,
 * so running this script any number of times never creates duplicates.
 *
 * Usage: tsx src/seed-bucet.ts
 */
import { prisma } from "./client";
import {
  BUCET_ORG_SLUG,
  BUCET_PROGRAM,
  BUCET_CURRICULUM,
  BUCET_SUBJECTS,
  BUCET_MODULES,
  BUCET_TOPICS,
  BUCET_LESSONS,
  BUCET_PASSAGE,
  BUCET_QUESTIONS,
  BUCET_ASSESSMENT,
  BUCET_DEMO_STUDENT_EMAIL,
  BUCET_TOPIC_SUBJECT,
  validateBucetSeed,
  type BucetQuestionDef,
} from "@aratc/shared";
import { ContentStatus } from "@prisma/client";

async function main() {
  // Guard: the content definition itself must be internally consistent.
  validateBucetSeed();

  // ------------------------------------------------------------
  // 0. Organization + author
  // ------------------------------------------------------------
  const org = await prisma.organization.findUnique({ where: { slug: BUCET_ORG_SLUG } });
  if (!org) throw new Error(`Organization "${BUCET_ORG_SLUG}" not found — seed it first (seed.ts / demo-memberships.ts).`);

  // Questions require an author. Prefer a content admin, fall back to any admin.
  const author = (await prisma.user.findFirst({
    where: { roles: { some: { role: { name: "content_admin" } } } },
  })) ?? (await prisma.user.findFirst({
    where: { roles: { some: { role: { name: "super_admin" } } } },
  }));
  if (!author) throw new Error("No content_admin/super_admin user found — run seed.ts first.");
  console.log(`Author: ${author.email}`);

  // ------------------------------------------------------------
  // 1. Program + Curriculum (owned by ARC Review Center)
  // ------------------------------------------------------------
  const program = await prisma.program.upsert({
    where: { slug: BUCET_PROGRAM.slug },
    update: {},
    create: {
      slug: BUCET_PROGRAM.slug,
      name: BUCET_PROGRAM.name,
      description: BUCET_PROGRAM.description,
      programType: BUCET_PROGRAM.programType,
      status: "PUBLISHED",
      organizationId: org.id,
      createdById: author.id,
    },
  });

  const curriculum = await prisma.curriculum.upsert({
    where: { slug: BUCET_CURRICULUM.slug },
    update: {},
    create: {
      slug: BUCET_CURRICULUM.slug,
      name: BUCET_CURRICULUM.name,
      description: BUCET_CURRICULUM.description,
      stage: "ENTRANCE_EXAM",
      programId: program.id,
      organizationId: org.id,
      status: ContentStatus.PUBLISHED,
      orderIndex: 1,
    },
  });

  // ------------------------------------------------------------
  // 2. Subjects (+ curriculum items) → Modules → Topics
  // ------------------------------------------------------------
  const subjectIds = new Map<string, string>();
  for (const s of BUCET_SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        name: s.name,
        description: `${s.name} track of the BUCET Reviewer.`,
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
  for (const m of BUCET_MODULES) {
    const subjectId = subjectIds.get(m.subjectKey);
    if (!subjectId) throw new Error(`Module ${m.key}: unknown subjectKey ${m.subjectKey}`);
    const mod = await prisma.module.upsert({
      where: { slug: `bucet-mod-${m.key}` },
      update: {},
      create: {
        subjectId,
        slug: `bucet-mod-${m.key}`,
        name: m.name,
        description: m.description,
        orderIndex: m.orderIndex,
        status: ContentStatus.PUBLISHED,
      },
    });
    moduleIds.set(m.key, mod.id);
  }

  const topicIds = new Map<string, string>();
  for (const t of BUCET_TOPICS) {
    const moduleId = moduleIds.get(t.moduleKey);
    if (!moduleId) throw new Error(`Topic ${t.key}: unknown moduleKey ${t.moduleKey}`);
    const topic = await prisma.topic.upsert({
      where: { slug: `bucet-topic-${t.key}` },
      update: {},
      create: {
        moduleId,
        slug: `bucet-topic-${t.key}`,
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
  for (const [i, les] of BUCET_LESSONS.entries()) {
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
        content: { blocks: les.blocks },
        orderIndex: i,
        status: ContentStatus.PUBLISHED,
        organizationId: org.id,
        createdById: author.id,
      },
    });
  }

  // ------------------------------------------------------------
  // 4. Passage (referenced by reading questions)
  // ------------------------------------------------------------
  await prisma.passage.upsert({
    where: { id: BUCET_PASSAGE.id },
    update: {},
    create: {
      id: BUCET_PASSAGE.id,
      title: BUCET_PASSAGE.title,
      content: BUCET_PASSAGE.content,
      status: ContentStatus.PUBLISHED,
    },
  });

  // ------------------------------------------------------------
  // 5. Questions — transformed for engine + player compatibility:
  //    TRUE_FALSE defs carry a boolean correctAnswer and no options;
  //    the player renders TF via options[], so add True/False options.
  // ------------------------------------------------------------
  function toDbQuestion(q: BucetQuestionDef) {
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
      organizationId: org.id,
      authorId: author.id,
      passageId: q.passageId ?? null,
    };
  }

  const dbQuestions = BUCET_QUESTIONS.map(toDbQuestion);
  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: dbQuestions.map((q) => q.id) } },
    select: { id: true },
  });
  const newQuestions = dbQuestions.filter((q) => !existingQuestions.some((e) => e.id === q.id));
  for (let i = 0; i < newQuestions.length; i += 500) {
    await prisma.question.createMany({ data: newQuestions.slice(i, i + 500), skipDuplicates: true });
  }

  // Question bank links (topic/subject tagging for the bank UI)
  const bankLinks = BUCET_QUESTIONS.map((q) => ({
    id: `qbl-${q.id}`,
    questionId: q.id,
    subjectId: subjectIds.get(BUCET_TOPIC_SUBJECT[q.topicKey]) ?? null,
    topicId: topicIds.get(q.topicKey) ?? null,
    passageId: q.passageId ?? null,
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
  // 6. Mock exam + question joins
  // ------------------------------------------------------------
  const assessment = await prisma.assessment.upsert({
    where: { slug: BUCET_ASSESSMENT.slug },
    update: {},
    create: {
      slug: BUCET_ASSESSMENT.slug,
      name: BUCET_ASSESSMENT.name,
      description: BUCET_ASSESSMENT.description,
      type: BUCET_ASSESSMENT.type,
      topicIds: [...topicIds.values()],
      questionCount: BUCET_QUESTIONS.length,
      timeLimitMinutes: BUCET_ASSESSMENT.timeLimitMinutes,
      passingScore: BUCET_ASSESSMENT.passingScore,
      maxAttempts: BUCET_ASSESSMENT.maxAttempts,
      allowRetake: BUCET_ASSESSMENT.allowRetake,
      randomizeQuestions: BUCET_ASSESSMENT.randomizeQuestions,
      randomizeChoices: BUCET_ASSESSMENT.randomizeChoices,
      showExplanations: BUCET_ASSESSMENT.showExplanations,
      status: ContentStatus.PUBLISHED,
      programId: program.id,
      organizationId: org.id,
      createdById: author.id,
    },
  });

  const joins = BUCET_QUESTIONS.map((q, i) => ({
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

  // ------------------------------------------------------------
  // 7. Demo student: profile + ACTIVE enrollment (real access policy)
  // ------------------------------------------------------------
  const studentUser = await prisma.user.findUnique({
    where: { email: BUCET_DEMO_STUDENT_EMAIL },
    include: { learnerProfile: true },
  });
  if (!studentUser) throw new Error(`Demo student ${BUCET_DEMO_STUDENT_EMAIL} not found — run seed.ts first.`);
  const learner =
    studentUser.learnerProfile ??
    (await prisma.learnerProfile.create({
      data: { userId: studentUser.id, organizationId: org.id, currentStage: "ENTRANCE_EXAM" },
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
      sourceId: `seed-bucet:${org.slug}`,
      enrolledById: author.id,
    },
  });

  console.log(
    [
      "BUCET seed complete:",
      `  program: ${program.slug} (org ${org.slug})`,
      `  curriculum: ${curriculum.slug}`,
      `  subjects: ${BUCET_SUBJECTS.length}, modules: ${BUCET_MODULES.length}, topics: ${BUCET_TOPICS.length}, lessons: ${BUCET_LESSONS.length}`,
      `  questions: ${dbQuestions.length} (${newQuestions.length} newly created)`,
      `  mock exam: ${assessment.slug} (${BUCET_QUESTIONS.length} questions, ${BUCET_ASSESSMENT.timeLimitMinutes} min, passing ${BUCET_ASSESSMENT.passingScore}%)`,
      `  enrollment: ${BUCET_DEMO_STUDENT_EMAIL} -> ACTIVE`,
    ].join("\n"),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
