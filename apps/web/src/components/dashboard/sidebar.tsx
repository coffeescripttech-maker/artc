"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@aratc/ui";
import { Avatar, AvatarFallback, Button, Badge } from "@/components/ui";
import LogoImage from "../../../assets/images/logo/logo.png";

// Sidebar width constants
export const SIDEBAR_WIDTH = 256; // w-64
export const SIDEBAR_COLLAPSED_WIDTH = 72; // w-[72px]

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const studentNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Programs", href: "/dashboard/programs", icon: BookOpen },
      { label: "Practice", href: "/dashboard/practice", icon: FileText },
      { label: "Mock Exams", href: "/dashboard/exams", icon: Trophy },
    ],
  },
  {
    label: "Progress",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Achievements", href: "/dashboard/achievements", icon: Trophy, badge: "New" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Programs", href: "/admin/programs", icon: BookOpen },
      { label: "Questions", href: "/admin/questions", icon: FileText },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  role?: "student" | "teacher" | "admin";
  children?: React.ReactNode;
}

// Create a context to share sidebar state
import { createContext, useContext } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Sidebar({ role = "student", children }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsedState(saved === "true");
    }
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const nav = role === "admin" ? adminNav : studentNav;

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="h-16 flex items-center px-3 border-b border-arc-navy-800">
        <Link
          href="/"
          className={cn(
            "flex items-center h-full",
            collapsed ? "justify-center w-full" : "gap-2"
          )}
        >
          {/* Logo container */}
          <div className="relative h-9 w-9 rounded-lg bg-white shadow-lg overflow-hidden flex-shrink-0">
            <Image
              src={LogoImage}
              alt="ARATC Logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
          {/* Brand text - smooth transition */}
          <span
            className={cn(
              "text-xl font-bold text-white tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            ARATC
          </span>
        </Link>

        {/* Collapse/Expand button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden lg:flex p-1.5 rounded-md hover:bg-arc-navy-800 transition-colors flex-shrink-0",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-arc-navy-300" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-arc-navy-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {group.label && !collapsed && (
              <div className="px-3 mb-2 text-xs font-semibold text-arc-navy-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-arc-navy-800 text-white"
                        : "text-arc-navy-200 hover:bg-arc-navy-800 hover:text-white",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-arc-orange-400" : "text-arc-navy-300 group-hover:text-white"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 font-medium text-sm">{item.label}</span>
                        {item.badge && (
                          <Badge variant="premium" size="sm">{item.badge}</Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-arc-navy-800 p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-arc-navy-800 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white text-sm font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Juan Dela Cruz</div>
              <div className="text-xs text-arc-navy-400 truncate">Grade 10 Student</div>
            </div>
          )}
        </div>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-arc-navy-300 hover:bg-arc-navy-800 hover:text-white transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Log out</span>}
        </button>
      </div>
    </>
  );

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 bg-arc-orange-500 text-white rounded-full shadow-arc-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-arc-navy-900/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-arc-navy-950 transition-all duration-300 flex flex-col",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content - responds to sidebar width */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[72px]" : "lg:ml-64"
      )}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-arc-slate-200 flex items-center justify-between px-6">
      {/* Mobile menu button */}
      <button className="lg:hidden p-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
        <Menu className="h-5 w-5 text-arc-slate-600" />
      </button>

      <div>
        <h1 className="text-xl font-bold text-arc-navy-900">{title}</h1>
        {subtitle && <p className="text-sm text-arc-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-arc-slate-50 rounded-lg border border-arc-slate-200">
          <Search className="h-4 w-4 text-arc-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-48 text-arc-navy-900 placeholder:text-arc-slate-400"
          />
        </div>
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-arc-slate-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-arc-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
