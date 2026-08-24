"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, DraggableList, type DraggableItem, LessonForm, ConfirmModal } from "@/components/admin";
import { topicsApi, lessonsApi } from "@/lib/api/client";
import { PageLoader, NoDataEmpty, ErrorEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  GripVertical,
  Video,
  FileText,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Clock,
  Send,
} from "lucide-react";

// Types
interface Topic {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  module?: {
    id: string;
    name: string;
    slug: string;
    subject?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  _count?: { lessons: number };
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: "VIDEO" | "ARTICLE" | "MIXED" | "PRACTICE";
  durationMinutes?: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  VIDEO: { icon: Video, color: "text-red-600", bg: "bg-red-100", label: "Video" },
  ARTICLE: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100", label: "Article" },
  MIXED: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100", label: "Mixed" },
  PRACTICE: { icon: Edit, color: "text-green-600", bg: "bg-green-100", label: "Practice" },
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  // Fetch topic and lessons
  useEffect(() => {
    fetchData();
  }, [topicId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [topicData, lessonsData] = await Promise.all([
        topicsApi.getById(topicId),
        lessonsApi.list(topicId),
      ]);

      setTopic(topicData as Topic);
      setLessons(Array.isArray(lessonsData) ? (lessonsData as Lesson[]) : []);
    } catch (err) {
      setError("Failed to load topic data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLesson = async (data: {
    title: string;
    slug: string;
    description: string;
    type: string;
    topicId?: string;
    moduleId?: string;
    subjectId?: string;
    durationMinutes?: number;
  }) => {
    try {
      const newLesson = await lessonsApi.create({
        title: data.title,
        slug: data.slug,
        topicId: data.topicId || topicId,
        description: data.description || undefined,
        type: data.type,
        durationMinutes: data.durationMinutes,
      });
      setLessons([...lessons, newLesson as Lesson]);
      setShowLessonForm(false);
      toast.success("Lesson created successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create lesson. Please try again.");
    }
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setDeleteTarget(lesson);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await lessonsApi.delete(deleteTarget.id);
      setLessons(lessons.filter((l) => l.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.title}" successfully`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete lesson. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleLessonStatus = async (lessonId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      if (newStatus === "PUBLISHED") {
        await lessonsApi.publish(lessonId);
      } else {
        await lessonsApi.archive(lessonId);
      }
      setLessons(lessons.map((l) =>
        l.id === lessonId ? { ...l, status: newStatus as Lesson["status"] } : l
      ));
      toast.success(`Lesson ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
    } catch (err) {
      toast.error("Failed to update lesson status");
    }
  };

  const handlePublishAllLessons = async () => {
    const draftLessons = lessons.filter((l) => l.status !== "PUBLISHED");
    if (draftLessons.length === 0) return;

    setIsPublishing(true);
    try {
      await Promise.all(
        draftLessons.map((l) => lessonsApi.publish(l.id)),
      );
      setLessons(lessons.map((l) =>
        l.status !== "PUBLISHED" ? { ...l, status: "PUBLISHED" as const } : l
      ));
      toast.success(`Published ${draftLessons.length} lessons`);
    } catch (err) {
      toast.error("Failed to publish lessons");
    } finally {
      setIsPublishing(false);
    }
  };

  // Convert lessons to DraggableItem format
  const lessonItems: DraggableItem[] = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    subtitle: `${typeConfig[lesson.type]?.label || "Lesson"}${lesson.durationMinutes ? ` • ${lesson.durationMinutes} min` : ""}`,
    badge: lesson.status,
    badgeVariant: (lesson.status === "PUBLISHED" ? "success" : lesson.status === "DRAFT" ? "warning" : "default") as "success" | "warning" | "default",
    onClick: () => router.push(`/admin/lessons/${lesson.id}`),
    onEdit: () => router.push(`/admin/lessons/${lesson.id}`),
    onDelete: () => handleDeleteLesson(lesson),
  }));

  const handleReorderLessons = async (reorderedItems: DraggableItem[]) => {
    const reorderedLessons = reorderedItems.map((item, index) => {
      const lesson = lessons.find((l) => l.id === item.id);
      return lesson ? { ...lesson, orderIndex: index } : null;
    }).filter(Boolean) as Lesson[];

    setLessons(reorderedLessons);
    setIsSaving(true);
    try {
      await lessonsApi.reorder(
        topicId,
        reorderedItems.map((i) => i.id),
      );
      toast.success("Lesson order saved");
    } catch (err) {
      toast.error("Failed to save lesson order. Please try again.");
      fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorEmpty onRetry={fetchData} />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <NoDataEmpty
          title="Topic Not Found"
          description="The topic you're looking for doesn't exist or may have been deleted."
        />
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Subjects", href: "/admin/subjects" },
    ...(topic.module?.subject ? [{ label: topic.module.subject.name, href: `/admin/subjects/${topic.module.subject.id}` }] : []),
    ...(topic.module ? [{ label: topic.module.name, href: `/admin/modules/${topic.module.id}` }] : []),
    { label: "Topics" },
    { label: topic.name },
  ];

  return (
    <>
      <WorkspaceHeader
        title={topic.name}
        subtitle={topic.module?.subject ? `${topic.module.subject.name} • ${topic.module.name} • Topic` : "Topic"}
        breadcrumbs={breadcrumbs}
        badge={topic.status}
        badgeVariant={topic.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={[{ label: "Lessons", value: topic._count?.lessons || lessons.length }]}
        actions={
          <Button variant="accent" size="sm" onClick={() => setShowLessonForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Lesson List Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-arc-navy-900">Lessons</h2>
            <Badge variant="secondary">{lessons.length} lessons</Badge>
            {lessons.filter((l) => l.status !== "PUBLISHED").length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                {lessons.filter((l) => l.status !== "PUBLISHED").length} draft
              </Badge>
            )}
            {isSaving && (
              <span className="text-sm text-arc-slate-500 animate-pulse">Saving order...</span>
            )}
          </div>
          {lessons.filter((l) => l.status !== "PUBLISHED").length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublishAllLessons}
              disabled={isPublishing}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPublishing ? "Publishing..." : `Publish All (${lessons.filter((l) => l.status !== "PUBLISHED").length})`}
            </Button>
          )}
        </div>

        {/* Drag-and-drop hint */}
        <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3">
          <p className="text-sm text-arc-slate-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag lessons to reorder them. Changes are saved automatically.
          </p>
        </div>

        {/* Lesson List with Drag-and-Drop */}
        {lessons.length === 0 ? (
          <NoDataEmpty
            title="No Lessons Yet"
            description="Add your first lesson to start building the topic content."
          />
        ) : (
          <DraggableList
            items={lessonItems}
            onReorder={handleReorderLessons}
            renderItem={(item, dragHandleProps) => {
              const lesson = lessons.find((l) => l.id === item.id);
              if (!lesson) return null;

              const config = typeConfig[lesson.type] || typeConfig.ARTICLE;
              const TypeIcon = config.icon;

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

                      <div className="w-8 text-center">
                        <span className="text-sm font-medium text-arc-slate-500">
                          {String(lesson.orderIndex + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`h-4 w-4 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/lessons/${lesson.id}`}>
                            <h3 className="font-medium text-arc-navy-900 hover:text-arc-orange-600 transition-colors truncate">
                              {lesson.title}
                            </h3>
                          </Link>
                          <Badge className={`${config.bg} ${config.color} text-xs`}>
                            {config.label}
                          </Badge>
                          <Badge className={statusColors[lesson.status]}>
                            {lesson.status}
                          </Badge>
                        </div>
                      </div>

                      {lesson.durationMinutes && (
                        <div className="flex items-center gap-1 text-sm text-arc-slate-500">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.durationMinutes} min</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLessonStatus(lesson.id, lesson.status);
                          }}
                        >
                          {lesson.status === "PUBLISHED" ? (
                            <Badge variant="success" className="cursor-pointer">Published</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 cursor-pointer">Draft</Badge>
                          )}
                        </button>
                        <Link href={`/admin/lessons/${lesson.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <button
                          className="p-1.5 hover:bg-arc-slate-100 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/lessons/${lesson.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4 text-arc-slate-500" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLesson(lesson);
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
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {lessons.filter((l) => l.type === "VIDEO").length}
                </div>
                <div className="text-sm text-blue-700">Video Lessons</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {lessons.filter((l) => l.type === "PRACTICE").length}
                </div>
                <div className="text-sm text-green-700">Practice Exercises</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)}
                </div>
                <div className="text-sm text-purple-700">Total Minutes</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-arc-navy-900">Add Lesson</h2>
                <button
                  onClick={() => setShowLessonForm(false)}
                  className="p-2 rounded-lg hover:bg-arc-slate-100"
                >
                  <svg className="h-5 w-5 text-arc-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <LessonForm
                onSubmit={handleAddLesson}
                onCancel={() => setShowLessonForm(false)}
                topicId={topicId}
                moduleId={topic.module?.id}
                subjectId={topic.module?.subject?.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Lesson"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
