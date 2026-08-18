import { z } from "zod";

/**
 * Block-based lesson content model.
 *
 * A lesson's `content` column stores a { version, blocks[] } envelope.
 * Blocks are lightweight and reference media by URL (never embed binaries),
 * so the same JSON powers the admin editor preview and the student renderer.
 */

export const LESSON_CONTENT_VERSION = 1;

export const BLOCK_TYPES = {
  HEADING: "heading",
  PARAGRAPH: "paragraph",
  IMAGE: "image",
  VIDEO: "video",
  EXAMPLE: "example",
  CALLOUT: "callout",
  FORMULA: "formula",
  DIVIDER: "divider",
  RESOURCE: "resource",
  QUESTION: "question",
} as const;

export type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES];

export const CALLOUT_VARIANTS = ["info", "tip", "warning"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const VIDEO_PROVIDERS = ["youtube", "vimeo", "url"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

// ---- Block interfaces -------------------------------------------------------

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
}
export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}
export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
}
export interface VideoBlock {
  id: string;
  type: "video";
  provider: VideoProvider;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}
export interface ExampleBlock {
  id: string;
  type: "example";
  title?: string;
  text: string;
}
export interface CalloutBlock {
  id: string;
  type: "callout";
  variant: CalloutVariant;
  text: string;
}
export interface FormulaBlock {
  id: string;
  type: "formula";
  latex: string;
}
export interface DividerBlock {
  id: string;
  type: "divider";
}
export interface ResourceBlock {
  id: string;
  type: "resource";
  url: string;
  name: string;
}
/** Question/practice blocks reference the question bank (resolved later). */
export interface QuestionBlock {
  id: string;
  type: "question";
  questionId: string;
}

export type LessonBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | VideoBlock
  | ExampleBlock
  | CalloutBlock
  | FormulaBlock
  | DividerBlock
  | ResourceBlock
  | QuestionBlock;

export interface LessonContent {
  version: number;
  blocks: LessonBlock[];
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Text",
  image: "Image",
  video: "Video",
  example: "Example",
  callout: "Callout",
  formula: "Formula",
  divider: "Divider",
  resource: "Resource",
  question: "Question",
};

// ---- Zod schema (canonical validation) --------------------------------------

const zId = z.string().min(1);

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: zId, type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]).default(2), text: z.string().default("") }),
  z.object({ id: zId, type: z.literal("paragraph"), text: z.string().default("") }),
  z.object({ id: zId, type: z.literal("image"), url: z.string().default(""), alt: z.string().optional(), caption: z.string().optional() }),
  z.object({ id: zId, type: z.literal("video"), provider: z.enum(VIDEO_PROVIDERS).default("url"), url: z.string().default(""), thumbnailUrl: z.string().optional(), caption: z.string().optional() }),
  z.object({ id: zId, type: z.literal("example"), title: z.string().optional(), text: z.string().default("") }),
  z.object({ id: zId, type: z.literal("callout"), variant: z.enum(CALLOUT_VARIANTS).default("info"), text: z.string().default("") }),
  z.object({ id: zId, type: z.literal("formula"), latex: z.string().default("") }),
  z.object({ id: zId, type: z.literal("divider") }),
  z.object({ id: zId, type: z.literal("resource"), url: z.string().default(""), name: z.string().default("") }),
  z.object({ id: zId, type: z.literal("question"), questionId: z.string().default("") }),
]);

export const lessonContentSchema = z.object({
  version: z.number().default(LESSON_CONTENT_VERSION),
  blocks: z.array(lessonBlockSchema).default([]),
});

// ---- Helpers ----------------------------------------------------------------

export function generateBlockId(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return "b_" + g.crypto.randomUUID().slice(0, 8);
  return "b_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyLessonContent(): LessonContent {
  return { version: LESSON_CONTENT_VERSION, blocks: [] };
}

export function createBlock(type: BlockType): LessonBlock {
  const id = generateBlockId();
  switch (type) {
    case "heading":
      return { id, type: "heading", level: 2, text: "" };
    case "paragraph":
      return { id, type: "paragraph", text: "" };
    case "image":
      return { id, type: "image", url: "", alt: "", caption: "" };
    case "video":
      return { id, type: "video", provider: "youtube", url: "", thumbnailUrl: "", caption: "" };
    case "example":
      return { id, type: "example", title: "", text: "" };
    case "callout":
      return { id, type: "callout", variant: "info", text: "" };
    case "formula":
      return { id, type: "formula", latex: "" };
    case "divider":
      return { id, type: "divider" };
    case "resource":
      return { id, type: "resource", url: "", name: "" };
    case "question":
      return { id, type: "question", questionId: "" };
    default:
      return { id, type: "paragraph", text: "" };
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeBlock(raw: unknown): LessonBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.type !== "string") return null;
  const id = typeof b.id === "string" && b.id ? b.id : generateBlockId();
  const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : v == null ? fallback : String(v));

  switch (b.type) {
    case "heading":
      return { id, type: "heading", level: b.level === 3 ? 3 : 2, text: str(b.text) };
    case "paragraph":
      return { id, type: "paragraph", text: str(b.text ?? b.markdown ?? b.html) };
    case "image":
      return { id, type: "image", url: str(b.url), alt: str(b.alt), caption: str(b.caption) };
    case "video":
      return {
        id,
        type: "video",
        provider: (VIDEO_PROVIDERS as readonly string[]).includes(str(b.provider)) ? (b.provider as VideoProvider) : "url",
        url: str(b.url),
        thumbnailUrl: str(b.thumbnailUrl),
        caption: str(b.caption),
      };
    case "example":
      return { id, type: "example", title: str(b.title), text: str(b.text ?? b.markdown) };
    case "callout":
      return {
        id,
        type: "callout",
        variant: (CALLOUT_VARIANTS as readonly string[]).includes(str(b.variant)) ? (b.variant as CalloutVariant) : "info",
        text: str(b.text ?? b.markdown),
      };
    case "formula":
      return { id, type: "formula", latex: str(b.latex) };
    case "divider":
      return { id, type: "divider" };
    case "resource":
      return { id, type: "resource", url: str(b.url), name: str(b.name) };
    case "question":
      return { id, type: "question", questionId: str(b.questionId) };
    default:
      return null;
  }
}

/**
 * Tolerant parser: accepts null, a JSON string (possibly double-encoded),
 * a legacy HTML/plain-text string, an array of blocks, or a { version, blocks }
 * object, and always returns a valid LessonContent.
 */
export function normalizeLessonContent(raw: unknown): LessonContent {
  if (raw == null) return emptyLessonContent();

  let value: unknown = raw;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return emptyLessonContent();
    try {
      value = JSON.parse(trimmed);
    } catch {
      // Legacy plain-text / HTML content becomes a single paragraph block.
      return { version: LESSON_CONTENT_VERSION, blocks: [{ id: generateBlockId(), type: "paragraph", text: stripHtml(trimmed) }] };
    }
  }

  if (Array.isArray(value)) {
    return { version: LESSON_CONTENT_VERSION, blocks: value.map(normalizeBlock).filter((b): b is LessonBlock => b !== null) };
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.blocks)) {
      return {
        version: typeof obj.version === "number" ? obj.version : LESSON_CONTENT_VERSION,
        blocks: obj.blocks.map(normalizeBlock).filter((b): b is LessonBlock => b !== null),
      };
    }
  }

  return emptyLessonContent();
}

// ---- Video helpers (shared by editor + renderer) ----------------------------

export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{6,})/);
  return m ? m[1] : null;
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export interface ResolvedVideo {
  kind: "iframe" | "file" | "empty";
  embedUrl: string;
  thumbnailUrl: string;
}

/** Derive an embeddable URL + thumbnail from a video block's url. */
export function resolveVideo(block: { provider?: string; url?: string; thumbnailUrl?: string }): ResolvedVideo {
  const url = (block.url || "").trim();
  if (!url) return { kind: "empty", embedUrl: "", thumbnailUrl: block.thumbnailUrl || "" };

  const yt = getYouTubeId(url);
  if (yt) {
    return {
      kind: "iframe",
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      thumbnailUrl: block.thumbnailUrl || `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vm = getVimeoId(url);
  if (vm) {
    return { kind: "iframe", embedUrl: `https://player.vimeo.com/video/${vm}`, thumbnailUrl: block.thumbnailUrl || "" };
  }

  return { kind: "file", embedUrl: url, thumbnailUrl: block.thumbnailUrl || "" };
}
