import { describe, it, expect, beforeEach, vi } from "vitest";
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
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@aratc/database";
import { organizationRoutes } from "../modules/organizations/routes";
import { errorHandler } from "../middleware/error-handler";
import { config } from "../config";
import { invalidatePermissionCache } from "../middleware/permissions";

const mockedPrisma = vi.mocked(prisma, true);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/organizations", organizationRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(roles: string[]): string {
  return jwt.sign({ userId: "requester-1", roles }, config.jwtSecret, {
    expiresIn: "1h",
  });
}

const orgRow = { id: "org_1", name: "Acme", slug: "acme", type: "REVIEW_CENTER" };

const activeMembership = {
  id: "om_own",
  organizationId: "org_1",
  userId: "requester-1",
  role: "ADMIN",
  status: "ACTIVE",
  organization: orgRow,
};

const userRows = [
  { id: "u2", firstName: "Juan", lastName: "Cruz", email: "juan@acme.com", roles: [] },
];

describe("GET /api/organizations/users/search — layered orgs.users_search (CS#23.4)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    invalidatePermissionCache();
    app = buildApp();
  });

  /** Set the DB grant rows returned for the caller's roles. */
  function grantKeys(keys: string[]) {
    mockedPrisma.rolePermission.findMany.mockResolvedValue(
      keys.map((key) => ({ permission: { key } })) as never,
    );
  }

  it("an org ADMIN member passes via the membership fallback WITHOUT any grant", async () => {
    grantKeys([]); // no orgs.users_search grant in the DB
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
      activeMembership as never,
    );
    mockedPrisma.user.findMany.mockResolvedValue(userRows as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`)
      .set("x-organization-id", "org_1");
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
  });

  it("a granted role WITH a verified org context passes via the grant path even when the membership axis would deny (TEACHER member)", async () => {
    grantKeys(["orgs.users_search"]);
    // resolveOrgContext verifies the caller IS an active member (TEACHER —
    // not an org manager), so the membership fallback alone would deny; the
    // DB grant layered on the verified org context is what allows the call.
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue({
      ...activeMembership,
      id: "om_teacher",
      role: "TEACHER",
    } as never);
    mockedPrisma.user.findMany.mockResolvedValue(userRows as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["teacher"])}`)
      .set("x-organization-id", "org_1");
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
  });

  it("a granted role WITHOUT membership and WITHOUT platform role is DENIED even with an org header (header never grants access)", async () => {
    grantKeys(["orgs.users_search"]);
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(null as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`)
      .set("x-organization-id", "org_1");
    expect(res.status).toBe(403);
  });

  it("a granted role WITHOUT an org context is DENIED (grant cannot bypass tenant scope)", async () => {
    grantKeys(["orgs.users_search"]);
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(null as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);
    expect(res.status).toBe(403);
  });

  it("content_admin passes via the grant path without an org context (platform role)", async () => {
    grantKeys(["orgs.users_search"]);
    mockedPrisma.user.findMany.mockResolvedValue(userRows as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
  });

  it("a role without the grant and without org-manager membership is DENIED (403)", async () => {
    grantKeys([]);
    mockedPrisma.organizationMembership.findUnique.mockResolvedValue(null as never);
    const res = await request(app)
      .get("/api/organizations/users/search?q=ju")
      .set("Authorization", `Bearer ${tokenFor(["student"])}`);
    expect(res.status).toBe(403);
  });

  it("an unauthenticated request is DENIED (401)", async () => {
    const res = await request(app).get("/api/organizations/users/search?q=ju");
    expect(res.status).toBe(401);
  });
});
