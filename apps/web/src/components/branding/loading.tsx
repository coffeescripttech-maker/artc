"use client";

import { cn } from "@aratc/ui";

// Full Page Loader
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-bg">
      <div className="text-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 rounded-xl bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 animate-ping opacity-75" />
        </div>
        <p className="mt-4 text-arc-navy-700 font-medium">{text}</p>
      </div>
    </div>
  );
}

// Button Loading State
interface ButtonLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ButtonLoader({ className, size = "md" }: ButtonLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-6 w-6 border-[3px]",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-arc-orange-500 border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Skeleton Loaders
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-arc-slate-200 bg-white p-6", className)}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded bg-arc-slate-100" />
        <div className="h-3 w-full rounded bg-arc-slate-100" />
        <div className="h-3 w-2/3 rounded bg-arc-slate-100" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-arc-slate-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-arc-slate-100">
        <div className="h-6 w-32 rounded bg-arc-slate-100 animate-pulse" />
      </div>
      <div className="divide-y divide-arc-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 rounded bg-arc-slate-100 animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-arc-slate-200 bg-white p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-arc-slate-100 animate-pulse" />
        <div className="flex-1">
          <div className="h-8 w-20 rounded bg-arc-slate-100 animate-pulse mb-1" />
          <div className="h-4 w-24 rounded bg-arc-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="h-12 w-12 rounded-full bg-arc-slate-100 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-32 rounded bg-arc-slate-100 animate-pulse mb-1" />
        <div className="h-3 w-48 rounded bg-arc-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

// Progress Bar Loading
export function ProgressLoader({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <div className="h-4 w-24 rounded bg-arc-slate-100 animate-pulse" />
        <div className="h-4 w-12 rounded bg-arc-slate-100 animate-pulse" />
      </div>
      <div className="h-2 w-full rounded-full bg-arc-slate-100 overflow-hidden">
        <div
          className="h-full bg-arc-navy-500 animate-pulse"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Page Section Loading
export function SectionLoader({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded bg-arc-slate-100 animate-pulse" />
        <div className="h-8 w-24 rounded bg-arc-slate-100 animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Dashboard Stats Loading
export function DashboardStatsLoader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
