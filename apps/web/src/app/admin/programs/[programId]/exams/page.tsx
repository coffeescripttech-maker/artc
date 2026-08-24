"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { StatCardSkeleton, TableSkeleton, EmptyState, ErrorEmpty } from "@/components/branding";
import { assessmentsApi, programsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import {
  Plus,
  Award,
  Users,
  FileText,
  Clock,
  Target,
  Edit,
  Trash2,
} from "lucide-react";

interface Assessment {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  questionCount: number;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  _count?: { questions: number; attempts: number };
}

interface Program {
  id: string;
  name: string;
  slug: string;
  status: string;
}

const typeColors: Record<string, string> = {
  QUIZ: "bg-blue-100 text-blue-700",
  PRACTICE: "bg-green-100 text-green-700",
  DIAGNOSTIC: "bg-purple-100 text-purple-700",
  MOCK_EXAM: "bg-orange-100 text-orange-700",
  ASSIGNMENT: "bg-yellow-100 text-yellow-700",
  CET_SIMULATION: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function ProgramExamsPage() {
  const params = useParams();
  const programId = params.programId as string;
  const router = useRouter();

  const [program, setProgram] = useState<Program | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [programData, assessmentsData] = await Promise.all([
        programsApi.getById(programId),
        assessmentsApi.list({ programId }),
      ]);
      setProgram(programData as Program);
      setAssessments(assessmentsData as Assessment[]);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await assessmentsApi.delete(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    setAssessments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const publishedCount = assessments.filter((a) => a.status === "PUBLISHED").length;
  const totalQuestions = assessments.reduce((sum, a) => sum + a.questionCount, 0);
  const totalAttempts = assessments.reduce((sum, a) => sum + (a._count?.attempts ?? 0), 0);

  return (
    <>
      <WorkspaceHeader
        title="Exams"
        subtitle="Manage assessments and mock exams for this program"
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: program?.name ?? "Program", href: `/admin/programs/${programId}` },
          { label: "Exams" },
        ]}
        badge={program?.status}
        badgeVariant={program?.status === "PUBLISHED" ? "published" : "draft"}
        actions={
          <Button variant="accent" size="sm" onClick={() => router.push(`/admin/assessments/new?programId=${programId}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Award className="h-5 w-5 text-purple-600" />
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
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-arc-navy-900">{publishedCount}</div>
                    <div className="text-sm text-arc-slate-500">Published</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-arc-navy-900">{totalQuestions}</div>
                    <div className="text-sm text-arc-slate-500">Total Questions</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-arc-navy-900">{totalAttempts}</div>
                    <div className="text-sm text-arc-slate-500">Total Attempts</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Exam List */}
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : error ? (
          <ErrorEmpty onRetry={fetchData} />
        ) : assessments.length === 0 ? (
          <EmptyState
            icon="trophy"
            title="No Assessments Yet"
            description="Create your first assessment or mock exam for this program. You can build quizzes, practice tests, and full mock exams."
            action={{
              label: "Create Assessment",
              href: `/admin/assessments/new?programId=${programId}`,
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Assessment
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Questions
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Time
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Passing
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Attempts
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Status
                      </th>
                      <th className="w-24 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {assessments.map((exam) => (
                      <tr key={exam.id} className="hover:bg-arc-slate-50 transition-colors group">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/assessments/${exam.id}`}
                            className="font-medium text-arc-navy-900 hover:text-arc-orange-600"
                          >
                            {exam.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={typeColors[exam.type] ?? "bg-gray-100 text-gray-600"}>
                            {exam.type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-arc-slate-600">
                          {exam.questionCount}
                        </td>
                        <td className="px-4 py-3">
                          {exam.timeLimitMinutes ? (
                            <div className="flex items-center gap-1 text-arc-slate-600">
                              <Clock className="h-4 w-4" />
                              {exam.timeLimitMinutes} min
                            </div>
                          ) : (
                            <span className="text-arc-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-arc-slate-600">
                          {exam.passingScore ? `${exam.passingScore}%` : "-"}
                        </td>
                        <td className="px-4 py-3 text-arc-slate-600">
                          {exam._count?.attempts ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[exam.status] ?? "bg-gray-100 text-gray-600"}>
                            {exam.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/assessments/${exam.id}`}
                              className="p-1.5 hover:bg-arc-slate-100 rounded"
                            >
                              <Edit className="h-4 w-4 text-arc-slate-500" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(exam)}
                              className="p-1.5 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
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
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
            cannot be undone, and all associated questions and attempt records will be removed.
          </>
        }
        confirmLabel="Delete"
        busyLabel="Deleting..."
        variant="danger"
      />
    </>
  );
}
