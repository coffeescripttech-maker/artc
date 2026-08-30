"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
  Skeleton,
} from "@/components/ui";
import { assessmentsApi, progressApi, progressionApi } from "@/lib/api/client";
import {
  TrendingUp,
  Target,
  Trophy,
  FileQuestion,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from "lucide-react";

// CS#22.9 — every value on this page is derived from real backend data
// (attempt history, mastery ladder, weak topics). No fabricated analytics.

interface AttemptInfo {
  id: string;
  status: string;
  percentage?: number | null;
}

interface SubjectPerformance {
  id: string;
  name: string;
  percent: number;
}

interface WeakTopic {
  id: string;
  completionPercentage: number;
  topic: {
    id: string;
    name: string;
    module: { subject: { id: string; name: string } };
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attemptData, progression, weak] = await Promise.all([
        assessmentsApi.myAttempts().catch(() => [] as AttemptInfo[]),
        progressApi.progression().catch(() => null),
        progressionApi.weakTopics().catch(() => ({ topics: [] as WeakTopic[] })),
      ]);
      setAttempts(Array.isArray(attemptData) ? (attemptData as AttemptInfo[]) : []);
      // Subject performance comes from the real mastery ladder.
      const grades =
        (progression as { grades?: { subjects?: SubjectPerformance[] }[] } | null)?.grades ?? [];
      const perf: SubjectPerformance[] = [];
      for (const g of grades) {
        for (const s of g.subjects ?? []) {
          perf.push({ id: s.id, name: s.name, percent: Math.round(s.percent ?? 0) });
        }
      }
      setSubjects(perf);
      setWeakTopics((weak as { topics?: WeakTopic[] })?.topics ?? []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("We couldn't load your analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Real derived metrics — truthful "—" when there is no data yet.
  const completed = attempts.filter((a) => a.status === "COMPLETED");
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.percentage || 0), 0) / completed.length)
      : null;
  const avgMastery =
    subjects.length > 0
      ? Math.round(subjects.reduce((s, x) => s + x.percent, 0) / subjects.length)
      : null;
  const stats = [
    { label: "Assessments Taken", value: `${attempts.length}`, icon: FileQuestion, hint: "all attempts recorded" },
    { label: "Completed", value: `${completed.length}`, icon: Trophy, hint: "submitted assessments" },
    { label: "Average Score", value: avgScore === null ? "—" : `${avgScore}%`, icon: TrendingUp, hint: "completed assessments only" },
    { label: "Average Mastery", value: avgMastery === null ? "—" : `${avgMastery}%`, icon: Target, hint: "across your subjects" },
  ];

  const strongAreas = subjects.filter((s) => s.percent >= 75);

  return (
    <>
      <DashboardHeader
        title="Analytics"
        subtitle="Your learning performance, from real activity"
      />

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <Skeleton className="h-4 w-28 mb-3" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Compact stat row — real derived values */}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                          <stat.icon className="h-4 w-4 text-arc-navy-700" />
                        </div>
                        <h3 className="text-sm font-semibold text-arc-navy-900">{stat.label}</h3>
                      </div>
                      <div className="text-2xl font-bold tracking-tight text-arc-navy-900">
                        {stat.value}
                      </div>
                      <p className="text-xs text-arc-slate-500 mt-1">{stat.hint}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Subject mastery — from the real progression ladder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4.5 w-4.5 text-arc-navy-700" />
                    Subject Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-arc-slate-500 text-sm">
                        No subject data yet. Mastery appears once you start learning in an
                        enrolled program.
                      </p>
                      <Link href="/dashboard/programs" className="inline-block mt-3">
                        <Button variant="outline" size="sm">
                          View My Programs
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subjects.map((s) => (
                        <div key={s.id} className="flex items-center gap-4">
                          <span className="text-sm text-arc-navy-900 w-40 truncate">{s.name}</span>
                          <div className="flex-1">
                            <Progress value={s.percent} className="h-2" />
                          </div>
                          <span className="text-sm font-medium text-arc-navy-900 w-12 text-right">
                            {s.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weak / strong areas — from real mastery data */}
              <div className="grid gap-6 lg:grid-cols-2">

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4.5 w-4.5 text-arc-red-500" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weakTopics.length === 0 ? (
                      <p className="text-sm text-arc-slate-500 text-center py-6">
                        No weak topics identified. Keep practicing!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {weakTopics.slice(0, 5).map((wt) => (
                          <div
                            key={wt.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-arc-slate-200"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-arc-navy-900 truncate">
                                {wt.topic?.name ?? "Topic"}
                              </div>
                              <div className="text-xs text-arc-slate-500">
                                {wt.topic?.module?.subject?.name ?? ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge className="bg-arc-slate-100 text-arc-slate-600 text-xs">
                                {Math.round(wt.completionPercentage ?? 0)}%
                              </Badge>
                              <Link href={`/dashboard/practice/topic/${wt.topic?.id}`}>
                                <Button variant="outline" size="sm">
                                  Practice
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4.5 w-4.5 text-arc-green-600" />
                      Your Strongest Subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {strongAreas.length === 0 ? (
                      <p className="text-sm text-arc-slate-500 text-center py-6">
                        Keep going — reach 75% mastery in a subject to see it here.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {[...strongAreas]
                          .sort((a, b) => b.percent - a.percent)
                          .slice(0, 5)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-arc-slate-200"
                            >
                              <span className="text-sm font-medium text-arc-navy-900 truncate">
                                {s.name}
                              </span>
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                {s.percent}%
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
