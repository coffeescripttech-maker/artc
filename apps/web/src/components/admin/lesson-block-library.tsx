"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { BlockType } from "@aratc/shared";
import { BLOCK_GROUPS } from "./lesson-block-defs";

/**
 * Left-hand block library for the lesson editor. Clicking a block appends it to
 * the canvas via onAdd. Interactive blocks are shown but disabled until the
 * Question Bank ships.
 */
export function BlockLibrary({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-arc-slate-400 mb-2">
          Content
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks..."
            className="w-full pl-8 pr-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
          />
        </div>
      </div>

      {BLOCK_GROUPS.map((group) => {
        const items = group.items.filter((it) => it.label.toLowerCase().includes(q));
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-arc-slate-400 mb-1.5">
              {group.title}
            </h4>
            <div className="space-y-1">
              {items.map((it) => {
                const Icon = it.icon;
                const disabled = it.soon || !it.type;
                return (
                  <button
                    key={it.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => it.type && onAdd(it.type)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm border transition-colors text-left ${
                      disabled
                        ? "border-transparent text-arc-slate-300 cursor-not-allowed"
                        : "border-arc-slate-200 bg-white text-arc-slate-700 hover:border-arc-orange-300 hover:text-arc-orange-600"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{it.label}</span>
                    {it.soon && (
                      <span className="text-[10px] font-medium text-arc-slate-400 bg-arc-slate-100 rounded px-1.5 py-0.5">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BlockLibrary;
