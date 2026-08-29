import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aratc/database", () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@aratc/database";
import { searchUsers } from "../modules/organizations/service";
import { ForbiddenError } from "../lib/errors";

const mockedPrisma = vi.mocked(prisma, true);

describe("User search (membership picker)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies plain learners (403)", async () => {
    await expect(searchUsers(["student"], "LEARNER", "ana")).rejects.toThrow(
      ForbiddenError
    );
    expect(mockedPrisma.user.findMany).not.toHaveBeenCalled();
  });

  it("denies users with no role and no membership", async () => {
    await expect(searchUsers([], undefined, "ana")).rejects.toThrow(ForbiddenError);
  });

  it("allows platform admins and queries by name/email", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        firstName: "Ana",
        lastName: "Dela Cruz",
        email: "ana@aratc.edu.ph",
        roles: [{ role: { name: "student" } }],
      },
    ] as never);
    const users = await searchUsers(["super_admin"], undefined, "ana");
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("ana@aratc.edu.ph");
    expect(users[0].roles).toEqual(["student"]);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("allows org OWNER/ADMIN members", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([] as never);
    await expect(searchUsers(["student"], "OWNER", "an")).resolves.toEqual([]);
  });

  it("returns empty for queries shorter than 2 chars without hitting DB", async () => {
    const users = await searchUsers(["super_admin"], undefined, "a");
    expect(users).toEqual([]);
    expect(mockedPrisma.user.findMany).not.toHaveBeenCalled();
  });
});
