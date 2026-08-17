"use client";

import { cn } from "@aratc/ui";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  variant?: "full" | "icon" | "compact";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: {
    icon: "h-7 w-7",
    text: "text-base",
    iconSize: "h-4 w-4",
  },
  md: {
    icon: "h-9 w-9",
    text: "text-lg",
    iconSize: "h-5 w-5",
  },
  lg: {
    icon: "h-12 w-12",
    text: "text-xl",
    iconSize: "h-6 w-6",
  },
  xl: {
    icon: "h-16 w-16",
    text: "text-2xl",
    iconSize: "h-8 w-8",
  },
};

export function Logo({ variant = "full", size = "md", className, showText = true }: LogoProps) {
  const sizes = sizeClasses[size];

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-arc-orange-500 to-arc-orange-600",
          sizes.icon,
          className
        )}
      >
        <GraduationCap className={cn("text-white", sizes.iconSize)} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 shadow-arc-sm",
          sizes.icon
        )}
      >
        <GraduationCap className={cn("text-white", sizes.iconSize)} />
      </div>
      {showText && (
        <span className={cn("font-bold text-arc-navy-900 tracking-tight", sizes.text)}>
          ARATC
        </span>
      )}
    </div>
  );
}

export function LogoWithText({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Logo variant="full" size={size} className={className} />;
}

export function LogoIconOnly({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Logo variant="icon" size={size} className={className} showText={false} />;
}

// Brand colors text for gradient text
export function BrandText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("bg-gradient-to-r from-arc-navy-700 to-arc-purple-600 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  );
}

// Badge for brand name
export function BrandBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-arc-navy-100 px-3 py-1 text-xs font-semibold text-arc-navy-700",
        className
      )}
    >
      <GraduationCap className="h-3 w-3" />
      <span>ARATC</span>
    </div>
  );
}
