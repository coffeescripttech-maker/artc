"use client";

import { Copy, Trash2 } from "lucide-react";
import { type LessonBlock, BLOCK_LABELS } from "@aratc/shared";
import { BlockFields } from "./lesson-block-fields";

/**
 * Right-hand contextual panel shown when a block is selected in the canvas.
 */
export function BlockProperties({
  block,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  block: LessonBlock;
  onUpdate: (patch: Record<string, unknown>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-arc-slate-400">
          {BLOCK_LABELS[block.type]} block
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate block"
            className="p-1.5 rounded hover:bg-arc-slate-100 text-arc-slate-500"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete block"
            className="p-1.5 rounded hover:bg-red-50 text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BlockFields block={block} onUpdate={onUpdate} />
    </div>
  );
}

export default BlockProperties;
