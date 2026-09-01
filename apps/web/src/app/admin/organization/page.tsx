"use client";

// CS#23.3 §19–§23 — Organization Overview (real metrics) + Settings (real
// profile persisted to the organization row / metadata). All org-scoped.

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Badge, Button, Input } from "@/components/ui";
import { useManageableOrgs } from "@/lib/use-manageable-orgs";
import {
  fetchOrgOverview,
  fetchOrgSettings,
  updateOrgSettings,
  OrgOverview,
  OrgSettings,
} from "@/lib/org-api";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  Tv,
  Building,
  Save,
} from "lucide-react";

const OVERVIEW_CARDS: Array<{ key: keyof OrgOverview; label: string; icon: React.ElementType; color: string }> = [
  { key: "members", label: "Members", icon: Users, color: "bg-blue-100 text-blue-600" },
  { key: "teachers", label: "Teachers", icon: GraduationCap, color: "bg-purple-100 text-purple-600" },
  { key: "students", label: "Students", icon: Users, color: "bg-green-100 text-green-600" },
  { key: "parents", label: "Parents", icon: Users, color: "bg-amber-100 text-amber-600" },
  { key: "programs", label: "Programs", icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
  { key: "activeEnrollments", label: "Active Enrollments", icon: ClipboardList, color: "bg-teal-100 text-teal-600" },
  { key: "publishedLessons", label: "Published Lessons", icon: FileText, color: "bg-rose-100 text-rose-600" },
  { key: "assessments", label: "Assessments", icon: Tv, color: "bg-slate-100 text-slate-600" },
];

export default function OrganizationPage() {
  const { error: orgError, organizations, selectedOrgId, setSelectedOrgId } = useManageableOrgs();
  const [overview, setOverview] = useState<OrgOverview | null>(null);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selectedOrgId) return;
    setOverview(null);
    setSettings(null);
    fetchOrgOverview(selectedOrgId).then(setOverview).catch(() => setOverview(null));
    fetchOrgSettings(selectedOrgId).then(setSettings).catch(() => setSettings(null));
  }, [selectedOrgId]);

  const handleSave = useCallback(async () => {
    if (!selectedOrgId || !settings) return;
    setBusy(true);
    setFormError(null);
    setSaved(false);
    try {
      const updated = await updateOrgSettings(selectedOrgId, {
        name: settings.name,
        slug: settings.slug,
        type: settings.type,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        description: settings.description,
      });
      setSettings(updated);
      setSaved(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setBusy(false);
    }
  }, [selectedOrgId, settings]);

  return (
    <>
      <DashboardHeader
        title="Organization"
        subtitle="Real overview metrics and profile settings for your organization"
      />
      <div className="p-6 space-y-4">
        {(orgError || formError) && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {orgError ?? formError}
          </div>
        )}

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

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-arc-slate-400">Overview</h2>
            {overview ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {OVERVIEW_CARDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card key={c.key}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-arc-navy-900">
                            {Number(overview[c.key] ?? 0)}
                          </div>
                          <div className="text-sm text-arc-slate-500">{c.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-arc-slate-500">Loading overview…</div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-arc-slate-400">
              Organization Settings
            </h2>
            {settings && (
              <Card>
                <CardContent className="p-5 space-y-4">
                  {saved && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
                      Settings saved.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-arc-navy-900 mb-1">
                      Organization name
                    </label>
                    <Input
                      value={settings.name}
                      onChange={(e) => setSettings((s) => (s ? { ...s, name: e.target.value } : s))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Slug</label>
                      <Input
                        value={settings.slug}
                        onChange={(e) => setSettings((s) => (s ? { ...s, slug: e.target.value } : s))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Type</label>
                      <Input
                        value={settings.type ?? ""}
                        onChange={(e) =>
                          setSettings((s) => (s ? { ...s, type: e.target.value || null } : s))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-arc-navy-900 mb-1">
                        Contact email
                      </label>
                      <Input
                        value={settings.contactEmail}
                        onChange={(e) =>
                          setSettings((s) => (s ? { ...s, contactEmail: e.target.value } : s))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-arc-navy-900 mb-1">
                        Contact phone
                      </label>
                      <Input
                        value={settings.contactPhone}
                        onChange={(e) =>
                          setSettings((s) => (s ? { ...s, contactPhone: e.target.value } : s))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Address</label>
                    <Input
                      value={settings.address}
                      onChange={(e) => setSettings((s) => (s ? { ...s, address: e.target.value } : s))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Description</label>
                    <Input
                      value={settings.description}
                      onChange={(e) =>
                        setSettings((s) => (s ? { ...s, description: e.target.value } : s))
                      }
                    />
                  </div>
                  <Button variant="accent" onClick={() => handleSave()} disabled={busy} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {busy ? "Saving…" : "Save Settings"}
                  </Button>
                  <p className="text-xs text-arc-slate-500">
                    Profile edits are audited and require organization update permission.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}