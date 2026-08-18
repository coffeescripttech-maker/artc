"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@aratc/ui";
import { Button } from "@/components/ui";

interface Tab {
  id?: string;
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface WorkspaceTabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function WorkspaceTabs({ tabs, activeTab, onTabChange, className = "" }: WorkspaceTabsProps) {
  const pathname = usePathname();

  // If activeTab/onTabChange are provided, use controlled mode
  const isControlled = activeTab !== undefined && onTabChange !== undefined;

  return (
    <div className={cn("border-b border-arc-slate-200 bg-white", className)}>
      <nav className="flex gap-1 px-6">
        {tabs.map((tab) => {
          // In controlled mode, check activeTab; in link mode, check pathname
          const isActive = isControlled
            ? tab.id === activeTab
            : tab.href && (pathname === tab.href || pathname.startsWith(tab.href + "/"));
          const Icon = tab.icon;

          if (isControlled) {
            return (
              <button
                key={tab.id || tab.label}
                onClick={() => tab.id && onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  isActive
                    ? "border-arc-orange-500 text-arc-orange-600"
                    : "border-transparent text-arc-slate-500 hover:text-arc-navy-900 hover:border-arc-slate-300"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
              </button>
            );
          }

          return (
            <Link
              key={tab.href || tab.label}
              href={tab.href || "#"}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                isActive
                  ? "border-arc-orange-500 text-arc-orange-600"
                  : "border-transparent text-arc-slate-500 hover:text-arc-navy-900 hover:border-arc-slate-300"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default WorkspaceTabs;
