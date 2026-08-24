"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, DraggableList, type DraggableItem, TopicForm } from "@/components/admin";
import { modulesApi, topicsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  GripVertical,
  FileText,
  Edit,
  Trash2,
  ArrowRight,
  Video,
  FileCheck,
  RefreshCw,
  Send,
} from "lucide-react";

// Types
interface Module {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  subject?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: { topics: number; lessons: number };
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: { lessons: number };
}

const mockModule: Module = {
  id: "2",
  name: "Algebra",
  slug: "algebra",
  status: "PUBLISHED",
  subject: { id: "1", name: "Mathematics", slug: "mathematics" },
  _count: { topics: 5, lessons: 12 },
};

const mockTopics: Topic[] = [
  { id: "1", name: "Algebraic Expressions", slug: "algebraic-expressions", orderIndex: 0, status: "PUBLISHED", _count: { lessons: 3 } },
  { id: "2", name: "Linear Equations", slug: "linear-equations", orderIndex: 1, status: "PUBLISHED", _count: { lessons: 4 } },
  { id: "3", name: "Inequalities", slug: "inequalities", orderIndex: 2, status: "PUBLISHED", _count: { lessons: 3 } },
  { id: "4", name: "Word Problems", slug: "word-problems", orderIndex: 3, status: "DRAFT", _count: { lessons: 2 } },
  { id: "5", name: "Systems of Equations", slug: "systems-of-equations", orderIndex: 4, status: "DRAFT", _count: { lessons: 2 } },
];

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [module, setModule] = useState<Module | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);

  // Fetch module and topics
  useEffect(() => {
    fetchData();
  }, [moduleId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [moduleData, topicsData] = await Promise.all([
        modulesApi.getById(moduleId).catch(() => null),
        topicsApi.list(moduleId).catch(() => null),
      ]);

      if (moduleData) {
        setModule(moduleData as Module);
      } else {
        setModule(mockModule);
      }

      if (topicsData && Array.isArray(topicsData)) {
        setTopics(topicsData as Topic[]);
      } else {
        setTopics(mockTopics);
      }
    } catch (err) {
      console.error("Failed to fetch module data:", err);
      setError("Failed to load module data. Using demo data.");
      setModule(mockModule);
      setTopics(mockTopics);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = async (data: {
    name: string;
    description: string;
    moduleId?: string;
    subjectId?: string;
  }) => {
    try {
      const newTopic = await topicsApi.create(
        {
          name: data.name,
          moduleId: data.moduleId || moduleId,
          description: data.description
        },
        ""
      );
      setTopics([...topics, newTopic as Topic]);
      setShowTopicForm(false);
    } catch (err) {
      // Fallback to local state for demo
      const newTopic: Topic = {
        id: Date.now().toString(),
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, "-"),
        orderIndex: topics.length,
        status: "DRAFT",
        _count: { lessons: 0 },
      };
      setTopics([...topics, newTopic]);
      setShowTopicForm(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;

    try {
      await topicsApi.delete(topicId, "");
      setTopics(topics.filter((t) => t.id !== topicId));
    } catch (err) {
      // Fallback to local state
      setTopics(topics.filter((t) => t.id !== topicId));
    }
  };

  // Convert topics to DraggableItem format
  const topicItems: DraggableItem[] = topics.map((topic) => ({
    id: topic.id,
    title: topic.name,
    subtitle: `${topic._count?.lessons || 0} Lessons`,
    badge: topic.status,
    badgeVariant: (topic.status === "PUBLISHED" ? "success" : topic.status === "DRAFT" ? "warning" : "default") as "success" | "warning" | "default",
    onClick: () => {},
    onEdit: () => console.log("Edit topic:", topic.id),
    onDelete: () => handleDeleteTopic(topic.id),
  }));

  const handleReorderTopics = async (reorderedItems: DraggableItem[]) => {
    const reorderedTopics = reorderedItems.map((item, index) => {
      const topic = topics.find((t) => t.id === item.id);
      return topic ? { ...topic, orderIndex: index } : null;
    }).filter(Boolean) as Topic[];

    setTopics(reorderedTopics);
    setIsSaving(true);
    try {
      await topicsApi.reorder(
        moduleId,
        reorderedItems.map((i) => i.id),
        ""
      );
    } catch (err) {
      console.error("Failed to reorder topics:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishAllTopics = async () => {
    const draftTopics = topics.filter((t) => t.status !== "PUBLISHED");
    if (draftTopics.length === 0) return;

    setIsPublishing(true);
    try {
      await Promise.all(
        draftTopics.map((t) => topicsApi.publish(t.id))
      );
      setTopics(topics.map((t) =>
        t.status !== "PUBLISHED" ? { ...t, status: "PUBLISHED" as const } : t
      ));
      toast.success(`Published ${draftTopics.length} topics`);
    } catch (err) {
      console.error("Failed to publish topics:", err);
      toast.error("Failed to publish topics");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleTopicStatus = async (topicId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      if (newStatus === "PUBLISHED") {
        await topicsApi.publish(topicId);
      } else {
        await topicsApi.archive(topicId);
      }
      setTopics(topics.map((t) =>
        t.id === topicId ? { ...t, status: newStatus as Topic["status"] } : t
      ));
      toast.success(`Topic ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
    } catch (err) {
      console.error("Failed to toggle topic status:", err);
      toast.error("Failed to update topic status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Module not found</h2>
          <p className="text-arc-slate-500 mb-4">The module you're looking for doesn't exist.</p>
          <Link href="/admin/subjects">
            <Button variant="accent">Back to Subjects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader
        title={module.name}
        subtitle={module.subject ? `${module.subject.name} • Module` : "Module"}
        breadcrumbs={[
          { label: "Subjects", href: "/admin/subjects" },
          ...(module.subject ? [{ label: module.subject.name, href: `/admin/subjects/${module.subject.id}` }] : []),
          { label: "Modules" },
          { label: module.name },
        ]}
        badge={module.status}
        badgeVariant={module.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={[
          { label: "Topics", value: module._count?.topics || topics.length },
          { label: "Lessons", value: module._count?.lessons || 0 },
        ]}
        actions={
          <Button variant="accent" size="sm" onClick={() => setShowTopicForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Topic
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}

        {/* Topic List Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-arc-navy-900">Topics</h2>
            <Badge variant="secondary">{topics.length} topics</Badge>
            {topics.filter((t) => t.status !== "PUBLISHED").length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                {topics.filter((t) => t.status !== "PUBLISHED").length} draft
              </Badge>
            )}
            {isSaving && (
              <span className="text-sm text-arc-slate-500 animate-pulse">Saving order...</span>
            )}
          </div>
          {topics.filter((t) => t.status !== "PUBLISHED").length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublishAllTopics}
              disabled={isPublishing}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish All"}
            </Button>
          )}
        </div>

        {/* Drag-and-drop hint */}
        <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3">
          <p className="text-sm text-arc-slate-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag topics to reorder them. Changes are saved automatically.
          </p>
        </div>

        {/* Topic List with Drag-and-Drop */}
        <DraggableList
          items={topicItems}
          onReorder={handleReorderTopics}
          renderItem={(item, dragHandleProps) => {
            const topic = topics.find((t) => t.id === item.id);
            if (!topic) return null;

            return (
              <Card className="hover:shadow-arc-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      {...dragHandleProps}
                      className="cursor-grab active:cursor-grabbing p-1 text-arc-slate-400 hover:text-arc-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-arc-slate-500 w-8">
                          {String(topic.orderIndex + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-semibold text-arc-navy-900 truncate">{topic.name}</h3>
                        <Badge className={statusColors[topic.status]}>
                          {topic.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-11 text-sm text-arc-slate-500">
                        <span className="flex items-center gap-1">
                          <FileCheck className="h-3 w-3" />
                          {topic._count?.lessons || 0} Lessons
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTopicStatus(topic.id, topic.status);
                        }}
                      >
                        {topic.status === "PUBLISHED" ? (
                          <Badge variant="success" className="cursor-pointer">Published</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 cursor-pointer">Draft</Badge>
                        )}
                      </button>
                      <Link href={`/admin/topics/${topic.id}`}>
                        <Button variant="ghost" size="sm">
                          View Lessons
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      <button
                        className="p-1.5 hover:bg-arc-slate-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit topic:", topic.id);
                        }}
                      >
                        <Edit className="h-4 w-4 text-arc-slate-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-red-50 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-900">
                  {topics.filter((t) => t.status === "PUBLISHED").length}/{topics.length}
                </div>
                <div className="text-sm text-amber-700">Topics Published</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  {topics.reduce((sum, t) => sum + (t._count?.lessons || 0), 0)}
                </div>
                <div className="text-sm text-emerald-700">Total Lessons</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Topic Modal */}
      {showTopicForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-arc-navy-900">Add Topic</h2>
                <button
                  onClick={() => setShowTopicForm(false)}
                  className="p-2 rounded-lg hover:bg-arc-slate-100"
                >
                  <svg className="h-5 w-5 text-arc-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TopicForm
                onSubmit={handleAddTopic}
                onCancel={() => setShowTopicForm(false)}
                moduleId={moduleId}
                subjectId={module?.subject?.id}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
