"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@aratc/ui";

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-arc-slate-100",
  {
    variants: {
      variant: {
        default: "bg-arc-navy-500",
        mastery: "bg-arc-green-500",
        learning: "bg-arc-navy-500",
        practice: "bg-arc-purple-500",
        warning: "bg-arc-orange-500",
        alert: "bg-arc-red-500",
      },
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "mastery" | "learning" | "practice" | "warning" | "alert";
  size?: "sm" | "default" | "lg" | "xl";
  showLabel?: boolean;
  labelPosition?: "left" | "right" | "inside";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = "default", size = "default", showLabel, labelPosition = "right", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="flex items-center gap-3">
        {(showLabel || labelPosition === "left") && (
          <span className="text-sm font-medium text-arc-slate-700 whitespace-nowrap">
            {Math.round(percentage)}%
          </span>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size }), className)}
          {...props}
        >
          {labelPosition === "inside" && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              variant === "default" && "bg-arc-navy-500",
              variant === "mastery" && "bg-arc-green-500",
              variant === "learning" && "bg-arc-navy-500",
              variant === "practice" && "bg-arc-purple-500",
              variant === "warning" && "bg-arc-orange-500",
              variant === "alert" && "bg-arc-red-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && labelPosition === "right" && (
          <span className="text-sm font-medium text-arc-slate-700 whitespace-nowrap">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress, progressVariants };
