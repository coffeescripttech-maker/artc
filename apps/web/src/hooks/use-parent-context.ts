"use client";

import { useSearchParams } from "next/navigation";

interface ParentContext {
  programId?: string;
  curriculumId?: string;
  subjectId?: string;
  moduleId?: string;
  topicId?: string;
}

/**
 * Hook to read parent context IDs from URL search params.
 * Used by creation pages to auto-fill parent entity IDs.
 *
 * Usage:
 * const { programId, curriculumId } = useParentContext();
 * // URL: /admin/modules/new?subjectId=xxx&moduleId=yyy
 */
export function useParentContext(): ParentContext {
  const searchParams = useSearchParams();

  return {
    programId: searchParams.get("programId") || undefined,
    curriculumId: searchParams.get("curriculumId") || undefined,
    subjectId: searchParams.get("subjectId") || undefined,
    moduleId: searchParams.get("moduleId") || undefined,
    topicId: searchParams.get("topicId") || undefined,
  };
}

// Helper to get a single parent ID by type
export function useParentId(type: "program" | "curriculum" | "subject" | "module" | "topic"): string | undefined {
  const context = useParentContext();
  return context[`${type}Id` as keyof ParentContext];
}
