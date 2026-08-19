"use client";

import type { ElementType } from "react";
import { FileText, Lightbulb, Video, Sigma, ClipboardList, Repeat } from "lucide-react";
import { generateBlockId, type LessonBlock } from "@aratc/shared";

// --- block builders (fresh ids each call) ---
const heading = (text: string, level: 2 | 3 = 2): LessonBlock => ({ id: generateBlockId(), type: "heading", level, text });
const paragraph = (text = ""): LessonBlock => ({ id: generateBlockId(), type: "paragraph", text });
const example = (title: string, text = ""): LessonBlock => ({ id: generateBlockId(), type: "example", title, text });
const callout = (variant: "info" | "tip" | "warning", text: string): LessonBlock => ({ id: generateBlockId(), type: "callout", variant, text });
const formula = (latex = ""): LessonBlock => ({ id: generateBlockId(), type: "formula", latex });
const video = (): LessonBlock => ({ id: generateBlockId(), type: "video", provider: "youtube", url: "", thumbnailUrl: "", caption: "" });
const divider = (): LessonBlock => ({ id: generateBlockId(), type: "divider" });

export interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  icon: ElementType;
  build: () => LessonBlock[];
}

export const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    icon: FileText,
    build: () => [paragraph("")],
  },
  {
    id: "concept",
    name: "Concept Lesson",
    description: "Intro, explanation, example, takeaway",
    icon: Lightbulb,
    build: () => [
      heading("Introduction"),
      paragraph("What will students learn in this lesson?"),
      heading("Explanation"),
      paragraph("Explain the concept clearly…"),
      example("Example", "Show a worked example…"),
      callout("tip", "Key takeaway: …"),
    ],
  },
  {
    id: "video",
    name: "Video Lesson",
    description: "Video + summary + example",
    icon: Video,
    build: () => [
      heading("Watch"),
      video(),
      heading("Summary"),
      paragraph("Summarize the key points from the video…"),
      example("Example", "Apply what was shown…"),
    ],
  },
  {
    id: "math",
    name: "Mathematics",
    description: "Concept, formula, worked example",
    icon: Sigma,
    build: () => [
      heading("Concept"),
      paragraph("Introduce the idea…"),
      heading("Formula"),
      formula(""),
      example("Worked Example", "Step-by-step solution…"),
      callout("tip", "Remember: …"),
    ],
  },
  {
    id: "practice",
    name: "Practice Lesson",
    description: "Instructions + guided examples",
    icon: ClipboardList,
    build: () => [
      heading("Practice"),
      paragraph("Follow the instructions below…"),
      example("Guided Example", "Walk through one example…"),
      callout("info", "Try these on your own."),
    ],
  },
  {
    id: "review",
    name: "Review Lesson",
    description: "Recap the key points",
    icon: Repeat,
    build: () => [
      heading("Review"),
      callout("info", "Key points to remember:"),
      paragraph("Summarize the main ideas…"),
      divider(),
      paragraph("Common mistakes to avoid…"),
    ],
  },
];

/** Shown in the canvas when a lesson has no blocks yet. */
export function LessonTemplates({
  onApply,
  className = "",
}: {
  onApply: (blocks: LessonBlock[]) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-arc-navy-900 mb-1">Start your lesson</h2>
      <p className="text-sm text-arc-slate-500 mb-4">
        Pick a template to get a head start, or start blank and add blocks yourself.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {LESSON_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onApply(t.build())}
              className="flex items-start gap-3 rounded-xl border border-arc-slate-200 bg-white p-4 text-left hover:border-arc-orange-300 hover:bg-arc-orange-50/40 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-arc-slate-100 text-arc-slate-600 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-arc-navy-900">{t.name}</div>
                <div className="text-xs text-arc-slate-500">{t.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LessonTemplates;
