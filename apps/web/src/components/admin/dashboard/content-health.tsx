"use client";

import { Card, CardHeader, CardTitle, CardContent, Progress, Badge, Button } from "@/components/ui";
import { AlertCircle, CheckCircle2, Clock, Archive } from "lucide-react";
import type { ContentHealth, NeedsAttentionItem } from "@/lib/api/client";

interface ContentHealthProps {
  data: ContentHealth;
  needsAttention: NeedsAttentionItem[];
}

const statusIcons = {
  published: <CheckCircle2 className="h-4 w-4 text-arc-green-600" />,
  draft: <Clock className="h-4 w-4 text-arc-orange-600" />,
  review: <AlertCircle className="h-4 w-4 text-arc-purple-600" />,
  archived: <Archive className="h-4 w-4 text-arc-slate-600" />,
};

export function ContentHealth({ data, needsAttention }: ContentHealthProps) {
  const { aggregated, lessons, questions } = data;

  const contentIssues = needsAttention
    .filter(
      (item) =>
        item.label.includes("Lessons") ||
        item.label.includes("Questions") ||
        item.label.includes("Assessments") ||
        item.label.includes("Modules")
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-arc-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-arc-green-600" />
          </div>
          Content Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Aggregated progress bars */}
        <div className="space-y-4">
          <Progress
            value={aggregated.publishedPercent}
            variant="mastery"
            size="lg"
            labelPosition="left"
          />
          <Progress
            value={aggregated.draftPercent}
            variant="warning"
            size="lg"
            labelPosition="left"
          />
          <Progress
            value={aggregated.reviewPercent}
            variant="alert"
            size="lg"
            labelPosition="left"
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="space-y-2 text-center">
            <div className="text-xl font-bold text-arc-navy-900">{lessons.published}</div>
            <div className="text-xs text-arc-slate-500">Lessons Published</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-xl font-bold text-arc-orange-600">{lessons.draft}</div>
            <div className="text-xs text-arc-slate-500">Lessons Draft</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-xl font-bold text-arc-purple-600">{questions.underReview}</div>
            <div className="text-xs text-arc-slate-500">Questions in Review</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-xl font-bold text-arc-slate-600">{lessons.archived}</div>
            <div className="text-xs text-arc-slate-500">Archived</div>
          </div>
        </div>

        {/* Actionable issues */}
        {contentIssues.length > 0 && (
          <div className="pt-4 border-t border-arc-slate-200 space-y-2">
            <p className="text-xs font-semibold text-arc-slate-600 uppercase tracking-wider">
              Actionable Items
            </p>
            {contentIssues.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-arc-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {statusIcons[item.severity === "danger" ? "review" : item.severity === "warning" ? "review" : "draft"]}
                  <span className="text-sm text-arc-navy-900">{item.label}</span>
                </div>
                <Badge variant="secondary" className="font-medium">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
