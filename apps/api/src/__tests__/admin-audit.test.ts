import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { buildApp } from "../app";

// Mock the whole @aratc/database module. We assert audit-log calls in isolation
// by capturing the prisma.auditEvent.create invocations.
vi.mock("@aratc/database", () => ({
  prisma: {
        auditEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    enrollment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    learnerProfile: { findUnique: vi.fn() },
    program: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    // CS#23.2 — RBAC middleware resolves effective permissions from the DB.
    // No test role carries DB grants here, so an empty grant set yields the
    // correct 403s; super_admin still bypasses without touching the DB.
    rolePermission: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@aratc/database";

const mockedPrisma = vi.mocked(prisma, true);
const app = buildApp();

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const STUDENT_ID = "00000000-0000-4000-8000-000000000002";
const PROGRAM_ID = "00000000-0000-4000-8000-000000000004";
const ENROLLMENT_ID = "e1";
const LP_ID = "lp-000001";
const ORG_ID = "org-test-1";

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: "1h" });
}

const adminToken = tokenFor(ADMIN_ID, ["school_admin"]);
const studentToken = tokenFor(STUDENT_ID, ["student"]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin audit log (CS#14)", () => {
  it("super_admin can query /api/admin/audit/events", async () => {
    mockedPrisma.auditEvent.findMany = vi.fn().mockResolvedValue([]) as never;

    const res = await request(app)
      .get("/api/admin/audit/events")
      .set("Authorization", `Bearer ${tokenFor(ADMIN_ID, ["super_admin"])}`)
      .set("x-tenant-id", ORG_ID);

    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(ORG_ID);
    expect(res.body.events).toEqual([]);
  });

  it("student cannot access /api/admin/audit/events", async () => {
    const res = await request(app)
      .get("/api/admin/audit/events")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it("no token → 401 (authenticate runs first)", async () => {
    const res = await request(app).get("/api/admin/audit/events");
    expect(res.status).toBe(401);
  });

  it("supports limit + eventType filters", async () => {
    mockedPrisma.auditEvent.findMany = vi.fn().mockResolvedValue([]) as never;

    const res = await request(app)
      .get("/api/admin/audit/events?eventTypes=ENROLLMENT_GRANTED&limit=25")
      .set("Authorization", `Bearer ${tokenFor(ADMIN_ID, ["super_admin"])}`)
      .set("x-tenant-id", ORG_ID);

    expect(res.status).toBe(200);
    expect(mockedPrisma.auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: ORG_ID,
          eventType: { in: ["ENROLLMENT_GRANTED"] },
        }),
        take: 26, // limit + 1 for hasNext
      })
    );
    });
});

describe("Audit instrumentation from enrollment ops (CS#9 → CS#14)", () => {
  it("granting an enrollment produces an ENROLLMENT_GRANTED audit event", async () => {
    mockedPrisma.learnerProfile.findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: LP_ID, userId: STUDENT_ID } as never)
      .mockResolvedValueOnce({ id: LP_ID, userId: STUDENT_ID } as never);
    mockedPrisma.program.findUnique = vi.fn().mockResolvedValue({ id: PROGRAM_ID } as never);
    mockedPrisma.auditEvent.create = vi.fn().mockResolvedValue({} as never);
    mockedPrisma.enrollment.upsert = vi.fn().mockResolvedValue({
      id: ENROLLMENT_ID,
      status: "ACTIVE",
      sourceType: "ADMIN_GRANT",
      expiresAt: null,
      startedAt: new Date(),
      endedAt: null,
      createdAt: new Date(),
      curriculumId: null,
      learner: { id: LP_ID, userId: STUDENT_ID, user: { firstName: "Ana", lastName: "Reyes", email: "s@x.com" } },
      enrolledBy: { id: ADMIN_ID, firstName: "Admin", lastName: "User" },
    } as never);

    const res = await request(app)
      .post(`/api/programs/${PROGRAM_ID}/enrollments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: STUDENT_ID });

    expect(res.status).toBe(201);
    expect(mockedPrisma.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "ENROLLMENT_GRANTED",
          actorId: ADMIN_ID,
        }),
      })
    );
  });

  it("revoking an enrollment produces an ENROLLMENT_REVOKED audit event", async () => {
    mockedPrisma.enrollment.findUnique = vi.fn().mockResolvedValue({
      id: ENROLLMENT_ID,
      status: "ACTIVE",
      endedAt: null,
      expiresAt: null,
      learner: { id: LP_ID, userId: STUDENT_ID, user: { firstName: "Ana", lastName: "Reyes", email: "s@x.com" } },
    } as never);
    mockedPrisma.auditEvent.create = vi.fn().mockResolvedValue({} as never);
    mockedPrisma.enrollment.update = vi.fn().mockResolvedValue({
      id: ENROLLMENT_ID,
      status: "CANCELLED",
      endedAt: new Date(),
      expiresAt: null,
      learner: { id: LP_ID, userId: STUDENT_ID, user: { firstName: "Ana", lastName: "Reyes", email: "s@x.com" } },
    } as never);

    const res = await request(app)
      .patch(`/api/enrollments/${ENROLLMENT_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(200);
    expect(mockedPrisma.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "ENROLLMENT_REVOKED",
        }),
      })
    );
  });

  it("student revocation attempt is rejected (403) and logs nothing", async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${ENROLLMENT_ID}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(403);
    expect(mockedPrisma.auditEvent.create).not.toHaveBeenCalled();
  });
});