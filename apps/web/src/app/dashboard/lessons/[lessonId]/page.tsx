"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";
import { lessonsApi, progressApi } from "@/lib/api/client";
import { normalizeLessonContent } from "@aratc/shared";
import { Button, Badge } from "@/components/ui";
import {
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Trophy,
  BarChart3,
  CheckCircle,
  XCircle,
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

export default function StudentLessonViewerPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonApi | null>(null);
  const [siblings, setSiblings] = useState<SiblingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [progressData, setProgressData] = useState<ProgressWithQuestions | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

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
    try {
      await progressApi.setLesson(lessonId, next);
      await fetchProgress();
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
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

  const handleQuestionComplete = (correct: boolean, _earnedPoints: number) => {
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

  const currentIndex = siblings.findIndex((s) => s.id === lesson.id);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const qs = progressData?.questionStats;
  const hasQuestions = qs && qs.totalBlocks > 0;

  return (
    <>
      <DashboardHeader
        title={lesson.title}
        subtitle={
          [subject?.name, parentModule?.name, lesson.topic?.name].filter(Boolean).join(" › ") ||
          undefined
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          ...(subject ? [{ label: subject.name }] : []),
          ...(lesson.topic ? [{ label: lesson.topic.name }] : []),
          { label: lesson.title },
        ]}
      />

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
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
          <div className="mt-6 flex items-center justify-center">
            <Button
              variant={progressData?.completed ? "outline" : "accent"}
              onClick={handleToggleComplete}
              disabled={savingProgress}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {savingProgress ? "Saving..." : progressData?.completed ? "Completed" : "Mark as complete"}
            </Button>
          </div>

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
        </div>
      </div>
    </>
  );
}
