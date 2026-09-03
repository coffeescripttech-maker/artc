import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aratc/database", () => ({
  prisma: {
    learnerProfile: { findUnique: vi.fn() },
    program: { findUnique: vi.fn() },
    progress: { findMany: vi.fn() },
  },
}));

vi.mock("../lib/program-access", () => ({
  findActiveEnrollment: vi.fn(),
}));

import { prisma } from "@aratc/database";
import { findActiveEnrollment } from "../lib/program-access";
import { getProgramCompletion } from "../modules/progression/service";
import { NotFoundError } from "../lib/errors";

const mockedPrisma = vi.mocked(prisma, true);
const mockedEnrollment = vi.mocked(findActiveEnrollment);

const USER_ID = "user-1";
const LP_ID = "lp-1";
const PROGRAM_ID = "prog-1";

function makePublishedProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: PROGRAM_ID,
    name: "College Readiness Program",
    status: "PUBLISHED",
    curriculums: [
      {
        items: [
          {
            subject: {
              id: "sub-1",
              name: "Mathematics",
              modules: [
                {
                  topics: [
                    { lessons: [{ id: "les-1" }, { id: "les-2" }] },
                    { lessons: [{ id: "les-3" }] },
                  ],
                },
              ],
            },
          },
          {
            subject: {
              id: "sub-2",
              name: "Science",
              modules: [
                {
                  topics: [
                    { lessons: [{ id: "les-4" }, { id: "les-5" }] },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("CS#23.5 — getProgramCompletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: LP_ID } as never);
    mockedEnrollment.mockResolvedValue({ id: "enroll-1" } as never);
  });

  it("404 when the learner has no profile", async () => {
    mockedPrisma.learnerProfile.findUnique.mockResolvedValue(null as never);
    await expect(getProgramCompletion(USER_ID, PROGRAM_ID)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedPrisma.program.findUnique).not.toHaveBeenCalled();
  });

  it("404 without an active enrollment", async () => {
    mockedEnrollment.mockResolvedValue(null as never);
    await expect(getProgramCompletion(USER_ID, PROGRAM_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("404 when the program is not PUBLISHED", async () => {
    mockedPrisma.program.findUnique.mockResolvedValue(
      makePublishedProgram({ status: "DRAFT" }) as never
    );
    await expect(getProgramCompletion(USER_ID, PROGRAM_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns a deterministic lesson-weighted rollup with subject breakdown", async () => {
    mockedPrisma.program.findUnique.mockResolvedValue(makePublishedProgram() as never);
    mockedPrisma.progress.findMany.mockResolvedValue([
      { lessonId: "les-1" },
      { lessonId: "les-3" },
      { lessonId: "les-4" },
    ] as never);

    const result = await getProgramCompletion(USER_ID, PROGRAM_ID);

    expect(result).toEqual({
      program: { id: PROGRAM_ID, name: "College Readiness Program" },
      totalLessons: 5,
      completedLessons: 3,
      completionPercentage: 60,
      mastery: "PRACTICING",
      subjects: [
        { subjectId: "sub-1", name: "Mathematics", totalLessons: 3, completedLessons: 2, completionPercentage: 67 },
        { subjectId: "sub-2", name: "Science", totalLessons: 2, completedLessons: 1, completionPercentage: 50 },
      ],
    });
  });

  it("returns 0 percent when there are no published lessons", async () => {
    mockedPrisma.program.findUnique.mockResolvedValue(
      makePublishedProgram({ curriculums: [] }) as never
    );
    const result = await getProgramCompletion(USER_ID, PROGRAM_ID);
    expect(result.completionPercentage).toBe(0);
    expect(result.totalLessons).toBe(0);
    expect(result.mastery).toBe("NOT_STARTED");
  });
});