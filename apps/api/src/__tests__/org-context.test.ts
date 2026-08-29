import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@aratc/database", () => ({
  prisma: {
    organizationMembership: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@aratc/database";
import { resolveOrgContext } from "../middleware/org-context";

const mockedFindUnique = vi.mocked(prisma.organizationMembership.findUnique);

function makeReq(headers: Record<string, string> = {}, userId?: string) {
  return {
    headers,
    userId,
    organizationId: undefined,
    membership: undefined,
  } as unknown as Request;
}

function makeRes() {
  return {} as Response;
}

function run(req: Request) {
  return new Promise<{ error?: unknown }>((resolve) => {
    const next: NextFunction = (err?) => resolve({ error: err });
    resolveOrgContext(req, makeRes(), next);
  });
}

const activeMembership = {
  id: "om_1",
  organizationId: "org_1",
  userId: "user-1",
  role: "ADMIN",
  status: "ACTIVE",
  organization: { id: "org_1", name: "Acme Review", slug: "acme", type: "REVIEW_CENTER" },
};

describe("resolveOrgContext middleware (tenant isolation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a no-op when no x-organization-id header is present", async () => {
    const req = makeReq({}, "user-1");
    const result = await run(req);

    expect(result.error).toBeUndefined();
    expect(req.organizationId).toBeUndefined();
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("attaches verified organization context for an ACTIVE member", async () => {
    mockedFindUnique.mockResolvedValue(activeMembership as never);
    const req = makeReq({ "x-organization-id": "org_1" }, "user-1");
    const result = await run(req);

    expect(result.error).toBeUndefined();
    expect(req.organizationId).toBe("org_1");
    expect(req.membership).toEqual({ role: "ADMIN" });
    expect(mockedFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId_userId: { organizationId: "org_1", userId: "user-1" } },
      })
    );
  });

  it("rejects a non-member with ForbiddenError (user A cannot access org B)", async () => {
    mockedFindUnique.mockResolvedValue(null as never);
    const req = makeReq({ "x-organization-id": "org_b" }, "user-1");
    const result = await run(req);

    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain("not an active member");
    expect(req.organizationId).toBeUndefined();
  });

  it("rejects a CANCELLED membership", async () => {
    mockedFindUnique.mockResolvedValue({
      ...activeMembership,
      status: "CANCELLED",
    } as never);
    const req = makeReq({ "x-organization-id": "org_1" }, "user-1");
    const result = await run(req);

    expect((result.error as Error).message).toContain("not an active member");
  });

  it("rejects a PENDING membership", async () => {
    mockedFindUnique.mockResolvedValue({
      ...activeMembership,
      status: "PENDING",
    } as never);
    const req = makeReq({ "x-organization-id": "org_1" }, "user-1");
    const result = await run(req);

    expect((result.error as Error).message).toContain("not an active member");
  });

  it("defers (no-op) when the header is present but unauthenticated — actual auth is per-route (§44)", async () => {
    const req = makeReq({ "x-organization-id": "org_1" }, undefined);
    const result = await run(req);

    expect(result.error).toBeUndefined();
    expect(req.organizationId).toBeUndefined();
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });
});
