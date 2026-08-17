import { PrismaClient, ContentStatus, QuestionType, DifficultyLevel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create roles
  const roles = [
    { name: "student", displayName: "Student" },
    { name: "parent", displayName: "Parent" },
    { name: "teacher", displayName: "Teacher" },
    { name: "school_admin", displayName: "School Admin" },
    { name: "content_admin", displayName: "Content Admin" },
    { name: "super_admin", displayName: "Super Admin" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log("Created roles");

  // ============================================================
  // SAMPLE USERS FOR TESTING
  // ============================================================

  // All passwords are: Test@1234 (for consistency)
  const testPassword = await hash("Test@1234", 10);

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@aratc.edu.ph" },
    update: {},
    create: {
      email: "admin@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "ARATC",
      lastName: "Administrator",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "super_admin" },
          },
        },
      },
    },
  });
  console.log(`✓ Admin: ${admin.email} / Test@1234`);

  // Content Admin
  const contentAdmin = await prisma.user.upsert({
    where: { email: "content@aratc.edu.ph" },
    update: {},
    create: {
      email: "content@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Maria",
      lastName: "Santos",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "content_admin" },
          },
        },
      },
    },
  });
  console.log(`✓ Content Admin: ${contentAdmin.email} / Test@1234`);

  // School Admin
  const schoolAdmin = await prisma.user.upsert({
    where: { email: "school@aratc.edu.ph" },
    update: {},
    create: {
      email: "school@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Juan",
      lastName: "Dela Cruz",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "school_admin" },
          },
        },
      },
    },
  });
  console.log(`✓ School Admin: ${schoolAdmin.email} / Test@1234`);

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@aratc.edu.ph" },
    update: {},
    create: {
      email: "teacher@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Pedro",
      lastName: "Garcia",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "teacher" },
          },
        },
      },
    },
  });
  console.log(`✓ Teacher: ${teacher.email} / Test@1234`);

  // Student
  const student = await prisma.user.upsert({
    where: { email: "student@aratc.edu.ph" },
    update: {},
    create: {
      email: "student@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Ana",
      lastName: "Reyes",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "student" },
          },
        },
      },
      learnerProfile: {
        create: {
          currentStage: "BASIC_EDUCATION",
          currentGradeLevel: "GRADE_7",
          preferredLanguage: "fil",
        },
      },
    },
  });
  console.log(`✓ Student: ${student.email} / Test@1234`);

  // Parent
  const parent = await prisma.user.upsert({
    where: { email: "parent@aratc.edu.ph" },
    update: {},
    create: {
      email: "parent@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Roberto",
      lastName: "Reyes",
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: "parent" },
          },
        },
      },
    },
  });
  console.log(`✓ Parent: ${parent.email} / Test@1234`);

  console.log("\n===========================================");
  console.log("  SAMPLE LOGIN CREDENTIALS");
  console.log("===========================================");
  console.log("  Email                  | Password    | Role");
  console.log("-------------------------|--------------|----------------");
  console.log("  admin@aratc.edu.ph     | Test@1234    | Super Admin");
  console.log("  content@aratc.edu.ph   | Test@1234    | Content Admin");
  console.log("  school@aratc.edu.ph    | Test@1234    | School Admin");
  console.log("  teacher@aratc.edu.ph   | Test@1234    | Teacher");
  console.log("  student@aratc.edu.ph   | Test@1234    | Student");
  console.log("  parent@aratc.edu.ph    | Test@1234    | Parent");
  console.log("===========================================\n");

  // Create sample Grade 7 Mathematics program
  const program = await prisma.program.upsert({
    where: { slug: "grade-7-mathematics" },
    update: {},
    create: {
      name: "Grade 7 Mathematics",
      slug: "grade-7-mathematics",
      description: "Mathematics program for Grade 7 students aligned with the Philippine curriculum.",
      stage: "BASIC_EDUCATION",
      gradeLevel: "GRADE_7",
      status: "PUBLISHED",
    },
  });

  const subject = await prisma.subject.upsert({
    where: {
      id: "sample-mathematics-subject",
    },
    update: {},
    create: {
      id: "sample-mathematics-subject",
      programId: program.id,
      name: "Mathematics",
      description: "Core mathematics subject for Grade 7",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const module1 = await prisma.module.upsert({
    where: { id: "sample-quarter-1" },
    update: {},
    create: {
      id: "sample-quarter-1",
      subjectId: subject.id,
      name: "Quarter 1: Number System",
      description: "Topics about numbers and operations",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const topic = await prisma.topic.upsert({
    where: { id: "sample-integers-topic" },
    update: {},
    create: {
      id: "sample-integers-topic",
      subjectId: subject.id,
      moduleId: module1.id,
      name: "Integers",
      description: "Understanding positive and negative whole numbers",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const lesson = await prisma.lesson.upsert({
    where: { slug: "introduction-to-integers" },
    update: {},
    create: {
      topicId: topic.id,
      title: "Introduction to Integers",
      slug: "introduction-to-integers",
      description: "Learn what integers are and how they are represented on the number line.",
      type: "ARTICLE",
      durationMinutes: 10,
      content: {
        blocks: [
          {
            type: "paragraph",
            content:
              "Integers are whole numbers that can be positive, negative, or zero. They do not include fractions or decimals.",
          },
          {
            type: "paragraph",
            content:
              "Examples of integers: ..., -3, -2, -1, 0, 1, 2, 3, ...",
          },
          {
            type: "paragraph",
            content:
              "On a number line, positive integers are to the right of zero, and negative integers are to the left of zero.",
          },
        ],
      },
      status: ContentStatus.PUBLISHED,
      orderIndex: 1,
    },
  });

  // Create sample questions
  const questions = [
    {
      stem: "Which of the following is an integer?",
      options: [
        { id: "a", text: "1.5", isCorrect: false },
        { id: "b", text: "-3", isCorrect: true },
        { id: "c", text: "1/2", isCorrect: false },
        { id: "d", text: "0.75", isCorrect: false },
      ],
      correctAnswer: { optionId: "b" },
      difficulty: DifficultyLevel.EASY,
      explanation: "Integers are whole numbers. -3 is a whole number and is negative.",
    },
    {
      stem: "What is the absolute value of -7?",
      options: [
        { id: "a", text: "-7", isCorrect: false },
        { id: "b", text: "0", isCorrect: false },
        { id: "c", text: "7", isCorrect: true },
        { id: "d", text: "14", isCorrect: false },
      ],
      correctAnswer: { optionId: "c" },
      difficulty: DifficultyLevel.EASY,
      explanation: "The absolute value of a number is its distance from zero on the number line. |-7| = 7.",
    },
    {
      stem: "Which integer is greater: -5 or -2?",
      options: [
        { id: "a", text: "-5", isCorrect: false },
        { id: "b", text: "-2", isCorrect: true },
        { id: "c", text: "They are equal", isCorrect: false },
        { id: "d", text: "Cannot be determined", isCorrect: false },
      ],
      correctAnswer: { optionId: "b" },
      difficulty: DifficultyLevel.MEDIUM,
      explanation: "On the number line, -2 is to the right of -5, so -2 is greater.",
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: `sample-q-${q.stem.slice(0, 20).replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `sample-q-${q.stem.slice(0, 20).replace(/\s/g, "-")}`,
        topicId: topic.id,
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: q.difficulty,
        stem: q.stem,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        status: ContentStatus.PUBLISHED,
        authorId: admin.id,
      },
    });
  }

  console.log(`Created sample program: ${program.name}`);
  console.log(`Created sample lesson: ${lesson.title}`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
