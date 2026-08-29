import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("@aratc/database", () => ({
  prisma: {
    organizationMembership: {
      findUnique: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@aratc/database";
import { programRoutes } from "../modules/programs/routes";
import { errorHandler } from "../middleware/error-handler";
import { config } from "../config";

const mockedPrisma = vi.mocked(prisma, true);

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: "1h" });
}

const activeMembership = {
  id: "om_1",
  organizationId: "org_1",
  userId: "u",
  role: "ADMIN",
  status: "ACTIVE",
  organization: { id: "org_1", name: "Acme", slug: "acme", type: "REVIEW_CENTER" },
};

const programRow = { id: "p_1", name: "P", slug: "p", organizationId: "org_1" };

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/programs", programRoutes);
  app.use(errorHandler);
  return app;
}

describe("requireContentEditor — POST /api/programs create-auth matrix", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  const validBody = { name: "Test", slug: "test-slug", stage: "COLLEGE" };

  it("lets a platform content_admin create WITHOUT an org context", async () => {
    mockedPrisma.program.create.mockResolvedValue({ ...programRow, organizationId: null } as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["content_admin"])}`)
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("lets a school_admin create WITH a verified active org context", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(activeMembership as never);
    mockedPrisma.program.create.mockResolvedValue(programRow as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["school_admin"])}`)
      .set("x-organization-id", "org_1")
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("lets an org OWNER/ADMIN member create (no school_admin platform role) with org context", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(activeMembership as never);
    mockedPrisma.program.create.mockResolvedValue(programRow as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["teacher"])}`)
      .set("x-organization-id", "org_1")
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("lets a TEACHER org member create (draft) with org context — §15 teacher content creation", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue({
      ...activeMembership,
      role: "TEACHER",
    } as never);
    mockedPrisma.program.create.mockResolvedValue(programRow as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["teacher"])}`)
      .set("x-organization-id", "org_1")
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("REJECTS a school_admin with NO org context (403) — cannot create platform content", async () => {
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["school_admin"])}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it("REJECTS a learner even WITH org context (403) — members cannot create", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue({
      ...activeMembership,
      role: "LEARNER",
    } as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["student"])}`)
      .set("x-organization-id", "org_1")
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it("REJECTS a teacher with NO membership in the active org (403)", async () => {
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(null as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["teacher"])}`)
      .set("x-organization-id", "org_other")
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it("REJECTS a learner (403)", async () => {
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["student"])}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });
});
