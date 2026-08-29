"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Card, CardContent, Badge, Button, Input, Label, Skeleton } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchPlatformOrganizations,
  createPlatformOrganization,
  suspendPlatformOrganization,
  deletePlatformOrganization,
  uploadOrgImage,
  type PlatformOrganization,
} from "@/lib/platform-api";
import { toast } from "@/lib/toast";
import { EmptyState } from "@/components/branding/empty-state";
import {
  Building2,
  Plus,
  Loader2,
  Ban,
  RotateCcw,
  ExternalLink,
  Search,
  Users,
  Settings2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Grid3X3,
  List,
  Trash2,
  ImagePlus,
  Upload,
  MoreVertical,
  ArrowRight,
  Eye,
  BookOpen,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard";

const PAGE_SIZE = 6;

type OrgStatusFilter = "all" | "ACTIVE" | "ARCHIVED";
type SortOption = "name-asc" | "name-desc" | "members-desc" | "members-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "members-desc", label: "Most members" },
  { value: "members-asc", label: "Fewest members" },
];

const statusBadgeClass: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};
const orgStatusLabel = (status: string) => (status === "ARCHIVED" ? "Suspended" : "Active");
const orgStatusBadge = (org: PlatformOrganization) =>
  org.deleted
    ? { cls: "bg-red-100 text-red-700", label: "Deleted" }
    : {
        cls: statusBadgeClass[org.status] ?? "bg-gray-100 text-gray-700",
        label: orgStatusLabel(org.status),
      };

export default function PlatformOrganizationsPage() {
  const { user, isLoading } = useAuth();
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [confirmOrg, setConfirmOrg] = useState<PlatformOrganization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<PlatformOrganization | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrgStatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrgs(await fetchPlatformOrganizations(showDeleted));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    if (user?.roles?.includes("super_admin")) void load();
    else if (!isLoading) setLoading(false);
  }, [user, isLoading, load]);

  const handleCreate = async () => {
    const name = newName.trim();
    const slug = newSlug.trim();
    if (!name || !slug) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createPlatformOrganization(name, slug, newImageUrl || undefined);
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setNewImageUrl("");
      await load();
      toast.success(`${name} created`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create organization";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleImageFile = async (file: File) => {
    const mime = file.type;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(mime)) {
      setCreateError("Please choose a PNG, JPEG, WebP, GIF, or SVG image.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setCreateError("Image too large (max 15MB).");
      return;
    }
    setUploadingImg(true);
    setCreateError(null);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), ""));
      const url = await uploadOrgImage(base64, mime, file.name);
      setNewImageUrl(url);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to upload image");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    setBusyId(deleteOrg.id);
    try {
      await deletePlatformOrganization(deleteOrg.id);
      await load();
      toast.success(`${deleteOrg.name} deleted — restore anytime via "Show deleted"`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete organization";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
      setDeleteOrg(null);
    }
  };

  const handleToggleSuspension = async () => {
    if (!confirmOrg) return;
    const action = confirmOrg.status === "ARCHIVED" ? "ACTIVATE" : "SUSPEND";
    setBusyId(confirmOrg.id);
    try {
      await suspendPlatformOrganization(confirmOrg.id, action);
      await load();
      toast.success(
        action === "SUSPEND"
          ? `${confirmOrg.name} suspended`
          : `${confirmOrg.name} restored`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update organization";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
      setConfirmOrg(null);
    }
  };

  const q = search.trim().toLowerCase();
  const activeOrgs = orgs.filter((o) => o.status === "PUBLISHED").length;
  const reviewModeOrgs = orgs.filter((o) => o.reviewMode).length;
  const totalMembers = orgs.reduce((acc, o) => acc + o.memberCount, 0);

  const statusFiltered = orgs.filter(
    (o) =>
      selectedStatus === "all" ||
      (selectedStatus === "ACTIVE" && o.status === "PUBLISHED") ||
      (selectedStatus === "ARCHIVED" && o.status === "ARCHIVED")
  );
  const filteredOrgs = q
    ? statusFiltered.filter((o) => o.name.toLowerCase().includes(q) || o.slug.includes(q))
    : statusFiltered;
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (sortOption.startsWith("name")) {
      const cmp = a.name.localeCompare(b.name);
      return sortOption.endsWith("desc") ? -cmp : cmp;
    }
    const cmp = (a.memberCount ?? 0) - (b.memberCount ?? 0);
    return sortOption.endsWith("desc") ? -cmp : cmp;
  });
  const totalPages = Math.max(1, Math.ceil(sortedOrgs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedOrgs = sortedOrgs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = !!search.trim() || selectedStatus !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const handleStatClick = (stat: "all" | "active" | "review" | "all-members") => {
    setCurrentPage(1);
    if (stat === "all") {
      setSelectedStatus("all");
    } else if (stat === "active") {
      setSelectedStatus((prev) => (prev === "ACTIVE" ? "all" : "ACTIVE"));
    } else if (stat === "review") {
      setSelectedStatus("all");
    }
    // "all-members" is informational (total headcount); no filter applied.
  };

  const isStatActive = (stat: "all" | "active" | "review") => {
    if (stat === "all") return selectedStatus === "all";
    if (stat === "active") return selectedStatus === "ACTIVE";
    return false; // review filter isn't tied to status via stat click today
  };

  return (
    <div className="min-h-screen bg-arc-slate-50">
      <DashboardHeader
        title="Organizations"
        subtitle="All organizations on the platform — create, manage admins, set policy, suspend"
        actions={
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" /> New Organization
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Compact stats — clickable to filter (matches /admin/programs) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            onClick={() => handleStatClick("all")}
            className={`cursor-pointer transition-shadow hover:shadow-arc ${isStatActive("all") ? "ring-2 ring-arc-navy-400 border-transparent" : ""}`}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-arc-navy-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-arc-navy-900">
                  {loading ? "..." : orgs.length}
                </div>
                <div className="text-xs text-arc-slate-500">Organizations</div>
              </div>
            </CardContent>
          </Card>
          <Card
            onClick={() => handleStatClick("active")}
            className={`cursor-pointer transition-shadow hover:shadow-arc ${isStatActive("active") ? "ring-2 ring-arc-navy-400 border-transparent" : ""}`}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-arc-navy-900">
                  {loading ? "..." : activeOrgs}
                </div>
                <div className="text-xs text-arc-slate-500">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card
            onClick={() => handleStatClick("review")}
            className={`cursor-pointer transition-shadow hover:shadow-arc ${isStatActive("review") ? "ring-2 ring-arc-navy-400 border-transparent" : ""}`}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-arc-navy-900">
                  {loading ? "..." : reviewModeOrgs}
                </div>
                <div className="text-xs text-arc-slate-500">Review required</div>
              </div>
            </CardContent>
          </Card>
          <Card
            onClick={() => handleStatClick("all-members")}
            className="cursor-pointer transition-shadow hover:shadow-arc"
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-arc-navy-900">
                  {loading ? "..." : totalMembers}
                </div>
                <div className="text-xs text-arc-slate-500">Total members</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Organization modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-arc-orange-600" />
                  </div>
                  <h2 className="text-lg font-bold text-arc-navy-900">New Organization</h2>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-arc-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={newName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewName(v);
                      if (!newSlug) {
                        setNewSlug(
                          v
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "")
                            .slice(0, 64)
                        );
                      }
                    }}
                    placeholder="e.g. Sto. Niño Academy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Slug (URL identifier)</Label>
                  <Input
                    id="org-slug"
                    value={newSlug}
                    onChange={(e) =>
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                    }
                    placeholder="e.g. sto-nino-academy"
                  />
                </div>

                {/* Organization image — link or upload */}
                <div className="space-y-2">
                  <Label>Organization image</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-arc-slate-100 flex items-center justify-center">
                      {newImageUrl ? (
                        <img
                          src={newImageUrl}
                          alt="Organization preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-6 w-6 text-arc-slate-400" />
                      )}
                    </div>
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Paste image URL…"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-arc-slate-500">
                    <span>or upload:</span>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-arc-slate-200 px-3 py-1.5 text-sm font-medium text-arc-navy-800 hover:bg-arc-slate-50">
                      {uploadingImg ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingImg ? "Uploading…" : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleImageFile(f);
                        }}
                      />
                    </label>
                  </div>
                </div>

                {createError && <p className="text-sm text-red-600">{createError}</p>}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="border-arc-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || uploadingImg || !newName.trim() || !newSlug.trim()}
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {/* Toolbar — search, status filter, sort (matches /admin/programs) */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                    <Input
                      placeholder="Search organizations..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 w-64 border-arc-slate-200 focus:border-arc-navy-500"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-arc-slate-400 hover:text-arc-slate-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as OrgStatusFilter);
                      setCurrentPage(1);
                    }}
                    className="h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-arc-navy-500"
                    aria-label="Filter by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Suspended</option>
                  </select>

                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-arc-navy-500"
                    aria-label="Sort organizations"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  )}

                  {/* Include soft-deleted orgs (restore via Activate) */}
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-arc-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={showDeleted}
                      onChange={(e) => {
                        setShowDeleted(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 rounded border-arc-slate-300 text-arc-navy-600 focus:ring-arc-navy-500"
                    />
                    Show deleted
                  </label>

                  {/* Grid / list view toggle (matches /admin/programs) */}
                  <div className="flex items-center border border-arc-slate-200 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-11 w-11 rounded-none"
                      aria-label="Grid view"
                      title="Grid view"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-11 w-11 rounded-none border-l border-arc-slate-200"
                      aria-label="List view"
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Result count + sort summary */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-arc-slate-500">
                  {hasActiveFilters ? (
                    <>
                      <span className="font-semibold text-arc-navy-900">{sortedOrgs.length}</span>{" "}
                      of {orgs.length} organization{orgs.length !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-arc-navy-900">{orgs.length}</span>{" "}
                      organization
                      {orgs.length !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
                {sortedOrgs.length > 0 && (
                  <p className="text-xs text-arc-slate-400">
                    Sorted by{" "}
                    {SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? "Name (A-Z)"}
                  </p>
                )}
              </div>

              <div className="mt-4">
                {pagedOrgs.length === 0 &&
                  (orgs.length === 0 ? (
                    <EmptyState
                      icon="users"
                      title="No organizations yet"
                      description="Create the first organization to start managing tenants."
                      action={{
                        label: "New organization",
                        onClick: () => setShowCreate(true),
                      }}
                    />
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No organizations match your filters.
                    </p>
                  ))}

                {viewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {pagedOrgs.map((org) => (
                      <OrgCard
                        key={org.id}
                        org={org}
                        busy={busyId === org.id}
                        onSuspendToggle={() => setConfirmOrg(org)}
                        onDelete={() => setDeleteOrg(org)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pagedOrgs.map((org) => {
                      const suspended = org.status === "ARCHIVED";
                      const badge = orgStatusBadge(org);
                      return (
                        <div
                          key={org.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
                        >
                          <Link href={`/platform/organizations/${org.id}`} className="shrink-0">
                            <OrgThumb org={org} className="h-12 w-12 rounded-lg" />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/platform/organizations/${org.id}`}
                                className="truncate font-medium hover:underline"
                              >
                                {org.name}
                              </Link>
                              <Badge className={badge.cls}>{badge.label}</Badge>
                              {org.reviewMode && (
                                <Badge className="bg-purple-100 text-purple-700">
                                  Review required
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              /{org.slug} · {org.memberCount} member
                              {org.memberCount === 1 ? "" : "s"} · {org.programCount} program
                              {org.programCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/platform/organizations/${org.id}`}>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Manage
                              </Button>
                            </Link>
                            <Button
                              variant={suspended ? "outline" : "destructive"}
                              size="sm"
                              disabled={busyId === org.id}
                              onClick={() => setConfirmOrg(org)}
                            >
                              {busyId === org.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : suspended ? (
                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              ) : (
                                <Ban className="mr-1 h-3.5 w-3.5" />
                              )}
                              {suspended
                                ? org.deleted
                                  ? "Restore"
                                  : "Activate"
                                : "Suspend"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-arc-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${org.name}`}
                              onClick={() => setDeleteOrg(org)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination (matches /admin/users) */}
              {sortedOrgs.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-1 pt-4 mt-4 border-t border-arc-slate-100">
                  <div className="text-sm text-arc-slate-500">
                    Showing {pagedOrgs.length} of {sortedOrgs.length} organizations
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="border-arc-slate-200 hover:bg-arc-slate-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm font-medium text-arc-navy-900">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="border-arc-slate-200 hover:bg-arc-slate-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <ConfirmModal
          isOpen={confirmOrg !== null}
          title={
            confirmOrg?.status === "ARCHIVED" ? "Activate organization" : "Suspend organization"
          }
          description={
            confirmOrg?.status === "ARCHIVED"
              ? `Activate "${confirmOrg?.name}"? Its members will regain access.`
              : `Suspend "${confirmOrg?.name}"? Its members will lose access until reactivated.`
          }
          confirmLabel={confirmOrg?.status === "ARCHIVED" ? "Activate" : "Suspend"}
          variant={confirmOrg?.status === "ARCHIVED" ? "default" : "danger"}
          onConfirm={handleToggleSuspension}
          onClose={() => setConfirmOrg(null)}
        />

        <ConfirmModal
          isOpen={deleteOrg !== null}
          title="Delete organization"
          description={
            deleteOrg
              ? `Delete "${deleteOrg.name}"? This archives the organization. Its members will lose access and its content will be hidden until reactivated.`
              : undefined
          }
          confirmLabel="Delete"
          variant="danger"
          busyLabel="Deleting…"
          onConfirm={handleDelete}
          onClose={() => setDeleteOrg(null)}
        />
      </div>
    </div>
  );
}

function OrgThumb({ org, className }: { org: PlatformOrganization; className?: string }) {
  const [err, setErr] = useState(false);
  if (org.imageUrl && !err) {
    return (
      <img
        src={org.imageUrl}
        alt={org.name}
        onError={() => setErr(true)}
        className={`${className ?? ""} object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className ?? ""} flex items-center justify-center bg-gradient-to-br from-arc-navy-50 to-arc-navy-100`}
    >
      <Building2 className="h-5 w-5 text-arc-navy-400/60" />
    </div>
  );
}

function OrgCard({
  org,
  busy,
  onSuspendToggle,
  onDelete,
}: {
  org: PlatformOrganization;
  busy: boolean;
  onSuspendToggle: () => void;
  onDelete: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const suspended = org.status === "ARCHIVED";
  const hasImage = !!org.imageUrl && !imgError;
  const statusCfg = org.deleted
    ? { bg: "bg-red-100", text: "text-red-700", label: "Deleted" }
    : suspended
      ? { bg: "bg-amber-100", text: "text-amber-700", label: "Suspended" }
      : { bg: "bg-green-100", text: "text-green-700", label: "Active" };
  const router = useRouter();
  const detailHref = `/platform/organizations/${org.id}`;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group overflow-hidden border border-arc-slate-100 flex flex-col">
      {/* Image header — imageUrl if available, otherwise navy gradient fallback with faint icon (matches ProgramCard) */}
      <div
        className={`relative h-28 ${hasImage ? "" : "bg-gradient-to-br from-arc-navy-50 to-arc-navy-100"}`}
      >
        {hasImage && (
          <img
            src={org.imageUrl!}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {!hasImage && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
            <Building2 className="h-20 w-20 text-arc-navy-400" />
          </div>
        )}

        {/* Actions dropdown overlay (matches ProgramCard) */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                aria-label="Organization actions"
              >
                <MoreVertical className="h-4 w-4 text-arc-navy-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-arc-slate-200 shadow-lg rounded-xl p-1 z-50"
            >
              <DropdownMenuItem
                onClick={() => router.push(detailHref)}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(detailHref)}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                <ExternalLink className="h-4 w-4 mr-2 text-arc-slate-500" />
                Manage
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-arc-slate-200 my-1" />
              <DropdownMenuItem
                onClick={onSuspendToggle}
                disabled={busy}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                {suspended ? (
                  <RotateCcw className="h-4 w-4 mr-2 text-arc-slate-500" />
                ) : (
                  <Ban className="h-4 w-4 mr-2 text-arc-slate-500" />
                )}
                {suspended
                  ? org.deleted
                    ? "Restore"
                    : "Activate"
                  : "Suspend"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-arc-slate-200 my-1" />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title hierarchy — name as main title, line-clamp-2 for equal heights */}
        <h3 className="font-semibold text-arc-navy-900 text-base group-hover:text-arc-navy-700 transition-colors line-clamp-2 leading-snug">
          {org.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 mb-3">
          <span className="text-xs uppercase tracking-wide text-arc-slate-400 font-medium">
            /{org.slug}
          </span>
          <span className="text-arc-slate-300 text-xs">·</span>
          <Badge className={`${statusCfg.bg} ${statusCfg.text} text-xs`}>{statusCfg.label}</Badge>
        </div>

        {/* Inline stats — single line (matches ProgramCard) */}
        <div className="flex items-center gap-3 text-xs text-arc-slate-600 mb-3">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-arc-slate-400" />
            <span className="font-semibold">{org.memberCount}</span> Member
            {org.memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-arc-slate-300">·</span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-arc-slate-400" />
            <span className="font-semibold">{org.programCount}</span> Program
            {org.programCount !== 1 ? "s" : ""}
          </span>
          {org.reviewMode && (
            <>
              <span className="text-arc-slate-300">·</span>
              <span className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-purple-500" />
                Review
              </span>
            </>
          )}
        </div>

        {/* Footer — action only, right-aligned (matches ProgramCard) */}
        <div className="flex items-center justify-end pt-3 border-t border-arc-slate-100 mt-auto">
          <Link href={detailHref}>
            <Button
              variant="ghost"
              size="sm"
              className="text-arc-navy-700 hover:text-arc-navy-900 hover:bg-arc-navy-50 font-semibold"
            >
              Manage
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
