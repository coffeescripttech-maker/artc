"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Skeleton, Button } from "@/components/ui";
import { assessmentsApi, progressApi } from "@/lib/api/client";
import { CheckCircle2, Circle, RefreshCw, AlertCircle, Trophy } from "lucide-react";

// CS#22.9 — achievements are real milestones derived from the student's actual
// attempt history and mastery ladder. No fabricated badges or leaderboards.

interface AttemptInfo {
  id: string;
  status: string;
  percentage?: number | null;
}

interface Milestone {
  key: string;
  title: string;
  description: string;
  earned: boolean;
  progressLabel: string;
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attemptData, progression] = await Promise.all([
        assessmentsApi.myAttempts().catch(() => [] as AttemptInfo[]),
        progressApi.progression().catch(() => null),
      ]);
      const attempts = Array.isArray(attemptData) ? (attemptData as AttemptInfo[]) : [];
      const completed = attempts.filter((a) => a.status === "COMPLETED");
      const bestPct = completed.reduce((m, a) => Math.max(m, a.percentage ?? 0), 0);
      const grades = (progression as { grades?: { subjects?: { percent?: number }[] }[] } | null)
        ?.grades ?? [];
      const subjectPcts = grades.flatMap((g) => (g.subjects ?? []).map((s) => s.percent ?? 0));
      const subjectsOver75 = subjectPcts.filter((p) => p >= 75).length;

      setMilestones([
        {
          key: "first-assessment",
          title: "First Step",
          description: "Complete your first assessment",
          earned: completed.length >= 1,
          progressLabel: `${Math.min(completed.length, 1)}/1`,
        },
        {
          key: "five-assessments",
          title: "Getting Serious",
          description: "Complete 5 assessments",
          earned: completed.length >= 5,
          progressLabel: `${Math.min(completed.length, 5)}/5`,
        },
        {
          key: "solid-score",
          title: "Solid Performance",
          description: "Score 75% or higher on an assessment",
          earned: bestPct >= 75,
          progressLabel: bestPct >= 75 ? "Achieved" : `Best: ${Math.round(bestPct)}%`,
        },
        {
          key: "perfect-score",
          title: "Perfect Score",
          description: "Score 100% on any assessment",
          earned: bestPct >= 100,
          progressLabel: bestPct >= 100 ? "Achieved" : `Best: ${Math.round(bestPct)}%`,
        },
        {
          key: "subject-mastery",
          title: "Subject Mastery",
          description: "Reach 75% mastery in a subject",
          earned: subjectsOver75 >= 1,
          progressLabel: subjectsOver75 >= 1 ? "Achieved" : `${subjectsOver75}/1`,
        },
      ]);
    } catch (err) {
      console.error("Failed to load milestones:", err);
      setError("We couldn't load your achievements. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const earnedCount = milestones.filter((m) => m.earned).length;

  return (
    <>
      <DashboardHeader
        title="Achievements"
        subtitle="Milestones from your real learning activity"
      />

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
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
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-arc-slate-500">
                {earnedCount} of {milestones.length} milestones earned
              </p>
              <div className="space-y-3">
                {milestones.map((m) => (
                  <Card
                    key={m.key}
                    className={m.earned ? "border-arc-slate-200" : "border-arc-slate-100"}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      {m.earned ? (
                        <CheckCircle2 className="h-6 w-6 text-arc-green-600 shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-arc-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              m.earned ? "text-arc-navy-900" : "text-arc-slate-600"
                            }`}
                          >
                            {m.title}
                          </span>
                          {m.earned && <Trophy className="h-3.5 w-3.5 text-arc-orange-500" />}
                        </div>
                        <p className="text-xs text-arc-slate-500 mt-0.5">{m.description}</p>
                      </div>
                      <span className="text-xs font-medium text-arc-slate-500 shrink-0">
                        {m.progressLabel}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}