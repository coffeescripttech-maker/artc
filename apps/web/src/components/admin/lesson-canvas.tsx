"use client";

import { useState } from "react";
import { cn } from "@aratc/ui";
import {
  GripVertical,
  MoreVertical,
  Copy,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  Heading,
  BookOpen,
  Info,
} from "lucide-react";
import { type LessonBlock, type BlockType, BLOCK_LABELS } from "@aratc/shared";
import { DraggableList, type DraggableItem } from "./draggable-list";
import { LessonBlockRenderer } from "@/components/lesson/block-renderer";

const TEXT_FAMILY: BlockType[] = ["paragraph", "heading", "example", "callout"];
const convertIcons: Partial<Record<BlockType, React.ElementType>> = {
  paragraph: Type,
  heading: Heading,
  example: BookOpen,
  callout: Info,
};

interface LessonCanvasProps {
  blocks: LessonBlock[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (blocks: LessonBlock[]) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string, toType: BlockType) => void;
}

/**
 * The lesson canvas. Blocks render like real content; hovering reveals a drag
 * handle + a ⋯ menu, and clicking a block selects it (the right Properties panel
 * then edits it). Rendered content is non-interactive so clicks always select.
 */
export function LessonCanvas({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onDuplicate,
  onMove,
  onDelete,
  onConvert,
}: LessonCanvasProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-arc-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-arc-slate-500">
          Your lesson is empty. Add content from the Block Library on the left.
        </p>
      </div>
    );
  }

  const items: DraggableItem[] = blocks.map((b) => ({ id: b.id, title: BLOCK_LABELS[b.type] }));

  const handleReorder = (reordered: DraggableItem[]) => {
    const map = new Map(blocks.map((b) => [b.id, b]));
    onReorder(reordered.map((i) => map.get(i.id)).filter((b): b is LessonBlock => !!b));
  };

  return (
    <div onClick={() => onSelect(null)}>
      <DraggableList
        items={items}
        onReorder={handleReorder}
        renderItem={(item, dragHandleProps) => {
          const index = blocks.findIndex((b) => b.id === item.id);
          const block = blocks[index];
          if (!block) return null;
          const selected = block.id === selectedId;
          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
              }}
              className={cn(
                "group relative rounded-lg px-4 py-3 cursor-pointer transition-all",
                selected
                  ? "bg-white ring-2 ring-arc-orange-400 shadow-sm"
                  : "hover:bg-white hover:ring-1 hover:ring-arc-slate-200"
              )}
            >
              {/* Hover / selected controls */}
              <div
                className={cn(
                  "absolute right-2 top-2 z-10 flex items-center gap-1 transition-opacity",
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <button
                  {...dragHandleProps}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                  className="p-1 rounded bg-white border border-arc-slate-200 text-arc-slate-400 hover:text-arc-slate-600 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <BlockMenu
                  block={block}
                  index={index}
                  total={blocks.length}
                  onDuplicate={() => onDuplicate(block.id)}
                  onMove={(dir) => onMove(block.id, dir)}
                  onDelete={() => onDelete(block.id)}
                  onConvert={(t) => onConvert(block.id, t)}
                />
              </div>

              {/* Rendered content (non-interactive in the editor) */}
              <div className="pointer-events-none select-none">
                <LessonBlockRenderer content={[block]} />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function BlockMenu({
  block,
  index,
  total,
  onDuplicate,
  onMove,
  onDelete,
  onConvert,
}: {
  block: LessonBlock;
  index: number;
  total: number;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onConvert: (t: BlockType) => void;
}) {
  const [open, setOpen] = useState(false);
  const canConvert = TEXT_FAMILY.includes(block.type);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="More"
        className="p-1 rounded bg-white border border-arc-slate-200 text-arc-slate-500 hover:text-arc-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          {/* click-away layer */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-arc-slate-200 bg-white shadow-lg py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={Copy} label="Duplicate" onClick={() => { onDuplicate(); setOpen(false); }} />
            <MenuItem
              icon={ChevronUp}
              label="Move up"
              disabled={index === 0}
              onClick={() => { onMove(-1); setOpen(false); }}
            />
            <MenuItem
              icon={ChevronDown}
              label="Move down"
              disabled={index === total - 1}
              onClick={() => { onMove(1); setOpen(false); }}
            />
            {canConvert && (
              <>
                <div className="my-1 border-t border-arc-slate-100" />
                <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-arc-slate-400">
                  Convert to
                </div>
                {TEXT_FAMILY.filter((t) => t !== block.type).map((t) => (
                  <MenuItem
                    key={t}
                    icon={convertIcons[t]}
                    label={BLOCK_LABELS[t]}
                    onClick={() => { onConvert(t); setOpen(false); }}
                  />
                ))}
              </>
            )}
            <div className="my-1 border-t border-arc-slate-100" />
            <MenuItem icon={Trash2} label="Delete" danger onClick={() => { onDelete(); setOpen(false); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left disabled:opacity-40",
        danger ? "text-red-600 hover:bg-red-50" : "text-arc-slate-700 hover:bg-arc-slate-50"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

export default LessonCanvas;
