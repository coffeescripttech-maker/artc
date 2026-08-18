"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { Button, Input, Badge, Card, CardContent } from "@/components/ui";
import { ProgramCard, ConfirmModal } from "@/components/admin";
import { programsApi } from "@/lib/api/client";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Layers,
  GraduationCap,
  RefreshCw,
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
  _count?: {
    curriculums: number;
    subjects: number;
    modules: number;
    lessons: number;
    enrollments: number;
  };
}

// Build a unique, URL-safe slug for a duplicated program (slug is @unique in the DB).
function makeCopySlug(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-copy-${suffix}`;
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
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
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || program.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
        // Program.stage is not stored on the program itself, but the create
        // validator requires a stage — default it (service ignores it).
        stage: "BASIC_EDUCATION",
      });
      await fetchPrograms();
    } catch (err: any) {
      console.error("Failed to duplicate program:", err);
      setError(err?.message || "Failed to duplicate program. Please try again.");
    }
  };

  // Thrown errors bubble up to the ConfirmModal, which shows them and stays open.
  const handleConfirmDelete = async () => {
    if (!programToDelete) return;
    await programsApi.delete(programToDelete.id);
    await fetchPrograms();
  };

  return (
    <>
      <DashboardHeader
        title="Programs"
        subtitle="Manage ARC learning programs, curricula, and learning paths"
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPrograms}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-arc-orange-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-arc-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-arc-navy-900">All Programs</h2>
              <Badge variant="secondary">
                {isLoading ? "Loading..." : `${filteredPrograms.length} programs`}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 w-64 border-arc-slate-200 focus:border-arc-navy-500"
              />
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

            <div className="flex items-center border border-arc-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                disabled={isLoading}
                className={`p-2.5 ${viewMode === "grid" ? "bg-arc-orange-500 text-white" : "text-arc-slate-500 hover:bg-arc-slate-50"} disabled:opacity-50`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                disabled={isLoading}
                className={`p-2.5 ${viewMode === "list" ? "bg-arc-orange-500 text-white" : "text-arc-slate-500 hover:bg-arc-slate-50"} disabled:opacity-50`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="accent"
              onClick={handleCreateProgram}
              disabled={isLoading}
              className="shadow-lg shadow-arc-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-arc-slate-200 rounded-lg mb-4" />
                  <div className="h-6 bg-arc-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-arc-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Program Cards */}
        {!isLoading && viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Empty State */}
        {!isLoading && filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <Layers className="h-16 w-16 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-arc-navy-900 mb-2">
              No programs found
            </h3>
            <p className="text-arc-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery || selectedStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first program"}
            </p>
            {!searchQuery && selectedStatus === "all" && (
              <Button variant="accent" onClick={handleCreateProgram}>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            )}
          </div>
        )}
      </div>

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
                <span className="font-semibold text-arc-navy-900">
                  {programToDelete.name}
                </span>
                . This action cannot be undone.
              </p>
              <ul className="space-y-1.5 rounded-lg border border-arc-slate-200 bg-arc-slate-50 p-3 text-xs">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-arc-red-500">•</span>
                  <span>
                    <span className="font-semibold">
                      {programToDelete._count?.enrollments ?? 0}
                    </span>{" "}
                    student enrollment(s), plus any batches and CET links, will be
                    permanently removed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-arc-slate-400">•</span>
                  <span>
                    <span className="font-semibold">
                      {programToDelete._count?.curriculums ?? 0}
                    </span>{" "}
                    curriculum(s) will be{" "}
                    <span className="font-semibold">unlinked</span> — kept, not deleted.
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
    </>
  );
}
