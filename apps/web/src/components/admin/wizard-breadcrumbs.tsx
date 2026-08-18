"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus, Home, BookOpen, Layers, BookMarked, Box, FileText, Play } from "lucide-react";
import { Breadcrumbs, BreadcrumbItem, deriveBreadcrumbs } from "./breadcrumbs";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useWizardContext } from "@/contexts/wizard-context";

export interface WizardBreadcrumbItem extends BreadcrumbItem {
  entityType?: "program" | "curriculum" | "subject" | "module" | "topic" | "lesson";
}

// Icon map for entity types
const entityIcons = {
  program: BookOpen,
  curriculum: Layers,
  subject: BookMarked,
  module: Box,
  topic: FileText,
  lesson: Play,
};

// Entity labels for add button
const entityLabels = {
  program: "Program",
  curriculum: "Curriculum",
  subject: "Subject",
  module: "Module",
  topic: "Topic",
  lesson: "Lesson",
};

interface WizardBreadcrumbsProps {
  items?: WizardBreadcrumbItem[];
  showAddButton?: boolean;
  onAddClick?: () => void;
  className?: string;
}

/**
 * Enhanced breadcrumbs with "Add [Entity]" button for wizard navigation.
 * Automatically determines entity type from current URL path.
 */
export function WizardBreadcrumbs({
  items,
  showAddButton = true,
  onAddClick,
  className = "",
}: WizardBreadcrumbsProps) {
  const router = useRouter();
  const breadcrumbs = items ?? deriveBreadcrumbs();

  // Determine current entity type from URL
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] || "";
  const entityType = detectEntityType(currentSegment, segments);

  // Build add URL based on context
  const handleAdd = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }

    // Default behavior: navigate to creation page
    const addUrls: Record<string, string> = {
      programs: "/admin/programs/new",
      curriculums: `/admin/programs/${getCurrentProgramId()}/curriculum/new`,
      subjects: "/admin/subjects/new",
      modules: `/admin/subjects/${getCurrentSubjectId()}/modules/new`,
      topics: `/admin/modules/${getCurrentModuleId()}/topics/new`,
      lessons: `/admin/topics/${getCurrentTopicId()}/lessons/new`,
    };

    const basePath = segments.slice(0, -1).join("/");
    const addPath = addUrls[currentSegment] || `${basePath}/new`;

    router.push(addPath);
  };

  if (breadcrumbs.length === 0 && !showAddButton) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-arc-slate-400 flex-shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-arc-slate-500 hover:text-arc-orange-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "text-arc-navy-900 font-medium" : "text-arc-slate-500"
                  }
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {showAddButton && entityType && (
        <Button
          variant="accent"
          size="sm"
          onClick={handleAdd}
          className="ml-4"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add {entityLabels[entityType as keyof typeof entityLabels] || "Item"}
        </Button>
      )}
    </div>
  );
}

/**
 * Detects the entity type from URL segment.
 */
function detectEntityType(
  currentSegment: string,
  segments: string[]
): string | null {
  // Check for creation pages
  if (currentSegment === "new") {
    const parentSegment = segments[segments.length - 2];
    if (parentSegment === "programs") return "program";
    if (parentSegment === "curriculums") return "curriculum";
    if (parentSegment === "subjects") return "subject";
    if (parentSegment === "modules") return "module";
    if (parentSegment === "topics") return "topic";
    if (parentSegment === "lessons") return "lesson";
  }

  // Check for detail/edit pages (UUIDs)
  if (currentSegment.match(/^[a-z0-9]{20,}$/i) || /^\d+$/.test(currentSegment)) {
    const parentSegment = segments[segments.length - 2];
    if (parentSegment === "programs") return "program";
    if (parentSegment === "curriculums") return "curriculum";
    if (parentSegment === "subjects") return "subject";
    if (parentSegment === "modules") return "module";
    if (parentSegment === "topics") return "topic";
    if (parentSegment === "lessons") return "lesson";
    if (parentSegment === "curriculum") return "curriculum";
    if (parentSegment === "curriculum") return "curriculum";
  }

  // Direct segment matches
  const segmentMap: Record<string, string> = {
    programs: "program",
    curriculums: "curriculum",
    subjects: "subject",
    modules: "module",
    topics: "topic",
    lessons: "lesson",
  };

  if (segmentMap[currentSegment]) {
    return segmentMap[currentSegment];
  }

  return null;
}

// Helper functions to extract current IDs from URL
function getCurrentProgramId(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/admin\/programs\/([^\/]+)/);
  return match ? match[1] : "";
}

function getCurrentSubjectId(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/admin\/subjects\/([^\/]+)/);
  return match ? match[1] : "";
}

function getCurrentModuleId(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/admin\/modules\/([^\/]+)/);
  return match ? match[1] : "";
}

function getCurrentTopicId(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/admin\/topics\/([^\/]+)/);
  return match ? match[1] : "";
}

/**
 * Context indicator component showing current position in hierarchy.
 * Used in forms to show "Adding to: Program > Curriculum > Subject"
 */
export function ContextIndicator({
  className = "",
}: {
  className?: string;
}) {
  const ctx = useWizardContext();

  const items: { label: string; href?: string }[] = [];

  if (ctx.programName) {
    items.push({ label: ctx.programName });
  }
  if (ctx.curriculumName) {
    items.push({ label: ctx.curriculumName });
  }
  if (ctx.subjectName) {
    items.push({ label: ctx.subjectName });
  }
  if (ctx.moduleName) {
    items.push({ label: ctx.moduleName });
  }
  if (ctx.topicName) {
    items.push({ label: ctx.topicName });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-arc-slate-50 rounded-lg text-sm ${className}`}
    >
      <span className="text-arc-slate-500">Adding to:</span>
      <div className="flex items-center gap-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-arc-slate-400" />
            )}
            <span className="text-arc-navy-700 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WizardBreadcrumbs;
