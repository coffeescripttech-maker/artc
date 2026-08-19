"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Plus, X, HelpCircle, ExternalLink, Loader } from "lucide-react";
import { type LessonBlock, resolveVideo, generateBlockId } from "@aratc/shared";
import { mediaApi, questionsApi } from "@/lib/api/client";
import { prepareImageForUpload, fileToUploadPayload } from "@/lib/image";
import { RichTextEditor } from "./rich-text-editor";
import { Button, Badge } from "@/components/ui";

export const inputClass =
  "w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Seed the rich editor from legacy plain text (paragraphs + line breaks). */
function textToHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Per-block-type edit fields. Rendered in the contextual Properties panel when a
 * block is selected. Kept UI-only: it calls onUpdate(patch) and never mutates.
 */
export function BlockFields({
  block,
  onUpdate,
  onSlash,
}: {
  block: LessonBlock;
  onUpdate: (patch: Record<string, unknown>) => void;
  onSlash?: () => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <select
            value={block.level}
            onChange={(e) => onUpdate({ level: Number(e.target.value) })}
            className="h-9 px-2 border border-arc-slate-200 rounded-lg text-sm bg-white"
          >
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Heading text"
            className={`${inputClass} font-semibold`}
          />
        </div>
      );

    case "paragraph":
      return (
        <RichTextEditor
          value={block.html || textToHtml(block.text)}
          onChange={(html, text) => onUpdate({ html, text })}
          placeholder="Write the paragraph text..."
          onSlash={onSlash}
        />
      );

    case "image":
      return <ImageFields block={block} onUpdate={onUpdate} />;

    case "video": {
      const resolved = resolveVideo(block);
      return (
        <div className="space-y-2">
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="YouTube, Vimeo, or direct video URL"
            className={inputClass}
          />
          <input
            value={block.caption || ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
          {block.url && (
            <p className="text-xs text-arc-slate-400">
              Detected:{" "}
              {resolved.kind === "iframe"
                ? "embeddable player"
                : resolved.kind === "file"
                  ? "direct video file"
                  : "unknown"}
            </p>
          )}
        </div>
      );
    }

    case "example":
      return (
        <div className="space-y-2">
          <input
            value={block.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Example title (optional)"
            className={`${inputClass} font-medium`}
          />
          <RichTextEditor
            value={block.html || textToHtml(block.text)}
            onChange={(html, text) => onUpdate({ html, text })}
            placeholder="Worked example / solution..."
            onSlash={onSlash}
          />
        </div>
      );

    case "callout":
      return (
        <div className="space-y-2">
          <select
            value={block.variant}
            onChange={(e) => onUpdate({ variant: e.target.value })}
            className="h-9 px-2 border border-arc-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="info">Info</option>
            <option value="tip">Tip</option>
            <option value="warning">Warning</option>
          </select>
          <RichTextEditor
            value={block.html || textToHtml(block.text)}
            onChange={(html, text) => onUpdate({ html, text })}
            placeholder="Callout message..."
            onSlash={onSlash}
          />
        </div>
      );

    case "keypoint":
      return (
        <RichTextEditor
          value={block.html || textToHtml(block.text)}
          onChange={(html, text) => onUpdate({ html, text })}
          placeholder="Key point…"
          onSlash={onSlash}
        />
      );

    case "formula":
      return (
        <textarea
          value={block.latex}
          onChange={(e) => onUpdate({ latex: e.target.value })}
          placeholder="LaTeX, e.g. x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
          rows={4}
          className={`${inputClass} font-mono resize-y`}
        />
      );

    case "resource":
      return <ResourceFields block={block} onUpdate={onUpdate} />;

    case "checklist":
      return <ChecklistFields block={block} onUpdate={onUpdate} />;

    case "link":
      return (
        <div className="space-y-2">
          <input
            value={block.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Link label"
            className={`${inputClass} font-medium`}
          />
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://…"
            className={inputClass}
          />
          <input
            value={block.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Description (optional)"
            className={inputClass}
          />
        </div>
      );

    case "divider":
      return <p className="text-sm text-arc-slate-500">A horizontal divider. No settings.</p>;

    case "question":
      return (
        <QuestionBlockFields block={block} onUpdate={onUpdate} />
      );

    default:
      return null;
  }
}

function QuestionBlockFields({
  block,
  onUpdate,
}: {
  block: LessonBlock & { type: "question"; questionId?: string; points?: number; required?: boolean; showFeedback?: boolean };
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [linkedQuestion, setLinkedQuestion] = useState<any>(null);

  // Fetch linked question info
  useState(() => {
    if (block.questionId) {
      setIsLoading(true);
      questionsApi.getById(block.questionId)
        .then((q: any) => setLinkedQuestion(q))
        .catch(() => setLinkedQuestion(null))
        .finally(() => setIsLoading(false));
    }
  });

  if (!block.questionId) {
    return (
      <div className="space-y-2">
        <div className="p-4 rounded-lg border border-dashed border-arc-slate-300 bg-arc-slate-50 text-center">
          <HelpCircle className="h-8 w-8 text-arc-slate-400 mx-auto mb-2" />
          <p className="text-sm text-arc-slate-500 mb-2">No question linked</p>
          <p className="text-xs text-arc-slate-400">Use the block picker to select a question</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Linked Question Info */}
      <div className="p-3 rounded-lg border border-arc-slate-200 bg-arc-slate-50">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">Linked Question</Badge>
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin text-arc-slate-400" />
          ) : (
            <a
              href={`/admin/questions/${block.questionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-arc-orange-600 hover:underline flex items-center gap-1"
            >
              View in Bank <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {linkedQuestion ? (
          <>
            <p className="text-sm text-arc-navy-900 line-clamp-2">{linkedQuestion.text}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{linkedQuestion.type?.replace(/_/g, " ")}</Badge>
              {linkedQuestion.difficulty && (
                <Badge
                  className={`text-xs ${
                    linkedQuestion.difficulty === "EASY"
                      ? "bg-green-100 text-green-700"
                      : linkedQuestion.difficulty === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {linkedQuestion.difficulty}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-arc-slate-500">Question #{block.questionId}</p>
        )}
      </div>

      {/* Points */}
      <div>
        <label className="block text-xs font-medium text-arc-slate-600 mb-1">Points</label>
        <input
          type="number"
          value={block.points || 1}
          onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
          min={1}
          max={100}
          className={inputClass}
        />
      </div>

      {/* Required Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-arc-slate-600">Required</label>
        <button
          type="button"
          onClick={() => onUpdate({ required: !block.required })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            block.required ? "bg-arc-orange-500" : "bg-arc-slate-200"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              block.required ? "translate-x-4.5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Show Feedback Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-arc-slate-600">Show Feedback</label>
        <button
          type="button"
          onClick={() => onUpdate({ showFeedback: !block.showFeedback })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            block.showFeedback !== false ? "bg-arc-orange-500" : "bg-arc-slate-200"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              block.showFeedback !== false ? "translate-x-4.5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Change Question Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          // Emit event to open question picker
          window.dispatchEvent(new CustomEvent("openQuestionPicker", { detail: { blockId: block.id } }));
        }}
      >
        Change Question
      </Button>
    </div>
  );
}

function UploadButton({
  uploading,
  accept,
  onFile,
}: {
  uploading: boolean;
  accept: string;
  onFile: (file: File | null | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm text-arc-slate-600 hover:border-arc-orange-300 whitespace-nowrap disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading" : "Upload"}
      </button>
    </>
  );
}

function ImageFields({
  block,
  onUpdate,
}: {
  block: Extract<LessonBlock, { type: "image" }>;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const payload = await prepareImageForUpload(file);
      const res = (await mediaApi.upload(payload)) as { url: string };
      onUpdate({ url: res.url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Image URL, or upload →"
          className={inputClass}
        />
        <UploadButton uploading={uploading} accept="image/*" onFile={handleFile} />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input
        value={block.alt || ""}
        onChange={(e) => onUpdate({ alt: e.target.value })}
        placeholder="Alt text (accessibility)"
        className={inputClass}
      />
      <input
        value={block.caption || ""}
        onChange={(e) => onUpdate({ caption: e.target.value })}
        placeholder="Caption (optional)"
        className={inputClass}
      />
      {block.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.url} alt={block.alt || ""} className="max-h-40 w-full object-contain rounded border border-arc-slate-200" />
      )}
    </div>
  );
}

function ResourceFields({
  block,
  onUpdate,
}: {
  block: Extract<LessonBlock, { type: "resource" }>;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const payload = await fileToUploadPayload(file);
      const res = (await mediaApi.upload(payload)) as { url: string };
      onUpdate({ url: res.url, name: block.name || file.name });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={block.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="File name (e.g. Worksheet.pdf)"
          className={inputClass}
        />
        <UploadButton uploading={uploading} accept=".pdf,image/*" onFile={handleFile} />
      </div>
      <input
        value={block.url}
        onChange={(e) => onUpdate({ url: e.target.value })}
        placeholder="File URL"
        className={inputClass}
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

function ChecklistFields({
  block,
  onUpdate,
}: {
  block: Extract<LessonBlock, { type: "checklist" }>;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const items = block.items;
  const setItems = (next: { id: string; text: string }[]) => onUpdate({ items: next });

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <input
            value={it.text}
            onChange={(e) =>
              setItems(items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))
            }
            placeholder={`Item ${i + 1}`}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((x) => x.id !== it.id))}
            title="Remove item"
            className="p-1.5 rounded hover:bg-red-50 text-red-400 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { id: generateBlockId(), text: "" }])}
        className="flex items-center gap-1.5 text-sm text-arc-slate-600 hover:text-arc-orange-600"
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    </div>
  );
}

export default BlockFields;
