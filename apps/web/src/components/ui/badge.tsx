import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@aratc/ui";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // ARC Badge Variants — semantic tokens
        default: "bg-primary-subtle text-primary",

        // Mastery - Success (Completed, Passed, On Track)
        mastery: "bg-success-subtle text-success-foreground",

        // Learning - Primary (In Progress)
        learning: "bg-primary-subtle text-primary",

        // Practice - Purple (Exercises, Quizzes — fixed domain color)
        practice: "bg-arc-purple-100 text-arc-purple-700",

        // Warning (Attention needed — draft/pending states)
        warning: "bg-warning-subtle text-warning-foreground",

        // Alert - Danger (Failed, Critical)
        alert: "bg-danger-subtle text-danger-foreground",

        // Error - Danger (alias for alert)
        error: "bg-danger-subtle text-danger-foreground",

        // Primary
        primary: "bg-primary text-primary-foreground",

        // Secondary
        secondary: "bg-secondary text-secondary-foreground",

        // Success (alias for mastery)
        success: "bg-success-subtle text-success-foreground",

        // Info
        info: "bg-primary-subtle text-primary",

        // Outline
        outline: "border border-arc-slate-300 text-arc-slate-700",

        // Ghost
        ghost: "bg-transparent text-arc-muted",

        // Premium/Featured
        premium: "bg-gradient-to-r from-accent to-accent-hover text-white",

        // Featured/Highlighted
        featured: "bg-gradient-to-r from-primary to-primary-hover text-white",

        // Draft status
        draft: "bg-warning-subtle text-warning-foreground",

        // Published status
        published: "bg-success-subtle text-success-foreground",

        // Archived status
        archived: "bg-secondary text-secondary-foreground",
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
