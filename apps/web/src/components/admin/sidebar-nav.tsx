"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@aratc/ui";
import { Button } from "@aratc/ui";
import {
  BookOpen,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  {
    group: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/programs", label: "Programs", icon: GraduationCap },
      { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
      { href: "/admin/topics", label: "Topics", icon: ClipboardList },
      { href: "/admin/questions", label: "Questions", icon: ClipboardList },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/batches", label: "Batches", icon: BookOpen },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: LifeBuoy },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-y-auto border-r bg-card transition-all duration-300",
        collapsed ? "w-[60px]" : "w-64",
      )}
    >
      {/* Top section with brand */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/admin" className="text-xl font-bold">
            ARATC Admin
          </Link>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn("h-6 w-6 p-0", collapsed && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        )}
      </div>

      {/* Nav list */}
      <nav className="flex-1 py-4">
        {navItems.map((section) => (
          <div key={section.group} className="mb-6">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                {section.group}
              </p>
            )}
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      collapsed ? "justify-center" : "",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
