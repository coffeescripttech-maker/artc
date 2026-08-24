"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from "@/components/ui";
import { assessmentsApi } from "@/lib/api/client";
import { masteryBand } from "@/lib/mastery";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  BookOpen,
  RotateCw,
  AlertCircle,
  Lightbulb,
  Zap,
} from "lucide-react";

interface WeakTopic {
  id: string;
  completionPercentage: number;
  mastery: string;
  topic: {
    id: string;
    name: string;
    module: {
      subject: {
        id: string;
        name: string;
      };
    };
  };
}

interface Recommendations {
  assessmentId: string;
  isMastered: boolean;
  bestScore: number;
  gate: number;
  canRetry: boolean;
  attemptsUsed: number;
  maxAttempts: number | null;
  weakTopics: WeakTopic[];
  suggestions: string[];
  hasLowExposure: boolean;
  message: string;
}

export default function AssessmentRecommendationsPage() {
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await assessmentsApi.recommendations(assessmentId)) as Recommendations;
      setRecs(data);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError((err as Error)?.message || "Failed to load recommendations.");
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void loadRecs();
  }, [loadRecs]);

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Study Recommendations"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Assessments", href: "/dashboard/assessments" },
            { label: "Study Plan" },
          ]}
        />
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-arc-orange-500" />
          </div>
        </div>
      </>
    );
  }

  if (error || !recs) {
    return (
      <>
        <DashboardHeader
          title="Study Recommendations"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Assessments", href: "/dashboard/assessments" },
            { label: "Study Plan" },
          ]}
        />
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-arc-slate-600 mb-4">{error || "No recommendations found."}</p>
            <Link href="/dashboard/assessments/history">
              <Button variant="accent">Back to Assessment History</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const pct = recs.bestScore;
  const band = masteryBand(pct, recs.gate);
  const attemptsLeft = recs.maxAttempts ? recs.maxAttempts - recs.attemptsUsed : null;
  const isPassed = pct >= recs.gate;

  return (
    <>
      <DashboardHeader
        title="Study Recommendations"
        subtitle={recs.isMastered ? "Great job! You've mastered this." : "Your personalized study plan"}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments", href: "/dashboard/assessments" },
          { label: "Study Plan" },
        ]}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Banner */}
          <Card className={recs.isMastered ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {isPassed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Target className="h-6 w-6 text-orange-500" />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${isPassed ? "text-green-800" : "text-orange-800"}`}>
                    {recs.message}
                  </h2>
                  <p className="text-sm text-arc-slate-600 mt-1">
                    Best score: {Math.round(pct)}% · Mastery threshold: {recs.gate}%
                    {attemptsLeft !== null && ` · ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} left`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-arc-navy-700" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-arc-navy-900 font-medium">
                      {Math.round(pct)}% mastery
                    </span>
                    <span className="text-arc-slate-500">
                      Need {recs.gate}% to master
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-3"
                    variant={pct >= recs.gate ? "mastery" : "alert"}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={band.cls}>{band.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-arc-slate-500">
                    <span>Attempts used: {recs.attemptsUsed}</span>
                    {attemptsLeft !== null && <span>Attempts left: {attemptsLeft}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retry button */}
          {recs.canRetry && (
            <div className="flex justify-center">
              <Link href={`/dashboard/assessments/${assessmentId}`}>
                <Button variant="accent" size="lg" className="gap-2">
                  <RotateCw className="h-5 w-5" />
                  Retake Assessment
                </Button>
              </Link>
            </div>
          )}

          {/* Suggested Topics */}
          {recs.weakTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-red-500" />
                  Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-arc-slate-600 mb-4">
                  These topics need more practice. Click "Practice" to study questions for each topic.
                </p>
                <div className="space-y-4">
                  {recs.weakTopics.map((wt) => (
                    <div
                      key={wt.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-arc-slate-200 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <Target className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <div className="font-medium text-arc-navy-900">
                            {wt.topic?.name || "Topic"}
                          </div>
                          <div className="text-sm text-arc-slate-500">
                            {wt.topic?.module?.subject?.name || "Unknown subject"} ·{" "}
                            {Math.round(wt.completionPercentage ?? 0)}% mastery
                          </div>
                        </div>
                      </div>
                      <Link href={`/dashboard/practice/topic/${wt.topic?.id}`}>
                        <Button variant="outline" size="sm">
                          Practice
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {recs.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-arc-orange-500" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recs.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-arc-navy-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-arc-orange-500 mt-1.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Low exposure warning */}
          {recs.hasLowExposure && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Limited Exposure</h4>
                    <p className="text-sm text-yellow-700">
                      You've seen fewer than 10 questions across your attempts. This score may not
                      reflect your true ability. Consider reviewing the material and retrying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <div className="flex justify-center gap-3 pt-4">
            <Link href="/dashboard/practice/weak-topics">
              <Button variant="outline" size="sm" className="gap-1">
                <Target className="h-4 w-4" />
                All Weak Topics
              </Button>
            </Link>
            <Link href="/dashboard/assessments/history">
              <Button variant="outline" size="sm" className="gap-1">
                <BookOpen className="h-4 w-4" />
                Assessment History
              </Button>
            </Link>
            <Link href="/dashboard/activity">
              <Button variant="outline" size="sm" className="gap-1">
                <Zap className="h-4 w-4" />
                Activity Feed
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
