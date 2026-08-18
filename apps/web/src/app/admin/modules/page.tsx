"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { modulesApi, subjectsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  orderIndex: number;
  subject?: {
    id: string;
    name: string;
    code?: string;
    color?: string;
  };
  _count?: { topics: number; lessons: number };
}

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

function getSubjectColor(color?: string) {
  return color && subjectColors[color] ? subjectColors[color] : subjectColors.blue;
}

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Fetch modules on mount
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await modulesApi.list() as Module[];
      setModules(data);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setError("Failed to load modules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(
    new Map(
      modules
        .filter((m) => m.subject)
        .map((m) => [m.subject!.id, m.subject!])
    ).values()
  );

  // Filter modules
  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || module.subject?.id === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Calculate stats
  const totalTopics = modules.reduce((sum, m) => sum + (m._count?.topics || 0), 0);
  const totalLessons = modules.reduce((sum, m) => sum + (m._count?.lessons || 0), 0);
  const publishedCount = modules.filter((m) => m.status === "PUBLISHED").length;
  const underReviewCount = modules.filter((m) => m.status === "UNDER_REVIEW").length;

  const handleDelete = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? This will also delete all topics and lessons within it.")) {
      return;
    }

    try {
      await modulesApi.delete(moduleId, "");
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err) {
      console.error("Failed to delete module:", err);
      alert("Failed to delete module. Please try again.");
    }
  };

  return (
    <>
      <DashboardHeader
        title="Modules"
        subtitle="Manage content modules within subjects"
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchModules}>
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
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 w-64"
              />
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
          </div>

          <Button
            variant="accent"
            onClick={() => router.push("/admin/modules/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : modules.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Modules</div>
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
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalLessons}
                </div>
                <div className="text-sm text-arc-slate-500">Total Lessons</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : underReviewCount}
                </div>
                <div className="text-sm text-arc-slate-500">Under Review</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-arc-slate-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules Table */}
        {!isLoading && filteredModules.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <tr>
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
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {filteredModules.map((module) => (
                      <tr
                        key={module.id}
                        className="hover:bg-arc-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getSubjectColor(module.subject?.color)}`}>
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <Link href={`/admin/modules/${module.id}`}>
                                <div className="font-medium text-arc-navy-900 hover:text-arc-orange-600 transition-colors">
                                  {module.name}
                                </div>
                              </Link>
                              <div className="text-sm text-arc-slate-500 line-clamp-1">
                                {module.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {module.subject && (
                            <Badge className={getSubjectColor(module.subject.color)}>
                              {module.subject.name}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-slate-600">
                          {module._count?.topics || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-slate-600">
                          {module._count?.lessons || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[module.status]}`}
                          >
                            {module.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/modules/${module.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(module.id)}
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
          <Card>
            <CardContent className="p-12 text-center">
              <Layers className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                {searchQuery || subjectFilter !== "all"
                  ? "No modules found"
                  : "No modules yet"}
              </h3>
              <p className="text-arc-slate-500 mb-4">
                {searchQuery || subjectFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first module to get started"}
              </p>
              {!searchQuery && subjectFilter === "all" && (
                <Button variant="accent" onClick={() => router.push("/admin/modules/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
