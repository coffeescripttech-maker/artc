"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/branding";
import type { NeedsAttentionItem } from "@/lib/api/client";

interface NeedsAttentionProps {
  items: NeedsAttentionItem[];
}

const severityConfig = {
  info: {
    icon: <CheckCircle2 className="h-5 w-5 text-arc-navy-600" />,
    iconBg: "bg-arc-navy-100",
    badgeVariant: "default" as const,
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5 text-arc-orange-600" />,
    iconBg: "bg-arc-orange-100",
    badgeVariant: "warning" as const,
  },
  danger: {
    icon: <AlertCircle className="h-5 w-5 text-arc-red-600" />,
    iconBg: "bg-arc-red-100",
    badgeVariant: "alert" as const,
  },
};

export function NeedsAttention({ items }: NeedsAttentionProps) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-arc-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-arc-green-600" />
            </div>
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon="graduation"
            title="All caught up!"
            description="Everything looks good across your platform. No immediate action required."
          />
        </CardContent>
      </Card>
    );
  }

  const totalIssues = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-arc-orange-600" />
            </div>
            Needs Attention
          </CardTitle>
          <Badge variant="secondary" className="font-medium">
            {totalIssues} issues
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const config = severityConfig[item.severity];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-arc-slate-200 hover:bg-arc-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={config.iconBg}>{config.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-arc-navy-900">{item.label}</p>
                    <p className="text-xs text-arc-slate-500">Severity: {item.severity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={config.badgeVariant} className="font-bold">
                    {item.count}
                  </Badge>
                  <Button
                    variant="ghost-accent"
                    size="sm"
                    asChild
                  >
                    <a href={item.href}>Review</a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
