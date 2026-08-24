"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { lessonsApi, topicsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Video,
  FileText,
  BookOpen,
  Play,
} from "lucide-react";

interface Topic {
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
}

const lessonTypes = [
  { value: "VIDEO", label: "Video", icon: Video, description: "Video lesson with optional transcript" },
  { value: "ARTICLE", label: "Article", icon: FileText, description: "Text-based lesson with rich content" },
  { value: "MIXED", label: "Mixed", icon: Play, description: "Combination of video and text" },
  { value: "PRACTICE", label: "Practice", icon: BookOpen, description: "Practice exercises and activities" },
  { value: "ACTIVITY", label: "Activity", icon: Play, description: "Interactive learning activity" },
];

export default function NewLessonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topicId: "",
    title: "",
    slug: "",
    description: "",
    type: "ARTICLE",
    durationMinutes: "",
    videoUrl: "",
  });

  // Fetch topics for dropdown
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const data = await topicsApi.list() as Topic[];
      setTopics(data);
    } catch {
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setFormData((prev) => ({ ...prev, title, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        topicId: formData.topicId,
        title: formData.title,
        slug: formData.slug,
        description: formData.description || undefined,
        type: formData.type,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
        videoUrl: formData.videoUrl || undefined,
      };
      await lessonsApi.create(payload);
      toast.success("Lesson created successfully");
      router.push("/admin/lessons");
    } catch (err: any) {
      setError(err.message || "Failed to create lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Create New Lesson"
        subtitle="Add a lesson to teach within a topic"
        breadcrumbs={[
          { label: "Lessons", href: "/admin/lessons" },
          { label: "New Lesson" },
        ]}
      />

      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/lessons"
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Link>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                {isLoadingTopics ? (
                  <div className="flex items-center gap-2 text-arc-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading topics...
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-arc-slate-500">
                    No topics found.{" "}
                    <Link href="/admin/topics/new" className="text-arc-orange-500 hover:underline">
                      Create a topic first
                    </Link>
                  </p>
                ) : (
                  <select
                    value={formData.topicId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, topicId: e.target.value }))}
                    required
                    className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.module?.subject?.name} › {topic.module?.name} › {topic.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Introduction to Linear Equations"
                  required
                  className="w-full"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  placeholder="e.g., introduction-to-linear-equations"
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  URL-friendly identifier (auto-generated from title)
                </p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Lesson Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.type === type.value
                            ? "border-arc-orange-500 bg-arc-orange-50"
                            : "border-arc-slate-200 hover:border-arc-slate-300"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-2 ${formData.type === type.value ? "text-arc-orange-500" : "text-arc-slate-400"}`} />
                        <div className="font-medium text-sm text-arc-navy-900">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the lesson..."
                  rows={3}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                />
              </div>

              {/* Video URL (conditional) */}
              {formData.type === "VIDEO" || formData.type === "MIXED" ? (
                <div>
                  <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                    Video URL
                  </label>
                  <Input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full"
                  />
                </div>
              ) : null}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                  placeholder="e.g., 15"
                  min="1"
                  className="w-32"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-arc-slate-100">
                <Link href="/admin/lessons">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting || !formData.topicId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Lesson
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
