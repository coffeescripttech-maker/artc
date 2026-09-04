"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@aratc/ui";
import { ConfirmModal, AdminPagination } from "@/components/admin";
import { modulesApi } from "@/lib/api/client";
import { TableSkeleton } from "@/components/branding";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
  subject?: {
    id: string;
    name: string;
    code?: string;
    color?: string;
  };
  _count?: { topics: number; lessons?: number };
}

type SortOption =
  | "createdAt-desc"
  | "createdAt-asc"
  | "name-asc"
  | "name-desc"
  | "order-asc"
  | "order-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "order-asc", label: "Order: low to high" },
  { value: "order-desc", label: "Order: high to low" },
];

const subjectColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

const PAGE_SIZE_DEFAULT = 10;

function getSubjectColor(color?: string) {
  return color && subjectColors[color] ? subjectColors[color] : subjectColors.blue;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export default function ModulesPage() {
  const router = useRouter();

  // ── Data ──
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters / sort / pagination ──
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("createdAt-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // ── Actions ──
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasTouchedSelection, setHasTouchedSelection] = useState(false);

  // Debounce search input (300ms), mirroring /admin/programs.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await modulesApi.list()) as Module[];
      setModules(data);
    } catch {
      setError("Failed to load modules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unique subjects (for the filter dropdown).
  const uniqueSubjects = useMemo(
    () =>
      Array.from(
        new Map(
          modules
            .filter((m) => m.subject)
            .map((m) => [m.subject!.id, m.subject!]),
        ).values(),
      ),
    [modules],
  );

  // Client-side filtering + sorting (the API returns server order; the table
  // re-sorts to the selected option exactly like /admin/programs).
  const filteredModules = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const filtered = modules.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.subject?.name.toLowerCase().includes(q);
      const matchesSubject = subjectFilter === "all" || m.subject?.id === subjectFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const [field, dir] = sortOption.split("-") as [string, "asc" | "desc"];
      let cmp = 0;
      if (field === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (field === "order") {
        cmp = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      } else {
        cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      }
      return dir === "asc" ? cmp : -cmp;
    });
  }, [modules, debouncedQuery, subjectFilter, statusFilter, sortOption]);

  // Pagination slice.
  const totalPages = Math.max(1, Math.ceil(filteredModules.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedModules = filteredModules.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
// Reset page whenever filters/sort/page size change.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, subjectFilter, statusFilter, sortOption, pageSize]);

  // Clear selection when the result set changes.
  useEffect(() => {
    if (hasTouchedSelection) setSelected(new Set());
  }, [filteredModules.length, hasTouchedSelection]);

  // ── Selection helpers ──
  const pageIds = paginatedModules.map((m) => m.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  const toggleRow = (id: string) => {
    setHasTouchedSelection(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    setHasTouchedSelection(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setHasTouchedSelection(false);
  };

  // ── Stats ──
  const totalLessons = modules.reduce(
    (sum, m) => sum + (m._count?.lessons || 0),
    0,
  );
  const publishedCount = modules.filter((m) => m.status === "PUBLISHED").length;
  const underReviewCount = modules.filter((m) => m.status === "UNDER_REVIEW").length;

  const hasActiveFilters =
    !!debouncedQuery || subjectFilter !== "all" || statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedQuery("");
    setSubjectFilter("all");
    setStatusFilter("all");
    setSortOption("createdAt-desc");
  };

  // Clickable stat filter — same interaction as /admin/programs.
  const handleStatClick = (key: "all" | "published" | "underReview") => {
    setStatusFilter(
      key === "all" ? "all" : key === "published" ? "PUBLISHED" : "UNDER_REVIEW",
    );
    setPage(1);
  };

  const isStatActive = (key: "all" | "published" | "underReview") =>
    (key === "all" && statusFilter === "all") ||
    (key === "published" && statusFilter === "PUBLISHED") ||
    (key === "underReview" && statusFilter === "UNDER_REVIEW");
// ── Actions ──
  const handleToggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      if (newStatus === "PUBLISHED") {
        await modulesApi.publish(moduleId);
      } else {
        await modulesApi.archive(moduleId);
      }
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, status: newStatus as Module["status"] } : m,
        ),
      );
      toast.success(`Module ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
    } catch {
      toast.error("Failed to update module status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await modulesApi.delete(deleteTarget.id);
      setModules((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success("Module deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete module. Please try again.",
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Bulk actions ──
  // modulesApi has no bulk endpoints — loop the single-item calls with
  // Promise.allSettled and report a combined success/failure toast.
  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => modulesApi.delete(id)));
      const failedIds = new Set(
        results
          .map((r, i) => (r.status === "rejected" ? ids[i] : null))
          .filter((id): id is string => id !== null),
      );
      const failed = failedIds.size;
      const succeeded = ids.length - failed;
      setModules((prev) => prev.filter((m) => !failedIds.has(m.id)));
      setSelected(new Set());
      setHasTouchedSelection(false);
      if (failed === 0) {
        toast.success(`${succeeded} module${succeeded !== 1 ? "s" : ""} deleted`);
      } else if (succeeded === 0) {
        throw new Error("Failed to delete the selected modules. Please try again.");
      } else {
        toast.error(`${succeeded} deleted, ${failed} failed`);
      }
    } finally {
      setIsBulkUpdating(false);
      setBulkDeleteOpen(false);
    }
  };

  const handleBulkStatus = async (action: "publish" | "archive") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => (action === "publish" ? modulesApi.publish(id) : modulesApi.archive(id))),
      );
      const okIds = new Set(
        results
          .map((r, i) => (r.status === "fulfilled" ? ids[i] : null))
          .filter((id): id is string => id !== null),
      );
      const failed = ids.length - okIds.size;
      const succeeded = okIds.size;
      if (succeeded > 0) {
        const newStatus = action === "publish" ? "PUBLISHED" : "ARCHIVED";
        setModules((prev) =>
          prev.map((m) =>
            okIds.has(m.id) ? { ...m, status: newStatus as Module["status"] } : m,
          ),
        );
      }
      setSelected(new Set());
      setHasTouchedSelection(false);
      if (failed === 0) {
        toast.success(
          `${succeeded} module${succeeded !== 1 ? "s" : ""} ${action === "publish" ? "published" : "archived"}`,
        );
      } else {
        toast.error(`${succeeded} updated, ${failed} failed`);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handlePublishAllModules = async () => {
    const unpublished = modules.filter(
      (m) => m.status === "DRAFT" || m.status === "UNDER_REVIEW",
    );
    if (unpublished.length === 0) {
      toast.error("No draft or under-review modules to publish");
      return;
    }
    setIsPublishing(true);
    try {
      const results = await Promise.allSettled(
        unpublished.map((m) => modulesApi.publish(m.id)),
      );
      const publishedIds = new Set(
        results
          .map((r, i) => (r.status === "fulfilled" ? unpublished[i].id : null))
          .filter((id): id is string => id !== null),
      );
      const failed = unpublished.length - publishedIds.size;
      const succeeded = publishedIds.size;
      if (succeeded > 0) {
        setModules((prev) =>
          prev.map((m) =>
            publishedIds.has(m.id) ? { ...m, status: "PUBLISHED" as const } : m,
          ),
        );
      }
      if (failed === 0) {
        toast.success(`Published ${succeeded} module${succeeded !== 1 ? "s" : ""}`);
      } else {
        toast.error(`${succeeded} published, ${failed} failed`);
      }
    } finally {
      setIsPublishing(false);
    }
  };


  return (
    <>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-arc-navy-900">Modules</h1>
            <p className="text-arc-slate-500 text-sm mt-1">
              Create and manage reusable learning modules across subjects.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePublishAllModules}
              disabled={isLoading || isPublishing}
              className="h-11"
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isPublishing && "animate-spin")}
              />
              {isPublishing ? "Publishing..." : "Publish All"}
            </Button>
            <Button
              variant="accent"
              onClick={() => router.push("/admin/modules/new")}
              disabled={isLoading}
              className="h-11 shadow-lg shadow-arc-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Module
            </Button>
          </div>
        </div>

        {/* Stat cards — click to filter by status, same interaction as /admin/programs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => handleStatClick("all")}
            className={cn(
              "text-left rounded-xl border bg-white p-4 transition-all",
              isStatActive("all")
                ? "border-arc-navy-500 ring-2 ring-arc-navy-500/20"
                : "border-arc-slate-200 hover:border-arc-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arc-slate-500">Total Modules</p>
                <p className="text-2xl font-bold text-arc-navy-900">
                  {modules.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-arc-navy-600" />
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleStatClick("published")}
            className={cn(
              "text-left rounded-xl border bg-white p-4 transition-all",
              isStatActive("published")
                ? "border-arc-navy-500 ring-2 ring-arc-navy-500/20"
                : "border-arc-slate-200 hover:border-arc-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arc-slate-500">Published</p>
                <p className="text-2xl font-bold text-arc-navy-900">
                  {publishedCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleStatClick("underReview")}
            className={cn(
              "text-left rounded-xl border bg-white p-4 transition-all",
              isStatActive("underReview")
                ? "border-arc-navy-500 ring-2 ring-arc-navy-500/20"
                : "border-arc-slate-200 hover:border-arc-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arc-slate-500">Under Review</p>
                <p className="text-2xl font-bold text-arc-navy-900">
                  {underReviewCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </button>
          <div className="text-left rounded-xl border border-arc-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arc-slate-500">Total Lessons</p>
                <p className="text-2xl font-bold text-arc-navy-900">
                  {totalLessons}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search modules..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isLoading}
                className="pl-10 w-64 border-arc-slate-200 focus:border-arc-navy-500"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-arc-slate-400 hover:text-arc-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Sort dropdown — direction baked into the options */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                disabled={isLoading}
                className="h-10 pl-10 pr-8 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-arc-slate-500 hover:text-arc-navy-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-arc-navy-200 bg-arc-navy-50 px-4 py-3">
            <p className="text-sm font-medium text-arc-navy-900">
              {selected.size} module{selected.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus("publish")}
                disabled={isBulkUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus("archive")}
                disabled={isBulkUpdating}
              >
                <BookOpen className="h-4 w-4 mr-1 text-arc-slate-500" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={isBulkUpdating}
                className="text-arc-red-600 border-arc-red-200 hover:bg-arc-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isBulkUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Clear selection
              </Button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchModules}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Result count */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-arc-slate-500">
              {hasActiveFilters ? (
                <>
                  <span className="font-semibold text-arc-navy-900">
                    {filteredModules.length}
                  </span>{" "}
                  of {modules.length} module{modules.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <span className="font-semibold text-arc-navy-900">
                    {modules.length}
                  </span>{" "}
                  module{modules.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
            {filteredModules.length > 0 && (
              <p className="text-xs text-arc-slate-400">
                Sorted by{" "}
                {SORT_OPTIONS.find((o) => o.value === sortOption)?.label ??
                  "Newest first"}
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && <TableSkeleton rows={6} cols={6} />}

        {/* Modules Table */}
        {!isLoading && paginatedModules.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = somePageSelected && !allPageSelected;
                          }}
                          onChange={toggleAllPage}
                          aria-label="Select all on page"
                          className="h-4 w-4 rounded border-arc-slate-300 text-arc-navy-600 focus:ring-arc-navy-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Module
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Subject
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Topics
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Lessons
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Updated
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-arc-navy-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {paginatedModules.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-arc-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(m.id)}
                            onChange={() => toggleRow(m.id)}
                            aria-label={`Select ${m.name}`}
                            className="h-4 w-4 rounded border-arc-slate-300 text-arc-navy-600 focus:ring-arc-navy-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/modules/${m.id}`} className="group block">
                            <div className="font-medium text-arc-navy-900 group-hover:text-arc-navy-700 transition-colors">
                              {m.name}
                            </div>
                            {m.slug && (
                              <div className="text-sm text-arc-slate-500">
                                /{m.slug}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {m.subject ? (
                            <Badge
                              variant="secondary"
                              className={getSubjectColor(m.subject.color)}
                            >
                              {m.subject.name}
                            </Badge>
                          ) : (
                            <span className="text-sm text-arc-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-navy-800">
                          {m._count?.topics ?? 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-navy-800">
                          {m._count?.lessons ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[m.status]}>
                            {m.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-slate-500">
                          {formatDate(m.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/modules/${m.id}`}>
                              <Button variant="ghost" size="sm" title="View module">
                                <Eye className="h-4 w-4 text-arc-slate-500" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={
                                m.status === "PUBLISHED"
                                  ? "Unpublish module"
                                  : "Publish module"
                              }
                              onClick={() => handleToggleModuleStatus(m.id, m.status)}
                            >
                              <CheckCircle className="h-4 w-4 text-arc-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete module"
                              onClick={() => setDeleteTarget(m)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredModules.length === 0 && (
          <Card className="border-arc-slate-200">
            <CardContent className="p-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-arc-slate-100 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-arc-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-arc-navy-900 mb-2">
                {hasActiveFilters ? "No modules match" : "No modules yet"}
              </h3>
              <p className="text-arc-slate-500 mb-8 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search keywords or filters."
                  : "Get started by creating your first learning module."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={handleClearFilters} className="h-11">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => router.push("/admin/modules/new")}
                  className="h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!isLoading && filteredModules.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <AdminPagination
                page={safePage}
                pageSize={pageSize}
                total={filteredModules.length}
                onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
                onPageSizeChange={(size) => setPageSize(size)}
                itemLabel="modules"
              />
            </CardContent>
          </Card>
        )}

        {/* Single delete confirmation */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          variant="danger"
          title="Delete Module"
          confirmLabel="Delete Module"
          busyLabel="Deleting..."
          description={
            deleteTarget && (
              <p>
                You are about to permanently delete{" "}
                <span className="font-semibold text-arc-navy-900">
                  {deleteTarget.name}
                </span>
                . This will also remove its{" "}
                <span className="font-semibold">
                  {deleteTarget._count?.topics ?? 0}
                </span>{" "}
                topic(s) and{" "}
                <span className="font-semibold">
                  {deleteTarget._count?.lessons ?? 0}
                </span>{" "}
                lesson(s). This action cannot be undone.
              </p>
            )
          }
        />

        {/* Bulk delete confirmation */}
        <ConfirmModal
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={handleConfirmBulkDelete}
          variant="danger"
          title="Delete Selected Modules"
          confirmLabel={`Delete ${selected.size} Module${selected.size !== 1 ? "s" : ""}`}
          busyLabel="Deleting..."
          description={
            <p>
              You are about to permanently delete{" "}
              <span className="font-semibold text-arc-navy-900">
                {selected.size}
              </span>{" "}
              selected module{selected.size !== 1 ? "s" : ""}, including all
              topics and lessons inside them. This action cannot be undone.
            </p>
          }
        />





      </div>
    </>
  );
}
