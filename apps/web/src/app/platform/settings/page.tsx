"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { DashboardHeader } from "@/components/dashboard";
import { toast } from "sonner";
import { Trash2, Database, Building2 } from "lucide-react";
import {
  fetchPlatformOrganizations,
  fetchResetPreview,
  performFullReset,
  performOrgReset,
  type PlatformOrganization,
  type ResetPreview,
} from "@/lib/platform-api";

const CONFIRM_TEXT = "RESET";

export default function PlatformSettingsPage() {
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [preview, setPreview] = useState<ResetPreview | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState<"full" | "org" | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([fetchPlatformOrganizations(), fetchResetPreview()]);
      setOrgs(o.filter((x) => !x.deleted));
      setPreview(p);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const canFull = confirmText === CONFIRM_TEXT && busy === null;
  const canOrg = canFull && !!selectedOrgId;

  async function handleFullReset() {
    if (!canFull) return;
    setBusy("full");
    try {
      await performFullReset();
      toast.success("Platform data reset complete — clean slate ready");
      setConfirmText("");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleOrgReset() {
    if (!canOrg) return;
    setBusy("org");
    try {
      await performOrgReset(selectedOrgId);
      toast.success("Organization reset complete");
      setConfirmText("");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  }

  const countEntries = preview ? Object.entries(preview.counts) : [];

  return (
    <div className="min-h-screen bg-arc-slate-50">
      <DashboardHeader
        title="Platform Settings"
        subtitle="Superadmin data management — reset previews and clean-slate tooling"
      />
      <div className="p-6 space-y-6 max-w-5xl">
        {/* Live counts preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-arc-navy-900" />
              Current data ({preview?.scope ?? "…"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading counts…</p>
            ) : countEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No counts to display.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {countEntries.map(([key, value]) => (
                  <div key={key} className="rounded-lg border bg-card p-3">
                    <p className="text-2xl font-bold text-arc-navy-900">{value}</p>
                    <p className="text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <Trash2 className="h-4 w-4" />
              Danger Zone — Data Reset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 space-y-2">
              <p>
                <strong>Full platform reset</strong> — deletes all organizations, memberships,
                content, enrollments, attempts, learning events and non-superadmin users.

              </p>
              <p>
                <strong>Organization reset</strong> — deletes one organization and everything scoped
                to it (programs,, lessons,, questions,, assessments,, learner profiles,, memberships).
              </p>
              <p className="text-red-600 font-medium">
                Both actions are permanent and audited. Always preserved: RBAC system tables,
                superadmin accounts, audit history, platform settings.

</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="reset-confirm">
                  Type {CONFIRM_TEXT} to arm the buttons
                </label>
                <Input
                  id="reset-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  className="max-w-xs font-mono"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="org-select">
                  Organization (for per-org reset)
                </label>
                <select
                  id="org-select"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select an organization�</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.slug})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="destructive"
                disabled={!canFull || busy === "full"}
                onClick={handleFullReset}
              >
                {busy === "full" ? "Resetting�" : "Reset platform data"}
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={!canOrg || busy === "org"}
                onClick={handleOrgReset}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {busy === "org" ? "Resetting�" : "Reset organization"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
