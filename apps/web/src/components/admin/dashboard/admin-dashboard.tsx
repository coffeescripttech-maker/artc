"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  StatCardSkeleton,
  ErrorEmpty,
  CardSkeleton,
} from "@/components/branding";
import { adminStatsApi } from "@/lib/api/client";
import type { AdminStatsOverview } from "@/lib/api/client";
import { CreateContentDropdown } from "./create-content-dropdown";
import { DashboardStats } from "./dashboard-stats";
import { NeedsAttention } from "./needs-attention";
import { CurriculumOverview } from "./curriculum-overview";
import { ContentHealth } from "./content-health";
import { RecentLessons } from "./recent-lessons";
import { RecentActivity } from "./recent-activity";
import { StudentOverview } from "./student-overview";

export function AdminDashboard() {
  const [data, setData] = useState<AdminStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await adminStatsApi.getOverview();
      setData(overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Greeting ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (error) {
    return (
      <>
        <DashboardHeader
          title={`${getGreeting()}, Admin`}
          subtitle="Overview of your platform"
          actions={<CreateContentDropdown />}
        />
        <div className="p-6">
          <ErrorEmpty onRetry={loadData} />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title={`${getGreeting()}, Admin`}
        subtitle="Here's what's happening across your LMS."
        actions={<CreateContentDropdown />}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          // Loading state — skeleton layout matching the final grid
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton className="h-96" />
            <CardSkeleton className="h-80" />
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-80" />
              <CardSkeleton className="h-80" />
            </div>
          </>
        ) : data ? (
          <>
            {/* Overview Statistics */}
            <DashboardStats data={data} />

            {/* Needs Attention */}
            <NeedsAttention items={data.needsAttention} />

            {/* Curriculum Overview + Content Health */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CurriculumOverview data={data.curriculumOverview} />
              </div>
              <div>
                <ContentHealth data={data.contentHealth} needsAttention={data.needsAttention} />
              </div>
            </div>

            {/* Recent Lessons */}
            <RecentLessons lessons={data.recentLessons} />

            {/* Recent Activity + Student Overview */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RecentActivity activity={data.recentActivity} />
              <StudentOverview overview={data.studentOverview} activityChart={data.activityChart} />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
