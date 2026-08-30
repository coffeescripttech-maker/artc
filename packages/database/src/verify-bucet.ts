import { prisma } from "./client";

async function main() {
  const program = await prisma.program.findUnique({ where: { slug: "bucet-reviewer" } });
  if (!program) throw new Error("program missing");
  const org = await prisma.organization.findUnique({ where: { slug: "arc-review-center" } });
  const curriculum = await prisma.curriculum.findUnique({ where: { slug: "bucet-reviewer-curriculum" } });
  const subjects = await prisma.subject.count({ where: { slug: { startsWith: "bucet-" } } });
  const modules = await prisma.module.count({ where: { slug: { startsWith: "bucet-mod-" } } });
  const topics = await prisma.topic.count({ where: { slug: { startsWith: "bucet-topic-" } } });
  const lessons = await prisma.lesson.findMany({ where: { slug: { startsWith: "bucet-les-" } }, select: { id: true, organizationId: true, status: true } });
  const questions = await prisma.question.findMany({
    where: { id: { startsWith: "bucet-q-" } },
    select: { id: true, type: true, organizationId: true, status: true, options: true, correctAnswer: true, passageId: true },
  });
  const tf = questions.filter((q) => q.type === "TRUE_FALSE");
  const tfOk = tf.every((q) => {
    const opts = (q.options ?? []) as { id: string; isCorrect: boolean }[];
    return opts.length === 2 && opts.some((o) => o.id === "true") && opts.some((o) => o.id === "false") && opts.filter((o) => o.isCorrect).length === 1;
  });
  const passage = await prisma.passage.findUnique({ where: { id: "bucet-passage-eagle" } });
  const assessment = await prisma.assessment.findUnique({
    where: { slug: "bucet-mock-exam-demo" },
    include: { _count: { select: { questions: true } } },
  });
  const bankLinks = await prisma.questionBankLink.count({ where: { id: { startsWith: "qbl-bucet-q-" } } });
  const student = await prisma.user.findUnique({
    where: { email: "student@aratc.edu.ph" },
    include: { learnerProfile: { include: { enrollments: { where: { programId: program.id } } } } },
  });
  const enrollment = student?.learnerProfile?.enrollments?.[0];

  const orgScoped = questions.every((q) => q.organizationId === org?.id) && lessons.every((l) => l.organizationId === org?.id);
  const allPublished =
    questions.every((q) => q.status === "PUBLISHED") &&
    lessons.every((l) => l.status === "PUBLISHED") &&
    program.status === "PUBLISHED" &&
    assessment?.status === "PUBLISHED";

  console.log(
    JSON.stringify(
      {
        program: { slug: program.slug, org: program.organizationId === org?.id, status: program.status },
        curriculum: { ok: !!curriculum, linked: curriculum?.programId === program.id },
        counts: { subjects, modules, topics, lessons: lessons.length, questions: questions.length, bankLinks, joins: assessment?._count.questions },
        passage: { ok: !!passage, published: passage?.status },
        tfOptionsCorrect: tfOk,
        tfCount: tf.length,
        passageQuestions: questions.filter((q) => q.passageId).length,
        orgScoped,
        allPublished,
        assessment: assessment
          ? { type: assessment.type, randomize: [assessment.randomizeQuestions, assessment.randomizeChoices], timeLimit: assessment.timeLimitMinutes, passing: assessment.passingScore, attempts: assessment.maxAttempts }
          : null,
        enrollment: enrollment ? { status: enrollment.status, source: enrollment.sourceType, expires: enrollment.expiresAt } : null,
      },
      null,
      1,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
