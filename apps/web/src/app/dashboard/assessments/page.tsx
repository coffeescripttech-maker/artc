"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { assessmentsApi, progressApi } from "@/lib/api/client";
import { Button, Badge } from "@/components/ui";
import { masteryBand } from "@/lib/mastery";
import { RefreshCw, Clock, FileQuestion, Play, RotateCcw, Lock } from "lucide-react";

interface AssessmentListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  topicIds?: string[];
  questionTags?: string[];
  difficultyLevels?: string[];
  questionCount?: number | null;
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  masteryThreshold?: number | null;
  _count?: { questions: number; attempts: number };
}

interface MyAttempt {
  id: string;
  assessmentId: string;
  status: string;
  percentage?: number | null;
}

interface Progression {
  grades: {
    curriculumId: string;
    unlocked: boolean;
    subjects: { topics: { id: string }[] }[];
  }[];
}

const typeLabels: Record<string, string> = {
  QUIZ: "Quiz",
  PRACTICE: "Practice",
  DIAGNOSTIC: "Diagnostic",
  MOCK_EXAM: "Mock Exam",
  ASSIGNMENT: "Assignment",
  CET_SIMULATION: "CET Simulation",
};

export default function StudentAssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [bestByAssessment, setBestByAssessment] = useState<Record<string, number>>({});
  const [lockedByAssessment, setLockedByAssessment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [list, attempts, prog] = await Promise.all([
          assessmentsApi.list({ status: "PUBLISHED" }).catch(() => []),
          assessmentsApi.myAttempts().catch(() => []),
          progressApi.progression().catch(() => null),
        ]);
        if (!active) return;

        const listArr = (Array.isArray(list) ? list : []) as AssessmentListItem[];
        setAssessments(listArr);

        const best: Record<string, number> = {};
        for (const a of (Array.isArray(attempts) ? attempts : []) as MyAttempt[]) {
          if (a.status === "COMPLETED" && typeof a.percentage === "number") {
            best[a.assessmentId] = Math.max(best[a.assessmentId] ?? 0, a.percentage);
          }
        }
        setBestByAssessment(best);

        // Progression-based lock: map topic -> curriculum -> unlocked.
        const topicCurr = new Map<string, string>();
        const currUnlocked = new Map<string, boolean>();
        const p = prog as Progression | null;
        if (p?.grades) {
          for (const g of p.grades) {
            currUnlocked.set(g.curriculumId, g.unlocked);
            for (const s of g.subjects)
              for (const t of s.topics) topicCurr.set(t.id, g.curriculumId);
          }
        }
        const lockMap: Record<string, boolean> = {};
        for (const a of listArr) {
          const cids = [
            ...new Set(
              (a.topicIds ?? []).map((id) => topicCurr.get(id)).filter(Boolean) as string[]
            ),
          ];
          const known = cids.filter((c) => currUnlocked.has(c));
          lockMap[a.id] = known.length > 0 && !known.some((c) => currUnlocked.get(c));
        }
        setLockedByAssessment(lockMap);
      } catch (err) {
        console.error("Failed to load assessments:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const takeable = assessments.filter((a) => {
    const fixed = (a._count?.questions ?? 0) > 0;
    const pool =
      !!a.questionCount &&
      ((a.topicIds?.length ?? 0) > 0 ||
        (a.questionTags?.length ?? 0) > 0 ||
        (a.difficultyLevels?.length ?? 0) > 0);
    return fixed || pool;
  });

  return (
    <>
      <DashboardHeader
        title="Assessments"
        subtitle="Take assessments and track your mastery"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Assessments" }]}
        actions={
          <Link href="/dashboard/assessments/history">
            <Button variant="outline" size="sm">
              View History
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-arc-orange-500" />
          </div>
        ) : takeable.length === 0 ? (
          <div className="bg-arc-slate-50 rounded-xl p-10 text-center">
            <FileQuestion className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-1">
              No assessments available
            </h3>
            <p className="text-arc-slate-500">
              Published assessments will appear here once your program adds them.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {takeable.map((a) => {
              const gate = a.masteryThreshold ?? a.passingScore ?? 95;
              const best = bestByAssessment[a.id];
              const attempted = typeof best === "number";
              const band = attempted ? masteryBand(best, gate) : null;
              const locked = lockedByAssessment[a.id];
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-5 flex flex-col ${
                    locked
                      ? "border-arc-slate-200 bg-arc-slate-50"
                      : "border-arc-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-arc-slate-100 text-arc-slate-600">
                      {typeLabels[a.type] || a.type}
                    </Badge>
                    {locked ? (
                      <span className="flex items-center gap-1 text-xs text-arc-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        Locked
                      </span>
                    ) : band ? (
                      <Badge className={band.cls}>{band.label}</Badge>
                    ) : (
                      <span className="text-xs text-arc-slate-400">Not started</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-arc-navy-900">{a.name}</h3>
                  {a.description && (
                    <p className="text-sm text-arc-slate-500 mt-1 line-clamp-2">{a.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-arc-slate-500 mt-3">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {a.questionCount ?? a._count?.questions ?? 0} items
                    </span>
                    {a.timeLimitMinutes ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {a.timeLimitMinutes} min
                      </span>
                    ) : null}
                    <span>Mastery {gate}%</span>
                  </div>

                  {attempted && !locked && (
                    <div className="mt-3 text-sm text-arc-slate-600">
                      Best score:{" "}
                      <span className="font-semibold text-arc-navy-900">{Math.round(best)}%</span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-arc-slate-100">
                    {locked ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Button>
                    ) : (
                      <Link href={`/dashboard/assessments/${a.id}`}>
                        <Button variant="accent" size="sm" className="w-full">
                          {attempted ? (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Retake
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </>
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
