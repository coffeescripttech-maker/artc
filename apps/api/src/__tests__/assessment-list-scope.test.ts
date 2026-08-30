/**
 * CS#22.7 â€” assessment list tenant scoping (C-2), program payload question
 * metadata (H-1), and per-program progression (H-3).
 *
 * Covers the audit findings:
 * - C-2: students must not receive unrelated / null-org / other-tenant
 *   assessments; org admins/teachers must not see platform DRAFT records;
 *   anonymous callers only see the public platform catalog.
 * - H-1: the program-overview payload must include the real question
 *   configuration (questionCount etc.) so "N Questions" is never undefined.
 * - H-3: `getProgression` must honor an explicit programId (multi-program
 *   discovery: BUCET + CRP) instead of only the learner's currentProgram.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { buildApp } from "../app";

vi.mock("@aratc/database", () => ({
  prisma: {
    organizationMembership: { findUnique: vi.fn() },
    assessment: { findMany: vi.fn() },
    program: { findUnique: vi.fn() },
    learnerProfile: { findUnique: vi.fn() },
    progress: { findMany: vi.fn() },
  },
}));

import { prisma } from "@aratc/database";
import { assessmentListScope } from "../lib/tenant-scope";
import { getProgramBySlug } from "../modules/programs/service";
import { getProgression } from "../modules/progression/service";

const mockedPrisma = vi.mocked(prisma, true);
const app = buildApp();

const ARC_ORG_ID = "org-arc";
const OTHER_ORG_ID = "org-other";
const USER_ID = "user-1";

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: "1h" });
}

function activeMembership(organizationId: string) {
  return {
    id: "m-1",
    organizationId,
    userId: USER_ID,
    role: "LEARNER",
    status: "ACTIVE",
    organization: { id: organizationId, name: "Org", slug: "org", type: null },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.assessment.findMany.mockResolvedValue([] as never);
  mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
    activeMembership(ARC_ORG_ID) as never
  );
  mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: "learner-1" } as never);
  mockedPrisma.progress.findMany.mockResolvedValue([] as never);
});

describe("assessmentListScope (pure scope matrix)", () => {
  it("platform admins keep the unrestricted global catalog", () => {
    expect(assessmentListScope(ARC_ORG_ID, true)).toBeUndefined();
    expect(assessmentListScope(undefined, true)).toBeUndefined();
  });

  it("members are scoped to their own organization only (no null-org leakage)", () => {
    expect(assessmentListScope(ARC_ORG_ID, false)).toEqual({ organizationId: ARC_ORG_ID });
  });

  it("anonymous callers see only the public platform catalog", () => {
    expect(assessmentListScope(undefined, false)).toEqual({ organizationId: null });
  });
});

describe("GET /api/assessments tenant scoping (C-2)", () => {
  it("student with org context receives own-org PUBLISHED assessments only â€” never null-org legacy records", async () => {
    const res = await request(app)
      .get("/api/assessments")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, ["student"])}`)
      .set("x-organization-id", ARC_ORG_ID);
    expect(res.status).toBe(200);
    expect(mockedPrisma.assessment.findMany).toHaveBeenCalledTimes(1);
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    // Own-org only; a null-org record like "matth quiz 1" can never match.
    expect(where).toEqual({ status: "PUBLISHED", organizationId: ARC_ORG_ID });
  });

  it("student cannot un-pin the PUBLISHED status filter", async () => {
    await request(app)
      .get("/api/assessments?status=DRAFT")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, ["student"])}`)
      .set("x-organization-id", ARC_ORG_ID);
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    expect(where.status).toBe("PUBLISHED");
  });

  it("teacher with org context sees own-org content (any status) plus PUBLISHED platform content â€” not platform DRAFTs", async () => {
    await request(app)
      .get("/api/assessments")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, ["teacher"])}`)
      .set("x-organization-id", ARC_ORG_ID);
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    expect(where.OR).toEqual([
      { organizationId: ARC_ORG_ID },
      { organizationId: null, status: "PUBLISHED" },
    ]);
  });

  it("member of another tenant is scoped to that tenant â€” ARC content is not exposed", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
      activeMembership(OTHER_ORG_ID) as never
    );
    await request(app)
      .get("/api/assessments")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, ["student"])}`)
      .set("x-organization-id", OTHER_ORG_ID);
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    expect(where.organizationId).toBe(OTHER_ORG_ID);
  });

  it("super_admin without org header keeps the global catalog (existing admin tooling)", async () => {
    await request(app)
      .get("/api/assessments")
      .set("Authorization", `Bearer ${tokenFor(USER_ID, ["super_admin"])}`);
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    expect(where.OR).toBeUndefined();
  });

  it("anonymous callers see only the published platform catalog", async () => {
    await request(app).get("/api/assessments");
    const call = mockedPrisma.assessment.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    const where = (call?.where ?? {}) as Record<string, unknown>;
    expect(where).toEqual({ status: "PUBLISHED", organizationId: null });
  });
});

describe("program overview payload (H-1)", () => {
  it("includes the real question configuration on assessments so 'N Questions' is never undefined", async () => {
    mockedPrisma.program.findUnique.mockResolvedValue({
      id: "prog-1",
      slug: "prog",
      status: "PUBLISHED",
      curriculums: [],
      assessments: [],
    } as never);

    await getProgramBySlug("prog");

    expect(mockedPrisma.program.findUnique).toHaveBeenCalledTimes(1);
    const args = mockedPrisma.program.findUnique.mock.calls[0][0];
    const select = (args as { include: { assessments: { select: Record<string, unknown> } } })
      .include.assessments.select;
    expect(select.questionCount).toBe(true);
    expect(select.timeLimitMinutes).toBe(true);
    expect(select.passingScore).toBe(true);
    expect(select.randomizeQuestions).toBe(true);
    expect(select._count).toEqual({ select: { questions: true } });
  });
});

describe("per-program progression (H-3)", () => {
  it("honors an explicit programId even when the learner has a different currentProgram", async () => {
    mockedPrisma.program.findUnique.mockResolvedValue({
      id: "crp-program",
      curriculums: [],
    } as never);

    const result = await getProgression(USER_ID, "crp-program");

    expect(mockedPrisma.program.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "crp-program" } })
    );
    expect(result.program).toEqual(expect.objectContaining({ id: "crp-program" }));
  });
});

