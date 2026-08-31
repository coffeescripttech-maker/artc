"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  CheckCircle,
  GraduationCap,
  ClipboardList,
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

function MasteryBadge({ mastery }: { mastery: string }) {
  const cfg: Record<string, { label: string; className: string; icon: JSX.Element }> = {
    MASTERED: {
      label: "Mastered",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-yellow-100 text-yellow-700",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    NOT_STARTED: {
      label: "Not Started",
      className: "bg-arc-slate-100 text-arc-slate-600",
      icon: <BookOpen className="h-3 w-3 mr-1" />,
    },
  };
  const c = cfg[mastery] || cfg.NOT_STARTED;
  return (
    <Badge className={`inline-flex items-center text-xs font-medium ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

/**
 * CS#23.1 — compact course-tree sidebar built from the workspace payload:
 * subject → module → topic → lesson with real completion state. Renders as a
 * sticky sidebar on desktop and a collapsible outline on mobile.
 */
function CourseOutline({
  workspace,
  currentLessonId,
}: {
  workspace: WorkspacePayload;
  currentLessonId: string;
}) {
  const completed = new Set(workspace.completedLessonIds);
  const tree = (
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-xl border border-arc-slate-200 bg-white p-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-arc-navy-700 flex-shrink-0" />
            <span className="text-sm font-semibold text-arc-navy-900 truncate">
              {workspace.program.name}
            </span>
          </div>
          {tree}
        </div>
      </aside>

      {/* Mobile collapsible outline */}
      <details className="lg:hidden mb-6 rounded-xl border border-arc-slate-200 bg-white px-4 py-3">
        <summary className="flex items-center gap-2 text-sm font-semibold text-arc-navy-900 cursor-pointer">
          <GraduationCap className="h-4 w-4 text-arc-navy-700 flex-shrink-0" />
          Course outline · {workspace.program.name}
        </summary>
        <div className="mt-3">{tree}</div>
      </details>
    </>
  );
}

export default function StudentLessonViewerPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonApi | null>(null);
  const [siblings, setSiblings] = useState<SiblingLesson[]>([]);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              ? "max-w-6xl lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8"
              : "max-w-3xl"
          )}
        >
          {workspace && <CourseOutline workspace={workspace} currentLessonId={lesson.id} />}
          <div className="min-w-0 max-w-3xl mx-auto w-full">
          {lesson.status !== "PUBLISHED" && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
              This lesson is <strong>{lesson.status.toLowerCase()}</strong> and not yet visible to students.
            </div>
          )}

          {/* Lesson header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
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
              <h1 className="text-3xl font-bold text-arc-navy-900">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-arc-slate-600 mt-2">{lesson.description}</p>
              )}
            </div>

            {progressData && (
              <MasteryBadge mastery={progressData.mastery} />
            )}
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

          {/* Complete + navigation */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {completionError && (
              <div
                role="alert"
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
              >
                {completionError}
              </div>
            )}
            <Button
              variant={progressData?.completed ? "outline" : "accent"}
              onClick={handleToggleComplete}
              disabled={savingProgress}
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {savingProgress ? "Saving..." : progressData?.completed ? "Completed" : "Mark as complete"}
            </Button>
          </div>

          {/* CS#23.1 — post-completion next step (persisted state only) */}
          {workspace && progressData?.completed && !savingProgress && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-arc-navy-900">Lesson completed</span>
              </div>
              {nextLesson ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <div className="min-w-0">
                    <div className="text-xs text-arc-slate-500">Up next</div>
                    <div className="text-sm font-medium text-arc-navy-900 truncate">
                      {nextLesson.title}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/lessons/${nextLesson.id}`}
                    className="flex-shrink-0"
                  >
                    <Button variant="accent" size="sm">
                      Continue to Next Lesson
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-arc-navy-900">
                      🎉 Program complete
                    </div>
                    <div className="text-xs text-arc-slate-500">
                      You&apos;ve completed all lessons in {workspace.program.name}.
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/programs/${workspace.program.id}`}
                    className="flex-shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      Back to Program
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

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
              <Link href={`/dashboard/lessons/${nextLesson.id}`} className="flex-1 min-w-0">
                <div className="flex items-center justify-end gap-3 rounded-lg border border-arc-slate-200 bg-white px-4 py-3 hover:border-arc-orange-300 transition-colors text-right">
                  <div className="min-w-0">
                    <div className="text-xs text-arc-slate-400">Next</div>
                    <div className="text-sm font-medium text-arc-navy-900 truncate">
                      {nextLesson.title}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-arc-slate-400 flex-shrink-0" />
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>

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
