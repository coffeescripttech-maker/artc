import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("@aratc/database", () => ({
  prisma: {
    organization: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    organizationMembership: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    parentStudent: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    learnerProfile: { create: vi.fn() },
    program: { count: vi.fn() },
    enrollment: { count: vi.fn() },
    lesson: { count: vi.fn() },
    assessment: { count: vi.fn() },
    batchTeacher: { count: vi.fn() },
    auditEvent: { create: vi.fn(), count: vi.fn() },
    // CS#23.3 — grants resolved for school_admin/content_admin permission gates;
    // teachers/students get none (mirrors the DB seed for tested paths).
    rolePermission: {
      findMany: vi.fn((args: {
        where?: { role?: { name?: { in?: string[] } } };
      }) => {
        const names = args?.where?.role?.name?.in ?? [];
        const grantKeys = [
          "parents.read",
          "parents.manage",
          "orgs.update",
          "users.create",
          "admin.stats_view",
        ];
        const isAdmin = names.some((n) => n === "school_admin" || n === "content_admin");
        const grants = isAdmin
          ? grantKeys.map((key) => ({ permission: { key } }))
          : [];
        return Promise.resolve(grants);
      }),
    },
  },
}));

import { prisma } from "@aratc/database";
import { organizationRoutes } from "../modules/organizations/routes";
import { errorHandler } from "../middleware/error-handler";
import { config } from "../config";

const mockedPrisma = vi.mocked(prisma, true);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/organizations", organizationRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(roles: string[]): string {
  return jwt.sign({ userId: "requester-1", roles }, config.jwtSecret, { expiresIn: "1h" });
}

const orgRow = {
  id: "org_1",
  name: "Acme",
  slug: "acme",
  type: "REVIEW_CENTER",
  status: "PUBLISHED",
  metadata: { contactEmail: "acme@example.com" },
};

function mockResolverAsAdmin() {
  mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
  mockedPrisma.organizationMembership.findUnique.mockResolvedValue({
    id: "om_own",
    organizationId: "org_1",
    userId: "requester-1",
    role: "ADMIN",
    status: "ACTIVE",
  } as never);
}

describe("CS#23.3 organization administration API (real routers, mocked DB)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("GET /api/organizations/:orgId/parents", () => {
    it("returns real parent-role members with org-scoped linked students", async () => {
      mockResolverAsAdmin();
      mockedPrisma.organizationMembership.findMany.mockResolvedValue([
        {
          id: "om_p1",
          organizationId: "org_1",
          userId: "parent-1",
          role: "LEARNER",
          status: "ACTIVE",
          createdAt: new Date(),
          user: {
            id: "parent-1",
            email: "parent@x.com",
            firstName: "Ana",
            lastName: "Reyes",
            phoneNumber: null,
            status: "ACTIVE",
            parentLinks: [
              {
                id: "link1",
                status: "ACTIVE",
                studentUserId: "stu-1",
                student: {
                  id: "stu-1",
                  email: "stu@x.com",
                  firstName: "Juan",
                  lastName: "Reyes",
                  memberships: [{ organizationId: "org_1" }],
                },
              },
              {
                id: "link9",
                status: "ACTIVE",
                studentUserId: "stu-OTHER",
                student: {
                  id: "stu-OTHER",
                  email: "other@y.com",
                  firstName: "X",
                  lastName: "Y",
                  // NOT a member of org_1 → link must not leak into the org view
                  memberships: [{ organizationId: "org_2" }],
                },
              },
            ],
          },
        },
      ] as never);

      const res = await request(app)
        .get("/api/organizations/org_1/parents")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);

      expect(res.status).toBe(200);
      expect(res.body.parents).toHaveLength(1);
      // cross-org student link filtered out
      expect(res.body.parents[0].linkedStudents).toHaveLength(1);
      expect(res.body.parents[0].linkedStudents[0].firstName).toBe("Juan");
      expect(mockedPrisma.organizationMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org_1",
            status: "ACTIVE",
            user: { roles: { some: { role: { name: "parent" } } } },
          }),
        })
      );
    });

    it("denies a teacher (permission-gated 403)", async () => {
      const res = await request(app)
        .get("/api/organizations/org_1/parents")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`);
      expect(res.status).toBe(403);
    });

    it("requires authentication (401)", async () => {
      const res = await request(app).get("/api/organizations/org_1/parents");
      expect(res.status).toBe(401);
    });
  });

  const OWN_ADMIN = {
  id: "om_own",
  organizationId: "org_1",
  userId: "requester-1",
  role: "ADMIN",
  status: "ACTIVE",
};

  describe("POST/DELETE parent-student links", () => {
    it("links a parent and a student in the SAME organization (201 + audit)", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(OWN_ADMIN as never) // assertCanManageOrg own lookup
        .mockResolvedValueOnce({
          status: "ACTIVE",
          user: { roles: [{ role: { name: "parent" } }] },
        } as never)
        .mockResolvedValueOnce({ status: "ACTIVE" } as never);
      mockedPrisma.parentStudent.upsert.mockResolvedValue({
        id: "link1",
        parentUserId: "parent-1",
        studentUserId: "stu-1",
        status: "ACTIVE",
      } as never);

      const res = await request(app)
        .post("/api/organizations/org_1/parents/parent-1/students/stu-1")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);

      expect(res.status).toBe(201);
      expect(res.body.link.status).toBe("ACTIVE");
      expect(mockedPrisma.parentStudent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            parentUserId_studentUserId: { parentUserId: "parent-1", studentUserId: "stu-1" },
          },
          create: expect.objectContaining({ status: "ACTIVE", requestedBy: "ADMIN" }),
        })
      );
      const auditCall = mockedPrisma.auditEvent.create.mock.calls.find(
        (c) => (c[0]?.data?.eventType ?? "") === "PARENT_LINKED"
      );
      expect(auditCall).toBeDefined();
    });

    it("rejects cross-organization linking (student not in org → 400)", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(OWN_ADMIN as never) // assertCanManageOrg own lookup
        .mockResolvedValueOnce({
          status: "ACTIVE",
          user: { roles: [{ role: { name: "parent" } }] },
        } as never)
        .mockResolvedValueOnce(null as never); // student NOT a member of org_1

      const res = await request(app)
        .post("/api/organizations/org_1/parents/parent-1/students/stu-OTHER")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);

      expect(res.status).toBe(400);
      expect(String(res.body.error?.message ?? "")).toContain(
        "Student must be an active member of this organization"
      );
      expect(mockedPrisma.parentStudent.upsert).not.toHaveBeenCalled();
    });

    it("soft-revokes a parent-student link (200 + REVOKED + audit)", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(OWN_ADMIN as never) // assertCanManageOrg own lookup
        .mockResolvedValueOnce({ id: "om_parent" } as never)
        .mockResolvedValueOnce({ id: "om_stu" } as never);
      mockedPrisma.parentStudent.findUnique.mockResolvedValue({
        id: "link1",
        parentUserId: "parent-1",
        studentUserId: "stu-1",
        status: "ACTIVE",
      } as never);
      mockedPrisma.parentStudent.update.mockResolvedValue({
        id: "link1",
        status: "REVOKED",
      } as never);

      const res = await request(app)
        .delete("/api/organizations/org_1/parents/parent-1/students/stu-1")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);

      expect(res.status).toBe(200);
      expect(mockedPrisma.parentStudent.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "REVOKED" } })
      );
      const auditCall = mockedPrisma.auditEvent.create.mock.calls.find(
        (c) => (c[0]?.data?.eventType ?? "") === "PARENT_UNLINKED"
      );
      expect(auditCall).toBeDefined();
    });
  });

  describe("GET /api/organizations/:orgId/overview", () => {
    it("returns real DB counts (super_admin)", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
      mockedPrisma.organizationMembership.count
        .mockResolvedValueOnce(9 as never) // members
        .mockResolvedValueOnce(2 as never) // teachers
        .mockResolvedValueOnce(5 as never) // students
        .mockResolvedValueOnce(4 as never); // parents
      mockedPrisma.program.count.mockResolvedValue(3 as never);
      mockedPrisma.enrollment.count.mockResolvedValue(7 as never);
      mockedPrisma.lesson.count.mockResolvedValue(12 as never);
      mockedPrisma.assessment.count.mockResolvedValue(8 as never);

      const res = await request(app)
        .get("/api/organizations/org_1/overview")
        .set("Authorization", `Bearer ${tokenFor(["super_admin"])}`);

      expect(res.status).toBe(200);
      expect(res.body.overview.members).toBe(9);
      expect(res.body.overview.students).toBe(5);
      expect(res.body.overview.parents).toBe(4);
      expect(res.body.overview.programs).toBe(3);
      expect(mockedPrisma.program.count).toHaveBeenCalledWith({
        where: { organizationId: "org_1" },
      });
    });

    it("denies a teacher (403)", async () => {
      const res = await request(app)
        .get("/api/organizations/org_1/overview")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET/PATCH /api/organizations/:orgId/settings", () => {
    it("reads real organization profile info", async () => {
      mockResolverAsAdmin();
      const res = await request(app)
        .get("/api/organizations/org_1/settings")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`);
      expect(res.status).toBe(200);
      expect(res.body.settings.name).toBe("Acme");
      expect(res.body.settings.contactEmail).toBe("acme@example.com");
    });

    it("updates profile and writes ORG_UPDATED audit event", async () => {
      mockResolverAsAdmin();
      mockedPrisma.organization.update.mockResolvedValue({
        ...orgRow,
        name: "Acme Updated",
        slug: "acme",
        metadata: { contactEmail: "new@example.com" },
      } as never);

      const res = await request(app)
        .patch("/api/organizations/org_1/settings")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`)
        .send({ name: "Acme Updated", contactEmail: "new@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.settings.name).toBe("Acme Updated");
      expect(mockedPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Acme Updated" }),
        })
      );
      const auditCall = mockedPrisma.auditEvent.create.mock.calls.find(
        (c) => (c[0]?.data?.eventType ?? "") === "ORG_UPDATED"
      );
      expect(auditCall).toBeDefined();
    });

    it("rejects an invalid slug (400) without touching the DB row", async () => {
      mockResolverAsAdmin();
      const res = await request(app)
        .patch("/api/organizations/org_1/settings")
        .set("Authorization", `Bearer ${tokenFor(["school_admin"])}`)
        .send({ slug: "BAD SLUG!" });
      expect(res.status).toBe(400);
      expect(mockedPrisma.organization.update).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/organizations/:orgId/users", () => {
    it("denies a teacher (403)", async () => {
      const res = await request(app)
        .post("/api/organizations/org_1/users")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`)
        .send({ email: "t@x.com", password: "password123", firstName: "T", lastName: "X", role: "student" });
      expect(res.status).toBe(403);
    });

    it("rejects assigning a platform role server-side (400)", async () => {
      mockResolverAsAdmin();
      const res = await request(app)
        .post("/api/organizations/org_1/users")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`)
        .send({
          email: "hacker@x.com",
          password: "password123",
          firstName: "H",
          lastName: "E",
          role: "super_admin",
        });
      expect(res.status).toBe(400);
      expect(String(res.body.error?.message ?? "")).toContain(
        "Organization administrators can only assign roles"
      );
      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    });

    it("creates a student user with membership + learner profile (201)", async () => {
      mockResolverAsAdmin();
      mockedPrisma.user.findUnique.mockResolvedValue(null as never);
      mockedPrisma.user.create.mockResolvedValue({
        id: "u9",
        email: "new.student@x.com",
        firstName: "New",
        lastName: "Student",
      } as never);
      mockedPrisma.learnerProfile.create.mockResolvedValue({ id: "lp9" } as never);
      mockedPrisma.organizationMembership.create.mockResolvedValue({
        id: "om9",
      } as never);

      const res = await request(app)
        .post("/api/organizations/org_1/users")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`)
        .send({
          email: "new.student@x.com",
          password: "password123",
          firstName: "New",
          lastName: "Student",
          role: "student",
          membershipRole: "LEARNER",
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("student");
      expect(mockedPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new.student@x.com",
            roles: { create: { role: { connect: { name: "student" } } } },
          }),
        })
      );
      expect(mockedPrisma.learnerProfile.create).toHaveBeenCalled();
      expect(mockedPrisma.organizationMembership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org_1",
            userId: "u9",
            role: "LEARNER",
            status: "ACTIVE",
          }),
        })
      );
    });
  });

  describe("GET /api/organizations/:orgId/members/:userId", () => {
    it("returns real member detail with roles, links and counts", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
      mockedPrisma.organizationMembership.findUnique.mockResolvedValue(OWN_ADMIN as never);
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: "stu-1",
        email: "stu@x.com",
        firstName: "Juan",
        lastName: "Reyes",
        phoneNumber: null,
        status: "ACTIVE",
        createdAt: new Date(),
        roles: [{ role: { name: "student" } }],
        memberships: [{ id: "om_s", role: "LEARNER", status: "ACTIVE", createdAt: new Date() }],
        parentLinks: [],
        studentLinks: [],
      } as never);
      mockedPrisma.enrollment.count.mockResolvedValue(2 as never);
      mockedPrisma.batchTeacher.count.mockResolvedValue(0 as never);
      mockedPrisma.auditEvent.count.mockResolvedValue(5 as never);

      const res = await request(app)
        .get("/api/organizations/org_1/members/stu-1")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`);

      expect(res.status).toBe(200);
      expect(res.body.member.systemRoles).toEqual(["student"]);
      expect(res.body.member.membership.role).toBe("LEARNER");
      expect(res.body.member.activeEnrollments).toBe(2);
      expect(res.body.member.recentAuditEvents).toBe(5);
    });
  });
});