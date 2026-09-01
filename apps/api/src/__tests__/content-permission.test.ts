import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("@aratc/database", () => ({
  prisma: {
    organizationMembership: {
      findUnique: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
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
import { invalidatePermissionCache } from "../middleware/permissions";

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

/**
 * CS#23.4 — layered content authorization matrix for POST /api/programs.
 * The global permission grant is the primary path; the org-membership
 * editor rules are the fallback. Both paths are exercised here.
 */
describe("requireContentPermission — layered grant + membership authorization", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    invalidatePermissionCache();
    app = buildApp();
  });

  const validBody = { name: "Test", slug: "test-slug", stage: "COLLEGE" };

  function grantKeys(keys: string[]) {
    mockedPrisma.rolePermission.findMany.mockResolvedValue(
      keys.map((key) => ({ permission: { key } })) as never,
    );
  }

  it("super_admin passes via the grant path WITHOUT an org context", async () => {
    grantKeys([]); // even with zero DB grants — hard system bypass
    mockedPrisma.program.create.mockResolvedValue({ ...programRow, organizationId: null } as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["super_admin"])}`)
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("content_admin passes via the grant path (holds programs.create) without org context", async () => {
    grantKeys(["programs.create"]);
    mockedPrisma.program.create.mockResolvedValue({ ...programRow, organizationId: null } as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["content_admin"])}`)
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("a granted non-platform role WITH org context passes via the grant path", async () => {
    grantKeys(["programs.create"]);
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(activeMembership as never);
    mockedPrisma.program.create.mockResolvedValue(programRow as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["school_admin"])}`)
      .set("x-organization-id", "org_1")
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it("a granted non-platform role WITHOUT org context is DENIED (grant path cannot bypass tenant scope)", async () => {
    grantKeys(["programs.create"]);
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(null as never);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["school_admin"])}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it("an org TEACHER member without the grant still creates drafts via the membership fallback", async () => {
    grantKeys([]); // teacher holds no programs.create grant
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

  it("a student with no membership and no grant is DENIED (403)", async () => {
    grantKeys([]);
    const res = await request(app)
      .post("/api/programs")
      .set("Authorization", `Bearer ${tokenFor("u", ["student"])}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it("an unauthenticated request is DENIED (401)", async () => {
    const res = await request(app).post("/api/programs").send(validBody);
    expect(res.status).toBe(401);
  });
});