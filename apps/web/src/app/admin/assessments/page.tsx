"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { assessmentsApi } from "@/lib/api/client";
import { TableSkeleton, NoResultsEmpty, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  Search,
  Zap,
  FileText,
  Trophy,
  Trash2,
  Clock,
  Users,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// Types
interface Assessment {
  id: string;
  name: string;
  type: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  questionCount?: number;
  timeLimitMinutes?: number;
  usageCount?: number;
  _count?: {
    questions: number;
    attempts: number;
  };
}

const typeColors: Record<string, { bg: string; icon: React.ElementType }> = {
  QUIZ: { bg: "bg-blue-100", icon: Zap },
  PRACTICE: { bg: "bg-green-100", icon: FileText },
  DIAGNOSTIC: { bg: "bg-purple-100", icon: Trophy },
  MOCK_EXAM: { bg: "bg-orange-100", icon: Trophy },
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);

  // Fetch assessments
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assessmentsApi.list();
      setAssessments(Array.isArray(data) ? (data as Assessment[]) : []);
    } catch (err) {
      setError("Failed to load assessments.");
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateAssessment = () => {
    router.push("/admin/assessments/new");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await assessmentsApi.delete(deleteTarget.id);
      setAssessments(assessments.filter((a) => a.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.name}" successfully`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete assessment. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Assessments"
        subtitle="Manage quizzes, practice tests, and mock exams"
        actions={
          <Button variant="accent" onClick={handleCreateAssessment}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAssessments}>
              Retry
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{assessments.length}</div>
                <div className="text-sm text-arc-slate-500">Total Assessments</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {assessments.filter((a) => a.status === "PUBLISHED").length}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
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
                  {assessments.reduce((sum, a) => sum + (a.usageCount || a._count?.attempts || 0), 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Total Attempts</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {assessments.filter((a) => a.type === "MOCK_EXAM").length}
                </div>
                <div className="text-sm text-arc-slate-500">Mock Exams</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 w-64"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 border border-arc-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Types</option>
              <option value="QUIZ">Quizzes</option>
              <option value="PRACTICE">Practice</option>
              <option value="DIAGNOSTIC">Diagnostic</option>
              <option value="MOCK_EXAM">Mock Exams</option>
            </select>
          </div>

          <Button variant="accent" onClick={handleCreateAssessment} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </div>

        {/* Assessment List */}
        <Card>
          <CardContent className="p-0">
            {isLoading && <TableSkeleton />}

            {/* Assessment rows */}
            {!isLoading && (
              <div className="divide-y divide-arc-slate-100">
                {filteredAssessments.map((assessment) => {
                  const typeConfig = typeColors[assessment.type] || typeColors.QUIZ;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <div
                      key={assessment.id}
                      className="p-4 hover:bg-arc-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
                          <TypeIcon className="h-5 w-5 text-arc-slate-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <Link href={`/admin/assessments/${assessment.id}`}>
                              <h3 className="font-semibold text-arc-navy-900 hover:text-arc-orange-600 transition-colors">
                                {assessment.name}
                              </h3>
                            </Link>
                            <Badge variant="secondary">{assessment.type.replace("_", " ")}</Badge>
                            <Badge className={statusColors[assessment.status]}>
                              {assessment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-arc-slate-500">
                            <span>{assessment.questionCount || assessment._count?.questions || 0} questions</span>
                            {assessment.timeLimitMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {assessment.timeLimitMinutes} min
                              </span>
                            )}
                            <span>{assessment.usageCount || assessment._count?.attempts || 0} attempts</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/assessments/${assessment.id}`}>
                            <Button variant="ghost" size="sm">
                              Edit
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded"
                            onClick={() => setDeleteTarget(assessment)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredAssessments.length === 0 && (
              <div className="py-8">
                {searchQuery || typeFilter !== "all" ? (
                  <NoResultsEmpty query={searchQuery || "your filter"} />
                ) : (
                  <NoDataEmpty
                    title="No Assessments Yet"
                    description="Create your first assessment to get started."
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Assessment"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove the assessment and all its question associations.`}
        confirmLabel="Delete Assessment"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
