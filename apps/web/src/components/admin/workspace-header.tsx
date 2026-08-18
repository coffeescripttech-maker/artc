"use client";

import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { Badge, Button } from "@/components/ui";

interface Stat {
  label: string;
  value: string | number;
}

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  stats?: Stat[];
  actions?: ReactNode;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error" | "draft" | "published" | "archived";
  className?: string;
}

const badgeColors: Record<string, string> = {
  default: "bg-arc-slate-100 text-arc-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  draft: "bg-arc-slate-100 text-arc-slate-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-600",
  under_review: "bg-yellow-100 text-yellow-700",
};

export function WorkspaceHeader({
  title,
  subtitle,
  breadcrumbs,
  stats,
  actions,
  badge,
  badgeVariant = "default",
  className = "",
}: WorkspaceHeaderProps) {
  return (
    <div className={`bg-white border-b border-arc-slate-200 ${className}`}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-3">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-arc-navy-900 truncate">
                {title}
              </h1>
              {badge && (
                <Badge className={badgeColors[badgeVariant]}>
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-arc-slate-600 text-sm">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-6 mt-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-2xl font-bold text-arc-navy-900">
                  {stat.value}
                </span>
                <span className="text-sm text-arc-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkspaceHeader;
