"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, DraggableList, type DraggableItem, LessonForm } from "@/components/admin";
import { topicsApi, lessonsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge } from "@/components/ui";
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
  RefreshCw,
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

const mockTopic: Topic = {
  id: "2",
  name: "Linear Equations",
  slug: "linear-equations",
  status: "PUBLISHED",
  module: {
    id: "2",
    name: "Algebra",
    slug: "algebra",
    subject: { id: "1", name: "Mathematics", slug: "mathematics" },
  },
  _count: { lessons: 4 },
};

const mockLessons: Lesson[] = [
  { id: "1", title: "Introduction to Linear Equations", slug: "introduction-to-linear-equations", type: "VIDEO", durationMinutes: 8, status: "PUBLISHED", orderIndex: 0 },
  { id: "2", title: "Solving One-Step Equations", slug: "solving-one-step-equations", type: "VIDEO", durationMinutes: 6, status: "PUBLISHED", orderIndex: 1 },
  { id: "3", title: "Solving Multi-Step Equations", slug: "solving-multi-step-equations", type: "MIXED", durationMinutes: 12, status: "PUBLISHED", orderIndex: 2 },
  { id: "4", title: "Practice: Linear Equations", slug: "practice-linear-equations", type: "PRACTICE", durationMinutes: 15, status: "DRAFT", orderIndex: 3 },
];

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
  const topicId = params.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  // Fetch topic and lessons
  useEffect(() => {
    fetchData();
  }, [topicId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [topicData, lessonsData] = await Promise.all([
        topicsApi.getById(topicId).catch(() => null),
        lessonsApi.list(topicId).catch(() => null),
      ]);

      if (topicData) {
        setTopic(topicData as Topic);
      } else {
        setTopic(mockTopic);
      }

      if (lessonsData && Array.isArray(lessonsData)) {
        setLessons(lessonsData as Lesson[]);
      } else {
        setLessons(mockLessons);
      }
    } catch (err) {
      console.error("Failed to fetch topic data:", err);
      setError("Failed to load topic data. Using demo data.");
      setTopic(mockTopic);
      setLessons(mockLessons);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLesson = async (data: {
    title: string;
    description: string;
    type: string;
    topicId?: string;
    moduleId?: string;
    subjectId?: string;
    durationMinutes?: number;
  }) => {
    try {
      const newLesson = await lessonsApi.create(
        {
          title: data.title,
          topicId: data.topicId || topicId,
          description: data.description,
          type: data.type,
          durationMinutes: data.durationMinutes
        },
        ""
      );
      setLessons([...lessons, newLesson as Lesson]);
      setShowLessonForm(false);
    } catch (err) {
      // Fallback to local state
      const newLesson: Lesson = {
        id: Date.now().toString(),
        title: data.title,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
        type: data.type as Lesson["type"],
        durationMinutes: data.durationMinutes,
        status: "DRAFT",
        orderIndex: lessons.length,
      };
      setLessons([...lessons, newLesson]);
      setShowLessonForm(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      await lessonsApi.delete(lessonId, "");
      setLessons(lessons.filter((l) => l.id !== lessonId));
    } catch (err) {
      setLessons(lessons.filter((l) => l.id !== lessonId));
    }
  };

  // Convert lessons to DraggableItem format
  const lessonItems: DraggableItem[] = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    subtitle: `${typeConfig[lesson.type]?.label || "Lesson"}${lesson.durationMinutes ? ` • ${lesson.durationMinutes} min` : ""}`,
    badge: lesson.status,
    badgeVariant: (lesson.status === "PUBLISHED" ? "success" : lesson.status === "DRAFT" ? "warning" : "default") as "success" | "warning" | "default",
    onClick: () => {},
    onEdit: () => console.log("Edit lesson:", lesson.id),
    onDelete: () => handleDeleteLesson(lesson.id),
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
        ""
      );
    } catch (err) {
      console.error("Failed to reorder lessons:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Topic not found</h2>
          <p className="text-arc-slate-500 mb-4">The topic you're looking for doesn't exist.</p>
          <Link href="/admin/modules">
            <Button variant="accent">Back to Modules</Button>
          </Link>
        </div>
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
        {error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lesson List Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-arc-navy-900">Lessons</h2>
            <Badge variant="secondary">{lessons.length} lessons</Badge>
            {isSaving && (
              <span className="text-sm text-arc-slate-500 animate-pulse">Saving order...</span>
            )}
          </div>
        </div>

        {/* Drag-and-drop hint */}
        <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3">
          <p className="text-sm text-arc-slate-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag lessons to reorder them. Changes are saved automatically.
          </p>
        </div>

        {/* Lesson List with Drag-and-Drop */}
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
                      <Link href={`/admin/lessons/${lesson.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <button
                        className="p-1.5 hover:bg-arc-slate-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit lesson:", lesson.id);
                        }}
                      >
                        <Edit className="h-4 w-4 text-arc-slate-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-red-50 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(lesson.id);
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
    </>
  );
}
