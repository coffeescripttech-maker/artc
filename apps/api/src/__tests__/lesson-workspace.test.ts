import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aratc/database", () => ({
  prisma: {
    learnerProfile: { findUnique: vi.fn(), create: vi.fn() },
    lesson: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    curriculumItem: { findMany: vi.fn() },
    progress: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    lessonQuestionResponse: { findMany: vi.fn() },
    assessment: { findMany: vi.fn() },
  },
}));

vi.mock("../lib/program-access", () => ({
  hasLearnerProgramAccess: vi.fn(),
}));

import { prisma } from "@aratc/database";
import { hasLearnerProgramAccess } from "../lib/program-access";
import { getLessonWorkspace, setLessonProgress } from "../modules/lessons/service";
import { NotFoundError } from "../lib/errors";

const mockedPrisma = vi.mocked(prisma, true);
const mockedAccess = vi.mocked(hasLearnerProgramAccess);

const USER_ID = "user-1";
const LP_ID = "lp-1";
const LESSON_ID = "les-1";
const SUBJECT_ID = "sub-1";
const CURRICULUM_ID = "cur-1";
const PROGRAM_ID = "prog-1";

function makeLesson(overrides: Record<string, unknown> = {}) {
  return {
    id: LESSON_ID,
    title: "Lesson 1",
    slug: "lesson-1",
    description: null,
    type: "ARTICLE",
    durationMinutes: 8,
    content: { blocks: [] },
    videoUrl: null,
    orderIndex: 0,
    status: "PUBLISHED",
    topicId: "topic-1",
    organizationId: null,
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    topic: {
      id: "topic-1",
      name: "Topic 1",
      module: {
        id: "mod-1",
        name: "Module 1",
        subject: {
          id: SUBJECT_ID,
          name: "Mathematics",
          slug: "math",
          code: null,
          description: null,
          icon: null,
          color: null,
          status: "PUBLISHED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
    ...overrides,
  };
}

function makeCurriculumItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "ci-1",
    curriculumId: CURRICULUM_ID,
    subjectId: SUBJECT_ID,
    orderIndex: 0,
    isRequired: true,
    customName: null,
    curriculum: {
      id: CURRICULUM_ID,
      name: "Entrance Exam Curriculum",
      slug: "entrance-cur",
      stage: "ENTRANCE_EXAM",
      gradeLevel: null,
      orderIndex: 0,
      status: "PUBLISHED",
      programId: PROGRAM_ID,
      organizationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      program: {
        id: PROGRAM_ID,
        slug: "bucet-reviewer",
        name: "BUCET Reviewer",
        programType: "CET",
        status: "PUBLISHED",
        description: null,
        imageUrl: null,
        metadata: null,
        organizationId: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    subject: {
      id: SUBJECT_ID,
      name: "Mathematics",
      slug: "math",
      code: null,
      description: null,
      icon: null,
      color: null,
      status: "PUBLISHED",
      createdAt: new Date(),
      updatedAt: new Date(),
      modules: [
        {
          id: "mod-1",
          subjectId: SUBJECT_ID,
          name: "Module 1",
          slug: "mod-1",
          description: null,
          orderIndex: 0,
          status: "PUBLISHED",
          createdAt: new Date(),
          updatedAt: new Date(),
          topics: [
            {
              id: "topic-1",
              moduleId: "mod-1",
              name: "Topic 1",
              slug: "topic-1",
              description: null,
              orderIndex: 0,
              status: "PUBLISHED",
              createdAt: new Date(),
              updatedAt: new Date(),
              lessons: [
                { id: LESSON_ID, title: "Lesson 1", slug: "lesson-1", durationMinutes: 8, orderIndex: 0 },
                { id: "les-2", title: "Lesson 2", slug: "lesson-2", durationMinutes: 5, orderIndex: 1 },
              ],
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: LP_ID, userId: USER_ID } as never);
  mockedAccess.mockResolvedValue(true);
  mockedPrisma.lesson.count.mockResolvedValue(2 as never);
  mockedPrisma.progress.count.mockResolvedValue(1 as never);
  mockedPrisma.lessonQuestionResponse.findMany.mockResolvedValue([] as never);
  mockedPrisma.assessment.findMany.mockResolvedValue([
    {
      id: "asm-1",
      name: "BUCET Mock Exam",
      slug: "bucet-mock",
      type: "MOCK_EXAM",
      description: null,
      questionCount: 48,
      timeLimitMinutes: 90,
      passingScore: 70,
      allowRetake: true,
      maxAttempts: 3,
      _count: { questions: 48 },
    },
  ] as never);
});

describe("CS#23.1 — getLessonWorkspace", () => {
  it("returns the full workspace for an enrolled learner (real ordering + completion + assessments)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([makeCurriculumItem()] as never);
    mockedPrisma.progress.findMany.mockResolvedValue([
      { lessonId: "les-2", completionPercentage: 100, mastery: "MASTERED" },
    ] as never);

    const result = await getLessonWorkspace(USER_ID, LESSON_ID);

    expect(result.lesson.id).toBe(LESSON_ID);
    // Ordered flattened chain: lesson 1 → lesson 2.
    expect(result.flatLessons.map((l) => l.id)).toEqual([LESSON_ID, "les-2"]);
    expect(result.lessonIndex).toBe(0);
    // Real completion state from Progress rows.
    expect(result.completedLessonIds).toEqual(["les-2"]);
    expect(result.progressById["les-2"]).toEqual({ completionPercentage: 100, mastery: "MASTERED" });
    // Course tree preserved module/topic grouping with real ordering.
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].modules[0].topics[0].lessons).toHaveLength(2);
    expect(result.courses[0].modules[0].topics[0].lessons[1].id).toBe("les-2");
    // Program + real published assessments for "assessment next".
    expect(result.program.id).toBe(PROGRAM_ID);
    expect(result.program.assessments[0].questionCount).toBe(48);
  });

  it("404 for a lesson the learner is not enrolled in (no enumeration leak)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    // No accessible curriculum for the subject → not enrolled in any program.
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([] as never);

    await expect(getLessonWorkspace(USER_ID, LESSON_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404 for an unattached subject (no curriculum item at all)", async () => {
    const orphan = makeLesson();
    // No topic → no subject → no curriculum resolution.
    (orphan as { topic: unknown }).topic = null;
    mockedPrisma.lesson.findUnique.mockResolvedValue(orphan as never);

    await expect(getLessonWorkspace(USER_ID, LESSON_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404 when the containing curriculum is not published", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    const item = makeCurriculumItem();
    item.curriculum.status = "DRAFT";
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([item] as never);

    await expect(getLessonWorkspace(USER_ID, LESSON_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404 when access is denied by the program-access policy (unenrolled / unpublished program)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([makeCurriculumItem()] as never);
    mockedAccess.mockResolvedValue(false);

    await expect(getLessonWorkspace(USER_ID, LESSON_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404 for an unpublished lesson (draft never exposed)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson({ status: "DRAFT" }) as never);

    await expect(getLessonWorkspace(USER_ID, LESSON_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("CS#23.1 — completion authorization (setLessonProgress)", () => {
  it("refuses to complete an unpublished lesson (404)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson({ status: "DRAFT" }) as never);

    await expect(setLessonProgress(USER_ID, LESSON_ID, true)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedPrisma.progress.create).not.toHaveBeenCalled();
  });

  it("refuses to complete a lesson with no enrolled program (404)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([] as never);

    await expect(setLessonProgress(USER_ID, LESSON_ID, true)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedPrisma.progress.create).not.toHaveBeenCalled();
  });

  it("creates a progress row scoped to the resolved program/curriculum", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([makeCurriculumItem()] as never);
    mockedPrisma.progress.findFirst.mockResolvedValue(null as never);

    await setLessonProgress(USER_ID, LESSON_ID, true);

    expect(mockedPrisma.progress.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          learnerId: LP_ID,
          lessonId: LESSON_ID,
          programId: PROGRAM_ID,
          curriculumId: CURRICULUM_ID,
          completionPercentage: 100,
        }),
      })
    );
  });

  it("rolls lesson completion up into the topic progress row (real lesson/topic counts)", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([makeCurriculumItem()] as never);
    mockedPrisma.progress.findFirst.mockResolvedValue(null as never);
    mockedPrisma.lesson.count.mockResolvedValue(2 as never);
    mockedPrisma.progress.count.mockResolvedValue(1 as never);

    await setLessonProgress(USER_ID, LESSON_ID, true);

    // Topic-level rollup row (lessonId: null) — this is what /progression reads.
    expect(mockedPrisma.progress.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          learnerId: LP_ID,
          topicId: "topic-1",
          lessonId: null,
          completionPercentage: 50,
          mastery: "PRACTICING",
        }),
      })
    );
  });

  it("is idempotent — repeat completion updates the existing row, never duplicates", async () => {
    mockedPrisma.lesson.findUnique.mockResolvedValue(makeLesson() as never);
    mockedPrisma.curriculumItem.findMany.mockResolvedValue([makeCurriculumItem()] as never);
    const existing = {
      id: "prg-1",
      lessonId: LESSON_ID,
      learnerId: LP_ID,
      completionPercentage: 100,
      mastery: "MASTERED",
    };
    mockedPrisma.progress.findFirst.mockResolvedValue(existing as never);

    await setLessonProgress(USER_ID, LESSON_ID, true);
    await setLessonProgress(USER_ID, LESSON_ID, true);

    // No new rows are created (idempotent). Each completion updates TWO rows:
    // the lesson-level row and its topic-level rollup (what /progression reads).
    expect(mockedPrisma.progress.create).not.toHaveBeenCalled();
    expect(mockedPrisma.progress.update).toHaveBeenCalledTimes(4);
    expect(mockedPrisma.progress.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "prg-1" } })
    );
  });
});