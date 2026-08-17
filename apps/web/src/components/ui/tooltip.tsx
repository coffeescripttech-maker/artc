"use client";

import * as React from "react";
import { cn } from "@aratc/ui";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
}

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
  contentClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            side === "top" && "bottom-full mb-2",
            side === "bottom" && "top-full mt-2",
            side === "left" && "right-full mr-2",
            side === "right" && "left-full ml-2",
            align === "start" && (side === "top" || side === "bottom") && "left-0",
            align === "center" && (side === "top" || side === "bottom") && "left-1/2 -translate-x-1/2",
            align === "end" && (side === "top" || side === "bottom") && "right-0",
            align === "start" && (side === "left" || side === "right") && "top-0",
            align === "center" && (side === "left" || side === "right") && "top-1/2 -translate-y-1/2",
            align === "end" && (side === "left" || side === "right") && "bottom-0",
            contentClassName
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
