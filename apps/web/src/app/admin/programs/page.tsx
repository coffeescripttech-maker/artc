"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/admin";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Progress,
} from "@/components/ui";
import { ProgramCard, ConfirmModal, programTypeColors } from "@/components/admin";
import { programsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  GraduationCap,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Copy,
  Layers,
  ChevronDown,
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle,
  Users,
  ArrowUpDown,
  X,
} from "lucide-react";

// Types
interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  programType?: string;
  imageUrl?: string;
  createdAt?: string;
  _count?: {
    curriculums: number;
    subjects: number;
    modules: number;
    lessons: number;
    enrollments: number;
  };
}

type SortField = "name" | "createdAt" | "enrollments";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "createdAt", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "enrollments", label: "Enrollments" },
];

// Build a unique, URL-safe slug for a duplicated program (slug is @unique in the DB).
function makeCopySlug(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-copy-${suffix}`;
}

// Template population steps for progress display
const POPULATE_STEPS = [
  "Creating program...",
  "Building Grade 9 curriculum...",
  "Building Grade 10 curriculum...",
  "Building Grade 11 curriculum...",
  "Building Grade 12 curriculum...",
  "Creating subjects & modules...",
  "Generating topics & sample questions...",
  "Finalizing...",
];

const CET_STEPS = [
  "Resolving topic mappings...",
  "Creating BUCET Mock Exam...",
  "Creating SSU-CET Mock Exam...",
  "Creating CSPC-CET Mock Exam...",
  "Creating VSU-CET Mock Exam...",
  "Creating BiISCAST-CET Mock Exam...",
  "Creating CNU-CET Mock Exam...",
  "Creating UPCAT Mock Exam...",
  "Creating PUPCET Mock Exam...",
  "Creating USTET Mock Exam...",
  "Creating ACET Mock Exam...",
  "Creating DECAT Mock Exam...",
  "Finalizing...",
];

export default function ProgramsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ProgramsPage />
    </Suspense>
  );
}

function ProgramsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL query params
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") ?? "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") ?? "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") ?? "grid"
  );
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get("sort") as SortField) ?? "createdAt"
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get("dir") as SortDirection) ?? "desc"
  );
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isGeneratingCet, setIsGeneratingCet] = useState(false);
  const [cetTargetProgram, setCetTargetProgram] = useState<Program | null>(null);
  const [populateProgress, setPopulateProgress] = useState(0);
  const [populateStep, setPopulateStep] = useState("");
  const [cetProgress, setCetProgress] = useState(0);
  const [cetStep, setCetStep] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync filter state to URL (replace history so back button doesn't spam)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (sortField !== "createdAt") params.set("sort", sortField);
    if (sortDirection !== "desc") params.set("dir", sortDirection);
    const qs = params.toString();
    router.replace(qs ? `/admin/programs?${qs}` : "/admin/programs", { scroll: false });
  }, [debouncedQuery, selectedStatus, viewMode, sortField, sortDirection, router]);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await programsApi.list();
      setPrograms(data as Program[]);
    } catch (err) {
      console.error("Failed to fetch programs:", err);
      setError("Failed to load programs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Simulate progress steps for long-running operations
  const runProgressSimulation = async (
    steps: string[],
    setProgress: (p: number) => void,
    setStep: (s: string) => void,
    durationMs: number
  ) => {
    const stepDuration = durationMs / steps.length;
    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise((r) => setTimeout(r, stepDuration));
    }
  };

  // Filter + sort (client-side; the API already returns createdAt desc)
  const filteredPrograms = programs
    .filter((program) => {
      const q = debouncedQuery.toLowerCase();
      const matchesSearch =
        !q ||
        program.name.toLowerCase().includes(q) ||
        program.description?.toLowerCase().includes(q) ||
        program.slug.toLowerCase().includes(q);
      const matchesStatus =
        selectedStatus === "all" || program.status.toLowerCase() === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "enrollments") {
        cmp = (a._count?.enrollments ?? 0) - (b._count?.enrollments ?? 0);
      } else {
        // createdAt — fall back to original order if missing
        cmp = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

  const hasActiveFilters = !!debouncedQuery || selectedStatus !== "all";

  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedStatus("all");
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const handleCreateProgram = () => {
    router.push("/admin/programs/new");
  };

  const handleDuplicate = async (program: Program) => {
    setError(null);
    try {
      await programsApi.create({
        name: `${program.name} (Copy)`,
        slug: makeCopySlug(program.slug),
        description: program.description || undefined,
        // Preserve the original program's type instead of defaulting to BASIC_EDUCATION
        stage: program.programType || "BASIC_EDUCATION",
      });
      await fetchPrograms();
      toast.success(`Duplicated "${program.name}" successfully`);
    } catch (err: any) {
      console.error("Failed to duplicate program:", err);
      const msg = err?.message || "Failed to duplicate program. Please try again.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handlePopulateCurriculum = async () => {
    setIsPopulating(true);
    setPopulateProgress(0);
    setPopulateStep("Starting...");
    setError(null);

    // Start progress simulation (longer duration for the heavy transaction)
    const progressPromise = runProgressSimulation(
      POPULATE_STEPS,
      setPopulateProgress,
      setPopulateStep,
      45000 // ~45s estimated
    );

    try {
      const result = await programsApi.createFromTemplate();
      await progressPromise; // Wait for progress to complete
      await fetchPrograms();
      toast.success("ARATC SHS Curriculum populated successfully!");
    } catch (err: any) {
      console.error("Failed to populate curriculum:", err);
      const msg = err?.message || "Failed to populate curriculum. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsPopulating(false);
      setPopulateProgress(0);
      setPopulateStep("");
    }
  };

  const handleGenerateCetExams = async (programId: string) => {
    setIsGeneratingCet(true);
    setCetProgress(0);
    setCetStep("Starting...");
    setError(null);

    const progressPromise = runProgressSimulation(
      CET_STEPS,
      setCetProgress,
      setCetStep,
      15000 // ~15s estimated
    );

    try {
      const result = await programsApi.generateCetExams(programId);
      await progressPromise;
      await fetchPrograms();
      toast.success("CET Mock Exams generated successfully!");
    } catch (err: any) {
      console.error("Failed to generate CET mock exams:", err);
      const msg = err?.message || "Failed to generate CET mock exams. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingCet(false);
      setCetTargetProgram(null);
      setCetProgress(0);
      setCetStep("");
    }
  };

  // Thrown errors bubble up to the ConfirmModal, which shows them and stays open.
  const handleConfirmDelete = async () => {
    if (!programToDelete) return;
    try {
      await programsApi.delete(programToDelete.id);
      await fetchPrograms();
      toast.success(`Deleted "${programToDelete.name}" successfully`);
    } catch (err: any) {
      const msg = err?.message || "Failed to delete program. Please try again.";
      setError(msg);
      toast.error(msg);
    }
  };

  // Calculate stats
  const publishedCount = programs.filter((p) => p.status === "PUBLISHED").length;
  const totalCurriculums = programs.reduce((sum, p) => sum + (p._count?.curriculums || 0), 0);
  const totalEnrollments = programs.reduce((sum, p) => sum + (p._count?.enrollments || 0), 0);

  return (
    <>
      <WorkspaceHeader
        title="Programs"
        subtitle="Manage ARC learning programs, curricula, and learning paths"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards - matching Curriculum page design */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-arc-navy-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : programs.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Programs</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : publishedCount}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalCurriculums}
                </div>
                <div className="text-sm text-arc-slate-500">Curriculums</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalEnrollments}
                </div>
                <div className="text-sm text-arc-slate-500">Enrollments</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPrograms}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search programs..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Sort dropdown */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400 pointer-events-none" />
              <select
                value={sortField}
                onChange={(e) => {
                  const field = e.target.value as SortField;
                  if (sortField !== field) {
                    setSortField(field);
                    setSortDirection(field === "name" ? "asc" : "desc");
                  }
                }}
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

            {/* Sort direction toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              disabled={isLoading}
              title={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
              className="h-10 w-10"
            >
              <span className="text-xs font-bold text-arc-navy-700">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            </Button>

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

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle - navy active for professional look */}
            <div className="flex items-center border border-arc-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                disabled={isLoading}
                aria-label="Grid view"
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                disabled={isLoading}
                aria-label="List view"
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Template triggers dropdown - secondary action, navy outline */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isLoading || isPopulating || isGeneratingCet}
                  className="h-11"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Templates
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 bg-white border border-arc-slate-200 shadow-lg rounded-lg p-1 z-50"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-arc-slate-500 uppercase">
                  Curriculum Templates
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handlePopulateCurriculum}
                  disabled={isPopulating}
                  className="cursor-pointer px-3 py-2.5 hover:bg-arc-navy-50 rounded-md mx-1 mt-1"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-arc-navy-600" />
                    <span className="text-sm text-arc-navy-700 flex-1">
                      {isPopulating ? "Populating..." : "Populate ARATC SHS Curriculum"}
                    </span>
                    {isPopulating && <Loader2 className="h-4 w-4 animate-spin text-arc-orange-500" />}
                  </div>
                  {isPopulating && (
                    <div className="mt-2">
                      <Progress value={populateProgress} max={100} size="sm" variant="default" showLabel />
                      <p className="text-xs text-arc-slate-500 mt-1">{populateStep}</p>
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-arc-slate-200 my-1 mx-1" />
                <DropdownMenuItem
                  onClick={() => {
                    const target = programs[0];
                    if (target) {
                      setCetTargetProgram(target);
                      handleGenerateCetExams(target.id);
                    }
                  }}
                  disabled={isGeneratingCet || programs.length === 0}
                  className="cursor-pointer px-3 py-2.5 hover:bg-arc-navy-50 rounded-md mx-1 mb-1"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-arc-navy-600" />
                    <span className="text-sm text-arc-navy-700 flex-1">
                      {isGeneratingCet ? "Generating..." : "Generate CET Mock Exams"}
                    </span>
                    {isGeneratingCet && <Loader2 className="h-4 w-4 animate-spin text-arc-orange-500" />}
                  </div>
                  {isGeneratingCet && (
                    <div className="mt-2">
                      <Progress value={cetProgress} max={100} size="sm" variant="default" showLabel />
                      <p className="text-xs text-arc-slate-500 mt-1">{cetStep}</p>
                    </div>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="accent"
              onClick={handleCreateProgram}
              disabled={isLoading}
              className="h-11 shadow-lg shadow-arc-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </div>
        </div>

        {/* Result count + pagination summary */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-arc-slate-500">
              {hasActiveFilters ? (
                <>
                  <span className="font-semibold text-arc-navy-900">{filteredPrograms.length}</span>{" "}
                  of {programs.length} program{programs.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <span className="font-semibold text-arc-navy-900">{programs.length}</span> program
                  {programs.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
            {filteredPrograms.length > 0 && (
              <p className="text-xs text-arc-slate-400">
                Sorted by {SORT_OPTIONS.find((o) => o.value === sortField)?.label ?? "Date Created"}{" "}
                ({sortDirection === "asc" ? "ascending" : "descending"})
              </p>
            )}
          </div>
        )}

        {/* Global Progress Overlays for long operations */}
        {(isPopulating || isGeneratingCet) && (
          <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    {isPopulating ? (
                      <BookOpen className="h-5 w-5 text-arc-orange-600" />
                    ) : (
                      <Layers className="h-5 w-5 text-arc-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-arc-navy-900">
                      {isPopulating
                        ? "Populating ARATC SHS Curriculum"
                        : "Generating CET Mock Exams"}
                    </h3>
                    <p className="text-sm text-arc-slate-500">
                      This may take a minute. You can continue working.
                    </p>
                  </div>
                </div>
                <Progress
                  value={isPopulating ? populateProgress : cetProgress}
                  max={100}
                  size="lg"
                  variant="default"
                  showLabel
                />
                <p className="text-sm text-arc-slate-500 mt-2 text-center">
                  {isPopulating ? populateStep : cetStep}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            {viewMode === "grid" && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="h-1 bg-arc-slate-200 rounded mb-4" />
                      <div className="h-6 w-12 bg-arc-slate-200 rounded mb-2" />
                      <div className="h-4 w-20 bg-arc-slate-200 rounded mb-4" />
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-10 bg-arc-slate-200 rounded" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {viewMode === "list" && (
              <Card className="animate-pulse">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                        <tr>
                          {[
                            "Program",
                            "Type",
                            "Subjects",
                            "Modules",
                            "Lessons",
                            "Enrollments",
                            "Status",
                          ].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-sm font-semibold">
                              {h}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-arc-slate-100">
                        {[1, 2, 3].map((i) => (
                          <tr key={i}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="h-4 bg-arc-slate-200 rounded w-3/4" />
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <div className="h-4 bg-arc-slate-200 rounded w-1/4 ml-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Program Cards (Grid View) - matching Curriculum card design */}
        {!isLoading && viewMode === "grid" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onView={() => router.push(`/admin/programs/${program.id}`)}
                onEdit={() => router.push(`/admin/programs/${program.id}/edit`)}
                onDuplicate={() => handleDuplicate(program)}
                onDelete={() => setProgramToDelete(program)}
              />
            ))}
          </div>
        )}

        {/* Programs Table (List View) - matching Curriculum page design */}
        {!isLoading && viewMode === "list" && filteredPrograms.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <tr>
                      <th
                        className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900 cursor-pointer select-none hover:text-arc-navy-700"
                        onClick={() => handleToggleSort("name")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Program
                          {sortField === "name" && (
                            <span className="text-arc-orange-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Subjects
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Modules
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Lessons
                      </th>
                      <th
                        className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900 cursor-pointer select-none hover:text-arc-navy-700"
                        onClick={() => handleToggleSort("enrollments")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Enrollments
                          {sortField === "enrollments" && (
                            <span className="text-arc-orange-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Status
                      </th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {filteredPrograms.map((program) => {
                      const typeConfig =
                        programTypeColors[program.programType || "BASIC_EDUCATION"] ||
                        programTypeColors.BASIC_EDUCATION;
                      const TypeIcon = typeConfig.icon;
                      return (
                        <tr
                          key={program.id}
                          className="hover:bg-arc-slate-50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/admin/programs/${program.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}
                              >
                                <TypeIcon className={`h-5 w-5 ${typeConfig.iconColor}`} />
                              </div>
                              <div>
                                <div className="font-medium text-arc-navy-900 group-hover:text-arc-navy-700 transition-colors">
                                  {program.name}
                                </div>
                                {program.slug && (
                                  <div className="text-sm text-arc-slate-500">/{program.slug}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            <Badge
                              variant="secondary"
                              className={`${typeConfig.bg} ${typeConfig.text}`}
                            >
                              {program.programType ? program.programType.replace(/_/g, " ") : "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {program._count?.subjects ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {program._count?.modules ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {program._count?.lessons ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">
                            {program._count?.enrollments ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                program.status === "PUBLISHED"
                                  ? "bg-green-100 text-green-700"
                                  : program.status === "ARCHIVED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {program.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/admin/programs/${program.id}`}>
                                <Button variant="ghost" size="sm" title="View program">
                                  <Eye className="h-4 w-4 text-arc-slate-500" />
                                </Button>
                              </Link>
                              <Link href={`/admin/programs/${program.id}/edit`}>
                                <Button variant="ghost" size="sm" title="Edit program">
                                  <Edit className="h-4 w-4 text-arc-slate-500" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Duplicate program"
                                onClick={() => handleDuplicate(program)}
                              >
                                <Copy className="h-4 w-4 text-arc-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete program"
                                onClick={() => setProgramToDelete(program)}
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
        {!isLoading && filteredPrograms.length === 0 && (
          <Card className="border-arc-slate-200">
            <CardContent className="p-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-arc-slate-100 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-10 w-10 text-arc-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-arc-navy-900 mb-2">
                {hasActiveFilters ? "No programs match" : "No programs yet"}
              </h3>
              <p className="text-arc-slate-500 mb-8 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search keywords or status filter."
                  : "Get started by creating your first program, or use a template to auto-populate the full ARATC SHS curriculum in one click."}
              </p>
              {!hasActiveFilters && (
                <div className="flex gap-3 justify-center">
                  <Button variant="accent" onClick={handleCreateProgram} className="h-11">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePopulateCurriculum}
                    disabled={isPopulating}
                    className="h-11"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isPopulating ? "Populating..." : "Auto-Populate Curriculum"}
                  </Button>
                </div>
              )}
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} className="h-11">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <ConfirmModal
          isOpen={!!programToDelete}
          onClose={() => setProgramToDelete(null)}
          onConfirm={handleConfirmDelete}
          variant="danger"
          title="Delete Program"
          confirmLabel="Delete Program"
          busyLabel="Deleting..."
          description={
            programToDelete && (
              <div className="space-y-3">
                <p>
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-arc-navy-900">{programToDelete.name}</span>.
                  This action cannot be undone.
                </p>
                <ul className="space-y-1.5 rounded-lg border border-arc-slate-200 bg-arc-slate-50 p-3 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-arc-red-500">•</span>
                    <span>
                      <span className="font-semibold">
                        {programToDelete._count?.enrollments ?? 0}
                      </span>{" "}
                      student enrollment(s), plus any batches and CET links, will be permanently
                      removed.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-arc-slate-400">•</span>
                    <span>
                      <span className="font-semibold">
                        {programToDelete._count?.curriculums ?? 0}
                      </span>{" "}
                      curriculum(s) will be <span className="font-semibold">unlinked</span> — kept,
                      not deleted.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-arc-slate-400">•</span>
                    <span>
                      Reusable subjects, modules, topics, and lessons will{" "}
                      <span className="font-semibold">not</span> be affected.
                    </span>
                  </li>
                </ul>
              </div>
            )
          }
        />
      </div>
    </>
  );
}

