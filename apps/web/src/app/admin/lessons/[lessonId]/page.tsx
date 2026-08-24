"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, WorkspaceTabs, DraggableList } from "@/components/admin";
import { LessonCanvas } from "@/components/admin/lesson-canvas";
import { BlockProperties } from "@/components/admin/block-properties";
import { BlockLibrary } from "@/components/admin/lesson-block-library";
import { BlockPicker } from "@/components/admin/block-picker";
import { LessonTemplates } from "@/components/admin/lesson-templates";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";
import { QuestionPickerModal } from "@/components/admin/question-picker-modal";
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
  Clock,
  RefreshCw,
  Archive,
  AlertCircle,
  FileText,
  List,
  Plus,
  Undo2,
  Redo2,
  GripVertical,
  Monitor,
  Tablet,
  Smartphone,
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

function isTextEntry(): boolean {
  const el = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    el.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    !!el.closest(".ProseMirror")
  );
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
  const [blockPicker, setBlockPicker] = useState<{ open: boolean; afterId: string | null }>({
    open: false,
    afterId: null,
  });
  const [questionPicker, setQuestionPicker] = useState<{ open: boolean; afterId: string | null }>({
    open: false,
    afterId: null,
  });
  const [undoStack, setUndoStack] = useState<LessonBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<LessonBlock[][]>([]);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [recovered, setRecovered] = useState<{
    title: string;
    description: string;
    type: string;
    duration: string;
    blocks: LessonBlock[];
    at: number;
  } | null>(null);

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

  // Listen for openQuestionPicker event from block-properties
  useEffect(() => {
    const handleOpenQuestionPicker = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.blockId) {
        setSelectedBlockId(detail.blockId);
      }
      openQuestionPicker(detail?.blockId || null);
    };
    window.addEventListener("openQuestionPicker", handleOpenQuestionPicker);
    return () => window.removeEventListener("openQuestionPicker", handleOpenQuestionPicker);
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
        setUndoStack([]);
        setRedoStack([]);
        lastSavedRef.current = makeSnapshot(loaded);
        hydratedRef.current = true;
        setSaveStatus("saved");
        try {
          const raw = localStorage.getItem(`arc:lesson-draft:${lessonId}`);
          if (raw) {
            const d = JSON.parse(raw);
            const draftSnap = makeSnapshot({
              title: d?.title ?? "",
              description: d?.description ?? "",
              type: d?.type ?? "",
              duration: d?.duration ?? "",
              blocks: Array.isArray(d?.blocks) ? d.blocks : [],
            });
            if (d && draftSnap !== makeSnapshot(loaded)) {
              if (active) setRecovered(d);
            } else {
              localStorage.removeItem(`arc:lesson-draft:${lessonId}`);
            }
          }
        } catch {}
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
      try {
        localStorage.removeItem(`arc:lesson-draft:${lessonId}`);
      } catch {}
      return true;
    } catch (err) {
      console.error("Failed to save lesson:", err);
      setSaveStatus("error");
      try {
        localStorage.setItem(
          `arc:lesson-draft:${lessonId}`,
          JSON.stringify({ title, description, type, duration, blocks, at: Date.now() })
        );
      } catch {}
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

  // --- Block history (undo/redo for structural ops) ---
  const commit = (next: LessonBlock[]) => {
    setUndoStack((s) => [...s.slice(-49), blocks]);
    setRedoStack([]);
    setBlocks(next);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r.slice(-49), blocks]);
    setUndoStack((s) => s.slice(0, -1));
    setBlocks(prev);
    setSelectedBlockId((cur) => (cur && prev.some((b) => b.id === cur) ? cur : null));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s.slice(-49), blocks]);
    setRedoStack((r) => r.slice(0, -1));
    setBlocks(next);
    setSelectedBlockId((cur) => (cur && next.some((b) => b.id === cur) ? cur : null));
  };

  const addBlock = (t: BlockType) => {
    const nb = createBlock(t);
    commit([...blocks, nb]);
    setSelectedBlockId(nb.id);
    setActiveTab("content");
  };

  const openBlockPicker = (afterId: string | null) => setBlockPicker({ open: true, afterId });

  const insertBlockAt = (t: BlockType, afterId: string | null) => {
    const nb = createBlock(t);
    const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
    const next = [...blocks];
    if (idx < 0) next.push(nb);
    else next.splice(idx + 1, 0, nb);
    commit(next);
    setSelectedBlockId(nb.id);
    setBlockPicker({ open: false, afterId: null });
    setActiveTab("content");
  };

  // Handle question selection from picker
  const handleQuestionSelect = (questionId: string, _questionText: string) => {
    const nb = createBlock("question") as any;
    nb.questionId = questionId;
    nb.points = 1;
    nb.required = false;
    nb.showFeedback = true;

    const afterId = questionPicker.afterId;
    const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
    const next = [...blocks];
    if (idx < 0) next.push(nb);
    else next.splice(idx + 1, 0, nb);

    commit(next);
    setSelectedBlockId(nb.id);
    setQuestionPicker({ open: false, afterId: null });
    setActiveTab("content");
  };

  // Open question picker modal
  const openQuestionPicker = (afterId: string | null) => setQuestionPicker({ open: true, afterId });

  const applyTemplate = (templateBlocks: LessonBlock[]) => {
    commit(templateBlocks);
    setSelectedBlockId(templateBlocks[0]?.id ?? null);
    setActiveTab("content");
  };

  const restoreDraft = () => {
    if (!recovered) return;
    setTitle(recovered.title);
    setDescription(recovered.description);
    setType(recovered.type);
    setDuration(recovered.duration);
    setBlocks(recovered.blocks);
    setSelectedBlockId(null);
    setUndoStack([]);
    setRedoStack([]);
    setRecovered(null);
    setSaveStatus("unsaved");
  };

  const dismissDraft = () => {
    try {
      localStorage.removeItem(`arc:lesson-draft:${lessonId}`);
    } catch {}
    setRecovered(null);
  };

  // Text/field edits stay out of block history (Tiptap & inputs have native undo).
  const updateBlock = (id: string, patch: Record<string, unknown>) =>
    setBlocks(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as LessonBlock) : b)));

  const removeBlock = (id: string) => {
    commit(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const copy = { ...blocks[idx], id: generateBlockId() } as LessonBlock;
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    commit(next);
    setSelectedBlockId(copy.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    commit(next);
  };

  const reorderBlocks = (next: LessonBlock[]) => commit(next);

  const convertBlock = (id: string, toType: BlockType) => {
    const HTML_TYPES = ["paragraph", "example", "callout", "keypoint"];
    commit(
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

  // Keyboard shortcuts: Ctrl/Cmd+S save, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z / Ctrl+Y redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        void handleManualSave();
      } else if (key === "z") {
        if (isTextEntry()) return; // let Tiptap / inputs handle text undo
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        if (isTextEntry()) return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack, blocks, title, description, type, duration]);

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
      <div className="flex flex-col h-dvh">
      {/* Header + tabs */}
      <div className="shrink-0">
        <WorkspaceHeader
          title="Edit Lesson"
          breadcrumbs={breadcrumbs}
          badge={status}
          badgeVariant={status.toLowerCase() as "published" | "draft" | "archived" | "default"}
          actions={
            <>
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  type="button"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded hover:bg-arc-slate-100 text-arc-slate-500 disabled:opacity-40"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 rounded hover:bg-arc-slate-100 text-arc-slate-500 disabled:opacity-40"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
              </div>
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

      {recovered && (
        <div className="shrink-0 bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-yellow-800">
            Recovered unsaved changes from your last session
            {recovered.at ? ` (${timeAgo(new Date(recovered.at))})` : ""}.
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={restoreDraft}>
              Restore
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissDraft}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Scrolling body */}
      <div className="flex-1 min-h-0">
      {/* CONTENT TAB: three-column editor */}
      {activeTab === "content" && (
        <div className="flex h-full">
          {/* Left: Block Library */}
          <aside className="w-60 shrink-0 border-r border-arc-slate-200 bg-white p-4 overflow-y-auto">
            <BlockLibrary onAdd={addBlock} />
          </aside>

          {/* Center: Canvas */}
          <main className="flex-1 min-w-0 bg-arc-slate-50 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-arc-navy-900">{title || "Untitled Lesson"}</h1>
                {description && <p className="text-arc-slate-600 mt-2">{description}</p>}
              </div>
              {blocks.length === 0 ? (
                <LessonTemplates onApply={applyTemplate} />
              ) : (
                <LessonCanvas
                  blocks={blocks}
                  selectedId={selectedBlockId}
                  onSelect={setSelectedBlockId}
                  onReorder={reorderBlocks}
                  onDuplicate={duplicateBlock}
                  onMove={moveBlock}
                  onDelete={removeBlock}
                  onConvert={convertBlock}
                />
              )}
              {/* Add content */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-arc-slate-200" />
                <button
                  type="button"
                  onClick={() => openBlockPicker(null)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-arc-slate-200 bg-white text-sm font-medium text-arc-slate-600 hover:border-arc-orange-300 hover:text-arc-orange-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add content
                </button>
                <div className="flex-1 h-px bg-arc-slate-200" />
              </div>
            </div>
          </main>

          {/* Right: Properties (contextual) */}
          <aside className="w-80 shrink-0 border-l border-arc-slate-200 bg-white p-5 overflow-y-auto">
            {selectedBlock ? (
              <BlockProperties
                key={selectedBlock.id}
                block={selectedBlock}
                onUpdate={(patch) => updateBlock(selectedBlock.id, patch)}
                onDuplicate={() => duplicateBlock(selectedBlock.id)}
                onDelete={() => removeBlock(selectedBlock.id)}
                onSlash={() => openBlockPicker(selectedBlock.id)}
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
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Lesson Structure</h2>
            {blocks.length === 0 ? (
              <p className="text-sm text-arc-slate-500">No blocks yet. Add content in the Content tab.</p>
            ) : (
              <>
                <p className="text-xs text-arc-slate-400 mb-3">
                  Drag to reorder. Click a block to edit it in the Content tab.
                </p>
                <DraggableList
                  items={blocks.map((b) => ({ id: b.id, title: BLOCK_LABELS[b.type] }))}
                  onReorder={(reordered) => {
                    const map = new Map(blocks.map((b) => [b.id, b]));
                    reorderBlocks(
                      reordered.map((i) => map.get(i.id)).filter((b): b is LessonBlock => !!b)
                    );
                  }}
                  renderItem={(item, dragHandleProps) => {
                    const idx = blocks.findIndex((b) => b.id === item.id);
                    const block = blocks[idx];
                    if (!block) return null;
                    return (
                      <div className="flex items-center gap-3 rounded-lg border border-arc-slate-200 bg-white px-3 py-2.5 hover:border-arc-orange-300 transition-colors">
                        <button
                          {...dragHandleProps}
                          className="cursor-grab active:cursor-grabbing p-1 text-arc-slate-300 hover:text-arc-slate-500"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-mono text-arc-slate-400 w-6">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setActiveTab("content");
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="text-xs font-medium uppercase tracking-wide text-arc-slate-400">
                            {BLOCK_LABELS[block.type]}
                          </div>
                          <div className="text-sm text-arc-navy-900 truncate">
                            {blockSnippet(block) || <span className="text-arc-slate-300">Empty</span>}
                          </div>
                        </button>
                      </div>
                    );
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-arc-slate-200 p-6">
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Lesson Settings</h2>
            {renderLessonSettings()}
          </div>
        </div>
      )}

      {/* PREVIEW TAB */}
      {activeTab === "preview" && (
        <div className="h-full overflow-y-auto p-6 bg-arc-slate-50">
          <div className="flex items-center justify-center gap-1 mb-4">
            {([
              { id: "desktop", icon: Monitor, label: "Desktop" },
              { id: "tablet", icon: Tablet, label: "Tablet" },
              { id: "mobile", icon: Smartphone, label: "Mobile" },
            ] as const).map((d) => {
              const Icon = d.icon;
              const active = previewDevice === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setPreviewDevice(d.id)}
                  title={d.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    active
                      ? "border-arc-orange-300 bg-arc-orange-50 text-arc-orange-600"
                      : "border-arc-slate-200 bg-white text-arc-slate-500 hover:text-arc-navy-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{d.label}</span>
                </button>
              );
            })}
          </div>
          <div
            className={`mx-auto bg-white rounded-2xl border border-arc-slate-200 p-6 sm:p-8 transition-all ${
              previewDevice === "mobile"
                ? "max-w-[390px]"
                : previewDevice === "tablet"
                  ? "max-w-[768px]"
                  : "max-w-3xl"
            }`}
          >
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
              <LessonBlockRenderer content={{ version: LESSON_CONTENT_VERSION, blocks }} isAdmin={true} />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Save bar (pinned to the bottom of the editor column) */}
      <div className="shrink-0 border-t border-arc-slate-200 bg-white">
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
                <span className="text-sm text-red-600 font-medium">Save failed</span>
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="text-sm font-medium text-arc-orange-600 hover:underline"
                >
                  Retry
                </button>
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
      </div>
      <BlockPicker
        open={blockPicker.open}
        onClose={() => setBlockPicker({ open: false, afterId: null })}
        onPick={(t) => {
          if (t === "question") {
            // Open question picker instead of inserting directly
            setBlockPicker({ open: false, afterId: null });
            openQuestionPicker(blockPicker.afterId);
          } else {
            insertBlockAt(t, blockPicker.afterId);
          }
        }}
      />

      <QuestionPickerModal
        isOpen={questionPicker.open}
        onClose={() => setQuestionPicker({ open: false, afterId: null })}
        onSelect={handleQuestionSelect}
        excludeQuestionIds={blocks
          .filter((b): b is Extract<LessonBlock, { type: "question" }> => b.type === "question" && Boolean(b.questionId))
          .map((b) => b.questionId)}
      />
    </>
  );
}
