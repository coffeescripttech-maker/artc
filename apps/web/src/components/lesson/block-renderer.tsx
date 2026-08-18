"use client";

import { useState } from "react";
import {
  Play,
  FileText,
  Info,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  type LessonBlock,
  type LessonContent,
  resolveVideo,
} from "@aratc/shared";

/**
 * Read-only renderer for block-based lesson content.
 * Used by the admin editor preview and (later) the student lesson viewer.
 * Media is loaded lazily: images use native lazy loading, videos load only
 * after the student taps play.
 */
export function LessonBlockRenderer({
  content,
  className = "",
}: {
  content: LessonContent | LessonBlock[] | null | undefined;
  className?: string;
}) {
  const blocks = Array.isArray(content) ? content : content?.blocks;

  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-sm text-arc-slate-400 italic">Nothing to preview yet.</p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 3 ? (
        <h3 className="text-lg font-semibold text-arc-navy-900">
          {block.text || <span className="text-arc-slate-300">Heading</span>}
        </h3>
      ) : (
        <h2 className="text-xl font-bold text-arc-navy-900">
          {block.text || <span className="text-arc-slate-300">Heading</span>}
        </h2>
      );

    case "paragraph":
      return (
        <p className="text-arc-slate-700 leading-relaxed whitespace-pre-wrap">
          {block.text || <span className="text-arc-slate-300">Empty paragraph</span>}
        </p>
      );

    case "image":
      return block.url ? (
        <figure className="space-y-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || ""}
            loading="lazy"
            className="rounded-lg border border-arc-slate-200 max-w-full h-auto"
          />
          {block.caption && (
            <figcaption className="text-xs text-arc-slate-500 text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <EmptyMedia label="Image URL not set" />
      );

    case "video":
      return <VideoView block={block} />;

    case "example":
      return (
        <div className="rounded-lg border border-arc-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-2 bg-arc-slate-50 border-b border-arc-slate-200 text-sm font-semibold text-arc-navy-900">
            {block.title || "Example"}
          </div>
          <div className="p-4 text-arc-slate-700 whitespace-pre-wrap leading-relaxed">
            {block.text}
          </div>
        </div>
      );

    case "callout": {
      const variants = {
        info: { box: "bg-blue-50 border-blue-200 text-blue-800", Icon: Info },
        tip: { box: "bg-green-50 border-green-200 text-green-800", Icon: Lightbulb },
        warning: { box: "bg-yellow-50 border-yellow-200 text-yellow-800", Icon: AlertTriangle },
      };
      const { box, Icon } = variants[block.variant] || variants.info;
      return (
        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${box}`}>
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{block.text}</p>
        </div>
      );
    }

    case "formula":
      return (
        <div className="rounded-lg border border-arc-slate-200 bg-arc-slate-50 px-4 py-3 font-mono text-sm text-arc-navy-900 overflow-x-auto">
          {block.latex || <span className="text-arc-slate-300">LaTeX formula</span>}
        </div>
      );

    case "divider":
      return <hr className="border-arc-slate-200" />;

    case "resource":
      return block.url ? (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-arc-slate-200 bg-white px-4 py-3 hover:border-arc-orange-300 transition-colors"
        >
          <FileText className="h-5 w-5 text-arc-orange-500 flex-shrink-0" />
          <span className="text-sm font-medium text-arc-navy-900 flex-1 truncate">
            {block.name || block.url}
          </span>
          <ExternalLink className="h-4 w-4 text-arc-slate-400 flex-shrink-0" />
        </a>
      ) : (
        <EmptyMedia label="Resource URL not set" />
      );

    case "question":
      return (
        <div className="rounded-lg border border-dashed border-arc-slate-300 bg-arc-slate-50 px-4 py-3 text-sm text-arc-slate-500">
          Question block {block.questionId ? `(#${block.questionId})` : "(not linked)"} —
          interactive rendering arrives with the Question Bank.
        </div>
      );

    default:
      return null;
  }
}

function VideoView({ block }: { block: Extract<LessonBlock, { type: "video" }> }) {
  const [playing, setPlaying] = useState(false);
  const video = resolveVideo(block);

  if (video.kind === "empty") return <EmptyMedia label="Video URL not set" />;

  if (!playing) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-arc-navy-900 group"
        >
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={block.caption || "Video thumbnail"}
              loading="lazy"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-arc-navy-700 to-arc-navy-900" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-16 w-16 rounded-full bg-white/25 group-hover:bg-white/35 flex items-center justify-center transition-colors">
              <Play className="h-8 w-8 text-white" />
            </span>
          </span>
        </button>
        {block.caption && (
          <p className="text-xs text-arc-slate-500 text-center">{block.caption}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        {video.kind === "iframe" ? (
          <iframe
            src={`${video.embedUrl}?autoplay=1`}
            title={block.caption || "Video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={video.embedUrl} controls autoPlay className="w-full h-full" />
        )}
      </div>
      {block.caption && (
        <p className="text-xs text-arc-slate-500 text-center">{block.caption}</p>
      )}
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-arc-slate-300 bg-arc-slate-50 px-4 py-6 text-center text-sm text-arc-slate-400">
      {label}
    </div>
  );
}

export default LessonBlockRenderer;
