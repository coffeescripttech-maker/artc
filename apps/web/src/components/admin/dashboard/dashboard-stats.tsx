"use client";

import { StatCard } from "@/components/ui";
import type { AdminStatsOverview } from "@/lib/api/client";
import {
  Users,
  GraduationCap,
  FileText,
  HelpCircle,
  Zap,
} from "lucide-react";

interface DashboardStatsProps {
  data: AdminStatsOverview;
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const { totals, contentHealth } = data;

  const stats = [
    {
      label: "Total Students",
      value: totals.students.toLocaleString(),
      change:
        totals.users > 0
          ? `+${totals.students} enrolled`
          : undefined,
      changeType: "increase" as const,
      icon: <Users className="h-6 w-6" />,
      iconBg: "navy" as const,
    },
    {
      label: "Published Programs",
      value: totals.publishedPrograms.toLocaleString(),
      change: `${totals.programs} total`,
      changeType: "neutral" as const,
      icon: <GraduationCap className="h-6 w-6" />,
      iconBg: "orange" as const,
    },
    {
      label: "Total Lessons",
      value: contentHealth.lessons.total.toLocaleString(),
      change: `${contentHealth.lessons.draft} draft`,
      changeType:
        contentHealth.lessons.draft > 0 ? "decrease" as const : "neutral" as const,
      icon: <FileText className="h-6 w-6" />,
      iconBg: "green" as const,
    },
    {
      label: "Questions in Bank",
      value: totals.questions.toLocaleString(),
      change: `${totals.publishedQuestions} published`,
      changeType: "increase" as const,
      icon: <HelpCircle className="h-6 w-6" />,
      iconBg: "purple" as const,
    },
    {
      label: "Assessments",
      value: totals.assessments.toLocaleString(),
      change: `${totals.completedAttempts} attempts`,
      changeType: "increase" as const,
      icon: <Zap className="h-6 w-6" />,
      iconBg: "red" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          iconBg={stat.iconBg}
        />
      ))}
    </div>
  );
}
