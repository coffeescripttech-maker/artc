"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/admin";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  Save,
  Eye,
  Send,
  Check,
  Video,
  FileText,
  BookOpen,
  Plus,
  Upload,
  X,
  ArrowLeft,
  Clock,
  GripVertical,
} from "lucide-react";

// Mock data
const mockLesson = {
  id: "2",
  title: "Solving One-Step Equations",
  slug: "solving-one-step-equations",
  type: "VIDEO",
  status: "PUBLISHED" as const,
  durationMinutes: 6,
  description: "Learn how to solve one-step linear equations through clear examples and step-by-step guidance.",
  videoUrl: "",
  topic: {
    id: "2",
    name: "Linear Equations",
    slug: "linear-equations",
    module: {
      id: "2",
      name: "Algebra",
      slug: "algebra",
      subject: {
        id: "1",
        name: "Mathematics",
        slug: "mathematics",
      },
    },
  },
};

const lessonTypes = [
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "ARTICLE", label: "Article", icon: FileText },
  { value: "MIXED", label: "Mixed", icon: BookOpen },
  { value: "PRACTICE", label: "Practice", icon: FileText },
];

type SaveStatus = "saved" | "unsaved" | "saving";

export default function LessonEditorPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const [lesson] = useState(mockLesson);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [title, setTitle] = useState(mockLesson.title);
  const [description, setDescription] = useState(mockLesson.description);
  const [lessonType, setLessonType] = useState(mockLesson.type);
  const [duration, setDuration] = useState(mockLesson.durationMinutes?.toString() || "");
  const [videoUrl, setVideoUrl] = useState(mockLesson.videoUrl || "");
  const [content, setContent] = useState(`<h2>Introduction</h2>
<p>Welcome to this lesson on solving one-step equations. By the end of this lesson, you'll be able to solve equations using addition, subtraction, multiplication, and division.</p>

<h2>Key Concepts</h2>
<ul>
  <li>Understanding variables as unknown values</li>
  <li>Balancing equations by performing the same operation on both sides</li>
  <li>Checking your solution by substituting back</li>
</ul>

<h2>Example</h2>
<p>Solve for x: x + 5 = 12</p>
<p><strong>Step 1:</strong> Subtract 5 from both sides</p>
<p>x + 5 - 5 = 12 - 5</p>
<p><strong>Step 2:</strong> Simplify</p>
<p>x = 7</p>

<p><strong>Check:</strong> 7 + 5 = 12 ✓</p>`);

  // Track unsaved changes
  useEffect(() => {
    if (title !== mockLesson.title || description !== mockLesson.description) {
      setSaveStatus("unsaved");
    }
  }, [title, description]);

  const handleSave = async () => {
    setSaveStatus("saving");
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus("saved");
  };

  const typeConfig = lessonTypes.find((t) => t.value === lessonType);
  const TypeIcon = typeConfig?.icon || Video;

  return (
    <>
      <WorkspaceHeader
        title="Edit Lesson"
        breadcrumbs={[
          { label: "Subjects", href: "/admin/subjects" },
          { label: lesson.topic.module.subject.name, href: `/admin/subjects/${lesson.topic.module.subject.id}` },
          { label: lesson.topic.module.name, href: `/admin/modules/${lesson.topic.module.id}` },
          { label: lesson.topic.name, href: `/admin/topics/${lesson.topic.id}` },
          { label: lesson.title },
        ]}
        badge={lesson.status}
        badgeVariant={lesson.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        className="sticky top-0 z-30"
      />

      {/* Main content with preview */}
      <div className="flex min-h-[calc(100vh-200px)]">
        {/* Editor Panel */}
        <div className="flex-1 p-6 bg-white border-r border-arc-slate-200">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Back button */}
            <button className="flex items-center gap-2 text-arc-slate-500 hover:text-arc-navy-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to {lesson.topic.name}</span>
            </button>

            {/* Lesson Title */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                Lesson Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title..."
                className="text-xl font-semibold border-arc-slate-200 focus:border-arc-navy-500"
              />
            </div>

            {/* Lesson Type */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                Lesson Type
              </label>
              <div className="flex gap-2">
                {lessonTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = lessonType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setLessonType(type.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        isActive
                          ? "border-arc-orange-500 bg-arc-orange-50 text-arc-orange-600"
                          : "border-arc-slate-200 hover:border-arc-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video URL (for VIDEO type) */}
            {lessonType === "VIDEO" && (
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Video URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-arc-slate-500 mt-1">
                  Supports YouTube, Vimeo, or direct video file URLs
                </p>
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                Duration (minutes)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="5"
                  className="w-24"
                  min="1"
                />
                <span className="text-sm text-arc-slate-500">minutes</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what students will learn..."
                rows={3}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
              />
            </div>

            {/* Content Editor (for non-VIDEO types) */}
            {lessonType !== "VIDEO" && (
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Content
                </label>
                <Card className="overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 border-b border-arc-slate-200 bg-arc-slate-50">
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 font-bold text-sm">
                      B
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 italic text-sm">
                      I
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 underline text-sm">
                      U
                    </button>
                    <div className="w-px h-6 bg-arc-slate-200 mx-1" />
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      H2
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      H3
                    </button>
                    <div className="w-px h-6 bg-arc-slate-200 mx-1" />
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      • List
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      1. List
                    </button>
                    <div className="w-px h-6 bg-arc-slate-200 mx-1" />
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      🔗 Link
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      📷 Image
                    </button>
                    <button className="p-2 hover:bg-arc-slate-200 rounded text-arc-slate-600 text-sm">
                      📊 Table
                    </button>
                  </div>

                  {/* Content area */}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[400px] p-4 border-0 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Start writing your lesson content..."
                  />
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 bg-arc-slate-50 p-6 overflow-y-auto">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-arc-slate-500" />
              <span className="text-sm font-medium text-arc-slate-700">Student Preview</span>
            </div>

            {/* Preview Card */}
            <Card className="overflow-hidden shadow-arc-lg">
              {/* Video placeholder */}
              {lessonType === "VIDEO" && (
                <div className="aspect-video bg-gradient-to-br from-arc-navy-700 to-arc-navy-900 flex items-center justify-center">
                  <button className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <Video className="h-8 w-8 text-white" />
                  </button>
                </div>
              )}

              <CardContent className="p-4">
                <Badge className="mb-2 bg-arc-slate-100 text-arc-slate-600">
                  {lessonType}
                </Badge>

                <h3 className="font-bold text-arc-navy-900 mb-2">{title || "Untitled Lesson"}</h3>

                {description && (
                  <p className="text-sm text-arc-slate-600 mb-4 line-clamp-2">
                    {description}
                  </p>
                )}

                {duration && (
                  <div className="flex items-center gap-1 text-xs text-arc-slate-500 mb-4">
                    <Clock className="h-3 w-3" />
                    <span>{duration} min</span>
                  </div>
                )}

                {/* Content preview */}
                {lessonType !== "VIDEO" && content && (
                  <div className="text-sm text-arc-slate-600 space-y-2">
                    <div className="line-clamp-3 prose prose-sm" dangerouslySetInnerHTML={{ __html: content.slice(0, 200) + "..." }} />
                  </div>
                )}

                <Button variant="accent" className="w-full mt-4">
                  {lessonType === "VIDEO" ? "Watch Now" : "Start Lesson"}
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-arc-slate-500 text-center mt-4">
              This is how students will see your lesson
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-arc-slate-200 bg-white shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Status */}
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">All changes saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm text-yellow-600 font-medium">Unsaved changes</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <div className="h-4 w-4 border-2 border-arc-slate-300 border-t-arc-orange-500 rounded-full animate-spin" />
                <span className="text-sm text-arc-slate-500">Saving...</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSave} disabled={saveStatus === "saving"}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button variant="ghost">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="accent">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
