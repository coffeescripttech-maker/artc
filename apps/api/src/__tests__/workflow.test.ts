import { describe, it, expect } from "vitest";
import {
  assertTransition,
  assertCanPublish,
  isApprovalRequired,
  withAutoPublish,
} from "../lib/tenant-scope";
import { ValidationError, ForbiddenError } from "../lib/errors";

/**
 * Content approval workflow (CS#6 — §17).
 * State machine: DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED (reject → DRAFT).
 */

describe("assertTransition (state machine)", () => {
  it("allows DRAFT → UNDER_REVIEW via submit", () => {
    expect(() => assertTransition("DRAFT", "SUBMIT_REVIEW")).not.toThrow();
  });

  it("allows UNDER_REVIEW → APPROVED via approve", () => {
    expect(() => assertTransition("UNDER_REVIEW", "APPROVE")).not.toThrow();
  });

  it("allows UNDER_REVIEW → DRAFT via reject", () => {
    expect(() => assertTransition("UNDER_REVIEW", "REJECT")).not.toThrow();
  });

  it("rejects approve from DRAFT (must be submitted first)", () => {
    expect(() => assertTransition("DRAFT", "APPROVE")).toThrow(ValidationError);
  });

  it("rejects submit from PUBLISHED", () => {
    expect(() => assertTransition("PUBLISHED", "SUBMIT_REVIEW")).toThrow(
      ValidationError,
    );
  });

  it("rejects reject from APPROVED (nothing to reject)", () => {
    expect(() => assertTransition("APPROVED", "REJECT")).toThrow(ValidationError);
  });
});

describe("isApprovalRequired (org policy)", () => {
  it("never requires approval for platform-owned content", () => {
    expect(isApprovalRequired(null, {}, undefined)).toBe(false);
    expect(isApprovalRequired(undefined, {}, undefined)).toBe(false);
  });

  it("never requires approval for platform admins", () => {
    expect(
      isApprovalRequired("org1", {}, ["super_admin"]),
    ).toBe(false);
    expect(
      isApprovalRequired("org1", {}, ["content_admin"]),
    ).toBe(false);
  });

  it("defaults to direct publishing for org content without metadata (backward compatible)", () => {
    expect(isApprovalRequired("org1", undefined, ["teacher"])).toBe(false);
    expect(isApprovalRequired("org1", {}, ["teacher"])).toBe(false);
  });

  it("requires approval when teacher_auto_publish is explicitly false", () => {
    expect(
      isApprovalRequired("org1", { teacher_auto_publish: false }, ["teacher"]),
    ).toBe(true);
  });
});

describe("assertCanPublish (publish guard)", () => {
  it("allows publishing APPROVED content in review-mode orgs", () => {
    expect(() =>
      assertCanPublish("APPROVED", "org1", { teacher_auto_publish: false }, [
        "teacher",
      ]),
    ).not.toThrow();
  });

  it("blocks publishing DRAFT content in review-mode orgs", () => {
    expect(() =>
      assertCanPublish("DRAFT", "org1", { teacher_auto_publish: false }, [
        "teacher",
      ]),
    ).toThrow(ForbiddenError);
  });

  it("blocks publishing UNDER_REVIEW content in review-mode orgs", () => {
    expect(() =>
      assertCanPublish("UNDER_REVIEW", "org1", { teacher_auto_publish: false }, [
        "teacher",
      ]),
    ).toThrow(ForbiddenError);
  });

  it("allows direct publish from DRAFT in auto-publish orgs (existing behavior)", () => {
    expect(() =>
      assertCanPublish("DRAFT", "org1", { teacher_auto_publish: true }, [
        "teacher",
      ]),
    ).not.toThrow();
  });

  it("allows direct publish from DRAFT when org has no metadata (default auto-publish)", () => {
    expect(() =>
      assertCanPublish("DRAFT", "org1", undefined, ["teacher"]),
    ).not.toThrow();
  });

  it("platform admins bypass the review queue entirely", () => {
    expect(() =>
      assertCanPublish("DRAFT", "org1", { teacher_auto_publish: false }, [
        "super_admin",
      ]),
    ).not.toThrow();
  });

  it("still enforces the state machine for platform admins (archived not publishable)", () => {
    expect(() =>
      assertCanPublish("ARCHIVED", null, undefined, ["super_admin"]),
    ).toThrow(ValidationError);
  });
});

describe("withAutoPublish (org settings helper)", () => {
  it("adds the flag to empty metadata", () => {
    expect(withAutoPublish(undefined, true)).toEqual({
      teacher_auto_publish: true,
    });
  });

  it("preserves other metadata keys", () => {
    const meta = { theme: "dark" };
    expect(withAutoPublish(meta, false)).toEqual({
      theme: "dark",
      teacher_auto_publish: false,
    });
  });
});