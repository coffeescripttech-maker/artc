"use client";

// CS#23.2 — Enterprise RBAC: configurable Access Control console.
// Superadmin-facing UI over /api/admin/access: role list, permission matrix
// editor, and a grant simulator. All authorization is enforced server-side;
// this page merely renders it.

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { toast } from "sonner";
import { Save, RefreshCw, Lock, Play, Loader2, ScrollText } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

interface AccessRole {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  userCount: number;
  permissionCount: number;
  systemLocked: boolean;
}

interface AccessPermission {
  key: string;
  resource: string;
  action: string;
  displayName: string;
  description: string | null;
  isEnforced: boolean;
}

interface RoleDetail extends AccessRole {
  permissionKeys: string[];
}

interface SimulateResult {
  role: { name: string; displayName: string };
  membershipRole: string | null;
  granted: string[];
  denied: string[];
  orgAxisKeys: string[];
  hardBypass: boolean;
}

const MEMBERSHIP_OPTIONS = ["", "OWNER", "ADMIN", "TEACHER", "LEARNER"];

export default function AccessControlPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [draftKeys, setDraftKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [simRole, setSimRole] = useState("teacher");
  const [simMembership, setSimMembership] = useState("");
  const [simBusy, setSimBusy] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);

  // §34/§55 — Audit Log tab: recent authorization-relevant events. Uses the
  // existing CS#14 admin audit endpoint (org-scoped; superadmin can pass
  // x-tenant-id for platform-wide via the API client's active-org header).
  interface AuditEventRow {
    id: string;
    actor: { email: string; name: string | null };
    eventType: string;
    actedOn: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: string;
  }
  const [tab, setTab] = useState<"permissions" | "audit">("permissions");
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await apiFetch<{ events: AuditEventRow[] }>(
        "/admin/audit/events?limit=50&eventTypes=ROLE_PERMISSIONS_UPDATED,ROLE_GRANTED,ROLE_REVOKED,MEMBERSHIP_GRANTED,MEMBERSHIP_ROLE_CHANGED,MEMBERSHIP_REVOKED",
        // §34 — global RBAC events (permission edits) are written under the
        // "platform" tenant; super_admin may target it explicitly (enforced
        // server-side in the audit controller) so the trail is platform-wide.
        { headers: { "x-tenant-id": "platform" } },
      );
      setAuditEvents(res.events);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiFetch<{ roles: AccessRole[] }>("/admin/access/roles"),
        apiFetch<{ permissions: AccessPermission[] }>("/admin/access/permissions"),
      ]);
      setRoles(rolesRes.roles);
      setPermissions(permsRes.permissions);
      setSelectedRoleId((prev) => prev ?? rolesRes.roles[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load access control data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (roleId: string) => {
    try {
      const res = await apiFetch<{ role: RoleDetail }>(`/admin/access/roles/${roleId}`);
      setDetail(res.role);
      setDraftKeys(new Set(res.role.permissionKeys));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load role");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedRoleId) void loadDetail(selectedRoleId);
  }, [selectedRoleId, loadDetail]);

  // Group permissions by resource for the matrix.
  const grouped = useMemo(() => {
    const map = new Map<string, AccessPermission[]>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return [...map.entries()];
  }, [permissions]);

  const dirty =
    detail !== null &&
    (draftKeys.size !== detail.permissionKeys.length ||
      [...draftKeys].some((k) => !detail.permissionKeys.includes(k)));

  const toggleKey = (key: string) => {
    if (detail?.systemLocked) return;
    setDraftKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/access/roles/${detail.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionKeys: [...draftKeys] }),
      });
      toast.success(`Permissions updated for ${detail.displayName}`);
      await loadDetail(detail.id);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const runSimulate = async () => {
    setSimBusy(true);
    try {
      const res = await apiFetch<SimulateResult>("/admin/access/simulate", {
        method: "POST",
        body: JSON.stringify({
          roleName: simRole,
          membershipRole: simMembership || undefined,
        }),
      });
      setSimResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimBusy(false);
    }
  };

  return (
    <>
      <DashboardHeader
        title="Access Control"
        subtitle="Enterprise RBAC — configure what each system role can do (CS#23.2)"
      />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-arc-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading access control…
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
          </Card>
        ) : (
          <>
            {/* §2/§34 — Access Control sections: Permissions (matrix + simulator)
                and Audit Log (who changed what, when). */}
            <div className="flex items-center gap-2 border-b border-arc-slate-200">
              <button
                onClick={() => setTab("permissions")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === "permissions"
                    ? "border-arc-navy-600 text-arc-navy-900"
                    : "border-transparent text-arc-slate-500 hover:text-arc-navy-700"
                }`}
              >
                Permissions & Simulator
              </button>
              <button
                onClick={() => {
                  setTab("audit");
                  if (auditEvents.length === 0) void loadAudit();
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  tab === "audit"
                    ? "border-arc-navy-600 text-arc-navy-900"
                    : "border-transparent text-arc-slate-500 hover:text-arc-navy-700"
                }`}
              >
                <ScrollText className="h-4 w-4" /> Audit Log
              </button>
            </div>

            {tab === "audit" ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Authorization Audit Log</CardTitle>
                  <Button variant="outline" onClick={loadAudit} disabled={auditLoading}>
                    {auditLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {auditEvents.length === 0 ? (
                    <div className="py-12 text-center text-sm text-arc-slate-500">
                      {auditLoading ? "Loading…" : "No authorization events recorded yet."}
                    </div>
                  ) : (
                    <div className="divide-y divide-arc-slate-100">
                      {auditEvents.map((e) => (
                        <div key={e.id} className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-arc-navy-50 text-arc-navy-700 border-transparent">
                              {e.eventType}
                            </Badge>
                            <span className="font-medium text-arc-navy-900">{e.actedOn}</span>
                            <span className="text-xs text-arc-slate-500">
                              by {e.actor.name || e.actor.email} ·{" "}
                              {new Date(e.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {(e.before || e.after) && (
                            <div className="mt-1 text-xs text-arc-slate-500 font-mono">
                              {e.before ? JSON.stringify(e.before) : "∅"} →{" "}
                              {e.after ? JSON.stringify(e.after) : "∅"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
          <>
            {/* Role selector */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    selectedRoleId === r.id
                      ? "border-arc-navy-500 bg-arc-navy-50 ring-1 ring-arc-navy-500"
                      : "border-arc-slate-200 bg-white hover:border-arc-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-arc-navy-900">{r.displayName}</span>
                    {r.systemLocked && <Lock className="h-3.5 w-3.5 text-arc-slate-400" />}
                  </div>
                  <div className="mt-1 text-xs text-arc-slate-500">
                    {r.userCount} user{r.userCount === 1 ? "" : "s"} · {r.permissionCount} perms
                  </div>
                </button>
              ))}
            </div>

            {/* Permission matrix */}
            {detail && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {detail.displayName}{" "}
                    <span className="text-sm font-normal text-arc-slate-500">
                      ({detail.permissionKeys.length} granted)
                    </span>
                  </CardTitle>
                  {detail.systemLocked ? (
                    <Badge className="bg-arc-slate-100 text-arc-slate-600">
                      <Lock className="mr-1 h-3 w-3" /> System role — locked
                    </Badge>
                  ) : (
                    <Button onClick={save} disabled={saving || !dirty}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save changes
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {grouped.map(([resource, perms]) => (
                    <div key={resource} className="rounded-lg border border-arc-slate-200">
                      <div className="border-b border-arc-slate-100 bg-arc-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-arc-slate-600">
                        {resource}
                      </div>
                      <div className="divide-y divide-arc-slate-100">
                        {perms.map((p) => (
                          <label
                            key={p.key}
                            className={`flex items-start gap-3 px-4 py-2.5 ${
                              detail.systemLocked
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer hover:bg-arc-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-arc-navy-700"
                              checked={draftKeys.has(p.key)}
                              onChange={() => toggleKey(p.key)}
                              disabled={detail.systemLocked}
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-medium text-arc-navy-900">
                                {p.displayName}
                                {!p.isEnforced && (
                                  <Badge className="ml-2 bg-amber-50 text-amber-700 text-[10px]">
                                    advisory
                                  </Badge>
                                )}
                              </span>
                              <span className="block text-xs text-arc-slate-500">
                                {p.description} <code className="text-[10px]">{p.key}</code>
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Grant simulator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grant Simulator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-md border border-arc-slate-300 bg-white px-3 py-2 text-sm"
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border border-arc-slate-300 bg-white px-3 py-2 text-sm"
                    value={simMembership}
                    onChange={(e) => setSimMembership(e.target.value)}
                  >
                    {MEMBERSHIP_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === "" ? "No org membership" : `Org member: ${m}`}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={runSimulate} disabled={simBusy}>
                    {simBusy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Simulate
                  </Button>
                </div>
                {simResult && (
                  <div className="rounded-lg border border-arc-slate-200 bg-arc-slate-50 p-4 text-sm">
                    {simResult.hardBypass ? (
                      <p className="font-medium text-arc-navy-900">
                        {simResult.role.displayName}: hard system bypass — every permission
                        granted ({simResult.granted.length}).
                      </p>
                    ) : (
                      <>
                        <p className="font-medium text-arc-navy-900">
                          {simResult.role.displayName}
                          {simResult.membershipRole
                            ? ` + org ${simResult.membershipRole}`
                            : ""}
                          : {simResult.granted.length} granted, {simResult.denied.length} denied
                        </p>
                        {simResult.orgAxisKeys.length > 0 && (
                          <p className="mt-1 text-xs text-arc-slate-500">
                            From org membership axis: {simResult.orgAxisKeys.join(", ")}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-arc-slate-600">
                          <span className="font-semibold">Granted:</span>{" "}
                          {simResult.granted.join(", ") || "none"}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>



            <div className="flex items-center gap-2 text-xs text-arc-slate-400">
              <RefreshCw className="h-3 w-3" />
              Permission changes apply immediately (30s cache) — users do not need to re-login.
              All edits are written to the audit log.
            </div>
          </>
            )}
          </>
        )}
      </div>

    </>
  );
}
