"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { curriculumApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { CardSkeleton, NoResultsEmpty, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Eye,
  GraduationCap,
  Users,
  AlertCircle,
} from "lucide-react";

interface Curriculum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  stage: string;
  gradeLevel?: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  orderIndex: number;
  program?: {
    id: string;
    name: string;
  };
  _count?: {
    items: number;
    learnerProfiles: number;
  };
}

const stageLabels: Record<string, string> = {
  BASIC_EDUCATION: "Basic Education",
  ENTRANCE_EXAM: "Entrance Exam",
  COLLEGE: "College",
  PROFESSIONAL: "Professional",
  BOARD_EXAM: "Board Exam",
  CERTIFICATION: "Certification",
  CONTINUING_EDUCATION: "Continuing Education",
};

const stageColors: Record<string, string> = {
  BASIC_EDUCATION: "bg-blue-100 text-blue-700",
  ENTRANCE_EXAM: "bg-purple-100 text-purple-700",
  COLLEGE: "bg-green-100 text-green-700",
  PROFESSIONAL: "bg-orange-100 text-orange-700",
  BOARD_EXAM: "bg-red-100 text-red-700",
  CERTIFICATION: "bg-teal-100 text-teal-700",
  CONTINUING_EDUCATION: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

export default function CurriculumsPage() {
  const router = useRouter();
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null);

  // Fetch curriculums on mount
  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await curriculumApi.list() as Curriculum[];
      setCurriculums(data);
    } catch (err) {
      setError("Failed to load curriculums. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter curriculums
  const filteredCurriculums = curriculums.filter((curriculum) => {
    const matchesSearch =
      curriculum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      curriculum.program?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      curriculum.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || curriculum.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const publishedCount = curriculums.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = curriculums.filter((c) => c.status === "DRAFT").length;
  const totalItems = curriculums.reduce((sum, c) => sum + (c._count?.items || 0), 0);
  const totalLearners = curriculums.reduce((sum, c) => sum + (c._count?.learnerProfiles || 0), 0);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await curriculumApi.delete(deleteTarget.id);
      setCurriculums(curriculums.filter((c) => c.id !== deleteTarget.id));
      toast.success("Curriculum deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete curriculum. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Curriculums"
        subtitle="Manage learning paths and grade levels"
        actions={
          <Button
            variant="accent"
            onClick={() => router.push("/admin/curriculums/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Curriculum
          </Button>
        }
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCurriculums}>
              Retry
            </Button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search curriculums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 w-64"
              />
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
          </div>

          <Button
            variant="accent"
            onClick={() => router.push("/admin/curriculums/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Curriculum
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-arc-orange-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-arc-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : curriculums.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Curriculums</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
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
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalItems}
                </div>
                <div className="text-sm text-arc-slate-500">Total Subjects</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalLearners}
                </div>
                <div className="text-sm text-arc-slate-500">Enrolled Learners</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Curriculum Cards */}
        {!isLoading && filteredCurriculums.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCurriculums.map((curriculum) => (
              <Card
                key={curriculum.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-arc-orange-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[curriculum.status]}>
                        {curriculum.status.replace("_", " ")}
                      </Badge>
                      <Link href={`/admin/curriculums/${curriculum.id}`}>
                        <button className="p-1 hover:bg-arc-slate-100 rounded">
                          <Eye className="h-4 w-4 text-arc-slate-400" />
                        </button>
                      </Link>
                    </div>
                  </div>

                  <Link href={`/admin/curriculums/${curriculum.id}`}>
                    <h3 className="font-semibold text-arc-navy-900 text-lg mb-1 hover:text-arc-orange-600 transition-colors">
                      {curriculum.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-arc-slate-500 mb-4">
                    {curriculum.program?.name || "No program linked"}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    {curriculum.stage && (
                      <Badge className={stageColors[curriculum.stage] || "bg-gray-100 text-gray-700"}>
                        {stageLabels[curriculum.stage] || curriculum.stage}
                      </Badge>
                    )}
                    {curriculum.gradeLevel && (
                      <Badge variant="secondary">
                        Grade {curriculum.gradeLevel.replace("GRADE_", "")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-arc-slate-600 mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {curriculum._count?.items || 0} subjects
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {curriculum._count?.learnerProfiles || 0} learners
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
                    <div></div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/curriculums/${curriculum.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(curriculum)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCurriculums.length === 0 && (
          <Card>
            <CardContent className="p-8">
              {searchQuery || statusFilter !== "all" ? (
                <NoResultsEmpty query={searchQuery || "your filter"} />
              ) : (
                <NoDataEmpty
                  title="No Curriculums Yet"
                  description="Create your first curriculum to get started."
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Curriculum"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Curriculum"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
