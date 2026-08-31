"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";
import { lessonsApi, progressApi } from "@/lib/api/client";
import { normalizeLessonContent } from "@aratc/shared";
import { Button, Badge } from "@/components/ui";
import { cn } from "@aratc/ui";
import {
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Trophy,
  GraduationCap,
  ClipboardList,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface LessonApi {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: string;
  durationMinutes?: number | null;
  content?: unknown;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  topic?: {
    id: string;
    name: string;
    module?: { id: string; name: string; subject?: { id: string; name: string } };
  };
}

interface SiblingLesson {
  id: string;
  title: string;
  orderIndex: number;
  status: string;
}

// CS#23.1 — student learning workspace payload (GET /lessons/:id/workspace)
interface WorkspaceAssessment {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  questionCount: number | null;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  _count: { questions: number };
}

interface WorkspacePayload {
  lesson: LessonApi;
  curriculum: { id: string; name: string; stage: string; gradeLevel: string | null; orderIndex: number };
  program: {
    id: string;
    slug: string;
    name: string;
    programType: string | null;
    assessments: WorkspaceAssessment[];
  };
  courses: Array<{
    subjectId: string;
    subjectName: string;
    customName: string | null;
    orderIndex: number;
    modules: Array<{
      id: string;
      name: string;
      orderIndex: number;
      topics: Array<{
        id: string;
        name: string;
        orderIndex: number;
        lessons: Array<{ id: string; title: string; slug: string; durationMinutes: number | null; orderIndex: number }>;
      }>;
    }>;
  }>;
  flatLessons: Array<{ id: string; title: string; slug: string; orderIndex: number }>;
  lessonIndex: number;
  completedLessonIds: string[];
  progressById: Record<string, { completionPercentage: number; mastery: string }>;
  questionStats: QuestionStats;
}

interface QuestionStats {
  totalBlocks: number;
  answeredBlocks: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
}

interface ProgressWithQuestions {
  lessonId: string;
  completed: boolean;
  completionPercentage: number;
  mastery: string;
  questionStats: QuestionStats;
}

const typeLabels: Record<string, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  MIXED: "Mixed",
  ACTIVITY: "Activity",
  PRACTICE: "Practice",
};

/**
 * Compact Course/Lesson Outline built from the workspace payload:
 * subject → module → topic → lesson with real completion state.
 * Desktop: collapsible sticky panel or slim icon rail (240-260px when open).
 * Mobile: header button + slide-in drawer — never a permanent outline.
 * All states come from real data — no fabricated progress.
 */
function CourseOutline({
  workspace,
  currentLessonId,
  collapsed,
  onToggleCollapsed,
}: {
  workspace: WorkspacePayload;
  currentLessonId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const completed = new Set(workspace.completedLessonIds);
  const doneCount = workspace.completedLessonIds.length;
  const totalCount = workspace.flatLessons.length;
  const coursePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const renderTree = (onNavigate?: () => void) => (
    <>
      {workspace.courses.map((course) => (
        <div key={course.subjectId} className="mb-4 last:mb-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-arc-slate-400 px-2 mb-1.5 truncate">
            {course.customName || course.subjectName}
          </div>
          {course.modules.map((m) => (
            <div key={m.id} className="mb-2 last:mb-0">
              <div className="text-xs font-medium text-arc-slate-500 px-2 mb-1 truncate">
                {m.name}
              </div>
              {m.topics.map((t) => (
                <div key={t.id} className="mb-1.5 last:mb-0">
                  <div className="text-xs text-arc-slate-400 px-2 mb-0.5 truncate">{t.name}</div>
                  <ul>
                    {t.lessons.map((l) => {
                      const isCurrent = l.id === currentLessonId;
                      const isDone = completed.has(l.id);
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/dashboard/lessons/${l.id}`}
                            onClick={onNavigate}
                            aria-current={isCurrent ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors border-l-2",
                              isCurrent
                                ? "bg-arc-orange-50 text-arc-navy-900 font-medium border-arc-orange-500"
                                : "text-arc-slate-600 hover:bg-arc-slate-50 border-transparent"
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-arc-slate-300 flex-shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );

  const progressRow = (
    <div className="px-2 mb-3">
      <div className="flex justify-between text-[11px] font-medium text-arc-slate-400 mb-1">
        <span>Course progress</span>
        <span>
          {doneCount}/{totalCount}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-arc-slate-100 overflow-hidden">
        <div
          className="h-full bg-arc-green-500 transition-all duration-300"
          style={{ width: `${coursePct}%` }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — expanded outline */}
      {!collapsed && (
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-arc-slate-200 bg-white p-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-4 w-4 text-arc-navy-700 flex-shrink-0" />
                <span className="text-sm font-semibold text-arc-navy-900 truncate">
                  {workspace.program.name}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse lesson outline"
                className="p-1.5 rounded-md text-arc-slate-400 hover:text-arc-navy-700 hover:bg-arc-slate-100 transition-colors flex-shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            {progressRow}
            {renderTree()}
          </div>
        </aside>
      )}

      {/* Desktop — collapsed icon rail */}
      {collapsed && (
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-arc-slate-200 bg-white p-2 flex flex-col items-center">
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Expand lesson outline"
              title="Expand lesson outline"
              className="p-2 rounded-lg text-arc-navy-700 hover:bg-arc-slate-100 transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <div className="w-6 h-px bg-arc-slate-200 my-2" aria-hidden="true" />
            <nav aria-label="Lesson outline" className="flex flex-col items-center gap-1">
              {workspace.flatLessons.map((l) => {
                const isCurrent = l.id === currentLessonId;
                const isDone = completed.has(l.id);
                return (
                  <Link
                    key={l.id}
                    href={`/dashboard/lessons/${l.id}`}
                    title={l.title}
                    aria-label={l.title}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isCurrent
                        ? "bg-arc-orange-50 text-arc-orange-600 ring-1 ring-arc-orange-300"
                        : isDone
                        ? "text-green-500 hover:bg-arc-slate-100"
                        : "text-arc-slate-300 hover:bg-arc-slate-100"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      )}

      {/* Mobile — outline button */}
      {/* Mobile — outline button (drawer below) */}
      <div className="lg:hidden mb-5">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-arc-slate-200 bg-white px-4 py-3 text-sm font-semibold text-arc-navy-900 hover:border-arc-orange-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-arc-navy-700" />
            Lesson Outline
          </span>
          <span className="text-xs font-normal text-arc-slate-500">
            {doneCount}/{totalCount} completed
          </span>
        </button>
      </div>

      {/* Mobile — slide-in drawer */}
      <div
        className={cn("lg:hidden fixed inset-0 z-50", !mobileOpen && "pointer-events-none")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-arc-navy-900/50 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Lesson outline"
          className={cn(
            "absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-arc-slate-200">
            <span className="flex items-center gap-2 text-sm font-semibold text-arc-navy-900 min-w-0">
              <GraduationCap className="h-4 w-4 text-arc-navy-700 flex-shrink-0" />
              <span className="truncate">{workspace.program.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close lesson outline"
              className="p-1.5 rounded-md text-arc-slate-400 hover:text-arc-navy-700 hover:bg-arc-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {progressRow}
            {renderTree(() => setMobileOpen(false))}
          </div>
        </aside>
      </div>
    </>
  );
}

export default function StudentLessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonApi | null>(null);
  const [siblings, setSiblings] = useState<SiblingLesson[]>([]);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);

  const [progressData, setProgressData] = useState<ProgressWithQuestions | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const data = (await progressApi.getLessonWithQuestions(lessonId)) as ProgressWithQuestions;
      setProgressData(data);
    } catch (err) {
      // Silently fail — progress is optional
      console.error("Failed to load question progress:", err);
    }
  }, [lessonId]);

  // Next lesson in the real learning sequence (curriculum-wide when the
  // workspace is available; same-topic siblings in the legacy fallback flow).
  const orderedForFlow: Array<{ id: string }> = workspace ? workspace.flatLessons : siblings;
  const indexForFlow = workspace
    ? workspace.lessonIndex
    : siblings.findIndex((s) => s.id === lessonId);
  const nextLessonId =
    indexForFlow >= 0 && indexForFlow < orderedForFlow.length - 1
      ? orderedForFlow[indexForFlow + 1].id
      : null;

  const handleToggleComplete = async () => {
    const next = !progressData?.completed;
    setSavingProgress(true);
    setCompletionError(null);
    try {
      await progressApi.setLesson(lessonId, next);
      // Keep the workspace course-tree in sync without a refetch.
      setWorkspace((ws) =>
        ws
          ? {
              ...ws,
              completedLessonIds: next
                ? Array.from(new Set([...ws.completedLessonIds, lessonId]))
                : ws.completedLessonIds.filter((id) => id !== lessonId),
            }
          : ws
      );
      await fetchProgress();
    } catch (err) {
      // CS#23.1 — the completion was NOT saved; tell the student (retry = the
      // same button). Never fake a completed state on failure.
      console.error("Failed to save progress:", err);
      setCompletionError("We couldn't save your progress. Please try again.");
    } finally {
      setSavingProgress(false);
    }
  };

  // Complete the current lesson, then continue to the next one in the real
  // curriculum sequence. Never navigates if the completion was not persisted.
  const handleCompleteAndContinue = async () => {
    if (!nextLessonId) return;
    if (progressData?.completed) {
      router.push(`/dashboard/lessons/${nextLessonId}`);
      return;
    }
    setSavingProgress(true);
    setCompletionError(null);
    try {
      await progressApi.setLesson(lessonId, true);
      setWorkspace((ws) =>
        ws
          ? {
              ...ws,
              completedLessonIds: Array.from(new Set([...ws.completedLessonIds, lessonId])),
            }
          : ws
      );
      await fetchProgress();
      router.push(`/dashboard/lessons/${nextLessonId}`);
    } catch (err) {
      console.error("Failed to save progress:", err);
      setCompletionError("We couldn't save your progress. Please try again.");
    } finally {
      setSavingProgress(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      setWorkspace(null);
      try {
        // CS#23.1 — prefer the single authorized workspace read (enrolled
        // learners). Falls back to the legacy public flow for contexts where
        // the workspace is not applicable (e.g. staff previewing content).
        const ws = (await lessonsApi.getWorkspace(lessonId).catch(() => null)) as WorkspacePayload | null;
        if (ws && active) {
          setWorkspace(ws);
          setLesson(ws.lesson);
          const self = ws.progressById[lessonId];
          setProgressData({
            lessonId,
            completed: (self?.completionPercentage ?? 0) >= 100,
            completionPercentage: self?.completionPercentage ?? 0,
            mastery: self?.mastery ?? "NOT_STARTED",
            questionStats: ws.questionStats,
          });
        } else if (active) {
          const data = (await lessonsApi.getById(lessonId)) as LessonApi;
          if (!active) return;
          setLesson(data);

          if (data.topic?.id) {
            const list = (await lessonsApi.list(data.topic.id).catch(() => [])) as SiblingLesson[];
            if (active && Array.isArray(list)) {
              setSiblings([...list].sort((a, b) => a.orderIndex - b.orderIndex));
            }
          }

          await fetchProgress();
        }
      } catch (err) {
        console.error("Failed to load lesson:", err);
        if (active) setError("This lesson could not be loaded.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lessonId, fetchProgress]);

  const handleQuestionComplete = (_correct: boolean, _earnedPoints: number) => {
    // Refresh progress so the score card updates live
    fetchProgress();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Lesson unavailable</h2>
          <p className="text-arc-slate-500 mb-4">{error || "This lesson does not exist."}</p>
          <Link href="/dashboard">
            <Button variant="accent">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subject = lesson.topic?.module?.subject;
  const parentModule = lesson.topic?.module;
  const content = normalizeLessonContent(lesson.content);

  // CS#23.1 — real curriculum-wide ordering from the workspace when available;
  // falls back to same-topic siblings for the legacy (non-enrolled) flow.
  const orderedLessons: Array<{ id: string; title: string }> = workspace
    ? workspace.flatLessons
    : siblings;
  const currentIndex = workspace
    ? workspace.lessonIndex
    : siblings.findIndex((s) => s.id === lesson.id);
  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  const qs = progressData?.questionStats;
  const hasQuestions = qs && qs.totalBlocks > 0;

  return (
    <>
      <DashboardHeader
        title={lesson.title}
        subtitle={
          [
            // CS#23.1 §4 — program context + real position in the sequence
            workspace
              ? `Lesson ${workspace.lessonIndex + 1} of ${workspace.flatLessons.length}`
              : null,
            subject?.name,
            parentModule?.name,
            lesson.topic?.name,
          ]
            .filter(Boolean)
            .join(" › ") || undefined
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          // CS#23.1 §4 — back navigation to the enrolled program
          ...(workspace
            ? [
                {
                  label: workspace.program.name,
                  href: `/dashboard/programs/${workspace.program.id}`,
                },
              ]
            : []),
          ...(subject ? [{ label: subject.name }] : []),
          ...(lesson.topic ? [{ label: lesson.topic.name }] : []),
          { label: lesson.title },
        ]}
      />

      <div className="p-6">
        <div
          className={cn(
            "mx-auto",
            workspace
              ? cn(
                  "max-w-6xl lg:grid lg:gap-8",
                  outlineCollapsed
                    ? "lg:grid-cols-[64px_minmax(0,1fr)]"
                    : "lg:grid-cols-[260px_minmax(0,1fr)]"
                )
              : "max-w-3xl"
          )}
        >
          {workspace && (
            <CourseOutline
              workspace={workspace}
              currentLessonId={lesson.id}
              collapsed={outlineCollapsed}
              onToggleCollapsed={() => setOutlineCollapsed((c) => !c)}
            />
          )}
          <div className="min-w-0 max-w-3xl mx-auto w-full">
          {lesson.status !== "PUBLISHED" && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
              This lesson is <strong>{lesson.status.toLowerCase()}</strong> and not yet visible to students.
            </div>
          )}

          {/* Lesson header — lightweight context (§2) */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-arc-orange-100 text-arc-orange-700">
                {typeLabels[lesson.type] || lesson.type}
              </Badge>
              {lesson.durationMinutes ? (
                <span className="flex items-center gap-1 text-sm text-arc-slate-500">
                  <Clock className="h-4 w-4" />
                  {lesson.durationMinutes} min
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-arc-navy-900">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-arc-slate-600 mt-2">{lesson.description}</p>
            )}

            {/* Lesson + course progress (§10) — real persisted values only */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="w-44">
                <div className="flex justify-between text-[11px] font-medium text-arc-slate-400 mb-1">
                  <span>Lesson</span>
                  <span>{Math.round(progressData?.completionPercentage ?? 0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-arc-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-arc-orange-500 transition-all duration-300"
                    style={{ width: `${Math.round(progressData?.completionPercentage ?? 0)}%` }}
                  />
                </div>
              </div>
              {workspace && (
                <div className="w-44">
                  <div className="flex justify-between text-[11px] font-medium text-arc-slate-400 mb-1">
                    <span>Course</span>
                    <span>
                      {workspace.completedLessonIds.length} of {workspace.flatLessons.length}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-arc-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-arc-green-500 transition-all duration-300"
                      style={{
                        width: `${
                          workspace.flatLessons.length > 0
                            ? Math.round(
                                (workspace.completedLessonIds.length /
                                  workspace.flatLessons.length) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question score card */}
          {hasQuestions && qs && (
            <div className="mb-6 rounded-xl border border-arc-orange-200 bg-arc-orange-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-arc-orange-500" />
                <span className="font-semibold text-arc-navy-900">Practice Score</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-arc-navy-900 font-medium">
                    {qs.earnedPoints} / {qs.totalPoints} points
                  </span>
                  <span className="text-arc-navy-900 font-medium">
                    {qs.correctAnswers} / {qs.totalBlocks} correct
                  </span>
                </div>

                <div className="w-full h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-arc-orange-500 transition-all"
                    style={{ width: `${(qs.earnedPoints / qs.totalPoints) * 100}%` }}
                  />
                </div>

                <div className="text-xs text-arc-slate-500">
                  {qs.answeredBlocks === qs.totalBlocks
                    ? "All questions answered!"
                    : `${qs.totalBlocks - qs.answeredBlocks} questions remaining`}
                </div>
              </div>
            </div>
          )}

          {/* Lesson content */}
          <article className="bg-white rounded-2xl border border-arc-slate-200 p-6 sm:p-8">
            {content.blocks.length === 0 ? (
              <div className="text-center py-12 text-arc-slate-400">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-arc-slate-300" />
                <p>This lesson has no content yet.</p>
              </div>
            ) : (
              <LessonBlockRenderer
                content={content}
                lessonId={lesson.id}
                onQuestionComplete={handleQuestionComplete}
              />
            )}
          </article>

          {/* Lesson completion — ONE consolidated state (§3/§8) */}
          {completionError && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              {completionError}
            </div>
          )}

          {progressData?.completed && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-arc-navy-900">Lesson Mastered</span>
              </div>
              <p className="text-sm text-arc-slate-600 mt-1">You completed this lesson.</p>
              {workspace && !nextLesson && (
                <p className="text-sm font-medium text-arc-navy-900 mt-2">
                  🎉 You&apos;ve completed all lessons in {workspace.program.name}.
                </p>
              )}
            </div>
          )}

          {/* Previous / Next navigation (§9) — primary CTA reflects state */}
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-arc-slate-200 pt-6">
            {prevLesson ? (
              <Link href={`/dashboard/lessons/${prevLesson.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3 rounded-lg border border-arc-slate-200 bg-white px-4 py-3 hover:border-arc-orange-300 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-arc-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-arc-slate-400">Previous</div>
                    <div className="text-sm font-medium text-arc-navy-900 truncate">
                      {prevLesson.title}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextLesson ? (
              progressData?.completed ? (
                <Link href={`/dashboard/lessons/${nextLesson.id}`} className="flex-shrink-0">
                  <Button variant="accent" aria-live="polite">
                    Continue to Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="accent"
                  className="flex-shrink-0"
                  onClick={handleCompleteAndContinue}
                  disabled={savingProgress}
                  aria-live="polite"
                >
                  {savingProgress ? "Saving..." : "Complete Lesson & Continue"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )
            ) : progressData?.completed ? (
              workspace ? (
                <Link
                  href={`/dashboard/programs/${workspace.program.id}`}
                  className="flex-shrink-0"
                >
                  <Button variant="outline">Back to Program</Button>
                </Link>
              ) : (
                <div className="flex-1" />
              )
            ) : (
              <Button
                variant="accent"
                className="flex-shrink-0"
                onClick={handleToggleComplete}
                disabled={savingProgress}
                aria-live="polite"
              >
                {savingProgress ? "Saving..." : "Mark Lesson Complete"}
              </Button>
            )}
          </div>

          {/* Up-next context under the primary CTA (§9) */}
          {nextLesson && (
            <div className="mt-2.5 text-right min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-arc-slate-400">
                Next lesson
              </div>
              <div className="text-sm font-medium text-arc-navy-900 truncate">
                {nextLesson.title}
              </div>
            </div>
          )}

          {/* CS#23.1 — program assessment next-step (real published assessments) */}
          {workspace && workspace.program.assessments.length > 0 && (
            <Link
              href={`/dashboard/assessments/${workspace.program.assessments[0].id}`}
              className="block mt-6"
            >
              <div className="flex items-center justify-between gap-4 rounded-xl border border-arc-purple-200 bg-arc-purple-50/60 px-4 py-3 hover:border-arc-purple-300 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <ClipboardList className="h-5 w-5 text-arc-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-arc-purple-600">
                      Program assessment
                    </div>
                    <div className="text-sm font-medium text-arc-navy-900 truncate">
                      {workspace.program.assessments[0].name}
                      {workspace.program.assessments[0].questionCount
                        ? ` · ${workspace.program.assessments[0].questionCount} questions`
                        : ""}
                      {workspace.program.assessments[0].timeLimitMinutes
                        ? ` · ${workspace.program.assessments[0].timeLimitMinutes} min`
                        : ""}
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-arc-purple-600 flex-shrink-0">
                  Start
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
