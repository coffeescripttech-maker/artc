import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@aratc/ui";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-navy-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // ARC Primary - Navy (Main brand buttons)
        default: "bg-arc-navy-900 text-white hover:bg-arc-navy-700 shadow-arc-sm hover:shadow-arc",

        // ARC Accent - Orange (CTA buttons)
        accent: "bg-arc-orange-500 text-white hover:bg-arc-orange-600 shadow-arc-sm hover:shadow-arc",

        // ARC Success - Green (Positive actions)
        success: "bg-arc-green-500 text-white hover:bg-arc-green-600 shadow-arc-sm hover:shadow-arc",

        // ARC Practice - Purple (Learning activities)
        practice: "bg-arc-purple-500 text-white hover:bg-arc-purple-600 shadow-arc-sm hover:shadow-arc",

        // Outline variants
        outline: "border-2 border-arc-navy-900 text-arc-navy-900 hover:bg-arc-navy-50",
        "outline-accent": "border-2 border-arc-orange-500 text-arc-orange-500 hover:bg-arc-orange-50",
        "outline-success": "border-2 border-arc-green-500 text-arc-green-500 hover:bg-arc-green-50",
        "outline-practice": "border-2 border-arc-purple-500 text-arc-purple-500 hover:bg-arc-purple-50",

        // Ghost variants
        ghost: "hover:bg-arc-slate-100 text-arc-slate-700",
        "ghost-accent": "hover:bg-arc-orange-50 text-arc-orange-600",
        "ghost-success": "hover:bg-arc-green-50 text-arc-green-600",
        "ghost-practice": "hover:bg-arc-purple-50 text-arc-purple-600",

        // Link
        link: "text-arc-navy-700 underline-offset-4 hover:underline",

        // Destructive
        destructive: "bg-arc-red-500 text-white hover:bg-arc-red-600",

        // Secondary
        secondary: "bg-arc-slate-100 text-arc-navy-900 hover:bg-arc-slate-200",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
