import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("@aratc/database", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    organizationMembership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
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
  return jwt.sign({ userId: "requester-1", roles }, config.jwtSecret, {
    expiresIn: "1h",
  });
}

const orgRow = { id: "org_1", name: "Acme", slug: "acme", type: "REVIEW_CENTER" };

function mockOwnMembership(role: string | null, status = "ACTIVE") {
  mockedPrisma.organization.findUnique.mockResolvedValue(orgRow as never);
  mockedPrisma.organizationMembership.findUnique.mockResolvedValue(
    role
      ? ({
          id: "om_own",
          organizationId: "org_1",
          userId: "requester-1",
          role,
          status,
        } as never)
      : (null as never)
  );
}

const createdMember = {
  id: "om_new",
  organizationId: "org_1",
  userId: "user-2",
  role: "LEARNER",
  status: "ACTIVE",
  createdAt: new Date(),
  user: { id: "user-2", email: "u2@x.com", firstName: "U", lastName: "Two" },
};

describe("organization membership API (real routers, mocked DB)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("GET /api/organizations/me/memberships", () => {
    it("returns ACTIVE memberships of the current user", async () => {
      mockedPrisma.organizationMembership.findMany.mockResolvedValue([
        {
          id: "om_1",
          organizationId: "org_1",
          userId: "requester-1",
          role: "LEARNER",
          status: "ACTIVE",
          createdAt: new Date(),
          organization: orgRow,
        },
      ] as never);

      const res = await request(app)
        .get("/api/organizations/me/memberships")
        .set("Authorization", `Bearer ${tokenFor(["student"])}`);

      expect(res.status).toBe(200);
      expect(res.body.memberships).toHaveLength(1);
      expect(res.body.memberships[0].organization.slug).toBe("acme");
      expect(mockedPrisma.organizationMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "requester-1", status: "ACTIVE" } })
      );
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/api/organizations/me/memberships");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/organizations/:orgId/members", () => {
    const body = { userId: "user-2", role: "LEARNER" };

    it("allows a platform content_admin to grant membership", async () => {
      mockOwnMembership(null); // not a member — platform admin path
      mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-2" } as never);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(null as never) // duplicate check in createMembership
        .mockResolvedValueOnce(null as never);
      mockedPrisma.organizationMembership.create.mockResolvedValue(createdMember as never);

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`)
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body.member.userId).toBe("user-2");
    });

    it("allows an org ADMIN to grant membership in their own org", async () => {
      mockOwnMembership("ADMIN");
      mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-2" } as never);
      mockedPrisma.organizationMembership.findUnique
        // 1st call = own-membership lookup inside assertCanManageOrg
        .mockResolvedValueOnce({
          id: "om_own",
          organizationId: "org_1",
          userId: "requester-1",
          role: "ADMIN",
          status: "ACTIVE",
        } as never)
        // 2nd call = duplicate check in createMembership
        .mockResolvedValueOnce(null as never);
      mockedPrisma.organizationMembership.create.mockResolvedValue(createdMember as never);

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`)
        .send(body);

      expect(res.status).toBe(201);
    });

    it("rejects a plain LEARNER of the org (403)", async () => {
      mockOwnMembership("LEARNER");

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["student"])}`)
        .send(body);

      expect(res.status).toBe(403);
      expect(mockedPrisma.organizationMembership.create).not.toHaveBeenCalled();
    });

    it("rejects a non-member with no platform role (403)", async () => {
      mockOwnMembership(null);

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["student"])}`)
        .send(body);

      expect(res.status).toBe(403);
    });

    it("rejects an inactive (CANCELLED) org admin even with the ADMIN role", async () => {
      mockOwnMembership("ADMIN", "CANCELLED");

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`)
        .send(body);

      expect(res.status).toBe(403);
    });

    it("rejects invalid roles with 400", async () => {
      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["super_admin"])}`)
        .send({ userId: "user-2", role: "super_admin" });

      expect(res.status).toBe(400);
    });

    it("re-activates a CANCELLED membership instead of duplicating", async () => {
      mockOwnMembership(null);
      mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-2" } as never);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce({
          id: "om_old",
          organizationId: "org_1",
          userId: "user-2",
          role: "LEARNER",
          status: "CANCELLED",
        } as never);
      mockedPrisma.organizationMembership.update.mockResolvedValue({
        ...createdMember,
        id: "om_old",
      } as never);

      const res = await request(app)
        .post("/api/organizations/org_1/members")
        .set("Authorization", `Bearer ${tokenFor(["super_admin"])}`)
        .send(body);

      expect(res.status).toBe(201);
      expect(mockedPrisma.organizationMembership.create).not.toHaveBeenCalled();
      expect(mockedPrisma.organizationMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "ACTIVE", role: "LEARNER" } })
      );
    });
  });


  describe("GET /api/organizations (platform admin only)", () => {
    it("returns all organizations for a platform admin", async () => {
      mockedPrisma.organization.findMany.mockResolvedValue([
        { id: "org_1", name: "Acme", slug: "acme", type: "REVIEW_CENTER", _count: { memberships: 3, programs: 2 } },
      ] as never);

      const res = await request(app)
        .get("/api/organizations")
        .set("Authorization", `Bearer ${tokenFor(["super_admin"])}`);

      expect(res.status).toBe(200);
      expect(res.body.organizations).toHaveLength(1);
      expect(res.body.organizations[0].memberCount).toBe(3);
    });

    it("rejects non-platform roles (403)", async () => {
      const res = await request(app)
        .get("/api/organizations")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`);

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/organizations/:orgId/members/:membershipId", () => {
    it("soft-removes a member (status becomes CANCELLED, row kept)", async () => {
      mockOwnMembership(null);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(null as never) // assertCanManageOrg lookup
        .mockResolvedValueOnce({
          id: "om_target",
          organizationId: "org_1",
          userId: "user-2",
          role: "LEARNER",
          status: "ACTIVE",
        } as never); // target lookup
      mockedPrisma.organizationMembership.update.mockResolvedValue({
        id: "om_target",
        status: "CANCELLED",
      } as never);

      const res = await request(app)
        .delete("/api/organizations/org_1/members/om_target")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`);

      expect(res.status).toBe(200);
      expect(mockedPrisma.organizationMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "CANCELLED" } })
      );
    });

    it("blocks removing the last OWNER unless a platform super_admin", async () => {
      mockOwnMembership("ADMIN");
      mockedPrisma.organizationMembership.findUnique
        // 1st call = own-membership lookup inside assertCanManageOrg (org ADMIN)
        .mockResolvedValueOnce({
          id: "om_own",
          organizationId: "org_1",
          userId: "requester-1",
          role: "ADMIN",
          status: "ACTIVE",
        } as never)
        // 2nd call = target membership lookup (an OWNER)
        .mockResolvedValueOnce({
          id: "om_owner",
          organizationId: "org_1",
          userId: "user-owner",
          role: "OWNER",
          status: "ACTIVE",
        } as never);
      mockedPrisma.organizationMembership.count.mockResolvedValue(1 as never);

      const res = await request(app)
        .delete("/api/organizations/org_1/members/om_owner")
        .set("Authorization", `Bearer ${tokenFor(["teacher"])}`);

      expect(res.status).toBe(403);
      expect(String(res.body.error?.message ?? "")).toContain("last OWNER");
    });

    it("does not touch memberships of a different organization", async () => {
      mockOwnMembership(null);
      mockedPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce(null as never)
        .mockResolvedValueOnce({
          id: "om_other",
          organizationId: "org_OTHER",
          userId: "user-2",
          role: "LEARNER",
          status: "ACTIVE",
        } as never);

      const res = await request(app)
        .delete("/api/organizations/org_1/members/om_other")
        .set("Authorization", `Bearer ${tokenFor(["content_admin"])}`);

      expect(res.status).toBe(404);
      expect(mockedPrisma.organizationMembership.update).not.toHaveBeenCalled();
    });
  });
});

