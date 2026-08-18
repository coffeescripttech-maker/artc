"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { BlockType } from "@aratc/shared";
import { BLOCK_GROUPS } from "./lesson-block-defs";

/**
 * Beautiful "Add content" grid, opened from the canvas "+ Add content" button
 * or a "/" slash command inside a text block.
 */
export function BlockPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: BlockType) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      // focus search shortly after mount
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-arc-navy-950/40 backdrop-blur-sm p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-arc-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-arc-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-arc-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content blocks..."
            className="flex-1 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-arc-slate-100 text-arc-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {BLOCK_GROUPS.map((group) => {
            const items = group.items.filter((it) => it.label.toLowerCase().includes(q));
            if (items.length === 0) return null;
            return (
              <div key={group.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-arc-slate-400 mb-2">
                  {group.title}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((it) => {
                    const Icon = it.icon;
                    const disabled = it.soon || !it.type;
                    return (
                      <button
                        key={it.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (it.type) {
                            onPick(it.type);
                            onClose();
                          }
                        }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          disabled
                            ? "border-arc-slate-100 text-arc-slate-300 cursor-not-allowed"
                            : "border-arc-slate-200 hover:border-arc-orange-300 hover:bg-arc-orange-50/40"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            disabled ? "bg-arc-slate-50" : "bg-arc-slate-100 text-arc-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-arc-navy-900">{it.label}</div>
                          {it.soon && <div className="text-[10px] text-arc-slate-400">Coming soon</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BlockPicker;
