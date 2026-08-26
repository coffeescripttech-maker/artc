"use client";

import { Check } from "lucide-react";
import { cn } from "@aratc/ui";

const STEPS = [
  { number: 1, label: "Upload PDF" },
  { number: 2, label: "Review Text" },
  { number: 3, label: "Check & Import" },
];

/**
 * Shared 3-step progress indicator for the PDF import workflow.
 * current is 1-based (1 = Upload, 2 = Review, 3 = Import).
 */
export function ImportSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, i) => {
        const isDone = current > step.number;
        const isCurrent = current === step.number;

        return (
          <div key={step.number} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border transition-colors",
                  isDone
                    ? "bg-arc-orange-500 border-arc-orange-500 text-white"
                    : isCurrent
                      ? "border-arc-orange-500 text-arc-orange-600 bg-arc-orange-50"
                      : "border-arc-slate-200 text-arc-slate-400 bg-white"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.number}
              </span>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  isCurrent
                    ? "text-arc-navy-900"
                    : isDone
                      ? "text-arc-navy-600"
                      : "text-arc-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  current > step.number ? "bg-arc-orange-400" : "bg-arc-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
