import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("@aratc/database", () => ({
  prisma: {
    organizationMembership: {
      findUnique: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@aratc/database";
import { programRoutes } from "../modules/programs/routes";
import { errorHandler } from "../middleware/error-handler";
import { config } from "../config";

const mockedPrisma = vi.mocked(prisma, true);

function buildApp() {
  const app = express();
  app.use(express.json());
  // Org context is resolved per-route (after authenticate) inside programRoutes.
  app.use("/api/programs", programRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, { expiresIn: "1h" });
}

const activeMembership = {
  id: "om_1",
  organizationId: "org_1",
  userId: "user-1",
  role: "ADMIN",
  status: "ACTIVE",
  organization: { id: "org_1", name: "Acme", slug: "acme", type: "REVIEW_CENTER" },
};

const programRow = {
  id: "p_1",
  name: "Test Program",
  slug: "test-program",
  organizationId: "org_1",
};

describe("content tenant scoping (real routers + org context, mocked DB)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("GET /api/programs (public list, unscoped)", () => {
    it("does not apply an org filter — public listings are not tenant-scoped", async () => {
      mockedPrisma.program.findMany.mockResolvedValue([] as never);

      const res = await request(app)
        .get("/api/programs")
        .set("Authorization", `Bearer ${tokenFor("user-1", ["content_admin"])}`)
        .set("x-organization-id", "org_1");

      expect(res.status).toBe(200);
      const call = mockedPrisma.program.findMany.mock.calls[0][0] as {
        where?: Record<string, unknown>;
      };
      expect(call.where?.OR).toBeUndefined();
    });
  });

  describe("PUT /api/programs/:id (write tenant isolation)", () => {
    it("forbids editing a program owned by another organization (403)", async () => {
      mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
        activeMembership as never, // caller is a valid org_1 member
      );
      // The target program belongs to org_2.
      mockedPrisma.program.findUnique.mockResolvedValue({
        ...programRow,
        organizationId: "org_2",
      } as never);

      const res = await request(app)
        .put("/api/programs/p_1")
        .set("Authorization", `Bearer ${tokenFor("user-1", ["content_admin"])}`)
        .set("x-organization-id", "org_1")
        .send({ name: "Hijack" });

      expect(res.status).toBe(403);
    });

    it("allows editing a program owned by the caller's org", async () => {
      mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
        activeMembership as never,
      );
      mockedPrisma.program.findUnique
        .mockResolvedValueOnce(programRow as never) // existing lookup
        .mockResolvedValueOnce(null as never); // slug collision check
      mockedPrisma.program.findUnique.mockResolvedValue(programRow as never);
      mockedPrisma.program.update.mockResolvedValue({
        ...programRow,
        name: "Renamed",
      } as never);

      const res = await request(app)
        .put("/api/programs/p_1")
        .set("Authorization", `Bearer ${tokenFor("user-1", ["content_admin"])}`)
        .set("x-organization-id", "org_1")
        .send({ name: "Renamed" });

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/programs (org ownership on create)", () => {
    it("attaches organizationId + createdById from the org context", async () => {
      mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
        activeMembership as never,
      );
      mockedPrisma.program.create.mockResolvedValue(programRow as never);

      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${tokenFor("user-1", ["content_admin"])}`)
        .set("x-organization-id", "org_1")
        .send({ name: "Test Program", slug: "test-program", stage: "COLLEGE" });

      expect(res.status).toBe(201);
      expect(mockedPrisma.program.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org_1",
            createdById: "user-1",
          }),
        }),
      );
    });

    it("creates platform-level content when no org context is present", async () => {
      mockedPrisma.program.create.mockResolvedValue({ ...programRow, organizationId: null } as never);

      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${tokenFor("user-1", ["super_admin"])}`)
        .send({ name: "Test Program", slug: "test-program", stage: "COLLEGE" });

      expect(res.status).toBe(201);
      const call = mockedPrisma.program.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(call.data.organizationId).toBeUndefined();
    });
  });
});
