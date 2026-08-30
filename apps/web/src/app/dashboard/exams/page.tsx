"use client";

/**
 * Exams & Mock Tests (CS#22.7 — C-1).
 *
 * Previously this page rendered three hardcoded arrays (upcomingExams,
 * pastExams, mockExams) plus fabricated stat cards — zero API calls. It is now
 * fully backed by real data:
 *   - Available assessments: GET /assessments (tenant-scoped, PUBLISHED only)
 *   - This learner's attempts: GET /assessments/me/attempts
 * Insufficient data renders truthful empty states ("No attempts yet") — never
 * invented values.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { assessmentsApi } from "@/lib/api/client";
import {
  RefreshCw,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  FileText,
  Target,
  TrendingUp,
  BookOpen,
  RotateCcw,
} from "lucide-react";

interface AssessmentItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  questionCount?: number | null;
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  _count?: { questions?: number; attempts?: number };
}

interface AttemptItem {
  id: string;
  assessmentId: string;
  status: string;
  percentage?: number | null;
  score?: number | null;
  maxScore?: number | null;
  startedAt: string;
  completedAt?: string | null;
  assessment: { id: string; name: string; type: string; passingScore?: number | null };
}

const typeLabels: Record<string, string> = {
  QUIZ: "Quiz",
  PRACTICE: "Practice",
  DIAGNOSTIC: "Diagnostic",
  MOCK_EXAM: "Mock Exam",
  ASSIGNMENT: "Assignment",
  CET_SIMULATION: "CET Simulation",
};

/** An assessment is takeable when it has a fixed question set or a real pool. */
function isTakeable(a: AssessmentItem): boolean {
  const fixed = (a._count?.questions ?? 0) > 0;
  const pool = !!a.questionCount && a.questionCount > 0;
  return fixed || pool;
}

export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [list, myAttempts] = await Promise.all([
          assessmentsApi.list({ status: "PUBLISHED" }),
          assessmentsApi.myAttempts(),
        ]);
        if (!active) return;
        setAssessments(Array.isArray(list) ? (list as AssessmentItem[]) : []);
        setAttempts(Array.isArray(myAttempts) ? (myAttempts as AttemptItem[]) : []);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load exams:", err);
        setError("Your exams could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const takeable = assessments.filter(isTakeable);
  const mockExams = takeable.filter(
    (a) => a.type === "MOCK_EXAM" || a.type === "CET_SIMULATION"
  );
  const completed = attempts.filter((a) => a.status === "COMPLETED" && a.percentage != null);
  const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS");
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.percentage ?? 0), 0) / completed.length)
      : null;

  const bestScoreByAssessment = new Map<string, number>();
  for (const a of completed) {
    bestScoreByAssessment.set(
      a.assessmentId,
      Math.max(bestScoreByAssessment.get(a.assessmentId) ?? 0, a.percentage ?? 0)
    );
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Exams & Mock Tests" subtitle="Loading exams…" />
        <div className="p-6 flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Exams & Mock Tests"
        subtitle="Take assessments and track your exam results"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Exams" }]}
      />

      <div className="p-6">
        {error ? (
          <div className="max-w-lg mx-auto text-center py-12">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-arc-slate-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats — computed from real data only ("—" when there is no data) */}
            <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Calendar} label="Available Exams" value={String(takeable.length)} tone="blue" />
              <StatCard icon={CheckCircle2} label="Completed" value={String(completed.length)} tone="green" />
              <StatCard
                icon={TrendingUp}
                label="Avg Score"
                value={avgScore !== null ? `${avgScore}%` : "—"}
                tone="purple"
              />
              <StatCard icon={Clock} label="In Progress" value={String(inProgress.length)} tone="orange" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-6 border-b border-arc-slate-200">
              {[
                { id: "available", label: "Available", count: takeable.length },
                { id: "mock", label: "Mock Exams", count: mockExams.length },
                { id: "attempts", label: "My Attempts", count: attempts.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-arc-orange-600 border-b-2 border-arc-orange-500"
                      : "text-arc-slate-500 hover:text-arc-navy-900"
                  }`}
                >
                  {tab.label}
                  <Badge variant="secondary" className="ml-2">{tab.count}</Badge>
                </button>
              ))}
            </div>

            {/* Available assessments */}
            {activeTab === "available" && (
              <AssessmentGrid
                items={takeable}
                bestScoreByAssessment={bestScoreByAssessment}
                emptyLabel="No assessments are available to you yet."
                emptyHint="Assessments published for your organization will appear here."
              />
            )}

            {/* Mock exams */}
            {activeTab === "mock" && (
              <AssessmentGrid
                items={mockExams}
                bestScoreByAssessment={bestScoreByAssessment}
                emptyLabel="No mock exams have been published yet."
                emptyHint="Full-length mock examinations from your programs will appear here."
              />
            )}


            {/* My attempts */}
            {activeTab === "attempts" && (
              <div className="space-y-3">
                {attempts.length === 0 ? (
                  <div className="bg-arc-slate-50 rounded-xl p-10 text-center border border-arc-slate-200">
                    <FileQuestion className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
                    <p className="text-arc-slate-500">No attempts yet.</p>
                    <Link href="/dashboard/assessments" className="mt-3 inline-block">
                      <Button variant="accent" size="sm">Browse Assessments</Button>
                    </Link>
                  </div>
                ) : (
                  attempts.map((a) => {
                    const pct = a.percentage != null ? Math.round(a.percentage) : null;
                    const passed =
                      pct !== null && a.assessment.passingScore != null && pct >= a.assessment.passingScore;
                    const date = new Date(a.completedAt ?? a.startedAt).toLocaleDateString();
                    return (
                      <div
                        key={a.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-arc-slate-200 bg-white"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-arc-navy-900">{a.assessment.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[a.assessment.type] || a.assessment.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-arc-slate-500 mt-1">
                            {a.status === "COMPLETED"
                              ? `${pct}% · ${date}`
                              : a.status === "IN_PROGRESS"
                              ? `Started ${date}`
                              : a.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.status === "COMPLETED" && pct !== null && (
                            <Badge className={passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                              {passed ? "Passed" : "Below passing"}
                            </Badge>
                          )}
                          <Link
                            href={
                              a.status === "IN_PROGRESS"
                                ? `/dashboard/assessments/${a.assessmentId}`
                                : `/dashboard/assessments/${a.assessmentId}/review?attemptId=${a.id}`
                            }
                          >
                            <Button variant={a.status === "IN_PROGRESS" ? "accent" : "outline"} size="sm">
                              {a.status === "IN_PROGRESS" ? (
                                <>
                                  <Play className="h-4 w-4 mr-1" /> Resume
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" /> Review
                                </>
                              )}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone: "blue" | "green" | "purple" | "orange";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-arc-orange-100 text-arc-orange-600",
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-arc-navy-900">{value}</div>
            <div className="text-sm text-arc-slate-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentGrid({
  items,
  bestScoreByAssessment,
  emptyLabel,
  emptyHint,
}: {
  items: AssessmentItem[];
  bestScoreByAssessment: Map<string, number>;
  emptyLabel: string;
  emptyHint: string;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-arc-slate-50 rounded-xl p-10 text-center border border-arc-slate-200">
        <BookOpen className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
        <p className="text-arc-navy-900 font-medium">{emptyLabel}</p>
        <p className="text-sm text-arc-slate-500 mt-1">{emptyHint}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((exam) => {
        const questions = exam.questionCount ?? exam._count?.questions ?? 0;
        const best = bestScoreByAssessment.get(exam.id);
        return (
          <Card key={exam.id} className="flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="info">{typeLabels[exam.type] || exam.type}</Badge>
                {best !== undefined && <Badge variant="success">Best {best}%</Badge>}
              </div>
              <h3 className="font-semibold text-arc-navy-900">{exam.name}</h3>
              {exam.description && (
                <p className="text-sm text-arc-slate-500 mt-1 line-clamp-2">{exam.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                <div className="p-2 bg-arc-slate-50 rounded-lg text-center">
                  <FileText className="h-4 w-4 text-arc-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-arc-navy-900">{questions}</div>
                  <div className="text-xs text-arc-slate-500">Questions</div>
                </div>
                <div className="p-2 bg-arc-slate-50 rounded-lg text-center">
                  <Clock className="h-4 w-4 text-arc-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-arc-navy-900">
                    {exam.timeLimitMinutes ? `${exam.timeLimitMinutes}m` : "—"}
                  </div>
                  <div className="text-xs text-arc-slate-500">Duration</div>
                </div>
              </div>
              <Link href={`/dashboard/assessments/${exam.id}`} className="mt-auto">
                <Button className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  {best !== undefined ? "Retake Exam" : "Start Exam"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

