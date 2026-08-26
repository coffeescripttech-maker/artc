import { PrismaClient, ContentStatus, QuestionType, DifficultyLevel, MasteryLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

const prisma = new PrismaClient();

// ============================================================
// Deterministic pseudo-random (seeded LCG) so re-running the seed
// produces stable IDs and consistent data.
// ============================================================
let rngState = 42;
function rng(): number {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
  return rngState / 0x7fffffff;
}
function rngInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const FIRST_NAMES = ["Ana", "Liza", "Miguel", "Sofia", "Carlos", "Maria", "Juan", "Elena", "David", "Isabella", "Luis", "Carmen", "Pedro", "Dolores", "Javier", "Rosa", "Diego", "Nina", "Tomas", "Valeria"];
const LAST_NAMES = ["Reyes", "Garcia", "Santos", "Dela Cruz", "Mendoza", "Martinez", "Torres", "Lopez", "Gomez", "Perez", "Hernandez", "Diaz", "Romero", "Moreno", "Vasquez", "Castro", "Ortega", "Suarez", "Ramirez", "Cruz"];

const DAY = 24 * 60 * 60 * 1000;

// ============================================================
// Question templates per subject, parameterized by index.
// ============================================================
type QTemplate = {
  type: QuestionType;
  stem: (i: number) => string;
  options: (i: number) => any[];
  correctAnswer: (i: number) => any;
  explanation: (i: number) => string;
};

const MATH_TEMPLATES: QTemplate[] = [
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: (i) => `What is ${i + 2} + ${i + 5}?`,
    options: (i) => [
      { id: "a", text: String(i + 6), isCorrect: false },
      { id: "b", text: String(i + 7), isCorrect: true },
      { id: "c", text: String(i + 8), isCorrect: false },
      { id: "d", text: String(i + 9), isCorrect: false },
    ],
    correctAnswer: () => ({ optionId: "b" }),
    explanation: (i) => `${i + 2} + ${i + 5} = ${i + 7}.`,
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: (i) => `What is the absolute value of -${(i + 1) * 3}?`,
    options: (i) => [
      { id: "a", text: String(-((i + 1) * 3)), isCorrect: false },
      { id: "b", text: "0", isCorrect: false },
      { id: "c", text: String((i + 1) * 3), isCorrect: true },
      { id: "d", text: String((i + 1) * 6), isCorrect: false },
    ],
    correctAnswer: () => ({ optionId: "c" }),
    explanation: (i) => `The absolute value of -${(i + 1) * 3} is ${(i + 1) * 3}.`,
  },
  {
    type: QuestionType.TRUE_FALSE,
    stem: () => `The sum of two negative integers is always negative.`,
    options: () => [],
    correctAnswer: () => true,
    explanation: () => "The sum of two negative integers is always negative.",
  },
  {
    type: QuestionType.FILL_IN_THE_BLANK,
    stem: (i) => `The product of -${i + 1} and ${i + 2} is ___.`,
    options: () => [],
    correctAnswer: (i) => String(-((i + 1) * (i + 2))),
    explanation: (i) => `-${i + 1} × ${i + 2} = ${-((i + 1) * (i + 2))}.`,
  },
  {
    type: QuestionType.NUMERIC,
    stem: (i) => `Solve for x: x + ${i + 5} = ${i + 10}.`,
    options: () => [],
    correctAnswer: (i) => ({ value: i + 5, tolerance: 0.01 }),
    explanation: (i) => `x = ${i + 10} - ${i + 5} = ${i + 5}.`,
  },
  {
    type: QuestionType.MULTIPLE_SELECT,
    stem: (i) => `Which of the following are factors of ${(i + 1) * 12}?`,
    options: (i) => {
      const n = (i + 1) * 12;
      const factors = [1, 2, 3, 4, 6].filter(f => n % f === 0);
      const all = [...factors.slice(0, 2), 5, 7].sort(() => rng() - 0.5);
      return all.map((f, idx) => ({
        id: String.fromCharCode(97 + idx),
        text: String(f),
        isCorrect: factors.includes(f),
      }));
    },
    correctAnswer: (i) => {
      const n = (i + 1) * 12;
      const factors = [1, 2, 3, 4, 6].filter(f => n % f === 0);
      return factors.map(f => ({ text: String(f) }));
    },
    explanation: () => "Select all that apply — factors divide evenly with no remainder.",
  },
];

const SCIENCE_TEMPLATES: QTemplate[] = [
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: (i) => `What is the chemical symbol for ${["Oxygen", "Hydrogen", "Carbon", "Nitrogen"][(i + 1) % 4]}?`,
    options: () => [
      { id: "a", text: "O", isCorrect: false },
      { id: "b", text: "H", isCorrect: false },
      { id: "c", text: "C", isCorrect: false },
      { id: "d", text: "N", isCorrect: false },
    ],
    correctAnswer: (i) => ({ optionId: ["b", "d", "a", "c"][i % 4] }),
    explanation: () => "Recall the periodic table symbols.",
  },
  {
    type: QuestionType.TRUE_FALSE,
    stem: () => `Photosynthesis occurs in the mitochondria of plant cells.`,
    options: () => [],
    correctAnswer: () => false,
    explanation: () => "Photosynthesis occurs in chloroplasts, not mitochondria.",
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: () => `Which planet is known as the Red Planet?`,
    options: () => [
      { id: "a", text: "Venus", isCorrect: false },
      { id: "b", text: "Mars", isCorrect: true },
      { id: "c", text: "Jupiter", isCorrect: false },
      { id: "d", text: "Saturn", isCorrect: false },
    ],
    correctAnswer: () => ({ optionId: "b" }),
    explanation: () => "Mars appears red due to iron oxide on its surface.",
  },
  {
    type: QuestionType.FILL_IN_THE_BLANK,
    stem: () => `The force that pulls objects toward Earth is called ___.`,
    options: () => [],
    correctAnswer: () => "gravity",
    explanation: () => "Gravity is the gravitational force exerted by Earth.",
  },
  {
    type: QuestionType.MULTIPLE_SELECT,
    stem: () => `Which of the following are states of matter?`,
    options: () => [
      { id: "a", text: "Solid", isCorrect: true },
      { id: "b", text: "Liquid", isCorrect: true },
      { id: "c", text: "Gas", isCorrect: true },
      { id: "d", text: "Energy", isCorrect: false },
      { id: "e", text: "Plasma", isCorrect: true },
    ],
    correctAnswer: () => [{ text: "Solid" }, { text: "Liquid" }, { text: "Gas" }, { text: "Plasma" }],
    explanation: () => "The five states of matter are solid, liquid, gas, plasma, and Bose-Einstein condensate.",
  },
  {
    type: QuestionType.NUMERIC,
    stem: () => `If an object travels 100 meters in 20 seconds, what is its average speed in m/s?`,
    options: () => [],
    correctAnswer: () => ({ value: 5, tolerance: 0.01 }),
    explanation: () => "Speed = distance / time = 100 / 20 = 5 m/s.",
  },
];

const ENGLISH_TEMPLATES: QTemplate[] = [
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: () => `Which word best completes: "She ___ to the store every Saturday."`,
    options: () => [
      { id: "a", text: "go", isCorrect: false },
      { id: "b", text: "goes", isCorrect: true },
      { id: "c", text: "going", isCorrect: false },
      { id: "d", text: "went", isCorrect: false },
    ],
    correctAnswer: () => ({ optionId: "b" }),
    explanation: () => "Third-person singular present tense requires 'goes'.",
  },
  {
    type: QuestionType.TRUE_FALSE,
    stem: () => `"Their" is the correct possessive form, while "there" and "they're" are different words.`,
    options: () => [],
    correctAnswer: () => true,
    explanation: () => "Their = possessive, there = place/direction, they're = they are.",
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    stem: () => `What is the plural of "child"?`,
    options: () => [
      { id: "a", text: "childs", isCorrect: false },
      { id: "b", text: "children", isCorrect: true },
      { id: "c", text: "childrens", isCorrect: false },
      { id: "d", text: "childeren", isCorrect: false },
    ],
    correctAnswer: () => ({ optionId: "b" }),
    explanation: () => "The irregular plural of 'child' is 'children'.",
  },
  {
    type: QuestionType.FILL_IN_THE_BLANK,
    stem: () => `The opposite of "abbreviate" is ___.`,
    options: () => [],
    correctAnswer: () => "lengthen",
    explanation: () => "Abbreviate shortens; lengthen is its opposite.",
  },
  {
    type: QuestionType.MULTIPLE_SELECT,
    stem: () => `Which of the following are parts of speech? (Select all that apply)`,
    options: () => [
      { id: "a", text: "Noun", isCorrect: true },
      { id: "b", text: "Verb", isCorrect: true },
      { id: "c", text: "Adjective", isCorrect: true },
      { id: "d", text: "Paragraph", isCorrect: false },
      { id: "e", text: "Adverb", isCorrect: true },
    ],
    correctAnswer: () => [{ text: "Noun" }, { text: "Verb" }, { text: "Adjective" }, { text: "Adverb" }],
    explanation: () => "Noun, verb, adjective, and adverb are parts of speech. Paragraph is a writing unit.",
  },
  {
    type: QuestionType.FILL_IN_THE_BLANK,
    stem: () => `Identify the part of speech: "Quickly" in "She ran quickly."`,
    options: () => [],
    correctAnswer: () => "adverb",
    explanation: () => "Adverbs modify verbs and often end in -ly.",
  },
];

const TEMPLATES_BY_SUBJECT: Record<string, QTemplate[]> = {
  gmathematics: MATH_TEMPLATES,
  gscience: SCIENCE_TEMPLATES,
  genglish: ENGLISH_TEMPLATES,
};

const DIFFICULTY: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];
const DIFF_WEIGHTS = [0.4, 0.4, 0.2];

function randomDifficulty(): DifficultyLevel {
  const r = rng();
  if (r < DIFF_WEIGHTS[0]) return DIFFICULTY[0];
  if (r < DIFF_WEIGHTS[0] + DIFF_WEIGHTS[1]) return DIFFICULTY[1];
  return DIFFICULTY[2];
}

const PROGRAMS = [
  { id: "grade-7-mathematics", slug: "grade-7-mathematics", name: "Grade 7 Mathematics", subject: "Mathematics", subjectId: "subject-math", subjectSlug: "gmathematics", grade: "GRADE_7" },
  { id: "grade-8-science", slug: "grade-8-science", name: "Grade 8 Science", subject: "Science", subjectId: "subject-science", subjectSlug: "gscience", grade: "GRADE_8" },
  { id: "grade-9-english", slug: "grade-9-english", name: "Grade 9 English", subject: "English", subjectId: "subject-english", subjectSlug: "genglish", grade: "GRADE_9" },
];

const SUBJECT_COLORS: Record<string, string> = {
  gmathematics: "#3B82F6",
  gscience: "#10B981",
  genglish: "#F59E0B",
};

const TEACHERS = [
  { firstName: "Maria", lastName: "Santos", subject: "gmathematics", email: "teacher1@aratc.edu.ph" },
  { firstName: "Jose", lastName: "Ramos", subject: "gscience", email: "teacher2@aratc.edu.ph" },
  { firstName: "Luz", lastName: "Bautista", subject: "genglish", email: "teacher3@aratc.edu.ph" },
];

async function main() {
  console.log("Seeding database...");

  // ============================================================
  // ROLES (always upsert — never break existing)
  // ============================================================
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

  // ============================================================
  // EXISTING SAMPLE USERS (preserved, same emails/passwords)
  // ============================================================
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
      roles: { create: { role: { connect: { name: "super_admin" } } } },
    },
  });

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
      roles: { create: { role: { connect: { name: "content_admin" } } } },
    },
  });

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
      roles: { create: { role: { connect: { name: "school_admin" } } } },
    },
  });

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
      roles: { create: { role: { connect: { name: "teacher" } } } },
    },
  });

  // Pending Teacher
  await prisma.user.upsert({
    where: { email: "pending-teacher@aratc.edu.ph" },
    update: {},
    create: {
      email: "pending-teacher@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Karla",
      lastName: "Mendoza",
      status: "PENDING_VERIFICATION",
      roles: { create: { role: { connect: { name: "teacher" } } } },
    },
  });

  // Student 1 (original)
  const student = await prisma.user.upsert({
    where: { email: "student@aratc.edu.ph" },
    update: {},
    create: {
      email: "student@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Ana",
      lastName: "Reyes",
      status: "ACTIVE",
      roles: { create: { role: { connect: { name: "student" } } } },
    },
  });

  // Student 2 (original)
  const student2 = await prisma.user.upsert({
    where: { email: "student2@aratc.edu.ph" },
    update: {},
    create: {
      email: "student2@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Liza",
      lastName: "Reyes",
      status: "ACTIVE",
      roles: { create: { role: { connect: { name: "student" } } } },
    },
  });

  // Parent (original)
  const parent = await prisma.user.upsert({
    where: { email: "parent@aratc.edu.ph" },
    update: {},
    create: {
      email: "parent@aratc.edu.ph",
      passwordHash: testPassword,
      firstName: "Roberto",
      lastName: "Reyes",
      status: "ACTIVE",
      roles: { create: { role: { connect: { name: "parent" } } } },
    },
  });

  // ============================================================
  // NEW TEACHERS (3 total — one per subject)
  // ============================================================
  const newTeachers: { id: string; subject: string }[] = [];
  for (const t of TEACHERS) {
    const teacherUser = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash: testPassword,
        firstName: t.firstName,
        lastName: t.lastName,
        status: "ACTIVE",
        roles: { create: { role: { connect: { name: "teacher" } } } },
      },
    });
    newTeachers.push({ id: teacherUser.id, subject: t.subject });
  }
  // Keep original teacher as a math teacher too
  newTeachers.unshift({ id: teacher.id, subject: "gmathematics" });

  // ============================================================
  // PROGRAMS + CURRICULUMS + SUBJECTS + MODULES + TOPICS + LESSONS
  // ============================================================
  const programData: {
    programId: string;
    curriculumId: string;
    subjectId: string;
    subjectSlug: string;
    subjectName: string;
    topics: any[];
    lessons: any[];
    grade: string;
  }[] = [];

  for (const prog of PROGRAMS) {
    // Program
    const program = await prisma.program.upsert({
      where: { slug: prog.slug },
      update: {},
      create: {
        id: prog.id,
        name: prog.name,
        slug: prog.slug,
        description: `${prog.subject} program for ${prog.name.split(" ")[1]} students aligned with the Philippine curriculum.`,
        programType: "BASIC_EDUCATION",
        status: "PUBLISHED",
      },
    });

    // Curriculum
    const curriculum = await prisma.curriculum.upsert({
      where: { slug: `road-to-success-${prog.slug}` },
      update: {},
      create: {
        id: `curriculum-${prog.id}`,
        name: `Road to Success - ${prog.name}`,
        slug: `road-to-success-${prog.slug}`,
        description: `Complete ${prog.subject} curriculum for ${prog.name}.`,
        stage: "BASIC_EDUCATION",
        gradeLevel: prog.grade as any,
        programId: program.id,
        status: "PUBLISHED",
        orderIndex: 1,
      },
    });

    // Subject
    const subject = await prisma.subject.upsert({
      where: { id: prog.subjectId },
      update: {},
      create: {
        id: prog.subjectId,
        name: prog.subject,
        slug: prog.subjectSlug,
        description: `Core ${prog.subject} subject`,
        color: SUBJECT_COLORS[prog.subjectSlug],
        status: ContentStatus.PUBLISHED,
      },
    });

    // CurriculumItem
    await prisma.curriculumItem.upsert({
      where: { curriculumId_subjectId: { curriculumId: curriculum.id, subjectId: subject.id } },
      update: {},
      create: {
        curriculumId: curriculum.id,
        subjectId: subject.id,
        orderIndex: 1,
        isRequired: true,
      },
    });

    // Modules — 3 per subject, Topics — 4 per module, Lessons — 2 per topic
    const topics: any[] = [];
    const lessons: any[] = [];
    const lessonCreateData: any[] = [];

    for (let mi = 0; mi < 3; mi++) {
      const modId = `${prog.id}-mod${mi}`;
      const mod = await prisma.module.upsert({
        where: { id: modId },
        update: {},
        create: {
          id: modId,
          subjectId: subject.id,
          name: `${prog.subject} Module ${mi + 1}`,
          slug: `${prog.slug}-mod${mi}`,
          description: `${prog.subject} module ${mi + 1} covers core concepts.`,
          orderIndex: mi,
          status: ContentStatus.PUBLISHED,
        },
      });

      for (let ti = 0; ti < 4; ti++) {
        const topicId = `${prog.id}-mod${mi}-topic${ti}`;
        const topic = await prisma.topic.upsert({
          where: { id: topicId },
          update: {},
          create: {
            id: topicId,
            moduleId: mod.id,
            name: `${prog.subject} Topic ${mi * 4 + ti + 1}`,
            slug: `${prog.slug}-topic-${mi * 4 + ti}`,
            description: `${prog.subject} topic ${mi * 4 + ti + 1} covering advanced concepts.`,
            orderIndex: ti,
            status: ContentStatus.PUBLISHED,
          },
        });

        for (let li = 0; li < 2; li++) {
          const lessonId = `${topicId}-lesson${li}`;
          lessons.push({ id: lessonId, topicId: topicId });
          lessonCreateData.push({
            id: lessonId,
            topicId: topicId,
            title: `${prog.subject} Lesson ${mi * 8 + ti * 2 + li + 1}`,
            slug: `${topic.slug}-lesson${li}`,
            description: `Lesson ${mi * 8 + ti * 2 + li + 1} of ${prog.subject}.`,
            type: "ARTICLE",
            durationMinutes: 15,
            content: {
              blocks: [
                { type: "paragraph", content: `${prog.subject} introduces fundamental concepts. This lesson covers key principles.` },
                { type: "paragraph", content: `Practice problems reinforce your understanding of ${prog.subject}.` },
              ],
            },
            status: ContentStatus.PUBLISHED,
            orderIndex: li,
          });
        }

        topics.push({ id: topicId, name: topic.name, moduleId: mod.id });
      }
    }

    // Batch-create lessons
    for (const ld of lessonCreateData) {
      await prisma.lesson.upsert({
        where: { id: ld.id },
        update: {},
        create: ld,
      });
    }

    programData.push({
      programId: program.id,
      curriculumId: curriculum.id,
      subjectId: subject.id,
      subjectSlug: prog.subjectSlug,
      subjectName: prog.subject,
      topics,
      lessons,
      grade: prog.grade,
    });
  }

  // ============================================================
  // QUESTIONS (15 per topic) — use createMany for bulk insert
  // ============================================================
  const allQuestions: { id: string; topicId: string; subjectId: string; authorId: string }[] = [];

  // Collect all question data first
  const questionData: any[] = [];
  const bankLinkData: any[] = [];

  for (const pd of programData) {
    const subjTemplates = TEMPLATES_BY_SUBJECT[pd.subjectSlug];
    for (const topic of pd.topics) {
      const topicId = topic.id as string;
      for (let q = 0; q < 15; q++) {
        const tmpl = subjTemplates[q % subjTemplates.length];
        const qId = `auto-q-${topicId}-${q}`;
        const questionAuthor = newTeachers.find(t => t.subject === pd.subjectSlug) ?? newTeachers[0];
        const options = tmpl.options(q);
        let correctAnswer = tmpl.correctAnswer(q);
        let stem = tmpl.stem(q);
        if (tmpl.type === QuestionType.TRUE_FALSE) {
          if (q % 2 === 1) {
            correctAnswer = !correctAnswer;
            stem = "The chemical formula for water is H2O.";
          }
        }

        questionData.push({
          id: qId,
          type: tmpl.type,
          difficulty: randomDifficulty(),
          stem,
          options: options.length > 0 ? options : undefined,
          correctAnswer,
          explanation: tmpl.explanation(q),
          tags: [`auto`, pd.subjectSlug, `topic${q % 4}`],
          status: ContentStatus.PUBLISHED,
          authorId: questionAuthor.id,
        });
        bankLinkData.push({
          id: `qbl-${qId}`,
          questionId: qId,
          subjectId: pd.subjectId,
          topicId: topicId,
        });
        allQuestions.push({ id: qId, topicId: topicId, subjectId: pd.subjectId, authorId: questionAuthor.id });
      }
    }
  }

  // Batch create questions — skipDuplicates for idempotency on re-runs
  for (let i = 0; i < questionData.length; i += 1000) {
    const chunk = questionData.slice(i, i + 1000);
    await prisma.question.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  // Batch create QuestionBankLinks
  for (let i = 0; i < bankLinkData.length; i += 1000) {
    const chunk = bankLinkData.slice(i, i + 1000);
    await prisma.questionBankLink.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`Created ${questionData.length} questions, ${bankLinkData.length} bank links`);

  // ============================================================
  // ASSESSMENTS (3 per program) + AssessmentQuestion joins
  // ============================================================
  const allAssessments: { id: string; name: string; programId: string; topicId: string; questionIds: string[]; passingScore: number; masteryThreshold: number }[] = [];
  const assessmentQuestionData: any[] = [];

  for (const pd of programData) {
    const shuffledTopics = [...pd.topics].sort(() => rng() - 0.5);
    for (let ai = 0; ai < 3; ai++) {
      const topicIds = shuffledTopics.slice(0, 2 + ai).map(t => t.id as string);
      const topicQuestions = allQuestions.filter(q => q.topicId === topicIds[0]);
      const assessmentQuestions = topicQuestions.slice(0, 10 + ai);
      const qIds = assessmentQuestions.map(q => q.id);

      const aId = `auto-assessment-${pd.subjectSlug}-${ai}`;
      await prisma.assessment.upsert({
        where: { id: aId },
        update: {},
        create: {
          id: aId,
          name: `${pd.subjectName} ${["Quiz", "Practice Test", "Mock Exam"][ai]}`,
          slug: `auto-${pd.subjectSlug}-${ai}`,
          description: `An assessment covering ${pd.subjectName} concepts.`,
          type: ["QUIZ", "PRACTICE", "MOCK_EXAM"][ai] as any,
          topicIds,
          passingScore: 70,
          masteryThreshold: 75,
          maxAttempts: 3,
          allowRetake: true,
          randomizeQuestions: false,
          randomizeChoices: false,
          status: "PUBLISHED",
          programId: pd.programId,
          questionCount: qIds.length,
          timeLimitMinutes: 30,
          createdAt: new Date(Date.now() - (ai + 1) * DAY),
        },
      });

      // Collect AssessmentQuestion joins for batch insert
      for (let qi = 0; qi < qIds.length; qi++) {
        assessmentQuestionData.push({
          id: `aq-${aId}-${qi}`,
          assessmentId: aId,
          questionId: qIds[qi],
          orderIndex: qi,
          score: 1,
        });
      }

      allAssessments.push({
        id: aId,
        name: `${pd.subjectName} ${["Quiz", "Practice Test", "Mock Exam"][ai]}`,
        programId: pd.programId,
        topicId: topicIds[0],
        questionIds: qIds,
        passingScore: 70,
        masteryThreshold: 75,
      });
    }
  }

  // Batch create assessment questions — skipDuplicates for idempotency
  for (let i = 0; i < assessmentQuestionData.length; i += 1000) {
    const chunk = assessmentQuestionData.slice(i, i + 1000);
    await prisma.assessmentQuestion.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`Created ${allAssessments.length} assessments, ${assessmentQuestionData.length} assessment-question joins`);

  // ============================================================
  // NEW STUDENTS (20) with learner profiles + enrollments
  // ============================================================
  const allStudents: { id: string; userId: string; learnerId: string; firstName: string; lastName: string; programId: string }[] = [];
  const studentUserIds: string[] = [];
  const newProfileData: any[] = [];
  const newEnrollmentData: any[] = [];
  const learnerProfilesToFetch: string[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const email = `student${i + 3}@aratc.edu.ph`;
    const gradeLevel = PROGRAMS[i % PROGRAMS.length].grade;
    const userId = `user-student-${i + 3}`;

    // Upsert user
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: userId,
        email,
        passwordHash: testPassword,
        firstName,
        lastName,
        status: "ACTIVE",
        roles: { create: { role: { connect: { name: "student" } } } },
      },
    });

    learnerProfilesToFetch.push(u.id);

    // Enroll in 2-3 programs
    const numEnrollments = rngInt(2, 3);
    const shuffledPrograms = [...programData].sort(() => rng() - 0.5);
    for (let e = 0; e < numEnrollments && e < programData.length; e++) {
      const pd = shuffledPrograms[e];
      newEnrollmentData.push({
        id: `enroll-${u.id}-${pd.programId}`,
        learnerId: `lp-${u.id}`,
        programId: pd.programId,
        curriculumId: pd.curriculumId,
        status: "ACTIVE",
      });
      allStudents.push({
        id: u.id,
        userId: u.id,
        learnerId: `lp-${u.id}`,
        firstName,
        lastName,
        programId: pd.programId,
      });
    }

    newProfileData.push({
      userId: u.id,
      currentStage: "BASIC_EDUCATION",
      currentGradeLevel: gradeLevel as any,
      preferredLanguage: rng() < 0.5 ? "fil" : "en",
    });

    studentUserIds.push(u.id);
  }

  // Batch upsert learner profiles
  for (const pd of newProfileData) {
    await prisma.learnerProfile.upsert({
      where: { userId: pd.userId },
      update: {},
      create: pd,
    });
  }

  // Batch upsert enrollments (need real learnerProfile ids, so fetch them now)
  const lpMap = await prisma.learnerProfile.findMany({
    where: { userId: { in: learnerProfilesToFetch } },
    select: { userId: true, id: true },
  });
  const lpByuserId: Record<string, string> = {};
  for (const lp of lpMap) {
    lpByuserId[lp.userId] = lp.id;
  }

  for (const ed of newEnrollmentData) {
    // Replace temporary learnerId with real LP id
    const realLpId = lpByuserId[ed.learnerId.replace("lp-", "")];
    if (!realLpId) continue;
    await prisma.enrollment.upsert({
      where: { id: ed.id },
      update: {},
      create: { id: ed.id, learnerId: realLpId, programId: ed.programId, curriculumId: ed.curriculumId, status: "ACTIVE" },
    });
  }

  // Update allStudents with real learnerProfile ids
  for (const s of allStudents) {
    const realLpId = lpByuserId[s.userId];
    if (realLpId) s.learnerId = realLpId;
  }

  // Enroll original students + set their profiles
  for (const pd of programData) {
    for (const origStudent of [student, student2]) {
      const profile = await prisma.learnerProfile.findUnique({ where: { userId: origStudent.id } });
      if (profile) {
        await prisma.learnerProfile.update({
          where: { userId: origStudent.id },
          data: {
            currentGradeLevel: PROGRAMS[0].grade as any,
            currentProgramId: programData[0].programId,
            currentCurriculumId: programData[0].curriculumId,
          },
        });
      } else {
        await prisma.learnerProfile.create({
          data: {
            userId: origStudent.id,
            currentStage: "BASIC_EDUCATION",
            currentGradeLevel: PROGRAMS[0].grade as any,
            currentProgramId: programData[0].programId,
            currentCurriculumId: programData[0].curriculumId,
            preferredLanguage: "fil",
          },
        });
      }

      const lp = (await prisma.learnerProfile.findUnique({ where: { userId: origStudent.id } }))!;
      await prisma.enrollment.upsert({
        where: { learnerId_programId: { learnerId: lp.id, programId: pd.programId } },
        update: {},
        create: {
          learnerId: lp.id,
          programId: pd.programId,
          curriculumId: pd.curriculumId,
          status: "ACTIVE",
        },
      });
    }
  }

  const allStudentUserIds = [...new Set([...studentUserIds, student.id, student2.id])];

  // Prefetch all learner profiles for students in ONE query
  const studentLearnerProfiles = await prisma.learnerProfile.findMany({
    where: { userId: { in: allStudentUserIds } },
    select: { id: true, userId: true },
  });
  const lpByUserId: Record<string, string> = {};
  for (const lp of studentLearnerProfiles) {
    lpByUserId[lp.userId] = lp.id;
  }

  // ============================================================
  // ATTEMPTS + ATTEMPT ANSWERS — batched
  // ============================================================
  const attemptData: any[] = [];
  const answerData: any[] = [];

  for (const s of allStudentUserIds) {
    const learnerId = lpByUserId[s];
    if (!learnerId) continue;

    const numAttempts = rngInt(2, 4);
    const shuffledAssessments = [...allAssessments].sort(() => rng() - 0.5);

    for (let ai = 0; ai < Math.min(numAttempts, shuffledAssessments.length); ai++) {
      const assessment = shuffledAssessments[ai];
      const maxScore = assessment.questionIds.length;

      // Score distribution: 20% fail, 30% low pass, 30% solid, 20% mastery
      const scoreBucket = rng();
      let score: number;
      if (scoreBucket < 0.2) score = rngInt(0, Math.floor(maxScore * 0.59));
      else if (scoreBucket < 0.5) score = rngInt(Math.ceil(maxScore * 0.6), Math.floor(maxScore * 0.74));
      else if (scoreBucket < 0.8) score = rngInt(Math.ceil(maxScore * 0.75), Math.floor(maxScore * 0.89));
      else score = rngInt(Math.ceil(maxScore * 0.9), maxScore);

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const attemptDate = new Date(Date.now() - rngInt(5, 90) * DAY);
      const aId = `auto-attempt-${s.slice(-6)}-${ai}`;

      attemptData.push({
        id: aId,
        learnerId: learnerId,
        assessmentId: assessment.id,
        status: rng() < 0.1 ? "IN_PROGRESS" : "COMPLETED",
        startedAt: new Date(attemptDate.getTime() - 20 * 60 * 1000),
        completedAt: rng() < 0.1 ? null : attemptDate,
        score,
        maxScore,
        percentage,
        timeSpentSeconds: rngInt(300, 1800),
        createdAt: attemptDate,
      });

      for (let q = 0; q < maxScore; q++) {
        answerData.push({
          id: `${aId}-ans-${q}`,
          attemptId: aId,
          questionId: assessment.questionIds[q],
          answer: { selected: q < score ? "correct" : "incorrect" },
          isCorrect: q < score,
          score: q < score ? 1 : 0,
        });
      }
    }
  }

  // Batch create attempts — skipDuplicates for idempotency
  for (let i = 0; i < attemptData.length; i += 1000) {
    const chunk = attemptData.slice(i, i + 1000);
    await prisma.assessmentAttempt.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  // Batch create attempt answers
  for (let i = 0; i < answerData.length; i += 1000) {
    const chunk = answerData.slice(i, i + 1000);
    await prisma.attemptAnswer.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`Created ${attemptData.length} attempts, ${answerData.length} answers`);

  // ============================================================
  // BATCHES (5) with members + co-teachers — batched
  // ============================================================

  // Build a userId → learnerId map from allStudents (already updated with real LP ids)
  const studentLpByUserId: Record<string, string> = {};
  for (const s of allStudents) {
    if (s.learnerId && s.learnerId.startsWith("lp-")) {
      // Still a temp ID — shouldn't happen after refresh
    } else if (s.learnerId) {
      studentLpByUserId[s.userId] = s.learnerId;
    }
  }

  // Also add original students
  for (const origStudent of [student.id, student2.id]) {
    if (lpByUserId[origStudent]) {
      studentLpByUserId[origStudent] = lpByUserId[origStudent];
    }
  }

  const batchMemberData: any[] = [];
  const batchTeacherData: any[] = [];

  for (let bi = 0; bi < 5; bi++) {
    const pd = programData[bi % programData.length];
    const owner = newTeachers[bi % newTeachers.length];
    const bid = `auto-batch-${bi + 1}`;
    await prisma.batch.upsert({
      where: { id: bid },
      update: {},
      create: {
        id: bid,
        programId: pd.programId,
        name: `${pd.subjectName} Class ${bi + 1}`,
        description: `Section ${String.fromCharCode(65 + bi)}: ${pd.subjectName} students.`,
        ownerId: owner.id,
        startDate: new Date(Date.now() - 90 * DAY),
        endDate: new Date(Date.now() + 180 * DAY),
      },
    });

    // Collect members for batch insert using the pre-fetched map
    const batchStudents = allStudents.filter(s => s.programId === pd.programId);
    const numMembers = rngInt(5, Math.min(10, batchStudents.length));
    const addedMemberLearnerIds = new Set<string>();

    for (let mi = 0; mi < numMembers; mi++) {
      const learnerId = studentLpByUserId[batchStudents[mi].userId];
      if (!learnerId || addedMemberLearnerIds.has(learnerId)) continue;
      addedMemberLearnerIds.add(learnerId);
      batchMemberData.push({ batchId: bid, learnerId: learnerId });
    }

    const coTeacher = newTeachers[(bi + 1) % newTeachers.length];
    batchTeacherData.push({ id: `auto-bt-${bid}`, batchId: bid, teacherId: coTeacher.id });
  }

  // Batch create batch members — skipDuplicates for idempotency
  for (let i = 0; i < batchMemberData.length; i += 1000) {
    const chunk = batchMemberData.slice(i, i + 1000);
    await prisma.batchMember.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  // Batch create batch teachers
  for (let i = 0; i < batchTeacherData.length; i += 1000) {
    const chunk = batchTeacherData.slice(i, i + 1000);
    await prisma.batchTeacher.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`Created ${batchMemberData.length} batch members, ${batchTeacherData.length} batch teachers`);

  // ============================================================
  // PROGRESS ROWS (mastery ladder) — batched with findFirst pattern
  // ============================================================
  // Prefetch all lessons
  const allTopicIds = programData.flatMap(pd => pd.topics.map(t => t.id as string));
  const allLessons = await prisma.lesson.findMany({
    where: { topicId: { in: allTopicIds } },
    select: { id: true, topicId: true },
  });
  const lessonsByTopic: Record<string, any[]> = {};
  for (const lesson of allLessons) {
    if (!lessonsByTopic[lesson.topicId]) lessonsByTopic[lesson.topicId] = [];
    lessonsByTopic[lesson.topicId].push(lesson);
  }

  // Build all progress records in memory first
  const progressBatch: any[] = [];

  // Prefetch all learner profiles for students
  const allLearnerProfiles = await prisma.learnerProfile.findMany({
    where: { userId: { in: allStudentUserIds } },
    select: { id: true, userId: true },
  });

  // Prefetch all attempts + assessments in fewer queries
  const allAttemptsWithProgram = await prisma.assessmentAttempt.findMany({
    where: {
      learnerId: { in: allLearnerProfiles.map(lp => lp.id) },
      status: "COMPLETED",
    },
    select: {
      learnerId: true,
      percentage: true,
      assessment: { select: { program: { select: { id: true } } } },
    },
  });

  // Prefetch all enrollments
  const allEnrollments = await prisma.enrollment.findMany({
    where: { learnerId: { in: allLearnerProfiles.map(lp => lp.id) }, status: "ACTIVE" },
    select: { learnerId: true, programId: true },
  });

  // Build a lookup map for fast access
  const attemptsByLearnerAndProgram: Record<string, number[]> = {};
  for (const a of allAttemptsWithProgram) {
    const progId = a.assessment?.program?.id;
    if (!progId) continue;
    const key = `${a.learnerId}-${progId}`;
    if (!attemptsByLearnerAndProgram[key]) attemptsByLearnerAndProgram[key] = [];
    if (a.percentage !== null) attemptsByLearnerAndProgram[key].push(a.percentage);
  }

  const enrolledProgramsByLearner: Record<string, Set<string>> = {};
  for (const e of allEnrollments) {
    if (!enrolledProgramsByLearner[e.learnerId]) enrolledProgramsByLearner[e.learnerId] = new Set();
    enrolledProgramsByLearner[e.learnerId].add(e.programId);
  }

  for (const lp of allLearnerProfiles) {
    for (const pd of programData) {
      if (!enrolledProgramsByLearner[lp.id]?.has(pd.programId)) continue;

      const progKey = `${lp.id}-${pd.programId}`;
      const attemptPercents = attemptsByLearnerAndProgram[progKey] || [];
      const avgScore = attemptPercents.length > 0
        ? attemptPercents.reduce((sum, p) => sum + p, 0) / attemptPercents.length
        : 0;

      let mastery: MasteryLevel;
      if (avgScore === 0) mastery = MasteryLevel.NOT_STARTED;
      else if (avgScore < 50) mastery = MasteryLevel.LEARNING;
      else if (avgScore < 70) mastery = MasteryLevel.PRACTICING;
      else if (avgScore < 85) mastery = MasteryLevel.PROFICIENT;
      else mastery = MasteryLevel.MASTERED;

      // Topic-level progress
      for (const topic of pd.topics) {
        const topicId = topic.id as string;
        const moduleId = topic.moduleId as string;
        const pId = `prog-${lp.id}-${topicId}`;
        const completionPercent = avgScore > 0 ? Number(rng() * 50 + 50) : 0;
        progressBatch.push({
          id: pId,
          learnerId: lp.id,
          programId: pd.programId,
          curriculumId: pd.curriculumId,
          subjectId: pd.subjectId,
          moduleId,
          topicId,
          completionPercentage: completionPercent,
          mastery,
          attemptsCount: attemptPercents.length,
          averageScore: avgScore,
          lastActivityAt: new Date(Date.now() - rngInt(1, 30) * DAY),
        });
      }

      // Lesson-level progress for mastered/proficient topics
      if (mastery === MasteryLevel.MASTERED || mastery === MasteryLevel.PROFICIENT) {
        for (const topic of pd.topics.slice(0, 2)) {
          const topicId = topic.id as string;
          const lessons = lessonsByTopic[topicId] || [];
          for (const lesson of lessons) {
            const pId = `prog-${lp.id}-${lesson.id}`;
            progressBatch.push({
              id: pId,
              learnerId: lp.id,
              programId: pd.programId,
              curriculumId: pd.curriculumId,
              subjectId: pd.subjectId,
              topicId,
              lessonId: lesson.id,
              completionPercentage: 100,
              mastery: MasteryLevel.MASTERED,
              attemptsCount: 1,
              averageScore: 95,
              lastActivityAt: new Date(Date.now() - rngInt(1, 20) * DAY),
            });
          }
        }
      }
    }
  }

  // Optimize: fetch ALL existing progress rows in ONE query, then batch create/update
  const existingProgress = await prisma.progress.findMany({
    where: { learnerId: { in: progressBatch.map(p => p.learnerId) } },
    select: { id: true, learnerId: true, programId: true, curriculumId: true, subjectId: true, moduleId: true, topicId: true, lessonId: true },
  });

  // Build lookup key from non-null fields, matching the @@unique composite constraint
  const existingProgressMap = new Map<string, { id: string }>();
  for (const ep of existingProgress) {
    const key = `${ep.learnerId}|${ep.programId ?? "null"}|${ep.curriculumId ?? "null"}|${ep.subjectId ?? "null"}|${ep.moduleId ?? "null"}|${ep.topicId ?? "null"}|${ep.lessonId ?? "null"}`;
    existingProgressMap.set(key, { id: ep.id });
  }

  // Split into create vs update batches
  const progressCreates: any[] = [];
  const progressUpdates: any[] = [];
  for (const p of progressBatch) {
    const key = `${p.learnerId}|${p.programId ?? "null"}|${p.curriculumId ?? "null"}|${p.subjectId ?? "null"}|${p.moduleId ?? "null"}|${p.topicId ?? "null"}|${p.lessonId ?? "null"}`;
    const existing = existingProgressMap.get(key);
    if (existing) {
      progressUpdates.push({ ...p, existingId: existing.id });
    } else {
      progressCreates.push(p);
    }
  }

  // Batch create in transactions
  for (let i = 0; i < progressCreates.length; i += 100) {
    const chunk = progressCreates.slice(i, i + 100);
    await prisma.$transaction(
      chunk.map((p) => prisma.progress.create({ data: p }))
    );
  }

  // Batch update in transactions
  for (let i = 0; i < progressUpdates.length; i += 100) {
    const chunk = progressUpdates.slice(i, i + 100);
    await prisma.$transaction(
      chunk.map((p) => {
        const { existingId, ...data } = p;
        return prisma.progress.update({ where: { id: existingId }, data });
      })
    );
  }

  console.log(`Progress rows: ${progressCreates.length} created, ${progressUpdates.length} updated`);

  // ============================================================
  // PARENT-STUDENT LINKS
  // ============================================================
  // Original: parent → student (ACTIVE, admin), parent → student2 (PENDING, parent)
  await prisma.parentStudent.upsert({
    where: { parentUserId_studentUserId: { parentUserId: parent.id, studentUserId: student.id } },
    update: { status: "ACTIVE", requestedBy: "ADMIN" },
    create: {
      parentUserId: parent.id,
      studentUserId: student.id,
      status: "ACTIVE",
      requestedBy: "ADMIN",
      respondedAt: new Date(),
    },
  });

  await prisma.parentStudent.upsert({
    where: { parentUserId_studentUserId: { parentUserId: parent.id, studentUserId: student2.id } },
    update: { status: "PENDING", requestedBy: "PARENT" },
    create: {
      parentUserId: parent.id,
      studentUserId: student2.id,
      status: "PENDING",
      requestedBy: "PARENT",
      message: "Hi Liza! I'd like to follow your learning progress. — Dad",
    },
  });

  // 6 new parents, each linked to 1-3 students
  const parentStudentData: any[] = [];
  for (let pi = 0; pi < 6; pi++) {
    const firstName = FIRST_NAMES[pi + 5];
    const lastName = LAST_NAMES[pi];
    const pEmail = `parent${pi + 2}@aratc.edu.ph`;
    const p = await prisma.user.upsert({
      where: { email: pEmail },
      update: {},
      create: {
        email: pEmail,
        passwordHash: testPassword,
        firstName,
        lastName,
        status: "ACTIVE",
        roles: { create: { role: { connect: { name: "parent" } } } },
      },
    });

    const numLinks = rngInt(1, 3);
    const studentPool = [...allStudentUserIds].sort(() => rng() - 0.5);
    for (let li = 0; li < numLinks && li < studentPool.length; li++) {
      const studentId = studentPool[li];
      parentStudentData.push({
        parentUserId: p.id,
        studentUserId: studentId,
        status: rng() < 0.8 ? "ACTIVE" : "PENDING",
        requestedBy: "PARENT",
        message: rng() < 0.8 ? null : `Hi! I'd like to follow your learning progress. — ${firstName}`,
        respondedAt: rng() < 0.8 ? new Date() : null,
      });
    }
  }

  // Batch upsert parent-student links in transactions
  for (let i = 0; i < parentStudentData.length; i += 50) {
    const chunk = parentStudentData.slice(i, i + 50);
    await prisma.$transaction(
      chunk.map((psd) =>
        prisma.parentStudent.upsert({
          where: { parentUserId_studentUserId: { parentUserId: psd.parentUserId, studentUserId: psd.studentUserId } },
          update: {},
          create: psd,
        })
      )
    );
  }

  console.log(`Created ${parentStudentData.length} parent-student links`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n===========================================");
  console.log("  SAMPLE LOGIN CREDENTIALS");
  console.log("===========================================");
  console.log("  Email                        | Password  | Role / Notes");
  console.log("-------------------------------|-----------|------------------------");
  console.log("  admin@aratc.edu.ph            | Test@1234 | Super Admin");
  console.log("  content@aratc.edu.ph          | Test@1234 | Content Admin");
  console.log("  school@aratc.edu.ph           | Test@1234 | School Admin");
  console.log("  teacher@aratc.edu.ph          | Test@1234 | Teacher");
  console.log("  teacher1@aratc.edu.ph         | Test@1234 | Teacher 1 (new)");
  console.log("  teacher2@aratc.edu.ph         | Test@1234 | Teacher 2 (new)");
  console.log("  teacher3@aratc.edu.ph         | Test@1234 | Teacher 3 (new)");
  console.log("  student@aratc.edu.ph          | Test@1234 | Student (Ana, linked to parent)");
  console.log("  student2@aratc.edu.ph         | Test@1234 | Student (Liza, pending invite)");
  console.log("  parent@aratc.edu.ph           | Test@1234 | Parent (Roberto)");
  console.log("  student3@aratc.edu.ph-22      | Test@1234 | Demo students");
  console.log("  pending-teacher@aratc.edu.ph  | Test@1234 | Teacher (awaiting approval)");
  console.log("===========================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });