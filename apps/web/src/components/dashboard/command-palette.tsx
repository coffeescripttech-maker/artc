"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Hash } from "lucide-react";
import { adminNav, studentNav, teacherNav, type NavGroup, type NavItem } from "./sidebar";
import { useAuth } from "@/contexts/auth-context";

interface FlatNavItem extends NavItem {
  groupLabel?: string;
}

function flattenNav(groups: NavGroup[]): FlatNavItem[] {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupLabel: group.label,
    }))
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine which nav set to show
  const navItems = useMemo(() => {
    const isAdmin = window.location.pathname.startsWith("/admin");
    if (isAdmin) return flattenNav(adminNav);

    const roles = user?.roles ?? [];
    if (roles.includes("teacher")) return flattenNav(teacherNav);
    return flattenNav(studentNav);
  }, [user]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase();
    return navItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.groupLabel?.toLowerCase().includes(q)
    );
  }, [navItems, query]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus input after modal renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const handleSelect = useCallback(
    (item: FlatNavItem) => {
      router.push(item.href);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          handleSelect(filteredItems[activeIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    },
    [filteredItems, activeIndex, handleSelect, onOpenChange]
  );

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-arc-navy-900/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-arc-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-arc-slate-200">
          <Search className="h-5 w-5 text-arc-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 py-4 bg-transparent border-none outline-none text-base text-arc-navy-900 placeholder:text-arc-slate-400"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-xs text-arc-slate-400 bg-arc-slate-100 px-2 py-1 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${item.href}-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-arc-navy-50 text-arc-navy-900"
                      : "text-arc-slate-700 hover:bg-arc-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                      isActive ? "bg-arc-navy-100 text-arc-navy-600" : "bg-arc-slate-100 text-arc-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    {item.groupLabel && (
                      <div className="text-xs text-arc-slate-400 truncate">{item.groupLabel}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-arc-slate-400 flex-shrink-0">
                    <Hash className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{item.href}</span>
                  </div>
                  {isActive && (
                    <CornerDownLeft className="h-4 w-4 text-arc-navy-400 flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-12 text-center">
              <Search className="h-8 w-8 text-arc-slate-300 mx-auto mb-3" />
              <p className="text-sm text-arc-slate-500">
                No pages found for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-arc-slate-200 bg-arc-slate-50">
          <div className="flex items-center gap-4 text-xs text-arc-slate-500">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
          </div>
          <span className="text-xs text-arc-slate-400">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
