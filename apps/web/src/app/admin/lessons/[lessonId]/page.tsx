"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { LessonBlockEditor } from "@/components/admin/lesson-block-editor";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";
import { lessonsApi } from "@/lib/api/client";
import { Button, Badge, Input } from "@/components/ui";
import {
  normalizeLessonContent,
  LESSON_CONTENT_VERSION,
  LESSON_TYPES,
  type LessonBlock,
} from "@aratc/shared";
import {
  Save,
  Eye,
  Send,
  Check,
  ArrowLeft,
  Clock,
  RefreshCw,
  Archive,
  AlertCircle,
} from "lucide-react";

interface LessonApi {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: string;
  durationMinutes?: number | null;
  videoUrl?: string | null;
  content?: unknown;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  topic?: {
    id: string;
    name: string;
    module?: {
      id: string;
      name: string;
      subject?: { id: string; name: string; slug?: string };
    };
  };
}

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const typeLabels: Record<string, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  MIXED: "Mixed",
  ACTIVITY: "Activity",
  PRACTICE: "Practice",
};

function makeSnapshot(s: {
  title: string;
  description: string;
  type: string;
  duration: string;
  blocks: LessonBlock[];
}) {
  return JSON.stringify(s);
}

export default function LessonEditorPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("ARTICLE");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<LessonApi["status"]>("DRAFT");
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef("");

  // Fetch the real lesson
  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      hydratedRef.current = false;
      try {
        const data = (await lessonsApi.getById(lessonId)) as LessonApi;
        if (!active) return;
        const loaded = {
          title: data.title,
          description: data.description || "",
          type: data.type,
          duration: data.durationMinutes?.toString() || "",
          blocks: normalizeLessonContent(data.content).blocks,
        };
        setLesson(data);
        setTitle(loaded.title);
        setDescription(loaded.description);
        setType(loaded.type);
        setDuration(loaded.duration);
        setStatus(data.status);
        setBlocks(loaded.blocks);
        lastSavedRef.current = makeSnapshot(loaded);
        hydratedRef.current = true;
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to load lesson:", err);
        if (active) setLoadError("Failed to load this lesson.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lessonId]);

  const buildPayload = () => {
    const d = parseInt(duration, 10);
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      durationMinutes: Number.isFinite(d) && d >= 1 ? d : undefined,
      content: { version: LESSON_CONTENT_VERSION, blocks },
    };
  };

  const doSave = async (snapshot: string): Promise<boolean> => {
    if (!title.trim()) {
      setSaveStatus("unsaved");
      return false;
    }
    setSaveStatus("saving");
    try {
      await lessonsApi.update(lessonId, buildPayload());
      lastSavedRef.current = snapshot;
      setSaveStatus("saved");
      return true;
    } catch (err) {
      console.error("Failed to save lesson:", err);
      setSaveStatus("error");
      return false;
    }
  };

  // Debounced autosave
  useEffect(() => {
    if (!hydratedRef.current) return;
    const snap = makeSnapshot({ title, description, type, duration, blocks });
    if (snap === lastSavedRef.current) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("unsaved");
    const timer = setTimeout(() => {
      void doSave(snap);
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, type, duration, blocks]);

  const handleManualSave = () =>
    doSave(makeSnapshot({ title, description, type, duration, blocks }));

  const handlePublish = async () => {
    const ok = await doSave(makeSnapshot({ title, description, type, duration, blocks }));
    if (!ok) return;
    try {
      await lessonsApi.publish(lessonId);
      setStatus("PUBLISHED");
    } catch (err) {
      console.error("Failed to publish lesson:", err);
    }
  };

  const handleArchive = async () => {
    try {
      await lessonsApi.archive(lessonId);
      setStatus("ARCHIVED");
    } catch (err) {
      console.error("Failed to archive lesson:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (loadError || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Lesson not found</h2>
          <p className="text-arc-slate-500 mb-4">{loadError || "This lesson does not exist."}</p>
          <Link href="/admin/lessons">
            <Button variant="accent">Back to Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subject = lesson.topic?.module?.subject;
  const parentModule = lesson.topic?.module;
  const breadcrumbs = [
    { label: "Subjects", href: "/admin/subjects" },
    ...(subject ? [{ label: subject.name, href: `/admin/subjects/${subject.id}` }] : []),
    ...(parentModule ? [{ label: parentModule.name, href: `/admin/modules/${parentModule.id}` }] : []),
    ...(lesson.topic ? [{ label: lesson.topic.name, href: `/admin/topics/${lesson.topic.id}` }] : []),
    { label: lesson.title || "Lesson" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Edit Lesson"
        breadcrumbs={breadcrumbs}
        badge={status}
        badgeVariant={status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        className="sticky top-0 z-30"
        actions={
          <Link href={`/dashboard/lessons/${lessonId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview as student
            </Button>
          </Link>
        }
      />

      <div className="flex min-h-[calc(100vh-140px)]">
        {/* Editor Panel */}
        <div className="flex-1 p-6 bg-white border-r border-arc-slate-200 pb-24">
          <div className="max-w-3xl mx-auto space-y-6">
            {lesson.topic && (
              <Link
                href={`/admin/topics/${lesson.topic.id}`}
                className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-navy-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to {lesson.topic.name}</span>
              </Link>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">Lesson Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title..."
                className="text-lg font-semibold"
              />
              {!title.trim() && (
                <p className="text-xs text-red-500 mt-1">Title is required to save.</p>
              )}
            </div>

            {/* Type + Duration */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 px-3 border border-arc-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                >
                  {Object.values(LESSON_TYPES).map((t) => (
                    <option key={t} value={t}>
                      {typeLabels[t] || t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  className="w-32"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what students will learn..."
                rows={2}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
              />
            </div>

            {/* Block Editor */}
            <div>
              <label className="block text-sm font-medium text-arc-navy-900 mb-2">Content Blocks</label>
              <LessonBlockEditor blocks={blocks} onChange={setBlocks} />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="hidden lg:block w-[28rem] bg-arc-slate-50 p-6 overflow-y-auto pb-24">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-arc-slate-500" />
            <span className="text-sm font-medium text-arc-slate-700">Student Preview</span>
          </div>
          <div className="bg-white rounded-2xl shadow-arc-lg p-5">
            <Badge className="mb-2 bg-arc-slate-100 text-arc-slate-600">{typeLabels[type] || type}</Badge>
            <h1 className="text-xl font-bold text-arc-navy-900">{title || "Untitled Lesson"}</h1>
            {description && <p className="text-sm text-arc-slate-600 mt-1">{description}</p>}
            {duration && (
              <div className="flex items-center gap-1 text-xs text-arc-slate-500 mt-2">
                <Clock className="h-3 w-3" />
                <span>{duration} min</span>
              </div>
            )}
            <div className="mt-4 border-t border-arc-slate-100 pt-4">
              <LessonBlockRenderer content={{ version: LESSON_CONTENT_VERSION, blocks }} />
            </div>
          </div>
          <p className="text-xs text-arc-slate-500 text-center mt-4">
            This is how students will see your lesson
          </p>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-arc-slate-200 bg-white shadow-lg z-40 lg:ml-64">
        <div className="px-6 py-3 flex items-center justify-between">
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
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Save failed — retry</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {status !== "ARCHIVED" && (
              <Button variant="ghost" onClick={handleArchive} title="Archive lesson">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
            <Button variant="outline" onClick={handleManualSave} disabled={saveStatus === "saving"}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {status !== "PUBLISHED" && (
              <Button variant="accent" onClick={handlePublish} disabled={saveStatus === "saving"}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
