"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, WorkspaceTabs } from "@/components/admin";
import { LessonCanvas } from "@/components/admin/lesson-canvas";
import { BlockProperties } from "@/components/admin/block-properties";
import { BlockLibrary } from "@/components/admin/lesson-block-library";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";
import { lessonsApi } from "@/lib/api/client";
import { Button, Badge, Input } from "@/components/ui";
import {
  normalizeLessonContent,
  LESSON_CONTENT_VERSION,
  LESSON_TYPES,
  BLOCK_LABELS,
  createBlock,
  generateBlockId,
  type LessonBlock,
  type BlockType,
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
  FileText,
  List,
  Settings as SettingsIcon,
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
type EditorTab = "content" | "structure" | "settings" | "preview";

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

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString();
}

function blockSnippet(block: LessonBlock): string {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "example":
    case "callout":
      return block.type === "example" ? block.title || block.text : block.text;
    case "image":
      return block.caption || block.alt || block.url;
    case "video":
      return block.caption || block.url;
    case "formula":
      return block.latex;
    case "resource":
      return block.name || block.url;
    case "question":
      return block.questionId ? `#${block.questionId}` : "Not linked";
    case "divider":
      return "———";
    default:
      return "";
  }
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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [, setNowTick] = useState(0);

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef("");

  // Refresh relative "Saved X ago" label periodically
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

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
      setLastSavedAt(new Date());
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

  const addBlock = (t: BlockType) => {
    const nb = createBlock(t);
    setBlocks((prev) => [...prev, nb]);
    setSelectedBlockId(nb.id);
    setActiveTab("content");
  };

  const updateBlock = (id: string, patch: Record<string, unknown>) =>
    setBlocks(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as LessonBlock) : b)));

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const copy = { ...blocks[idx], id: generateBlockId() } as LessonBlock;
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    setBlocks(next);
    setSelectedBlockId(copy.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocks(next);
  };

  const convertBlock = (id: string, toType: BlockType) => {
    const HTML_TYPES = ["paragraph", "example", "callout"];
    setBlocks(
      blocks.map((b) => {
        if (b.id !== id) return b;
        const text = "text" in b ? (b as { text?: string }).text ?? "" : "";
        const html = "html" in b ? (b as { html?: string }).html : undefined;
        const fresh = { ...createBlock(toType), id: b.id } as LessonBlock & {
          text?: string;
          html?: string;
        };
        if ("text" in fresh) fresh.text = text;
        if (html && HTML_TYPES.includes(toType)) fresh.html = html;
        return fresh;
      })
    );
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

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const subject = lesson.topic?.module?.subject;
  const parentModule = lesson.topic?.module;
  const breadcrumbs = [
    { label: "Subjects", href: "/admin/subjects" },
    ...(subject ? [{ label: subject.name, href: `/admin/subjects/${subject.id}` }] : []),
    ...(parentModule ? [{ label: parentModule.name, href: `/admin/modules/${parentModule.id}` }] : []),
    ...(lesson.topic ? [{ label: lesson.topic.name, href: `/admin/topics/${lesson.topic.id}` }] : []),
    { label: lesson.title || "Lesson" },
  ];

  const saveIndicator = (
    <span className="flex items-center gap-1.5 text-sm">
      {saveStatus === "saving" && (
        <>
          <span className="h-3.5 w-3.5 border-2 border-arc-slate-300 border-t-arc-orange-500 rounded-full animate-spin" />
          <span className="text-arc-slate-500">Saving…</span>
        </>
      )}
      {saveStatus === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600 font-medium">Save failed</span>
        </>
      )}
      {saveStatus === "unsaved" && (
        <>
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-yellow-600 font-medium">Unsaved</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {lastSavedAt ? `Saved ${timeAgo(lastSavedAt)}` : "Saved"}
          </span>
        </>
      )}
    </span>
  );

  const renderLessonSettings = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title..."
        />
        {!title.trim() && <p className="text-xs text-red-500 mt-1">Title is required to save.</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        >
          {Object.values(LESSON_TYPES).map((t) => (
            <option key={t} value={t}>
              {typeLabels[t] || t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">Duration (minutes)</label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g., 10"
          min="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what students will learn..."
          rows={3}
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-arc-navy-900">Status</span>
        <Badge
          className={
            status === "PUBLISHED"
              ? "bg-green-100 text-green-700"
              : status === "ARCHIVED"
                ? "bg-gray-100 text-gray-600"
                : "bg-yellow-100 text-yellow-700"
          }
        >
          {status}
        </Badge>
      </div>

      {lesson.slug && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-arc-navy-900">Slug</span>
          <span className="text-xs font-mono text-arc-slate-500 truncate max-w-[60%]">{lesson.slug}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sticky header + tabs */}
      <div className="sticky top-0 z-30">
        <WorkspaceHeader
          title="Edit Lesson"
          breadcrumbs={breadcrumbs}
          badge={status}
          badgeVariant={status.toLowerCase() as "published" | "draft" | "archived" | "default"}
          actions={
            <>
              {saveIndicator}
              <Link href={`/dashboard/lessons/${lessonId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview as student
                </Button>
              </Link>
            </>
          }
        />
        <WorkspaceTabs
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as EditorTab)}
          tabs={[
            { id: "content", label: "Content", icon: FileText },
            { id: "structure", label: "Structure", icon: List },
            { id: "settings", label: "Settings", icon: SettingsIcon },
            { id: "preview", label: "Preview", icon: Eye },
          ]}
        />
      </div>

      {/* CONTENT TAB: three-column editor */}
      {activeTab === "content" && (
        <div className="flex items-stretch min-h-[calc(100vh-9.5rem)]">
          {/* Left: Block Library */}
          <aside className="w-60 shrink-0 border-r border-arc-slate-200 bg-white p-4 pb-28 overflow-y-auto">
            <BlockLibrary onAdd={addBlock} />
          </aside>

          {/* Center: Canvas */}
          <main className="flex-1 min-w-0 bg-arc-slate-50 p-6 pb-28 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-arc-navy-900">{title || "Untitled Lesson"}</h1>
                {description && <p className="text-arc-slate-600 mt-2">{description}</p>}
              </div>
              <LessonCanvas
                blocks={blocks}
                selectedId={selectedBlockId}
                onSelect={setSelectedBlockId}
                onReorder={setBlocks}
                onDuplicate={duplicateBlock}
                onMove={moveBlock}
                onDelete={removeBlock}
                onConvert={convertBlock}
              />
            </div>
          </main>

          {/* Right: Properties (contextual) */}
          <aside className="w-80 shrink-0 border-l border-arc-slate-200 bg-white p-5 pb-28 overflow-y-auto">
            {selectedBlock ? (
              <BlockProperties
                block={selectedBlock}
                onUpdate={(patch) => updateBlock(selectedBlock.id, patch)}
                onDuplicate={() => duplicateBlock(selectedBlock.id)}
                onDelete={() => removeBlock(selectedBlock.id)}
              />
            ) : (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-arc-slate-400 mb-4">
                  Lesson
                </h3>
                {renderLessonSettings()}
              </>
            )}
          </aside>
        </div>
      )}

      {/* STRUCTURE TAB: outline */}
      {activeTab === "structure" && (
        <div className="p-6 pb-28">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Lesson Structure</h2>
            {blocks.length === 0 ? (
              <p className="text-sm text-arc-slate-500">No blocks yet. Add content in the Content tab.</p>
            ) : (
              <ol className="space-y-2">
                {blocks.map((block, i) => (
                  <li
                    key={block.id}
                    className="flex items-center gap-3 rounded-lg border border-arc-slate-200 bg-white px-4 py-3"
                  >
                    <span className="text-sm font-mono text-arc-slate-400 w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-arc-slate-400">
                        {BLOCK_LABELS[block.type]}
                      </div>
                      <div className="text-sm text-arc-navy-900 truncate">
                        {blockSnippet(block) || <span className="text-arc-slate-300">Empty</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-xs text-arc-slate-400 mt-4">
              Drag-to-reorder here is coming soon. For now, reorder in the Content tab.
            </p>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="p-6 pb-28">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-arc-slate-200 p-6">
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Lesson Settings</h2>
            {renderLessonSettings()}
          </div>
        </div>
      )}

      {/* PREVIEW TAB */}
      {activeTab === "preview" && (
        <div className="p-6 pb-28 bg-arc-slate-50 min-h-[calc(100vh-9.5rem)]">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-arc-slate-200 p-6 sm:p-8">
            <Badge className="mb-2 bg-arc-slate-100 text-arc-slate-600">{typeLabels[type] || type}</Badge>
            <h1 className="text-3xl font-bold text-arc-navy-900">{title || "Untitled Lesson"}</h1>
            {description && <p className="text-arc-slate-600 mt-2">{description}</p>}
            {duration && (
              <div className="flex items-center gap-1 text-xs text-arc-slate-500 mt-2">
                <Clock className="h-3 w-3" />
                <span>{duration} min</span>
              </div>
            )}
            <div className="mt-6 border-t border-arc-slate-100 pt-6">
              <LessonBlockRenderer content={{ version: LESSON_CONTENT_VERSION, blocks }} />
            </div>
          </div>
        </div>
      )}

      {/* Sticky Save Bar (unchanged position) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-arc-slate-200 bg-white shadow-lg z-40 lg:ml-64">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  {lastSavedAt ? `Saved ${timeAgo(lastSavedAt)}` : "All changes saved"}
                </span>
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
