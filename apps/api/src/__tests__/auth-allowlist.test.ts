import { describe, it, expect } from "vitest";
import { resolveSelfServiceRole } from "../modules/auth/service";
import { SELF_SERVICE_ROLES } from "@aratc/shared";
import { ValidationError } from "../lib/errors";

/**
 * SECURITY: registration is the only place a visitor can influence their own
 * role. These tests pin the server-side allowlist so privileged roles can
 * never be self-assigned, regardless of validation-layer changes.
 */
describe("resolveSelfServiceRole (registration role allowlist)", () => {
  it("allows exactly the self-service roles", () => {
    expect(SELF_SERVICE_ROLES).toEqual(["student", "parent", "teacher"]);
  });

  it("resolves each allowed account type", () => {
    expect(resolveSelfServiceRole("student")).toBe("student");
    expect(resolveSelfServiceRole("parent")).toBe("parent");
    expect(resolveSelfServiceRole("teacher")).toBe("teacher");
  });

  it("defaults to student when accountType is missing", () => {
    expect(resolveSelfServiceRole(undefined)).toBe("student");
    expect(resolveSelfServiceRole(null)).toBe("student");
    expect(resolveSelfServiceRole("")).toBe("student");
  });

  it("rejects every privileged role", () => {
    for (const role of [
      "super_admin",
      "content_admin",
      "school_admin",
      "admin",
      "instructor",
      "billing_admin",
    ]) {
      expect(() => resolveSelfServiceRole(role)).toThrow(ValidationError);
    }
  });

  it("rejects non-string garbage", () => {
    for (const bad of [123, true, {}, [], "  student"]) {
      expect(() => resolveSelfServiceRole(bad)).toThrow(ValidationError);
    }
  });
});