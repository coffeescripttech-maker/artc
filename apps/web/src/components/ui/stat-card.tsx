"use client";

import { cn } from "@aratc/ui";
import { Card } from "@/components/ui";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  iconBg?: "navy" | "orange" | "green" | "purple" | "red";
  className?: string;
}

const iconBgClasses = {
  navy: "bg-arc-navy-100 text-arc-navy-700",
  orange: "bg-arc-orange-100 text-arc-orange-600",
  green: "bg-arc-green-100 text-arc-green-600",
  purple: "bg-arc-purple-100 text-arc-purple-600",
  red: "bg-arc-red-100 text-arc-red-600",
};

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBg = "navy",
  className,
}: StatCardProps) {
  const changeColor =
    changeType === "increase"
      ? "text-arc-green-600"
      : changeType === "decrease"
      ? "text-arc-red-600"
      : "text-arc-slate-500";

  return (
    <Card className={cn("hover:shadow-arc transition-shadow", className)}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          {icon && (
            <div className={cn("p-2 rounded-lg", iconBgClasses[iconBg])}>
              {icon}
            </div>
          )}
          {change && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
              {changeType === "increase" && <TrendingUp className="h-4 w-4" />}
              {changeType === "decrease" && <TrendingDown className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-arc-navy-900">{value}</div>
        <div className="text-sm text-arc-slate-500 mt-1">{label}</div>
      </div>
    </Card>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MiniStat({ label, value, className }: MiniStatProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-lg font-bold text-arc-navy-900">{value}</div>
      <div className="text-xs text-arc-slate-500">{label}</div>
    </div>
  );
}
