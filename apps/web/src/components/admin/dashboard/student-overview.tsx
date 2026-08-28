"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { MiniStat } from "@/components/ui";
import { Activity, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils/date";
import type { StudentOverview as StudentOverviewType, ActivityChartPoint } from "@/lib/api/client";

interface StudentOverviewProps {
  overview: StudentOverviewType;
  activityChart?: ActivityChartPoint[];
}

export function StudentOverview({ overview, activityChart }: StudentOverviewProps) {
  const {
    activeStudentsToday,
    learningActivityToday,
    completedAssessments,
    averageScore,
    enrolledStudents,
    totalLearnerProfiles,
  } = overview;

  const avgScorePercent = averageScore != null ? Math.round(averageScore) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-arc-navy-100 flex items-center justify-center">
            <Activity className="h-5 w-5 text-arc-navy-700" />
          </div>
          Student Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mini stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <MiniStat
            label="Active Today"
            value={activeStudentsToday.toLocaleString()}
            className="border-r border-arc-slate-100 pr-2"
          />
          <MiniStat label="Today's Activity" value={learningActivityToday.toLocaleString()} />
          <MiniStat label="Assessments Done" value={completedAssessments.toLocaleString()} />
          <MiniStat label="Average Score" value={`${avgScorePercent}%`} />
        </div>

        {/* Engagement trend (7-day mini chart) */}
        {activityChart && activityChart.length > 0 && (
          <div className="pt-4 border-t border-arc-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-arc-slate-600 uppercase tracking-wider">
                7-Day Engagement
                  </span>
              <div className="flex items-center gap-1 text-xs text-arc-slate-500">
                    <TrendingUp className="h-3 w-3" />
                    {avgScorePercent}% avg score
                  </div>
            </div>
            <ActivityMiniChart data={activityChart} />
          </div>
        )}

        {/* Enrolled learners */}
        {enrolledStudents != null && (
          <div className="pt-2 text-xs text-arc-slate-500">
            {enrolledStudents} active enrollments across {totalLearnerProfiles ?? 0} learner profiles
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Tiny inline bar chart — pure CSS, no external library */
function ActivityMiniChart({ data }: { data: ActivityChartPoint[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.attempts, d.activeLearners)), 1);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-2">
      {/* Attempts bars */}
      <div className="flex items-end gap-1 h-12">
        {data.map((point) => {
          const height = (point.attempts / maxVal) * 100;
          return (
            <div key={`a-${point.date}`} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-arc-navy-500 rounded-t-sm transition-all duration-300 hover:bg-arc-navy-600"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.attempts} attempts on ${formatDistanceToNow(new Date(point.date), { addSuffix: false })}`}
              />
              <span className="text-[10px] text-arc-slate-400 mt-1">
                {dayLabels[new Date(point.date).getDay()]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active learners bars */}
      <div className="flex items-end gap-1 h-8">
        {data.map((point) => {
          const height = (point.activeLearners / maxVal) * 100;
          return (
            <div key={`p-${point.date}`} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-arc-orange-400 rounded-t-sm transition-all duration-300 hover:bg-arc-orange-500"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.activeLearners} active learners`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center text-[10px] text-arc-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-arc-navy-500 rounded-sm" /> Attempts
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-arc-orange-400 rounded-sm" /> Active Learners
        </span>
      </div>
    </div>
  );
}
