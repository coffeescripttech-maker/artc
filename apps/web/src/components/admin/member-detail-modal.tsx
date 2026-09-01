"use client";

// CS#23.3 §7 — member detail modal: real profile + org membership + system
// roles + linked students/parents + activity counts from the org API.

import { useEffect, useState } from "react";
import { Badge, Avatar, AvatarFallback } from "@/components/ui";
import { fetchOrgMemberDetail, OrgMemberDetail } from "@/lib/org-api";

interface Props {
  orgId: string;
  member: { userId: string; firstName: string; lastName: string; email: string } | null;
  onClose: () => void;
}

export function MemberDetailModal({ orgId, member, onClose }: Props) {
  const [detail, setDetail] = useState<OrgMemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member) return;
    setError(null);
    setDetail(null);
    fetchOrgMemberDetail(orgId, member.userId)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load member"));
  }, [orgId, member]);

  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-arc-navy-950/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Member detail: ${member.firstName} ${member.lastName}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-arc-xl w-full max-w-2xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
          <h2 className="text-lg font-bold text-arc-navy-900">Member Detail</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!detail && !error && <div className="text-sm text-arc-slate-500">Loading member…</div>}

          {detail && (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-arc-navy-100 text-arc-navy-700 font-semibold">
                    {`${detail.firstName?.[0] ?? ""}${detail.lastName?.[0] ?? ""}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base font-bold text-arc-navy-900">
                    {detail.firstName} {detail.lastName}
                  </div>
                  <div className="text-sm text-arc-slate-500">{detail.email}</div>
                </div>
                <Badge
                  className={`ml-auto ${
                    detail.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-arc-slate-100 text-arc-slate-600"
                  } border-transparent`}
                >
                  {detail.status}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-lg border border-arc-slate-200 p-3">
                  <div className="text-xs uppercase tracking-wide text-arc-slate-400 mb-2">System Roles</div>
                  <div className="flex flex-wrap gap-1">
                    {detail.systemRoles.map((r) => (
                      <Badge key={r} className="bg-arc-navy-100 text-arc-navy-700 border-transparent">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-arc-slate-200 p-3">
                  <div className="text-xs uppercase tracking-wide text-arc-slate-400 mb-2">Membership</div>
                  {detail.membership ? (
                    <>
                      <div className="font-semibold text-arc-navy-900">{detail.membership.role}</div>
                      <div className="text-xs text-arc-slate-500">{detail.membership.status}</div>
                    </>
                  ) : (
                    <div className="text-xs text-arc-slate-500">No membership</div>
                  )}
                </div>
                <div className="rounded-lg border border-arc-slate-200 p-3 text-xs text-arc-slate-600">
                  <div className="text-xs uppercase tracking-wide text-arc-slate-400 mb-2">Activity</div>
                  <div>{detail.activeEnrollments} active enrollment(s)</div>
                  <div>{detail.teachingAssignments} teaching assignment(s)</div>
                  <div>{detail.recentAuditEvents} audit event(s)</div>
                </div>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-arc-slate-200 p-3">
                  <div className="text-xs uppercase tracking-wide text-arc-slate-400 mb-2">
                    Linked Students
                  </div>
                  {detail.linkedStudents.length === 0 ? (
                    <p className="text-xs text-arc-slate-500">None linked.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-arc-navy-900">
                      {detail.linkedStudents.map((s) => (
                        <li key={s.id}>
                          {s.firstName} {s.lastName}
                          <span className="text-arc-slate-400"> · {s.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-lg border border-arc-slate-200 p-3">
                  <div className="text-xs uppercase tracking-wide text-arc-slate-400 mb-2">Parents</div>
                  {detail.parents.length === 0 ? (
                    <p className="text-xs text-arc-slate-500">None linked.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-arc-navy-900">
                      {detail.parents.map((p) => (
                        <li key={p.id}>
                          {p.firstName} {p.lastName}
                          <span className="text-arc-slate-400"> · {p.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}