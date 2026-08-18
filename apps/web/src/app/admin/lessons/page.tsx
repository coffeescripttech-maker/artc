"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { lessonsApi, topicsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  Clock,
  BookOpen,
  Video,
  FileCheck,
  RefreshCw,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: "VIDEO" | "ARTICLE" | "MIXED" | "ACTIVITY" | "PRACTICE";
  durationMinutes?: number;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  orderIndex: number;
  topic?: {
    id: string;
    name: string;
    module?: {
      id: string;
      name: string;
      subject?: {
        id: string;
        name: string;
      };
    };
  };
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  VIDEO: { icon: Video, color: "text-red-700", bg: "bg-red-100" },
  ARTICLE: { icon: FileText, color: "text-blue-700", bg: "bg-blue-100" },
  MIXED: { icon: FileCheck, color: "text-purple-700", bg: "bg-purple-100" },
  PRACTICE: { icon: BookOpen, color: "text-green-700", bg: "bg-green-100" },
  ACTIVITY: { icon: Play, color: "text-orange-700", bg: "bg-orange-100" },
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch lessons on mount
  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lessonsApi.list() as Lesson[];
      setLessons(data);
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
      setError("Failed to load lessons. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic?.module?.subject?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || lesson.type === typeFilter;
    const matchesStatus = statusFilter === "all" || lesson.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const publishedCount = lessons.filter((l) => l.status === "PUBLISHED").length;
  const videoCount = lessons.filter((l) => l.type === "VIDEO").length;
  const articleCount = lessons.filter((l) => l.type === "ARTICLE").length;
  const totalDuration = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const underReviewCount = lessons.filter((l) => l.status === "UNDER_REVIEW").length;

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      await lessonsApi.delete(lessonId, "");
      setLessons(lessons.filter((l) => l.id !== lessonId));
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      alert("Failed to delete lesson. Please try again.");
    }
  };

  return (
    <>
      <DashboardHeader
        title="Lessons"
        subtitle="Manage learning content within topics"
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLessons}>
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
                placeholder="Search lessons..."
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
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Types</option>
              <option value="VIDEO">Video</option>
              <option value="ARTICLE">Article</option>
              <option value="MIXED">Mixed</option>
              <option value="PRACTICE">Practice</option>
              <option value="ACTIVITY">Activity</option>
            </select>

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
            </select>
          </div>

          <Button
            variant="accent"
            onClick={() => router.push("/admin/lessons/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Lesson
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : lessons.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Lessons</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
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
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Video className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : videoCount}
                </div>
                <div className="text-sm text-arc-slate-500">Videos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : totalDuration}
                </div>
                <div className="text-sm text-arc-slate-500">Total Minutes</div>
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

        {/* Lessons Table */}
        {!isLoading && filteredLessons.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Lesson
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Subject / Topic
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Duration
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                        Status
                      </th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {filteredLessons.map((lesson) => {
                      const config = typeConfig[lesson.type] || typeConfig.ARTICLE;
                      const TypeIcon = config.icon;

                      return (
                        <tr
                          key={lesson.id}
                          className="hover:bg-arc-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link href={`/admin/lessons/${lesson.id}`}>
                              <div className="font-medium text-arc-navy-900 hover:text-arc-orange-600 transition-colors">
                                {lesson.title}
                              </div>
                            </Link>
                            <div className="text-sm text-arc-slate-500 line-clamp-1">
                              {lesson.description || "No description"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${config.bg} ${config.color}`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {lesson.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {lesson.topic?.module?.subject && (
                              <div className="text-sm text-arc-navy-900">
                                {lesson.topic.module.subject.name}
                              </div>
                            )}
                            <div className="text-xs text-arc-slate-500">
                              {lesson.topic?.name || "No topic"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lesson.durationMinutes ? (
                              <div className="flex items-center gap-1 text-sm text-arc-slate-600">
                                <Clock className="h-4 w-4" />
                                {lesson.durationMinutes} min
                              </div>
                            ) : (
                              <span className="text-arc-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lesson.status]}`}
                            >
                              {lesson.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/admin/lessons/${lesson.id}`}>
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
                                onClick={() => handleDelete(lesson.id)}
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
        {!isLoading && filteredLessons.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "No lessons found"
                  : "No lessons yet"}
              </h3>
              <p className="text-arc-slate-500 mb-4">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first lesson to get started"}
              </p>
              {!searchQuery && typeFilter === "all" && statusFilter === "all" && (
                <Button variant="accent" onClick={() => router.push("/admin/lessons/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
