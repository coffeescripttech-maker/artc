"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { assessmentsApi } from "@/lib/api/client";
import { Button, Badge } from "@/components/ui";
import { masteryBand } from "@/lib/mastery";
import {
  RefreshCw,
  Clock,
  FileQuestion,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Lightbulb,
} from "lucide-react";

interface Attempt {
  id: string;
  assessmentId: string;
  assessment: {
    id: string;
    name: string;
    type: string;
    passingScore?: number | null;
    masteryThreshold?: number | null;
  };
  status: string;
  percentage?: number | null;
  score?: number | null;
  maxScore: number;
  startedAt: string;
  completedAt?: string | null;
}

const typeLabels: Record<string, string> = {
  QUIZ: "Quiz",
  PRACTICE: "Practice",
  DIAGNOSTIC: "Diagnostic",
  MOCK_EXAM: "Mock Exam",
  ASSIGNMENT: "Assignment",
  CET_SIMULATION: "CET Simulation",
};

// CS#22.9 — lightweight status filtering for the attempt list.
const ATTEMPT_FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In Progress" },
] as const;
type AttemptFilter = (typeof ATTEMPT_FILTERS)[number]["key"];

export default function AssessmentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filter, setFilter] = useState<AttemptFilter>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await assessmentsApi.myAttempts();
        if (active && Array.isArray(data)) {
          setAttempts(data as Attempt[]);
        }
      } catch (err) {
        console.error("Failed to load attempts:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const completed = attempts.filter((a) => a.status === "COMPLETED" && a.percentage != null);
  const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS");

  return (
    <>
      <DashboardHeader
        title="My Assessments"
        subtitle="Review your attempt history and scores"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments", href: "/dashboard/assessments" },
          { label: "History" },
        ]}
      />

      <div className="p-6">
        {!loading && (
          <div className="flex items-center gap-2 mb-6" role="group" aria-label="Filter attempts">
            {ATTEMPT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  filter === f.key
                    ? "bg-arc-navy-900 text-white border-arc-navy-900"
                    : "bg-white text-arc-slate-600 border-arc-slate-200 hover:border-arc-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-arc-orange-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Completed attempts */}
            {filter !== "in_progress" && (
            <div>
              <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Past Attempts</h2>
              {completed.length === 0 ? (
                <div className="bg-arc-slate-50 rounded-xl p-8 text-center border border-arc-slate-200">
                  <FileQuestion className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
                  <p className="text-arc-slate-500">You haven't completed any assessments yet.</p>
                  <Link href="/dashboard/assessments" className="mt-3 inline-block">
                    <Button variant="accent" size="sm">
                      Browse Assessments
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {completed.map((a) => {
                    const pct = a.percentage ?? 0;
                    const gate = a.assessment.masteryThreshold ?? a.assessment.passingScore ?? 75;
                    const band = masteryBand(pct, gate);
                    const date = a.completedAt
                      ? new Date(a.completedAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "";
                    const correct = a.score ?? 0;
                    const total = a.maxScore;
                    const passed = gate <= pct;

                    return (
                      <div
                        key={a.id}
                        className="rounded-xl border border-arc-slate-200 bg-white p-4 hover:border-arc-orange-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0">
                              {passed ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-arc-navy-900">
                                  {a.assessment.name}
                                </span>
                                <Badge className="bg-arc-slate-100 text-arc-slate-600 text-xs">
                                  {typeLabels[a.assessment.type] || a.assessment.type}
                                </Badge>
                              </div>
                              <div className="text-sm text-arc-slate-500 mt-1">
                                {correct} of {total} correct · {Math.round(pct)}%
                                {date && <span> · {date}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={band.cls}>{band.label}</Badge>
                            <Link href={`/dashboard/assessments/${a.assessmentId}/review?attemptId=${a.id}`}>
                              <Button variant="outline" size="sm">
                                Review
                              </Button>
                            </Link>
                            {!passed && (
                              <>
                                <Link href={`/dashboard/assessments/${a.assessmentId}/recommendations`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Lightbulb className="h-4 w-4" />
                                    Study Plan
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/assessments/${a.assessmentId}`}>
                                  <Button variant="accent" size="sm">
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Retry
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* In-progress attempts */}
            {filter !== "completed" && inProgress.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">In Progress</h2>
                <div className="space-y-3">
                  {inProgress.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-arc-slate-200 bg-arc-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-arc-slate-500" />
                          <span className="font-medium text-arc-navy-900">
                            {a.assessment.name}
                          </span>
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                            In Progress
                          </Badge>
                        </div>
                        <Link href={`/dashboard/assessments/${a.assessmentId}`}>
                          <Button variant="accent" size="sm">
                            Resume
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
