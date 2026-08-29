"use client";

import { useEffect, useState } from "react";
import { Building2, Check, ChevronDown, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  fetchMyMemberships,
  getActiveOrgId,
  setActiveOrgId,
  type MyMembership,
} from "@/lib/org-api";

/**
 * Organization switcher for the top nav.
 *
 * Renders nothing while memberships are loading and nothing at all when the
 * user has no organization memberships — so the nav is visually unchanged
 * for every existing user (§29: additive only).
 */
export function OrgSwitcher() {
  const [memberships, setMemberships] = useState<MyMembership[] | null>(null);
  const [activeOrgId, setActiveOrg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyMemberships()
      .then((list) => {
        if (cancelled) return;
        setMemberships(list);
        setActiveOrg(getActiveOrgId());
      })
      .catch(() => {
        // Silent — the switcher is optional chrome; failures just hide it.
        if (!cancelled) setMemberships([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const active =
    memberships.find((m) => m.organization.id === activeOrgId)?.organization ??
    null;

  const roleLabel = (role: string) =>
    role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-arc-slate-100 transition-colors"
          aria-label="Switch organization"
        >
          <Building className="h-4 w-4 text-arc-slate-600" />
          <span className="hidden lg:block text-sm font-medium text-arc-navy-900 max-w-[140px] truncate">
            {active ? active.name : "Organization"}
          </span>
          <ChevronDown className="h-4 w-4 text-arc-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white border border-arc-slate-200 shadow-lg rounded-xl p-1 mt-1"
      >
        <DropdownMenuLabel className="px-3 py-2 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-arc-slate-500" />
          <span className="text-sm font-semibold text-arc-navy-900">
            Organizations
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-arc-slate-200" />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => {
              setActiveOrgId(m.organization.id);
              setActiveOrg(m.organization.id);
            }}
            className="cursor-pointer px-3 py-2 rounded-lg hover:bg-arc-navy-50"
          >
            <div className="flex items-center justify-between w-full gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-arc-navy-900 truncate">
                  {m.organization.name}
                </div>
                <div className="text-xs text-arc-slate-500">
                  {roleLabel(m.role)}
                </div>
              </div>
              {activeOrgId === m.organization.id && (
                <Check className="h-4 w-4 text-arc-orange-600 flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OrgSwitcher;
