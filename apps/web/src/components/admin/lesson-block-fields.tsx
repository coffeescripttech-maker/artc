"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { type LessonBlock, resolveVideo } from "@aratc/shared";
import { mediaApi } from "@/lib/api/client";
import { prepareImageForUpload, fileToUploadPayload } from "@/lib/image";
import { RichTextEditor } from "./rich-text-editor";

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

    case "divider":
      return <p className="text-sm text-arc-slate-500">A horizontal divider. No settings.</p>;

    case "question":
      return (
        <div className="text-sm text-arc-slate-500">
          Linked question {block.questionId ? `#${block.questionId}` : "(not set)"} — editing
          arrives with the Question Bank.
        </div>
      );

    default:
      return null;
  }
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

export default BlockFields;
