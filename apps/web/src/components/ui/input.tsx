import * as React from "react";
import { cn } from "@aratc/ui";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-arc-slate-200 bg-white px-4 py-2 text-sm",
          "placeholder:text-arc-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-arc-navy-500 focus:border-arc-navy-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
