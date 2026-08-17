"use client";

import { cn } from "@aratc/ui";
import { Button } from "@/components/ui";
import {
  BookOpen,
  FileText,
  Users,
  Trophy,
  Search,
  Bell,
  Inbox,
  FolderOpen,
  ClipboardList,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

interface EmptyStateProps {
  icon?: "book" | "file" | "users" | "trophy" | "search" | "bell" | "inbox" | "folder" | "clipboard" | "graduation" | "chart";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

const icons = {
  book: BookOpen,
  file: FileText,
  users: Users,
  trophy: Trophy,
  search: Search,
  bell: Bell,
  inbox: Inbox,
  folder: FolderOpen,
  clipboard: ClipboardList,
  graduation: GraduationCap,
  chart: TrendingUp,
};

export function EmptyState({ icon = "inbox", title, description, action, className }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-arc-navy-100 rounded-full opacity-50 animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-arc-navy-100">
          <Icon className="h-10 w-10 text-arc-navy-400" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold text-arc-navy-900 mb-2">{title}</h3>
      {description && (
        <p className="text-arc-slate-500 max-w-sm mb-6">{description}</p>
      )}

      {/* Action */}
      {action && (
        action.href ? (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

// Pre-built Empty States
export function NoProgramsEmpty({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon="book"
      title="No Programs Yet"
      description="You haven't enrolled in any programs. Browse our catalog to find programs that match your learning goals."
      action={{ label: "Browse Programs", onClick: onBrowse }}
    />
  );
}

export function NoLessonsEmpty() {
  return (
    <EmptyState
      icon="graduation"
      title="No Lessons Available"
      description="This section doesn't have any lessons yet. Check back later for new content."
    />
  );
}

export function NoPracticeEmpty() {
  return (
    <EmptyState
      icon="clipboard"
      title="No Practice Sets"
      description="Practice sets help you master topics. Complete more lessons to unlock practice exercises."
    />
  );
}

export function NoExamsEmpty() {
  return (
    <EmptyState
      icon="trophy"
      title="No Exams Scheduled"
      description="You don't have any upcoming exams. Keep studying and check back for new assessments."
    />
  );
}

export function NoResultsEmpty({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="No Results Found"
      description={query ? `We couldn't find anything matching "${query}". Try a different search term.` : "We couldn't find what you're looking for. Try adjusting your filters."}
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon="bell"
      title="All Caught Up!"
      description="You have no new notifications. We'll let you know when something important happens."
    />
  );
}

export function NoDataEmpty({ title = "No Data", description = "There's no data to display at the moment." }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon="inbox"
      title={title}
      description={description}
    />
  );
}

export function ErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="folder"
      title="Something Went Wrong"
      description="We couldn't load this content. Please try again."
      action={{ label: "Try Again", onClick: onRetry }}
    />
  );
}

export function ComingSoonEmpty({ title = "Coming Soon", description = "This feature is under development. Stay tuned for updates!" }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon="graduation"
      title={title}
      description={description}
    />
  );
}
