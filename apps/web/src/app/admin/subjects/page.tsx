"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { subjectsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Layers,
  FileText,
  Users,
  RefreshCw,
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

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subjectsApi.list() as Subject[];
      setSubjects(data);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError("Failed to load subjects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || subject.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will affect all linked curriculums.")) {
      return;
    }

    try {
      await subjectsApi.delete(subjectId, "");
      setSubjects(subjects.filter((s) => s.id !== subjectId));
    } catch (err) {
      console.error("Failed to delete subject:", err);
      alert("Failed to delete subject. Please try again.");
    }
  };

  // Calculate stats
  const totalModules = subjects.reduce((sum, s) => sum + (s._count?.modules || 0), 0);
  const publishedCount = subjects.filter((s) => s.status === "PUBLISHED").length;
  const draftCount = subjects.filter((s) => s.status === "DRAFT").length;

  return (
    <>
      <DashboardHeader
        title="Subjects"
        subtitle="Manage reusable subjects across all programs"
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSubjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
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
                placeholder="Search subjects..."
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
            onClick={() => router.push("/admin/subjects/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Subject
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-arc-navy-50 border border-arc-navy-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-arc-navy-600 flex-shrink-0" />
          <p className="text-sm text-arc-navy-800">
            <strong>Reusable Subjects:</strong> Subjects are independent entities that can be used across multiple programs and curriculums. Creating a subject once makes it available everywhere.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : subjects.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Subjects</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalModules}
                </div>
                <div className="text-sm text-arc-slate-500">Total Modules</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
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
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : draftCount}
                </div>
                <div className="text-sm text-arc-slate-500">Drafts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-14 w-14 rounded-xl bg-arc-slate-200 mb-4" />
                  <div className="h-6 bg-arc-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-arc-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Subject Cards */}
        {!isLoading && filteredSubjects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => {
              const config = getColorConfig(subject.color);
              const icon = getIcon(subject.code);

              return (
                <Card
                  key={subject.id}
                  className={`hover:shadow-lg transition-all duration-200 border-2 ${config.border}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-14 w-14 rounded-xl ${config.bg} flex items-center justify-center text-2xl`}>
                        {icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[subject.status]}>
                          {subject.status.replace("_", " ")}
                        </Badge>
                        <button className="p-1 hover:bg-arc-slate-100 rounded">
                          <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/subjects/${subject.id}`}>
                          <h3 className="font-bold text-arc-navy-900 text-lg hover:text-arc-orange-600 transition-colors">
                            {subject.name}
                          </h3>
                        </Link>
                        {subject.code && (
                          <Badge variant="secondary" className="bg-arc-slate-100 text-arc-slate-600">
                            {subject.code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-arc-slate-500 line-clamp-2 mt-1">
                        {subject.description || "No description provided"}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 my-4">
                      <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-arc-navy-900">
                          {subject._count?.modules || 0}
                        </div>
                        <div className="text-xs text-arc-slate-500">Modules</div>
                      </div>
                      <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-arc-navy-900">
                          {subject._count?.curriculumItems || 0}
                        </div>
                        <div className="text-xs text-arc-slate-500">In Curricula</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-arc-slate-100">
                      <Link href={`/admin/subjects/${subject.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Layers className="h-4 w-4 mr-1" />
                          Modules
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              {searchQuery || statusFilter !== "all"
                ? "No subjects found"
                : "No subjects yet"}
            </h3>
            <p className="text-arc-slate-500 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first subject to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button variant="accent" onClick={() => router.push("/admin/subjects/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Subject
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
