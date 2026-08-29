import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock the database layer — these tests exercise real routers, middleware,
// services and authorization logic without a live PostgreSQL instance.
vi.mock("@aratc/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    learnerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@aratc/database";
import { authRoutes } from "../modules/auth/routes";
import { lessonRoutes } from "../modules/lessons/routes";
import { errorHandler } from "../middleware/error-handler";
import { config } from "../config";

const mockedPrisma = vi.mocked(prisma, true);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/lessons", lessonRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(roles: string[]): string {
  return jwt.sign({ userId: "user-1", roles }, config.jwtSecret, {
    expiresIn: "1h",
  });
}

describe("API security contract (real routers, mocked DB)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("POST /api/auth/register", () => {
    const validBody = {
      email: "new.student@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      firstName: "Juan",
      lastName: "Dela Cruz",
    };

    function mockSuccessfulUserCreation(roleName: string) {
      mockedPrisma.user.findUnique.mockResolvedValue(null as never);
      mockedPrisma.user.create.mockResolvedValue({
        id: "u_new",
        email: validBody.email,
        roles: [{ role: { name: roleName } }],
      } as never);
      mockedPrisma.learnerProfile.create.mockResolvedValue({ id: "lp_new" } as never);
    }

    it("registers a student by default", async () => {
      mockSuccessfulUserCreation("student");
      const res = await request(app)
        .post("/api/auth/register")
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.user.roles).toEqual(["student"]);
      expect(mockedPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it("registers a teacher when explicitly requested", async () => {
      mockSuccessfulUserCreation("teacher");
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validBody, accountType: "teacher" });

      expect(res.status).toBe(201);
      expect(res.body.user.roles).toEqual(["teacher"]);
    });

    it("REJECTS self-assigned privileged roles with 400", async () => {
      for (const accountType of ["super_admin", "content_admin", "school_admin"]) {
        mockedPrisma.user.findUnique.mockResolvedValue(null as never);
        const res = await request(app)
          .post("/api/auth/register")
          .send({ ...validBody, accountType });

        expect(res.status).toBe(400);
        expect(mockedPrisma.user.create).not.toHaveBeenCalled();
      }
    });
  });

  describe("GET /api/lessons (published-only visibility)", () => {
    it("pins anonymous callers to PUBLISHED lessons only", async () => {
      mockedPrisma.lesson.findMany.mockResolvedValue([] as never);

      const res = await request(app).get("/api/lessons");

      expect(res.status).toBe(200);
      const where = mockedPrisma.lesson.findMany.mock.calls[0][0]?.where as Record<
        string,
        unknown
      >;
      expect(where.status).toBe("PUBLISHED");
    });

    it("pins student tokens to PUBLISHED lessons only", async () => {
      mockedPrisma.lesson.findMany.mockResolvedValue([] as never);

      await request(app)
        .get("/api/lessons")
        .set("Authorization", `Bearer ${tokenFor(["student"])}`);

      const where = mockedPrisma.lesson.findMany.mock.calls[0][0]?.where as Record<
        string,
        unknown
      >;
      expect(where.status).toBe("PUBLISHED");
    });

    it("lets content_admin tokens see all statuses (admin UI contract)", async () => {
      mockedPrisma.lesson.findMany.mockResolvedValue([] as never);

      await request(app)
        .get("/api/lessons")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`);

      const where = mockedPrisma.lesson.findMany.mock.calls[0][0]?.where as Record<
        string,
        unknown
      >;
      expect(where.status).toBeUndefined();
    });

    it("hides DRAFT lessons from anonymous callers (404, not leak)", async () => {
      mockedPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        status: "DRAFT",
        topic: null,
      } as never);

      const res = await request(app).get("/api/lessons/lesson-1");
      expect(res.status).toBe(404);
    });

    it("hides DRAFT lessons from student callers (404, not leak)", async () => {
      mockedPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        status: "DRAFT",
        topic: null,
      } as never);

      const res = await request(app)
        .get("/api/lessons/lesson-1")
        .set("Authorization", `Bearer ${tokenFor(["student"])}`);
      expect(res.status).toBe(404);
    });

    it("serves PUBLISHED lessons to anonymous callers", async () => {
      mockedPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        status: "PUBLISHED",
        topic: null,
      } as never);

      const res = await request(app).get("/api/lessons/lesson-1");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PUBLISHED");
    });
  });

  describe("auth rate limiting", () => {
    it("blocks credential endpoint abuse with 429 after the window limit", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null as never);

      let sawRateLimit = false;
      // The register tests above already consumed a few slots from the
      // shared per-IP "auth" bucket; drive the endpoint until it 429s.
      for (let i = 0; i < 60; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .send({ email: "nobody@example.com", password: "Password123!" });
        if (res.status === 429) {
          sawRateLimit = true;
          expect(res.body.error.message).toMatch(/too many requests/i);
          expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
          break;
        }
        expect(res.status).toBe(401);
      }
      expect(sawRateLimit).toBe(true);
    });
  });
});