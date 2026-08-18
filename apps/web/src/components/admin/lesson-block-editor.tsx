"use client";

import {
  Heading,
  Type,
  Image as ImageIcon,
  Video,
  BookOpen,
  Info,
  Sigma,
  Minus,
  Paperclip,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  type LessonBlock,
  type BlockType,
  BLOCK_LABELS,
  createBlock,
  resolveVideo,
} from "@aratc/shared";
import { DraggableList, type DraggableItem } from "./draggable-list";

interface LessonBlockEditorProps {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
}

// Block types offered in the "add" toolbar (question comes with the Question Bank).
const ADD_MENU: { type: BlockType; icon: React.ElementType }[] = [
  { type: "heading", icon: Heading },
  { type: "paragraph", icon: Type },
  { type: "image", icon: ImageIcon },
  { type: "video", icon: Video },
  { type: "example", icon: BookOpen },
  { type: "callout", icon: Info },
  { type: "formula", icon: Sigma },
  { type: "resource", icon: Paperclip },
  { type: "divider", icon: Minus },
];

const inputClass =
  "w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500";

export function LessonBlockEditor({ blocks, onChange }: LessonBlockEditorProps) {
  const addBlock = (type: BlockType) => onChange([...blocks, createBlock(type)]);

  const updateBlock = (id: string, patch: Record<string, unknown>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as LessonBlock) : b)));

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const items: DraggableItem[] = blocks.map((b) => ({ id: b.id, title: BLOCK_LABELS[b.type] }));

  const handleReorder = (reordered: DraggableItem[]) => {
    const map = new Map(blocks.map((b) => [b.id, b]));
    onChange(reordered.map((i) => map.get(i.id)).filter((b): b is LessonBlock => !!b));
  };

  return (
    <div className="space-y-4">
      {/* Add block toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-arc-slate-200 bg-arc-slate-50 p-2">
        <span className="text-xs font-medium text-arc-slate-500 px-1">Add block:</span>
        {ADD_MENU.map(({ type, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-arc-slate-200 bg-white text-xs font-medium text-arc-slate-600 hover:border-arc-orange-300 hover:text-arc-orange-600 transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-arc-slate-300 bg-white p-8 text-center">
          <Plus className="h-8 w-8 text-arc-slate-300 mx-auto mb-2" />
          <p className="text-sm text-arc-slate-500">
            Start building your lesson by adding a block above.
          </p>
        </div>
      ) : (
        <DraggableList
          items={items}
          onReorder={handleReorder}
          renderItem={(item, dragHandleProps) => {
            const index = blocks.findIndex((b) => b.id === item.id);
            const block = blocks[index];
            if (!block) return null;
            return (
              <BlockCard
                block={block}
                index={index}
                total={blocks.length}
                dragHandleProps={dragHandleProps}
                onUpdate={(patch) => updateBlock(block.id, patch)}
                onRemove={() => removeBlock(block.id)}
                onMove={(dir) => moveBlock(index, dir)}
              />
            );
          }}
        />
      )}
    </div>
  );
}

interface BlockCardProps {
  block: LessonBlock;
  index: number;
  total: number;
  dragHandleProps?: Record<string, unknown>;
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

function BlockCard({ block, index, total, dragHandleProps, onUpdate, onRemove, onMove }: BlockCardProps) {
  return (
    <div className="rounded-lg border border-arc-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <button
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 text-arc-slate-300 hover:text-arc-slate-500 mt-0.5"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-arc-slate-400">
              {BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-arc-slate-100 text-arc-slate-400 disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                className="p-1 rounded hover:bg-arc-slate-100 text-arc-slate-400 disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1 rounded hover:bg-red-50 text-red-400"
                title="Delete block"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <BlockFields block={block} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onUpdate,
}: {
  block: LessonBlock;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <select
            value={block.level}
            onChange={(e) => onUpdate({ level: Number(e.target.value) })}
            className="h-9 px-2 border border-arc-slate-200 rounded-lg text-sm bg-white"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
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
        <textarea
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Write the paragraph text..."
          rows={3}
          className={`${inputClass} resize-y`}
        />
      );

    case "image":
      return (
        <div className="space-y-2">
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="Image URL (https://...)"
            className={inputClass}
          />
          <div className="flex gap-2">
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
          </div>
          {block.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt={block.alt || ""}
              className="max-h-32 rounded border border-arc-slate-200"
            />
          )}
        </div>
      );

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
              Detected: {resolved.kind === "iframe" ? "embeddable player" : resolved.kind === "file" ? "direct video file" : "unknown"}
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
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Worked example / solution..."
            rows={3}
            className={`${inputClass} resize-y`}
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
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Callout message..."
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </div>
      );

    case "formula":
      return (
        <textarea
          value={block.latex}
          onChange={(e) => onUpdate({ latex: e.target.value })}
          placeholder="LaTeX, e.g. x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
          rows={2}
          className={`${inputClass} font-mono resize-y`}
        />
      );

    case "resource":
      return (
        <div className="flex gap-2">
          <input
            value={block.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="File name (e.g. Worksheet.pdf)"
            className={inputClass}
          />
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="File URL"
            className={inputClass}
          />
        </div>
      );

    case "divider":
      return <hr className="border-arc-slate-200" />;

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

export default LessonBlockEditor;
