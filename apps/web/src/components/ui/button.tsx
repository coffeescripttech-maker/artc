import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@aratc/ui";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary (Main brand buttons — semantic token)
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-arc-sm hover:shadow-arc",

        // Accent (CTA buttons — semantic token)
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-arc-sm hover:shadow-arc",

        // Success (Positive actions — semantic token)
        success: "bg-success text-white hover:bg-success-hover shadow-arc-sm hover:shadow-arc",

        // Practice - Purple (Learning activities — fixed domain color)
        practice: "bg-arc-purple-500 text-white hover:bg-arc-purple-600 shadow-arc-sm hover:shadow-arc",

        // Outline variants
        outline: "border-2 border-primary text-primary hover:bg-primary-subtle",
        "outline-accent": "border-2 border-accent text-accent hover:bg-accent-subtle",
        "outline-success": "border-2 border-success text-success hover:bg-success-subtle",
        "outline-practice": "border-2 border-arc-purple-500 text-arc-purple-500 hover:bg-arc-purple-50",

        // Ghost variants
        ghost: "hover:bg-secondary text-arc-slate-700",
        "ghost-accent": "hover:bg-accent-subtle text-accent-hover",
        "ghost-success": "hover:bg-success-subtle text-success-hover",
        "ghost-practice": "hover:bg-arc-purple-50 text-arc-purple-600",

        // Link
        link: "text-primary-hover underline-offset-4 hover:underline",

        // Destructive
        destructive: "bg-danger text-white hover:bg-danger-hover",

        // Secondary
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
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
