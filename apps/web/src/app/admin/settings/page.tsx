"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@aratc/ui";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { settingsApi } from "@/lib/api/client";
import {
  BRAND_TOKEN_NAMES,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  deriveBrandTokens,
  deriveRoleShades,
  type BrandSettings,
  type GeneralSettings,
} from "@aratc/shared";
import {
  Settings,
  Bell,
  Shield,
  Users,
  Palette,
  Save,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

// ============================================================
// Helpers
// ============================================================

/**
 * Applies brand tokens to :root as inline styles (live preview).
 * Any token missing from the map is cleared, so passing an empty
 * map restores the defaults from globals.css.
 */
function applyTokens(tokens: Record<string, string>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const name of BRAND_TOKEN_NAMES) {
    const value = tokens[name];
    if (value) {
      root.style.setProperty(name, value);
    } else {
      root.style.removeProperty(name);
    }
  }
}

const isHex = (value: string) => /^#[0-9A-F]{6}$/.test(value);

function ColorField({
  label,
  hint,
  value,
  shades,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  /** Derived swatches shown next to the picker (hover · subtle · text). */
  shades?: { hover: string; subtle: string; foreground?: string };
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-arc-navy-900">{label}</div>
        {hint && <div className="text-xs text-arc-slate-500">{hint}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {shades && (
          <div
            className="hidden sm:flex items-center -space-x-1"
            title={`Derived shades — hover ${shades.hover} · subtle ${shades.subtle}${shades.foreground ? ` · text ${shades.foreground}` : ""}`}
          >
            {[shades.hover, shades.subtle, shades.foreground ?? shades.hover].map((color, i) => (
              <span
                key={i}
                className="h-5 w-5 rounded-full border-2 border-white shadow-arc-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded-md border border-arc-slate-200 bg-white p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            if (/^#[0-9A-F]{0,6}$/.test(next)) onChange(next);
          }}
          className="w-28 font-mono text-xs"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

// ============================================================
// General tab — organization info (persisted)
// ============================================================

function GeneralSettingsTab() {
  const [form, setForm] = useState<GeneralSettings>({ ...DEFAULT_GENERAL_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef<GeneralSettings>({ ...DEFAULT_GENERAL_SETTINGS });

  useEffect(() => {
    let mounted = true;
    settingsApi
      .getGeneral()
      .then((saved) => {
        if (!mounted) return;
        const merged = { ...DEFAULT_GENERAL_SETTINGS, ...saved };
        savedRef.current = merged;
        setForm(merged);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedRef.current);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateGeneral(form);
      savedRef.current = { ...form };
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof GeneralSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent-hover" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-arc-navy-900">Organization Name</label>
          <Input
            value={form.organizationName ?? ""}
            onChange={set("organizationName")}
            className="max-w-md"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-arc-navy-900">Organization Email</label>
          <Input
            value={form.organizationEmail ?? ""}
            onChange={set("organizationEmail")}
            type="email"
            className="max-w-md"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-arc-navy-900">Contact Number</label>
          <Input
            value={form.contactNumber ?? ""}
            onChange={set("contactNumber")}
            className="max-w-md"
            disabled={loading}
          />
        </div>
        <div className="pt-4">
          <Button variant="accent" onClick={handleSave} disabled={saving || loading || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Branding tab — theme colors (persisted, previewed live)
// ============================================================

function BrandingTab() {
  const router = useRouter();
  const [brand, setBrand] = useState<Required<BrandSettings>>({ ...DEFAULT_BRAND_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // The persisted baseline — the live preview reverts to it on unmount
  const savedRef = useRef<BrandSettings>({});

  useEffect(() => {
    let mounted = true;
    settingsApi
      .getBrand()
      .then((saved) => {
        if (!mounted) return;
        savedRef.current = saved;
        setBrand({ ...DEFAULT_BRAND_SETTINGS, ...saved });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Live preview — the working state applies to :root as it changes,
  // so the whole app (and the preview panel below) re-themes instantly.
  const liveTokens = useMemo(() => deriveBrandTokens(brand), [brand]);
  useEffect(() => {
    applyTokens(liveTokens);
  }, [liveTokens]);

  // Leaving the tab without saving reverts to the persisted theme
  useEffect(() => {
    return () => applyTokens(deriveBrandTokens(savedRef.current));
  }, []);

  const baseline = useMemo(
    () => ({ ...DEFAULT_BRAND_SETTINGS, ...savedRef.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedRef.current]
  );
  const isDirty = JSON.stringify(brand) !== JSON.stringify(baseline);

  const update = (key: keyof BrandSettings) => (hex: string) =>
    setBrand((prev) => ({ ...prev, [key]: hex }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateBrand(brand);
      savedRef.current = { ...brand };
      toast.success("Brand updated — the whole app now uses these colors");
      // Re-render the root layout so the injected tokens persist on reload
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brand settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setBrand({ ...DEFAULT_BRAND_SETTINGS });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent-hover" />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-arc-slate-500 pb-2">
            Pick the brand colors — hover, subtle backgrounds, and readable text shades are derived
            automatically. Changes preview live across the entire app until you save.
          </p>

          <div className="divide-y divide-arc-slate-100">
            <ColorField
              label="Primary"
              hint="Main buttons, titles, links"
              value={brand.primary}
              shades={deriveRoleShades(brand.primary)}
              onChange={update("primary")}
            />
            <ColorField
              label="Accent"
              hint="CTAs, highlights, active navigation"
              value={brand.accent}
              shades={deriveRoleShades(brand.accent)}
              onChange={update("accent")}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 pt-4 text-sm font-medium text-arc-slate-500 hover:text-arc-navy-900 transition-colors"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
            />
            Advanced colors
          </button>

          {showAdvanced && (
            <div className="divide-y divide-arc-slate-100 pt-2">
              <ColorField
                label="Secondary"
                hint="Subtle buttons, muted fills"
                value={brand.secondary}
                onChange={update("secondary")}
              />
              <ColorField
                label="Success"
                hint="Published, mastery, positive states"
                value={brand.success}
                shades={deriveRoleShades(brand.success)}
                onChange={update("success")}
              />
              <ColorField
                label="Warning"
                hint="Draft, pending, attention states"
                value={brand.warning}
                shades={deriveRoleShades(brand.warning)}
                onChange={update("warning")}
              />
              <ColorField
                label="Danger"
                hint="Destructive actions, errors"
                value={brand.danger}
                shades={deriveRoleShades(brand.danger)}
                onChange={update("danger")}
              />
              <ColorField
                label="Background"
                hint="App page background"
                value={brand.background}
                onChange={update("background")}
              />
              <ColorField
                label="Surface"
                hint="Cards and panels"
                value={brand.surface}
                onChange={update("surface")}
              />
              <ColorField
                label="Text"
                hint="Primary text color"
                value={brand.text}
                onChange={update("text")}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-5">
            <Button onClick={handleSave} disabled={saving || loading || !isDirty}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Save brand"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading || !isDirty}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to defaults
            </Button>
            {isDirty && (
              <span className="text-xs font-medium text-warning-foreground">
                Unsaved changes — previewing live
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live preview — real components, so it always shows the truth */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary action</Button>
            <Button variant="accent">Accent CTA</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Delete</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="published">Published</Badge>
            <Badge variant="draft">Draft</Badge>
            <Badge variant="alert">Failed</Badge>
            <Badge variant="info">In progress</Badge>
            <Badge variant="practice">Practice</Badge>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-surface p-4 space-y-2">
            <div className="font-heading font-semibold">Card heading</div>
            <p className="text-sm text-arc-slate-600">
              Panels use the surface token and body text uses the text token.
            </p>
            <div className="h-2 rounded-full bg-arc-slate-100 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-success" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Page shell
// ============================================================

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "users", label: "User Management", icon: Users },
  ];

  return (
    <>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your organization settings"
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-accent-subtle text-accent-hover"
                          : "text-arc-slate-600 hover:bg-arc-slate-50"
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "general" && <GeneralSettingsTab />}

            {activeTab === "branding" && <BrandingTab />}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-accent-hover" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["Email notifications", "Push notifications", "SMS alerts", "Weekly digest"].map((item) => (
                    <div key={item} className="flex items-center justify-between py-2">
                      <span className="text-arc-navy-900">{item}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-arc-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-subtle rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-arc-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent-hover" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Current Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">New Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Confirm New Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="pt-4">
                    <Button variant="accent">
                      <Shield className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "users" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent-hover" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-arc-slate-500">User management features coming soon.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
