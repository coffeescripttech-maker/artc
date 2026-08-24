"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress, Skeleton } from "@/components/ui";
import { progressionApi } from "@/lib/api/client";
import { Target, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

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

const masteryLabels: Record<string, { label: string; color: string }> = {
  MASTERED: { label: "Mastered", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  LEARNING: { label: "Learning", color: "bg-orange-100 text-orange-700" },
  NOT_STARTED: { label: "Not Started", color: "bg-slate-100 text-slate-600" },
};

export default function WeakTopicsPage() {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeakTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await progressionApi.weakTopics() as { topics: WeakTopic[] };
      setWeakTopics(data?.topics ?? []);
    } catch (err) {
      console.error("Failed to load weak topics:", err);
      setError("Failed to load weak topics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeakTopics();
  }, [loadWeakTopics]);

  const getMasteryConfig = (mastery: string) =>
    masteryLabels[mastery] || masteryLabels.NOT_STARTED;

  return (
    <>
      <DashboardHeader
        title="Practice Weak Topics"
        subtitle="Focus on areas where you need improvement"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Practice", href: "/dashboard/practice" },
          { label: "Weak Topics" },
        ]}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border border-arc-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 ml-4" />
                    </div>
                    <Skeleton className="h-2 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">Great job!</h3>
              <p className="text-arc-slate-500 max-w-md mx-auto">
                No weak topics identified. You're mastering all your subjects. Keep up the excellent work!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weakTopics.map((wt) => {
                const subjectName = wt.topic?.module?.subject?.name || "Unknown Subject";
                const topicName = wt.topic?.name || "Unknown Topic";
                const completion = wt.completionPercentage ?? 0;
                const masteryCfg = getMasteryConfig(wt.mastery);

                return (
                  <Card
                    key={wt.id}
                    className="border border-arc-slate-200 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <Target className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-arc-navy-900">{topicName}</h3>
                            <p className="text-sm text-arc-slate-500">{subjectName}</p>
                          </div>
                        </div>
                        <Badge className={masteryCfg.color}>{masteryCfg.label}</Badge>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-arc-slate-600">Mastery progress</span>
                          <span className="font-medium text-arc-navy-900">
                            {Math.round(completion)}%
                          </span>
                        </div>
                        <Progress
                          value={completion}
                          variant="alert"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-arc-slate-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>Practice questions to improve mastery</span>
                        </div>
                        <Link href={`/dashboard/practice/topic/${wt.topic?.id}`}>
                          <Button variant="accent" size="sm">
                            Study Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
