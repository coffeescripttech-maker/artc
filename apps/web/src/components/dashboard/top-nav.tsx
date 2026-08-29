"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Search, Settings, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "./sidebar";
import { useAuth } from "@/contexts/auth-context";
import { CommandPalette } from "./command-palette";
import { OrgSwitcher } from "./org-switcher";

export function TopNav() {
  const { setMobileOpen } = useSidebar();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const settingsPath = isAdmin ? "/admin/settings" : "/dashboard/settings";
  const sectionLabel = isAdmin ? "Admin" : "Dashboard";

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Guest User";
  const role = user?.roles?.[0]?.replace(/_/g, " ").toLowerCase() || "Student";

  return (
    <>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <header className="sticky top-0 z-30 h-12 bg-white border-b border-arc-slate-200 flex items-center gap-3 px-4 lg:px-6">
        {/* Left: mobile menu toggle + section label */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-arc-slate-600" />
          </button>
          <span className="text-sm font-semibold text-arc-navy-900 hidden sm:block">
            {sectionLabel}
          </span>
        </div>

        {/* Center: search trigger — opens command palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-arc-slate-50 rounded-lg border border-arc-slate-200 text-sm text-arc-slate-400 w-56 ml-2 hover:bg-arc-slate-100 hover:border-arc-slate-300 transition-colors"
          aria-label="Search (Cmd+K)"
        >
          <Search className="h-4 w-4 flex-shrink-0" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-arc-slate-200 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon — opens command palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-arc-slate-600" />
        </button>

        {/* Right: org switcher (hidden when no memberships) + notifications + user dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Organization switcher — renders nothing without memberships */}
          <OrgSwitcher />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-arc-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-arc-orange-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-medium text-arc-navy-900 max-w-[120px] truncate">
                  {fullName}
                </span>
                <ChevronDown className="hidden lg:block h-4 w-4 text-arc-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border border-arc-slate-200 shadow-lg rounded-xl p-1 mt-1"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="font-semibold text-arc-navy-900 text-sm truncate">
                  {fullName}
                </div>
                <div className="text-xs text-arc-slate-500 capitalize mt-0.5">
                  {role}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-arc-slate-200" />
              <Link href={settingsPath}>
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg">
                  <Settings className="h-4 w-4 mr-2 text-arc-slate-500" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-arc-slate-200" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-2 text-red-500" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}

export default TopNav;
