"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { topicsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { CardSkeleton, NoResultsEmpty, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  FileText,
  Edit,
  Trash2,
  Eye,
  Filter,
  AlertCircle,
} from "lucide-react";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  orderIndex: number;
  module?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };
  _count?: { lessons: number };
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await topicsApi.list() as Topic[];
      setTopics(data);
    } catch (err) {
      setError("Failed to load topics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique modules for filter
  const uniqueModules = Array.from(
    new Map(
      topics
        .filter((t) => t.module)
        .map((t) => [t.module!.id, t.module!])
    ).values()
  );

  // Filter topics
  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || topic.status === statusFilter;
    const matchesModule = moduleFilter === "all" || topic.module?.id === moduleFilter;
    return matchesSearch && matchesStatus && matchesModule;
  });

  // Group topics by subject/module for display
  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    const key = topic.module?.subject?.name || "Uncategorized";
    const subKey = topic.module?.name || "No Module";
    const groupKey = `${key} › ${subKey}`;

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await topicsApi.delete(deleteTarget.id);
      setTopics(topics.filter((t) => t.id !== deleteTarget.id));
      toast.success("Topic deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete topic. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Topics"
        subtitle="Manage topics within modules - leaf nodes of the curriculum"
        actions={
          <Button
            variant="accent"
            onClick={() => router.push("/admin/topics/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Topic
          </Button>
        }
      />

      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTopics}>
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
                placeholder="Search topics..."
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
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              disabled={isLoading}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Modules</option>
              {uniqueModules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.subject?.name} › {mod.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="accent"
            onClick={() => router.push("/admin/topics/new")}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Topic
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : topics.length}
                </div>
                <div className="text-sm text-arc-slate-500">Total Topics</div>
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
                  {isLoading ? "..." : topics.filter((t) => t.status === "PUBLISHED").length}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
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
                  {isLoading ? "..." : topics.filter((t) => t.status === "DRAFT").length}
                </div>
                <div className="text-sm text-arc-slate-500">Drafts</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {isLoading ? "..." : uniqueModules.length}
                </div>
                <div className="text-sm text-arc-slate-500">Modules</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Topics List */}
        {!isLoading && Object.keys(groupedTopics).length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedTopics).map(([groupName, groupTopics]) => (
              <div key={groupName}>
                <h3 className="text-sm font-semibold text-arc-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {groupName}
                  <Badge variant="secondary">{groupTopics.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {groupTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="hover:shadow-arc-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <Link href={`/admin/topics/${topic.id}`}>
                                <h4 className="font-medium text-arc-navy-900 hover:text-arc-orange-600 transition-colors">
                                  {topic.name}
                                </h4>
                              </Link>
                              <Badge className={statusColors[topic.status]}>
                                {topic.status.replace("_", " ")}
                              </Badge>
                            </div>
                            {topic.description && (
                              <p className="text-sm text-arc-slate-500 line-clamp-1">
                                {topic.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-arc-navy-900">
                                {topic._count?.lessons || 0}
                              </div>
                              <div className="text-xs text-arc-slate-500">Lessons</div>
                            </div>

                            <div className="flex items-center gap-1 border-l border-arc-slate-200 pl-4">
                              <Link href={`/admin/topics/${topic.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/topics/${topic.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(topic)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTopics.length === 0 && (
          <div className="py-8">
            {searchQuery || statusFilter !== "all" || moduleFilter !== "all" ? (
              <NoResultsEmpty query={searchQuery || "your filter"} />
            ) : (
              <NoDataEmpty
                title="No Topics Yet"
                description="Topics organize lessons within modules. Create your first topic to get started."
              />
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Topic"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all associated lessons.`}
        confirmLabel="Delete Topic"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
