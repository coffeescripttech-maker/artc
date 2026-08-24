"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { progressionApi } from "@/lib/api/client";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BookOpen,
  Trophy,
  TrendingUp,
  Calendar,
  Filter,
} from "lucide-react";

type ActivityItem = {
  id: string;
  type: "ASSESSMENT" | "PROGRESS";
  title: string;
  description: string;
  timestamp: string;
  percent?: number;
  link?: string;
};

type ActivityResponse = {
  activities: ActivityItem[];
};

function groupByDate(items: ActivityItem[]): Record<string, ActivityItem[]> {
  const groups: Record<string, ActivityItem[]> = {};
  const now = new Date();

  items.forEach((item) => {
    const ts = new Date(item.timestamp);
    let group = "Older";

    const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      group = "Today";
    } else if (diffDays === 1) {
      group = "Yesterday";
    } else if (diffDays <= 7) {
      group = "This Week";
    } else if (diffDays <= 30) {
      group = "This Month";
    } else {
      group = "Older";
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });

  return groups;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<"all" | "ASSESSMENT" | "PROGRESS">("all");

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await progressionApi.activity(50)) as ActivityResponse;
      setActivities(data?.activities ?? []);
    } catch (err) {
      console.error("Failed to load activity:", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === filter);

  const grouped = groupByDate(filtered);

  return (
    <>
      <DashboardHeader
        title="Activity"
        subtitle="Your learning activity timeline"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Activity" },
        ]}
      />

      <div className="p-6">
        {/* Filter controls */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-arc-slate-500" />
          {(["all", "ASSESSMENT", "PROGRESS"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "ASSESSMENT" ? "Assessments" : "Progress"}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                {filter === "all" || filter === "ASSESSMENT"
                  ? "No activity yet"
                  : "No progress recorded"}
              </h3>
              <p className="text-arc-slate-500">
                {filter === "all"
                  ? "Start taking assessments and studying lessons to see your activity here."
                  : `No ${filter === "ASSESSMENT" ? "assessment" : "progress"} activity in this filter.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                <h2 className="text-xs font-semibold text-arc-slate-500 uppercase tracking-wider mb-3">
                  {group}
                </h2>
                <div className="space-y-2">
                  {groupItems.map((item) => (
                    <ActivityItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ActivityItemCard({ item }: { item: ActivityItem }) {
  const isAssessment = item.type === "ASSESSMENT";
  const percent = item.percent ?? 0;

  let icon: React.ReactNode;
  let iconBg: string;
  let borderColor: string;

  if (isAssessment) {
    icon = <Trophy className="h-5 w-5 text-arc-orange-500" />;
    iconBg = "bg-arc-orange-100";
    const passed = percent >= 70;
    borderColor = passed ? "border-green-500" : "border-red-500";
  } else {
    icon = <TrendingUp className="h-5 w-5 text-blue-500" />;
    iconBg = "bg-blue-100";
    borderColor = "border-blue-500";
  }

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${iconBg} border-2 ${borderColor}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-arc-navy-900">{item.title}</div>
          <div className="text-sm text-arc-slate-500 mt-0.5">{item.description}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-arc-slate-400">
            <Calendar className="h-3 w-3" />
            <span>{formatTime(item.timestamp)}</span>
            {item.percent !== undefined && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(item.percent)}%
                </Badge>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-arc-slate-300 shrink-0 ml-2" />
      </div>
    </>
  );

  return item.link ? (
    <Link href={item.link} className="block">
      <Card className="hover:border-arc-orange-300 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    </Link>
  ) : (
    <Card>
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}

import { ChevronRight } from "lucide-react";