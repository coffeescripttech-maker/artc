"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@aratc/ui";
import { ConfirmModal, AdminPagination } from "@/components/admin";
import { subjectsApi } from "@/lib/api/client";
import { TableSkeleton } from "@/components/branding";
import { toast } from "@/lib/toast";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Eye,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  slug: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  _count?: {
    modules: number;
    curriculumItems: number;
  };
}

type SortOption =
  | "name-asc"
  | "name-desc"
  | "modules-desc"
  | "curricula-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "modules-desc", label: "Most modules" },
  { value: "curricula-desc", label: "Most curricula" },
];

const defaultColors = [
  { name: "blue", bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  { name: "purple", bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
  { name: "green", bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
  { name: "orange", bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600" },
  { name: "red", bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
  { name: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-600" },
];

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

const defaultIcons: Record<string, string> = {
  MATH: "📐",
  ENG: "📖",
  SCI: "🔬",
  AP: "🇵🇭",
  AR: "🧩",
  DEFAULT: "📚",
};

function getColorConfig(color?: string) {
  return defaultColors.find((c) => c.name === color) || defaultColors[0];
}

function getIcon(code?: string) {
  if (!code) return defaultIcons.DEFAULT;
  return defaultIcons[code.toUpperCase()] || defaultIcons.DEFAULT;
}

const PAGE_SIZE_DEFAULT = 10;

export default function SubjectsPage() {
  const router = useRouter();

  // ── Data ──
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters / sort / pagination ──
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // ── Actions / selection ──
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
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
    fetchSubjects();
  }, []);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await subjectsApi.list()) as Subject[];
      setSubjects(data);
    } catch {
      setError("Failed to load subjects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredSubjects = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const filtered = subjects.filter((subject) => {
      const matchesSearch =
        !q ||
        subject.name.toLowerCase().includes(q) ||
        subject.code?.toLowerCase().includes(q) ||
        subject.slug.toLowerCase().includes(q) ||
        subject.description?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || subject.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "modules-desc":
          return (b._count?.modules ?? 0) - (a._count?.modules ?? 0);
        case "curricula-desc":
          return (b._count?.curriculumItems ?? 0) - (a._count?.curriculumItems ?? 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [subjects, debouncedQuery, statusFilter, sortOption]);

  // Pagination slice.
  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedSubjects = filteredSubjects.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  // Reset page whenever filters/sort/page size change.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, statusFilter, sortOption, pageSize]);

  // Clear selection when the result set changes.
  useEffect(() => {
    if (hasTouchedSelection) setSelected(new Set());
  }, [filteredSubjects.length, hasTouchedSelection]);

  // ── Selection helpers ──
  const pageIds = paginatedSubjects.map((s) => s.id);
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subjectsApi.delete(deleteTarget.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success("Subject deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete subject. Please try again.",
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Stats ──
  const totalModules = subjects.reduce((sum, s) => sum + (s._count?.modules || 0), 0);
  const publishedCount = subjects.filter((s) => s.status === "PUBLISHED").length;
  const draftCount = subjects.filter((s) => s.status === "DRAFT").length;
  const underReviewCount = subjects.filter((s) => s.status === "UNDER_REVIEW").length;

  const hasActiveFilters = !!debouncedQuery || statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedQuery("");
    setStatusFilter("all");
    setSortOption("name-asc");
  };

  // Clickable stat filter — same interaction as /admin/programs.
  const handleStatClick = (key: "all" | "published" | "draft" | "underReview") => {
    setStatusFilter(
      key === "all"
        ? "all"
        : key === "published"
          ? "PUBLISHED"
          : key === "draft"
            ? "DRAFT"
            : "UNDER_REVIEW",
    );
    setPage(1);
  };

  const isStatActive = (key: "all" | "published" | "draft" | "underReview") =>
    (key === "all" && statusFilter === "all") ||
    (key === "published" && statusFilter === "PUBLISHED") ||
    (key === "draft" && statusFilter === "DRAFT") ||
    (key === "underReview" && statusFilter === "UNDER_REVIEW");

  // ── Actions ──
  const handleToggleSubjectStatus = async (subjectId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      if (newStatus === "PUBLISHED") {
        await subjectsApi.publish(subjectId);
      } else {
        await subjectsApi.archive(subjectId);
      }
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, status: newStatus as Subject["status"] } : s,
        ),
      );
      toast.success(`Subject ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
    } catch {
      toast.error("Failed to update subject status");
    }
  };

  // ── Bulk actions ──
  // subjectsApi has no bulk endpoints — loop the single-item calls with
  // Promise.allSettled and report a combined success/failure toast.
  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => subjectsApi.delete(id)));
      const failedIds = new Set(
        results
          .map((r, i) => (r.status === "rejected" ? ids[i] : null))
          .filter((id): id is string => id !== null),
      );
      const failed = failedIds.size;
      const succeeded = ids.length - failed;
      setSubjects((prev) => prev.filter((s) => !failedIds.has(s.id)));
      setSelected(new Set());
      setHasTouchedSelection(false);
      if (failed === 0) {
        toast.success(`${succeeded} subject${succeeded !== 1 ? "s" : ""} deleted`);
      } else if (succeeded === 0) {
        throw new Error("Failed to delete the selected subjects. Please try again.");
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
        ids.map((id) => (action === "publish" ? subjectsApi.publish(id) : subjectsApi.archive(id))),
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
        setSubjects((prev) =>
          prev.map((s) =>
            okIds.has(s.id) ? { ...s, status: newStatus as Subject["status"] } : s,
          ),
        );
      }
      setSelected(new Set());
      setHasTouchedSelection(false);
      if (failed === 0) {
        toast.success(
          `${succeeded} subject${succeeded !== 1 ? "s" : ""} ${action === "publish" ? "published" : "archived"}`,
        );
      } else {
        toast.error(`${succeeded} updated, ${failed} failed`);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-arc-navy-900">Subjects</h1>
            <p className="text-arc-slate-500 text-sm mt-1">
              Manage reusable subjects across all programs and curriculums.
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => router.push("/admin/subjects/new")}
            disabled={isLoading}
            className="h-11 shadow-lg shadow-arc-orange-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Subject
          </Button>
        </div>

        {/* Stat cards — click to filter by status, same interaction as /admin/programs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { key: "all", label: "Total Subjects", value: subjects.length, icon: <BookOpen className="h-5 w-5 text-arc-navy-600" />, bg: "bg-arc-navy-100" },
              { key: "published", label: "Published", value: publishedCount, icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: "bg-green-100" },
              { key: "draft", label: "Drafts", value: draftCount, icon: <Layers className="h-5 w-5 text-purple-600" />, bg: "bg-purple-100" },
              { key: "underReview", label: "Under Review", value: underReviewCount, icon: <AlertCircle className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-100" },
            ] as const
          ).map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => handleStatClick(stat.key)}
              className={cn(
                "text-left rounded-xl border bg-white p-4 transition-all",
                isStatActive(stat.key)
                  ? "border-arc-navy-500 ring-2 ring-arc-navy-500/20"
                  : "border-arc-slate-200 hover:border-arc-slate-300",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-arc-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-arc-navy-900">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search subjects..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
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
              {selected.size} subject{selected.size !== 1 ? "s" : ""} selected
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
                <Layers className="h-4 w-4 mr-1 text-arc-slate-500" />
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
            <Button variant="outline" size="sm" onClick={fetchSubjects}>
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
                    {filteredSubjects.length}
                  </span>{" "}
                  of {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <span className="font-semibold text-arc-navy-900">
                    {subjects.length}
                  </span>{" "}
                  subject{subjects.length !== 1 ? "s" : ""} ·{" "}
                  {totalModules} module{totalModules !== 1 ? "s" : ""} total
                </>
              )}
            </p>
            {filteredSubjects.length > 0 && (
              <p className="text-xs text-arc-slate-400">
                Sorted by{" "}
                {SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? "Name (A-Z)"}
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && <TableSkeleton rows={6} cols={6} />}

        {/* Subjects Table */}
        {!isLoading && paginatedSubjects.length > 0 && (
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
                        Subject
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Code
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Modules
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        In Curricula
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-arc-navy-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {paginatedSubjects.map((subject) => {
                      const config = getColorConfig(subject.color);
                      const icon = getIcon(subject.code);

                      return (
                        <tr
                          key={subject.id}
                          className="hover:bg-arc-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(subject.id)}
                              onChange={() => toggleRow(subject.id)}
                              aria-label={`Select ${subject.name}`}
                              className="h-4 w-4 rounded border-arc-slate-300 text-arc-navy-600 focus:ring-arc-navy-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/subjects/${subject.id}`} className="group flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg ${config.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                                {icon}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-arc-navy-900 group-hover:text-arc-navy-700 transition-colors truncate">
                                  {subject.name}
                                </div>
                                {subject.description && (
                                  <div className="text-sm text-arc-slate-500 truncate max-w-xs">
                                    {subject.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            {subject.code ? (
                              <Badge variant="secondary" className="bg-arc-slate-100 text-arc-slate-600">
                                {subject.code}
                              </Badge>
                            ) : (
                              <span className="text-sm text-arc-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {subject._count?.modules ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {subject._count?.curriculumItems ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[subject.status]}>
                              {subject.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/admin/subjects/${subject.id}`}>
                                <Button variant="ghost" size="sm" title="View subject">
                                  <Eye className="h-4 w-4 text-arc-slate-500" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                title={
                                  subject.status === "PUBLISHED"
                                    ? "Unpublish subject"
                                    : "Publish subject"
                                }
                                onClick={() =>
                                  handleToggleSubjectStatus(subject.id, subject.status)
                                }
                              >
                                <CheckCircle className="h-4 w-4 text-arc-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete subject"
                                onClick={() => setDeleteTarget(subject)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredSubjects.length === 0 && (
          <Card className="border-arc-slate-200">
            <CardContent className="p-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-arc-slate-100 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-arc-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-arc-navy-900 mb-2">
                {hasActiveFilters ? "No subjects match" : "No subjects yet"}
              </h3>
              <p className="text-arc-slate-500 mb-8 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search keywords or status filter."
                  : "Subjects are reusable across programs — create your first subject to get started."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={handleClearFilters} className="h-11">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => router.push("/admin/subjects/new")}
                  className="h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subject
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!isLoading && filteredSubjects.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <AdminPagination
                page={safePage}
                pageSize={pageSize}
                total={filteredSubjects.length}
                onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
                onPageSizeChange={(size) => setPageSize(size)}
                itemLabel="subjects"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Single delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Subject"
        confirmLabel="Delete Subject"
        busyLabel="Deleting..."
        description={
          <p>
            You are about to permanently delete{" "}
            <span className="font-semibold text-arc-navy-900">{deleteTarget?.name}</span>. This
            will affect all linked curriculums. This action cannot be undone.
          </p>
        }
      />

      {/* Bulk delete confirmation */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        variant="danger"
        title="Delete Selected Subjects"
        confirmLabel={`Delete ${selected.size} Subject${selected.size !== 1 ? "s" : ""}`}
        busyLabel="Deleting..."
        description={
          <p>
            You are about to permanently delete{" "}
            <span className="font-semibold text-arc-navy-900">{selected.size}</span> selected
            subject{selected.size !== 1 ? "s" : ""}, affecting all linked curriculums. This
            action cannot be undone.
          </p>
        }
      />
    </>
  );
}
