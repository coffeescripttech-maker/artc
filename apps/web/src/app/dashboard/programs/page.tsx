"use client";

/**
 * My Programs (CS#22.7 H-3 → CS#22.8 redesign).
 *
 * Enterprise student-facing program list. Every value is derived from real
 * backend data — enrollments, program hierarchy (description, subjects,
 * lessons, assessments), per-program mastery, and real attempt dates.
 * No fabricated progress, dates, or counts.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Button, Badge, Progress } from "@/components/ui";
import {
  enrollmentsApi,
  progressionApi,
  programsApi,
  assessmentsApi,
} from "@/lib/api/client";
import {
  RefreshCw,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Clock,
  AlertCircle,
  FileQuestion,
  Layers,
} from "lucide-react";

interface MyEnrollment {
  id: string;
  status: string;
  active: boolean;
  expiresAt: string | null;
  program: { id: string; name: string; slug: string; status: string } | null;
}

interface ProgramCard {
  enrollmentId: string;
  programId: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  active: boolean;
  expiresAt: string | null;
  subjectCount: number | null;
  lessonCount: number | null;
  assessmentCount: number | null;
  masteryPercent: number | null;
  lastActivityAt: string | null;
  typeLabel: string | null;
}

const typeLabels: Record<string, string> = {
  COLLEGE_ENTRANCE: "College Entrance",
  COLLEGE: "College",
  REVIEW_CENTER: "Review Center",
};

/** Shape of the published curriculum tree returned by GET /programs/{slug}. */
interface ProgramHierarchy {
  description?: string | null;
  programType?: string | null;
  curriculums?: {
    items?: {
      subject: {
        id: string;
        modules?: { topics?: { lessons?: { id: string }[] }[] }[];
      };
    }[];
  }[];
  assessments?: { id: string }[];
}

export default function MyProgramsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const mine = (await enrollmentsApi.mine()) as MyEnrollment[];
        const list = (Array.isArray(mine) ? mine : []).filter(
          (e) => e.program && e.active && e.status === "ACTIVE"
        );

        // Real attempt dates mapped to programs via the tenant-scoped list.
        const [assessmentList, attempts] = await Promise.all([
          assessmentsApi.list({ status: "PUBLISHED" }).catch(() => []),
          assessmentsApi.myAttempts().catch(() => []),
        ]);
        const progByAssessment = new Map<string, string>();
        for (const a of Array.isArray(assessmentList) ? assessmentList : []) {
          if (a?.program?.id) progByAssessment.set(a.id, a.program.id);
        }
        const lastByProgram = new Map<string, string>();
        for (const at of Array.isArray(attempts) ? attempts : []) {
          const pid = progByAssessment.get(at.assessmentId);
          if (!pid) continue;
          const ts = at.completedAt ?? at.startedAt;
          if (!ts) continue;
          const prev = lastByProgram.get(pid);
          if (!prev || new Date(ts).getTime() > new Date(prev).getTime()) {
            lastByProgram.set(pid, ts);
          }
        }
const cards = await Promise.all(
          list.map(async (e) => {
            const program = e.program!;
            let hierarchy: ProgramHierarchy | null = null;
            let masteryPercent: number | null = null;

            try {
              const [h, prog] = await Promise.all([
                programsApi.getBySlug(program.slug).catch(() => null),
                progressionApi.get(program.id).catch(() => null),
              ]);
              hierarchy = (h as ProgramHierarchy | null) ?? null;
              const grades =
                (prog as { grades?: { subjects?: { percent: number }[] }[] } | null)
                  ?.grades ?? [];
              const subjectPcts = grades.flatMap((g) =>
                (g.subjects ?? []).map((s) => s.percent ?? 0)
              );
              if (subjectPcts.length > 0) {
                masteryPercent = Math.round(
                  subjectPcts.reduce((s, x) => s + x, 0) / subjectPcts.length
                );
              }
            } catch {
              // hierarchy/mastery degrade to neutral states below.
            }

            const subjectIds = new Set<string>();
            let lessons = 0;
            for (const cur of hierarchy?.curriculums ?? []) {
              for (const item of cur.items ?? []) {
                subjectIds.add(item.subject.id);
                lessons += (item.subject.modules ?? []).reduce(
                  (sum, m) =>
                    sum +
                    (m.topics ?? []).reduce((s, t) => s + (t.lessons ?? []).length, 0),
                  0
                );
              }
            }

            return {
              enrollmentId: e.id,
              programId: program.id,
              slug: program.slug,
              name: program.name,
              description: hierarchy?.description ?? null,
              status: program.status,
              active: e.active,
              expiresAt: e.expiresAt,
              subjectCount: subjectIds.size > 0 ? subjectIds.size : null,
              lessonCount: lessons > 0 ? lessons : null,
              assessmentCount: hierarchy?.assessments?.length ?? null,
              masteryPercent,
              lastActivityAt: lastByProgram.get(program.id) ?? null,
              typeLabel: hierarchy?.programType
                ? (typeLabels[hierarchy.programType] ?? hierarchy.programType)
                : null,
            } as ProgramCard;
          })
        );
        if (!active) return;
        setPrograms(cards);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load enrollments:", err);
        setError("Your programs could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const sorted = useMemo(
    () =>
      [...programs].sort((a, b) => {
        // Highest progress first; programs without progress sort to the end.
        if (a.masteryPercent === null) return 1;
        if (b.masteryPercent === null) return -1;
        return b.masteryPercent - a.masteryPercent;
      }),
    [programs]
  );

  return (
    <>
      <DashboardHeader
        title="My Programs"
        subtitle="Your enrolled learning programs"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Programs" },
        ]}
      />
<div className="mx-auto max-w-4xl p-6">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading programs">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-arc-slate-200 bg-white p-5 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="h-11 w-11 rounded-lg bg-arc-slate-200 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-1/3 rounded bg-arc-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-arc-slate-100" />
                    <div className="h-2 w-full rounded bg-arc-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-xl border border-arc-slate-200 bg-white p-10 text-center">
            <AlertCircle className="h-8 w-8 text-arc-red-500 mx-auto mb-3" />
            <p className="text-arc-navy-900 font-medium">{error}</p>
            <p className="text-sm text-arc-slate-500 mt-1">
              Your enrollment information could not be loaded from the server.
            </p>
            <Button
              variant="accent"
              size="sm"
              className="mt-4"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-arc-slate-300 bg-arc-slate-50 p-12 text-center">
            <GraduationCap className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-1">
              No programs yet
            </h3>
            <p className="text-sm text-arc-slate-500 max-w-sm mx-auto">
              You aren&apos;t enrolled in any active programs. Contact your school
              or administrator to get enrolled.
            </p>
          </div>
        )}

        {/* Program rows */}
        {!loading && !error && sorted.length > 0 && (
          <div className="space-y-4">
            {sorted.map((p) => (
              <div
                key={p.enrollmentId}
                className="rounded-xl border border-arc-slate-200 bg-white flex flex-col sm:flex-row hover:border-arc-navy-300 hover:shadow-sm transition-all"
              >
                {/* Main clickable body */}
                <Link
                  href={`/dashboard/programs/${p.programId}`}
                  className="flex-1 min-w-0 p-5 rounded-l-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-arc-orange-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-lg bg-arc-navy-800 text-white flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-arc-navy-900 truncate">
                          {p.name}
                        </h3>
                        {p.typeLabel && (
                          <Badge
                            variant="outline"
                            className="text-arc-slate-500 shrink-0"
                          >
                            {p.typeLabel}
                          </Badge>
                        )}
                        <Badge
                          className={
                            p.active
                              ? "bg-arc-green-100 text-arc-green-700 shrink-0"
                              : "bg-arc-slate-100 text-arc-slate-500 shrink-0"
                          }
                        >
                          {p.active ? "Active" : p.status}
                        </Badge>
                      </div>
                      {p.description ? (
                        <p className="text-sm text-arc-slate-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      ) : (
                        <p className="text-sm text-arc-slate-400 mt-1">
                          No description available.
                        </p>
                      )}
                    </div>
                  </div>
{/* Metadata */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-arc-slate-500">
                    {p.subjectCount !== null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-arc-slate-400" />
                        {p.subjectCount}{" "}
                        {p.subjectCount === 1 ? "Subject" : "Subjects"}
                      </span>
                    )}
                    {p.lessonCount !== null && (
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-arc-slate-400" />
                        {p.lessonCount}{" "}
                        {p.lessonCount === 1 ? "Lesson" : "Lessons"}
                      </span>
                    )}
                    {p.assessmentCount !== null && (
                      <span className="inline-flex items-center gap-1.5">
                        <FileQuestion className="h-3.5 w-3.5 text-arc-slate-400" />
                        {p.assessmentCount}{" "}
                        {p.assessmentCount === 1 ? "Assessment" : "Assessments"}
                      </span>
                    )}
                    {p.lastActivityAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-arc-slate-400" />
                        Last activity:{" "}
                        {new Date(p.lastActivityAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {p.expiresAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-arc-slate-400" />
                        Expires: {new Date(p.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {p.masteryPercent !== null ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-arc-slate-500">Progress</span>
                        <span className="font-semibold text-arc-navy-900">
                          {p.masteryPercent}%
                        </span>
                      </div>
                      <Progress value={p.masteryPercent} className="h-1.5" />
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-arc-slate-400">
                      No progress recorded yet.
                    </p>
                  )}
                </Link>

                {/* CTA column */}
                <div className="px-5 pb-5 sm:p-5 sm:border-l sm:border-arc-slate-100 flex sm:items-center">
                  <Link href={`/dashboard/programs/${p.programId}`} className="w-full sm:w-auto">
                    <Button variant="accent" size="sm" className="w-full sm:w-auto">
                      Continue Learning
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}