import * as React from "react";
import { cn } from "@aratc/ui";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "animate-pulse rounded-lg bg-arc-slate-100",
        className
      )}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export { Skeleton };
