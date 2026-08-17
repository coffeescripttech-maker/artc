import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@aratc/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // ARC Badge Variants
        default: "bg-arc-navy-100 text-arc-navy-700",

        // Mastery - Green (Completed, Passed, On Track)
        mastery: "bg-arc-green-100 text-arc-green-700",

        // Learning - Navy (In Progress)
        learning: "bg-arc-navy-100 text-arc-navy-700",

        // Practice - Purple (Exercises, Quizzes)
        practice: "bg-arc-purple-100 text-arc-purple-700",

        // Warning - Orange (Attention needed)
        warning: "bg-arc-orange-100 text-arc-orange-700",

        // Alert - Red (Failed, Critical)
        alert: "bg-arc-red-100 text-arc-red-600",

        // Primary (Navy)
        primary: "bg-arc-navy-900 text-white",

        // Secondary
        secondary: "bg-arc-slate-100 text-arc-slate-700",

        // Success (alias for mastery)
        success: "bg-arc-green-100 text-arc-green-700",

        // Info
        info: "bg-arc-navy-100 text-arc-navy-700",

        // Outline
        outline: "border border-arc-slate-300 text-arc-slate-700",

        // Ghost
        ghost: "bg-transparent text-arc-muted",

        // Premium/Featured
        premium: "bg-gradient-to-r from-arc-orange-500 to-arc-orange-400 text-white",

        // Featured/Highlighted
        featured: "bg-gradient-to-r from-arc-navy-900 to-arc-navy-700 text-white",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
