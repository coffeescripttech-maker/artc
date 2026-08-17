"use client";

import { cn } from "@aratc/ui";
import { Progress } from "@/components/ui";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface MasteryMeterProps {
  label: string;
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MasteryMeter({
  label,
  value,
  showLabel = true,
  size = "md",
  className,
}: MasteryMeterProps) {
  const getVariant = () => {
    if (value >= 80) return "mastery";
    if (value >= 50) return "learning";
    if (value >= 30) return "practice";
    return "warning";
  };

  const getIcon = () => {
    if (value >= 80) return <CheckCircle className="h-4 w-4 text-arc-green-600" />;
    if (value >= 50) return <Circle className="h-4 w-4 text-arc-navy-500" />;
    return <AlertCircle className="h-4 w-4 text-arc-orange-500" />;
  };

  const getLabel = () => {
    if (value >= 80) return "Mastered";
    if (value >= 50) return "Learning";
    if (value >= 30) return "Practicing";
    return "Needs Work";
  };

  const getProgressSize = () => {
    if (size === "sm") return "sm";
    if (size === "lg") return "lg";
    return "default";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-arc-slate-700">{label}</span>
        </div>
        {showLabel && (
          <span className="text-xs font-semibold text-arc-slate-500">{getLabel()}</span>
        )}
      </div>
      <Progress value={value} variant={getVariant()} size={getProgressSize()} />
    </div>
  );
}

interface SubjectMasteryProps {
  subject: string;
  score: number;
  trend?: string;
  icon?: string;
  className?: string;
}

export function SubjectMasteryCard({
  subject,
  score,
  trend,
  icon,
  className,
}: SubjectMasteryProps) {
  const getScoreColor = () => {
    if (score >= 80) return "text-arc-green-600";
    if (score >= 60) return "text-arc-navy-600";
    if (score >= 40) return "text-arc-orange-500";
    return "text-arc-red-500";
  };

  return (
    <div className={cn("p-4 bg-white rounded-xl border border-arc-slate-100", className)}>
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div className="flex-1">
          <div className="text-sm font-medium text-arc-slate-700">{subject}</div>
          {trend && (
            <div className="text-xs text-arc-green-600 font-medium">{trend}</div>
          )}
        </div>
        <div className={cn("text-2xl font-bold", getScoreColor())}>{score}%</div>
      </div>
      <Progress value={score} variant={score >= 80 ? "mastery" : "learning"} size="sm" />
    </div>
  );
}
