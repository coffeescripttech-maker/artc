import { describe, it, expect } from "vitest";
import { orgReadScope, assertCanEditContent, canCreateInOrg } from "../lib/tenant-scope";
import { ForbiddenError } from "../lib/errors";

describe("orgReadScope", () => {
  it("returns undefined with no org context (preserves existing behavior)", () => {
    expect(orgReadScope()).toBeUndefined();
  });

  it("filters to platform content OR the caller's org", () => {
    expect(orgReadScope("org_1")).toEqual({
      OR: [{ organizationId: null }, { organizationId: "org_1" }],
    });
  });
});

describe("assertCanEditContent (tenant isolation)", () => {
  it("lets a platform admin manage platform-owned content", () => {
    expect(() =>
      assertCanEditContent(undefined, ["super_admin"], null),
    ).not.toThrow();
  });

  it("lets a content_admin manage platform-owned content", () => {
    expect(() =>
      assertCanEditContent(undefined, ["content_admin"], null),
    ).not.toThrow();
  });

  it("forbids a non-platform admin from editing platform-owned content", () => {
    expect(() => assertCanEditContent("org_1", ["teacher"], null)).toThrow(
      ForbiddenError,
    );
  });

  it("lets a member of the same org edit that org's content", () => {
    expect(() =>
      assertCanEditContent("org_1", ["teacher"], "org_1"),
    ).not.toThrow();
  });

  it("forbids editing another org's content (§36: teacher cannot edit another org's lesson)", () => {
    expect(() => assertCanEditContent("org_1", ["teacher"], "org_2")).toThrow(
      "do not have access",
    );
  });

  it("forbids a caller with no org context from editing org content", () => {
    expect(() =>
      assertCanEditContent(undefined, ["teacher"], "org_1"),
    ).toThrow(ForbiddenError);
  });

  // CS#23.2 regression (§12/§44): platform admins operate at the Platform
  // layer and are authorized across ALL organizations. The superadmin
  // program-delete 403 ("You do not have access to content in this
  // organization") was caused by the bypass existing only for platform-owned
  // (null-org) content.
  it("lets a super_admin manage another org's content (platform-wide scope)", () => {
    expect(() =>
      assertCanEditContent("org_A", ["super_admin"], "org_B"),
    ).not.toThrow();
  });

  it("lets a super_admin with no org context manage org-owned content", () => {
    expect(() =>
      assertCanEditContent(undefined, ["super_admin"], "org_1"),
    ).not.toThrow();
  });

  it("lets a content_admin manage another org's content (platform-wide scope)", () => {
    expect(() =>
      assertCanEditContent(undefined, ["content_admin"], "org_2"),
    ).not.toThrow();
  });

  it("still forbids a school_admin (org role) from editing another org's content", () => {
    expect(() =>
      assertCanEditContent("org_A", ["school_admin"], "org_B"),
    ).toThrow("do not have access");
  });
});

describe("canCreateInOrg", () => {
  it("is false without org context", () => {
    expect(canCreateInOrg()).toBe(false);
  });
  it("is true with an org context", () => {
    expect(canCreateInOrg("org_1")).toBe(true);
  });
});
