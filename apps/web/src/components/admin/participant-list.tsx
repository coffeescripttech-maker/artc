"use client";

// CS#23.3 §26–§27 — real participant lists (students/teachers): organization
// members filtered by system role. No mock data. Row click opens the real
// member-detail modal (profile, membership, links, activity).

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Badge, Input, Avatar, AvatarFallback } from "@/components/ui";
import { useManageableOrgs } from "@/lib/use-manageable-orgs";
import { fetchOrgMembers, OrgMember } from "@/lib/org-api";
import { MemberDetailModal } from "@/components/admin/member-detail-modal";
import { Search, Users } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  systemRole: "student" | "teacher" | "parent";
}

export function ParticipantList({ title, subtitle, systemRole }: Props) {
  const { error: orgError, organizations, selectedOrgId, setSelectedOrgId } = useManageableOrgs();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrgMember | null>(null);

  const loadMembers = useCallback(
    async (orgId: string) => {
      try {
        setListError(null);
        setMembers(await fetchOrgMembers(orgId, { systemRole }));
      } catch (e) {
        setListError(e instanceof Error ? e.message : "Failed to load members");
        setMembers([]);
      }
    },
    [systemRole],
  );

  useEffect(() => {
    if (selectedOrgId) {
      setMembers([]);
      loadMembers(selectedOrgId);
    }
  }, [selectedOrgId, loadMembers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId;
      return name.toLowerCase().includes(q) || (m.user?.email ?? "").toLowerCase().includes(q);
    });
  }, [members, search]);

  const totalActive = members.filter((m) => m.status === "ACTIVE").length;

  return (
    <>
      <DashboardHeader title={title} subtitle={subtitle} />
      <div className="p-6 space-y-4">
        {(orgError || listError) && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {orgError ?? listError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm font-medium text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            aria-label="Organization"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 border-arc-slate-200"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{members.length}</div>
                <div className="text-sm text-arc-slate-500">Total {title}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{totalActive}</div>
                <div className="text-sm text-arc-slate-500">Active</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Users className="h-12 w-12 text-arc-slate-300 mb-3" />
                <p className="text-sm font-medium text-arc-navy-900">No {title.toLowerCase()} found</p>
                <p className="text-xs text-arc-slate-500 mt-1">
                  {search ? "Try a different search." : "No records in this organization yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-arc-slate-100">
                {filtered.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => m.user && setDetail(m)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-arc-slate-50/60 transition-colors text-left"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-arc-navy-100 text-arc-navy-700 text-xs font-semibold">
                        {`${m.user?.firstName?.[0] ?? ""}${m.user?.lastName?.[0] ?? ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-arc-navy-900 truncate">
                        {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                      </div>
                      <div className="text-xs text-arc-slate-500 truncate">{m.user?.email ?? ""}</div>
                    </div>
                    <Badge className="bg-arc-slate-100 text-arc-navy-800 border-transparent text-xs">
                      {m.role}
                    </Badge>
                    <Badge
                      className={`${m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-arc-slate-100 text-arc-slate-600"} border-transparent`}
                    >
                      {m.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MemberDetailModal
        orgId={selectedOrgId ?? ""}
        member={
          detail
            ? {
                userId: detail.userId,
                firstName: detail.user?.firstName ?? "",
                lastName: detail.user?.lastName ?? "",
                email: detail.user?.email ?? "",
              }
            : null
        }
        onClose={() => setDetail(null)}
      />
    </>
  );
}

export default ParticipantList;