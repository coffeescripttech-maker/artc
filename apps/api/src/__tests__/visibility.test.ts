import { describe, it, expect } from "vitest";
import type { Request } from "express";
import {
  canViewUnpublishedContent,
  publishedOnly,
  isVisible,
} from "../lib/visibility";

function reqWith(roles?: string[]): Request {
  return { userRoles: roles } as unknown as Request;
}

describe("content visibility rules", () => {
  it("denies unpublished access to anonymous requests", () => {
    expect(canViewUnpublishedContent(reqWith(undefined))).toBe(false);
  });

  it("denies unpublished access to learner-scoped roles", () => {
    expect(canViewUnpublishedContent(reqWith(["student"]))).toBe(false);
    expect(canViewUnpublishedContent(reqWith(["parent"]))).toBe(false);
  });

  it("grants unpublished access to privileged roles", () => {
    expect(canViewUnpublishedContent(reqWith(["teacher"]))).toBe(true);
    expect(canViewUnpublishedContent(reqWith(["school_admin"]))).toBe(true);
    expect(canViewUnpublishedContent(reqWith(["content_admin"]))).toBe(true);
    expect(canViewUnpublishedContent(reqWith(["super_admin"]))).toBe(true);
  });

  it("grants access when ANY role is privileged (multi-role users)", () => {
    expect(canViewUnpublishedContent(reqWith(["student", "content_admin"]))).toBe(true);
  });

  it("publishedOnly() restricts non-privileged callers", () => {
    expect(publishedOnly({ includeUnpublished: false })).toEqual({ status: "PUBLISHED" });
    expect(publishedOnly(undefined)).toEqual({ status: "PUBLISHED" });
    expect(publishedOnly({ includeUnpublished: true })).toEqual({});
  });

  it("isVisible() treats drafts/review/archived as hidden by default", () => {
    expect(isVisible("DRAFT")).toBe(false);
    expect(isVisible("UNDER_REVIEW")).toBe(false);
    expect(isVisible("ARCHIVED")).toBe(false);
    expect(isVisible("PUBLISHED")).toBe(true);
    expect(isVisible("DRAFT", { includeUnpublished: true })).toBe(true);
    expect(isVisible(null)).toBe(false);
  });
});