"use client";

import { useState, useEffect } from "react";
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

const typeLabels: Record<string, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  MIXED: "Mixed",
  ACTIVITY: "Activity",
  PRACTICE: "Practice",
};

export default function StudentLessonViewerPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonApi | null>(null);
  const [siblings, setSiblings] = useState<SiblingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      setCompleted(false);
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

        const prog = (await progressApi
          .getLesson(lessonId)
          .catch(() => null)) as { completed?: boolean } | null;
        if (active && prog) setCompleted(Boolean(prog.completed));
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
  }, [lessonId]);

  const handleToggleComplete = async () => {
    const next = !completed;
    setCompleted(next); // optimistic
    setSavingProgress(true);
    try {
      await progressApi.setLesson(lessonId, next);
    } catch (err) {
      console.error("Failed to save progress:", err);
      setCompleted(!next); // revert on failure
    } finally {
      setSavingProgress(false);
    }
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
            <h1 className="text-3xl font-bold text-arc-navy-900">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-arc-slate-600 mt-2">{lesson.description}</p>
            )}
          </div>

          {/* Lesson content */}
          <article className="bg-white rounded-2xl border border-arc-slate-200 p-6 sm:p-8">
            {content.blocks.length === 0 ? (
              <div className="text-center py-12 text-arc-slate-400">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-arc-slate-300" />
                <p>This lesson has no content yet.</p>
              </div>
            ) : (
              <LessonBlockRenderer content={content} />
            )}
          </article>

          {/* Complete + navigation */}
          <div className="mt-6 flex items-center justify-center">
            <Button
              variant={completed ? "outline" : "accent"}
              onClick={handleToggleComplete}
              disabled={savingProgress}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {savingProgress ? "Saving..." : completed ? "Completed" : "Mark as complete"}
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
