/**
 * MinerU adapter — high-fidelity LOCAL PDF parsing for the optional "MinerU"
 * question-import workflow (see question-import/service.ts).
 *
 * MinerU (https://github.com/opendatalab/MinerU) parses PDFs beyond plain
 * text extraction: layout-aware Markdown, OCR for scanned pages, tables →
 * HTML, formulas → LaTeX, and figure extraction with captions. Running it
 * locally means the downstream Gemini call can be TEXT ONLY (no vision, no
 * PDF upload) — the cheapest possible AI step with the best upstream
 * fidelity.
 *
 * Two transports, tried in order:
 *  1. HTTP — self-hosted `mineru-api` service (POST /file_parse). Recommended
 *     in production: one `pip install "mineru[core]"` box serves the whole
 *     API (`mineru-api --host 0.0.0.0 --port 8000`).
 *  2. CLI  — local `mineru -p <in.pdf> -o <out>` executable (slower; pulls
 *     models onto the API server, but fine for single-node dev).
 *
 * Output is normalized to one shape regardless of transport:
 *   { markdown, pages, transport, images: [{id, pageNumber, caption, bytes, bbox}], warnings }
 *
 * Image ids are stable and coordinate-free ("page3-image1") so the AI can
 * reference figures without ever computing bounding boxes — the backend owns
 * all geometry (percentages of page width/height), derived from MinerU's
 * middle.json when available. The Markdown is also relinked so MinerU's
 * hashed image filenames become the stable ids directly in the text.
 *
 * No new npm dependencies: the MinerU result ZIP is decoded with Node's zlib
 * and the content_list/middle.json shapes are parsed leniently.
 */

import { config } from "../../config";
import { existsSync } from "fs";
import { promises as fsp } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import zlib from "zlib";

const execFileAsync = promisify(execFile);

// ============================================================
// Public contract (consumed by question-import/service.ts)
// ============================================================

export interface MineruImage {
  /** Stable, coordinate-free id, e.g. "page3-image1" (page is 1-indexed). */
  id: string;
  /** 1-indexed page the figure appears on. */
  pageNumber: number;
  /** Figure caption when MinerU detected one. */
  caption?: string | null;
  /** Raw image bytes (jpeg/png) when available — saved directly for media. */
  bytes?: Buffer | null;
  /** Bounding box as percentages of the page (backend-owned geometry). */
  bbox?: { x: number; y: number; width: number; height: number } | null;
}

export interface MineruParseResult {
  /** Layout-aware Markdown of the whole document (image refs → stable ids). */
  markdown: string;
  /** Total pages parsed (best effort — inferred when MinerU omits it). */
  pages: number;
  /** Which transport produced this result ("http" | "cli"). */
  transport: string;
  images: MineruImage[];
  /** Soft, non-fatal issues surfaced to the admin review UI. */
  warnings: string[];
}

/** Hard ceiling for the AI context — a parsed doc above this must be split. */
const MAX_MARKDOWN_CHARS = 900_000;
/** Cap on indexed figures so the FIGURES INDEX stays prompt-friendly. */
const MAX_IMAGES = 400;

// ============================================================
// Availability + dispatch
// ============================================================

/** True when MinerU is enabled AND at least one transport is usable. */
export async function mineruAvailable(): Promise<boolean> {
  if (!config.mineru.enabled) return false;
  if (config.mineru.apiUrl) return true;
  return cliOnPath(config.mineru.cliCmd);
}

/**
 * PATH scan for the CLI — deliberately avoids executing it (MinerU's model
 * imports make even `--version` take many seconds).
 */
function cliOnPath(cmd: string): boolean {
  if (!cmd) return false;
  const dirs = (process.env.PATH || process.env.Path || "")
    .split(path.delimiter)
    .filter(Boolean);
  const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  return dirs.some((dir) =>
    exts.some((ext) => existsSync(path.join(dir, cmd + ext)))
  );
}

/**
 * Parses a PDF with MinerU via the first working transport. Transport
 * failures are collected so the thrown error tells the admin exactly what
 * was tried.
 */
export async function parsePdfWithMinerU(pdfBuffer: Buffer): Promise<MineruParseResult> {
  const errors: string[] = [];

  if (config.mineru.apiUrl) {
    try {
      return await parseViaHttp(pdfBuffer);
    } catch (err) {
      errors.push(`HTTP service (${config.mineru.apiUrl}): ${errorMessage(err)}`);
    }
  }

  if (cliOnPath(config.mineru.cliCmd)) {
    try {
      return await parseViaCli(pdfBuffer);
    } catch (err) {
      errors.push(`CLI (${config.mineru.cliCmd}): ${errorMessage(err)}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `All MinerU transports failed — ${errors.join(" | ")}`
      : "No MinerU transport configured (set MINERU_API_URL or install the mineru CLI)."
  );
}

function errorMessage(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 400);
}

// ============================================================
// Shared normalization — content_list + markdown + middle.json
// ============================================================

interface ContentListItem {
  type?: string;
  page_idx?: number;
  img_path?: string;
  img_caption?: string | string[];
  [key: string]: unknown;
}

function captionOf(item: ContentListItem): string | null {
  const raw = item.img_caption;
  if (!raw) return null;
  const text = Array.isArray(raw) ? raw.join(" ") : String(raw);
  return text.trim() || null;
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function basename(p: string): string {
  const norm = p.replace(/\\/g, "/");
  return norm.slice(norm.lastIndexOf("/") + 1);
}

/** Percent bboxes per 0-indexed page, derived from MinerU middle.json. */
function imageBboxesPerPage(
  middle: unknown
): Map<number, { x: number; y: number; width: number; height: number }[]> {
  const perPage = new Map<number, { x: number; y: number; width: number; height: number }[]>();
  const pages = (middle as any)?.pdf_info;
  if (!Array.isArray(pages)) return perPage;

  for (const page of pages) {
    const idx = Number(page?.page_idx ?? 0);
    const w = Number(page?.page_size?.width || 0);
    const h = Number(page?.page_size?.height || 0);
    if (!w || !h) continue;

    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    const blocks = [...(page?.para_blocks ?? []), ...(page?.preproc_blocks ?? [])];
    for (const b of blocks) {
      if (b?.type !== "image" || !Array.isArray(b?.bbox) || b.bbox.length < 4) continue;
      const [x0, y0, x1, y1] = b.bbox.map(Number);
      if (![x0, y0, x1, y1].every(Number.isFinite) || x1 <= x0 || y1 <= y0) continue;
      boxes.push({
        x: clampPercent((x0 / w) * 100),
        y: clampPercent((y0 / h) * 100),
        width: clampPercent(((x1 - x0) / w) * 100),
        height: clampPercent(((y1 - y0) / h) * 100),
      });
    }
    if (boxes.length > 0) perPage.set(idx, boxes);
  }
  return perPage;
}

// ============================================================
// Dependency-free ZIP decoding (Node zlib)
// ============================================================

interface ZipEntry {
  name: string;
  data: Buffer;
}

function isZip(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.readUInt32LE(0) === 0x04034b50;
}

/** Decodes stored/deflate entries from a ZIP local-header stream. */
function decodeZip(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;

    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);

    // Streaming writers (data descriptor, bit 3) leave sizes zero in the
    // local header — bail politely instead of decoding garbage.
    if ((flags & 0x8) !== 0 && compressedSize === 0) break;

    const name = buffer.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    let data: Buffer;
    if (method === 0) {
      data = Buffer.from(raw);
    } else if (method === 8) {
      data = zlib.inflateRawSync(raw);
    } else {
      throw new Error(`Unsupported ZIP compression method ${method} for "${name}".`);
    }

    if (!name.endsWith("/")) entries.push({ name, data });
    offset = dataStart + compressedSize;
  }

  return entries;
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ============================================================
// Transport 1 — self-hosted mineru-api HTTP service
// ============================================================

async function parseViaHttp(pdfBuffer: Buffer): Promise<MineruParseResult> {
  const base = config.mineru.apiUrl.replace(/\/+$/, "");
  const url = base.endsWith("/file_parse") ? base : `${base}/file_parse`;

  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
    "upload.pdf"
  );
  form.append("backend", "pipeline");
  form.append("parse_method", "auto");
  // MinerU 3.x field names (MinerU 2.x used `formulas`/`tables` instead):
  form.append("return_middle_json", "true");
  form.append("return_content_list", "true");
  form.append("return_images", "true");
  form.append("response_format_zip", "true");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.mineru.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form, signal: controller.signal });
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? `timed out after ${Math.round(config.mineru.timeoutMs / 1000)}s`
        : errorMessage(err);
    throw new Error(`request failed (${msg})`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const payload = Buffer.from(await response.arrayBuffer());

  // Preferred response: a ZIP of the parse outputs (md + images + jsons).
  if (isZip(payload)) return resultFromZip(payload, "http");

  // Otherwise a JSON document. MinerU 3.x may return an immediate task
  // envelope ({task_id, status_url, result_url}) — follow result_url to get
  // the real result, which can itself be a ZIP or a {results: {...}} doc.
  let json: any;
  try {
    json = JSON.parse(payload.toString("utf8"));
  } catch {
    throw new Error("unrecognized response (expected a ZIP or JSON document)");
  }

  json = await resolveTaskEnvelope(json, url, controller);

  // MinerU nests per-file outputs under results[file_name]; fallback to the
  // flat shape used by older/minimal builds.
  const file: any =
    json && typeof json === "object" && json.results && typeof json.results === "object"
      ? Object.values(json.results)[0]
      : json;
  const markdown: string | undefined =
    typeof file?.md_content === "string"
      ? file.md_content
      : typeof file?.markdown === "string"
        ? file.markdown
        : undefined;
  if (!markdown) throw new Error("JSON response contained no markdown content");

  const files = new Map<string, Buffer>();
  const rawImages = file?.images ?? json?.images;
  if (rawImages && typeof rawImages === "object") {
    for (const [name, b64] of Object.entries(rawImages)) {
      const data = Buffer.from(String(b64), "base64");
      if (data.length > 0) files.set(basename(name), data);
    }
  }

  return normalizeMineruResult({
    markdown,
    contentList: file?.content_list ?? file?.contentList ?? json?.content_list ?? null,
    middle: file?.middle_json ?? file?.middle ?? json?.middle_json ?? null,
    files,
    transport: "http",
    warnings: [],
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * If the /file_parse reply is a task envelope ({task_id, status_url, result_url})
 * instead of an immediate result, poll status then fetch the result_url.
 * Returns the resolved result document (or ZIP buffer already turned into a
 * MineruParseResult upstream when response_format_zip is honored).
 */
async function resolveTaskEnvelope(
  json: any,
  baseUrl: string,
  controller: AbortController
): Promise<any> {
  // Already a result document (md_content) or already the results wrapper.
  if (typeof json?.md_content === "string" || json?.results) return json;
  const taskId = json?.task_id;
  if (!taskId) return json;

  const base = baseUrl.replace(/\/+$/, "");
  const statusUrl = json?.status_url ?? `${base}/tasks/${taskId}`;
  const resultUrl = json?.result_url ?? `${base}/tasks/${taskId}/result`;

  // Poll until the task reaches a terminal state (with a 90s cap).
  for (let i = 0; i < 90; i++) {
    await delay(1000);
    let st: any = {};
    try {
      const r = await fetch(statusUrl, { signal: controller.signal });
      st = JSON.parse(await r.text());
    } catch {
      /* keep polling */
    }
    const status = typeof st === "string" ? st : st?.status;
    if (status === "completed" || status === "failed" || status === "canceled") break;
  }

  let r: Response;
  try {
    r = await fetch(resultUrl, { signal: controller.signal });
  } catch (err) {
    throw new Error(`fetching task result failed (${errorMessage(err)})`);
  }
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`task result fetch failed HTTP ${r.status}: ${body.slice(0, 200)}`);
  }
  const resultPayload = Buffer.from(await r.arrayBuffer());
  if (isZip(resultPayload)) return resultFromZip(resultPayload, "http");
  try {
    return JSON.parse(resultPayload.toString("utf8"));
  } catch {
    throw new Error("task result was neither a ZIP nor JSON");
  }
}

/** Builds the normalized result from a mineru output ZIP. */
function resultFromZip(zip: Buffer, transport: string): MineruParseResult {
  const entries = decodeZip(zip);
  const warnings: string[] = [];

  const mdEntry = entries.find(
    (e) => !e.name.startsWith("__MACOSX") && /\.md$/i.test(basename(e.name))
  );
  if (!mdEntry) throw new Error("parse output contained no Markdown file");

  const readJsonEntry = (suffix: RegExp): unknown => {
    const entry = entries.find((e) => suffix.test(basename(e.name)));
    if (!entry) return null;
    try {
      return JSON.parse(entry.data.toString("utf8"));
    } catch {
      return null;
    }
  };

  const contentList = readJsonEntry(/_content_list\.json$/i);
  if (contentList === null) {
    warnings.push("content_list.json missing/malformed — figure captions and page numbers degraded.");
  }
  const middle = readJsonEntry(/_middle\.json$/i);
  if (middle === null) {
    warnings.push("middle.json missing/malformed — figure bounding boxes unavailable.");
  }

  const files = new Map<string, Buffer>();
  for (const e of entries) {
    const base = basename(e.name);
    if (/\.(jpe?g|png|bmp|webp|gif)$/i.test(base)) files.set(base, e.data);
  }

  return normalizeMineruResult({
    markdown: mdEntry.data.toString("utf8"),
    contentList,
    middle,
    files,
    transport,
    warnings,
  });
}

// ============================================================
// Transport 2 — local mineru CLI executable
// ============================================================

async function parseViaCli(pdfBuffer: Buffer): Promise<MineruParseResult> {
  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), "mineru-"));
  const inputPath = path.join(workDir, "upload.pdf");
  const outputDir = path.join(workDir, "out");

  try {
    await fsp.writeFile(inputPath, pdfBuffer);

    try {
      await execFileAsync(config.mineru.cliCmd, ["-p", inputPath, "-o", outputDir], {
        timeout: config.mineru.timeoutMs,
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      });
    } catch (err) {
      throw new Error(`exit failed: ${errorMessage(err)}`);
    }

    // CLI nests results: <out>/<doc>/<method>/{file.md, images/, *.json}
    const all = await walkFiles(outputDir);
    const mdFiles = all.filter((p) => /\.md$/i.test(p));
    if (mdFiles.length === 0) throw new Error("no Markdown output produced");

    // Prefer the .md that sits beside a content_list.json.
    const md =
      mdFiles.find((p) =>
        all.some(
          (q) => path.dirname(q) === path.dirname(p) && /_content_list\.json$/i.test(q)
        )
      ) ?? mdFiles[0];

    const readJson = async (suffix: RegExp): Promise<unknown> => {
      const p = all.find((q) => suffix.test(q));
      if (!p) return null;
      try {
        return JSON.parse(await fsp.readFile(p, "utf8"));
      } catch {
        return null;
      }
    };

    const files = new Map<string, Buffer>();
    for (const p of all) {
      const base = basename(p);
      if (/\.(jpe?g|png|bmp|webp|gif)$/i.test(base)) {
        files.set(base, await fsp.readFile(p));
      }
    }

    return normalizeMineruResult({
      markdown: await fsp.readFile(md, "utf8"),
      contentList: await readJson(/_content_list\.json$/i),
      middle: await readJson(/_middle\.json$/i),
      files,
      transport: "cli",
      warnings: [],
    });
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let dirents;
    try {
      dirents = await fsp.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const d of dirents) {
      const full = path.join(cur, d.name);
      if (d.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

// ============================================================
// Shared normalization → MineruParseResult
// ============================================================

interface MineruRawParts {
  markdown: string;
  contentList: unknown;
  middle: unknown;
  /** basename → raw image bytes, from ZIP entries / CLI dir / JSON record. */
  files: Map<string, Buffer>;
  transport: string;
  warnings: string[];
}

/**
 * Normalizes any MinerU transport output into the single contract consumed
 * by question-import/service.ts:
 *  - figures get stable, coordinate-free ids ("page3-image1") in content_list
 *    order; bounding boxes (percentages) come from middle.json — never the AI
 *  - the Markdown is relinked so hashed filenames become the stable ids
 */
function normalizeMineruResult(parts: MineruRawParts): MineruParseResult {
  const warnings = [...parts.warnings];
  const bboxesByPage = imageBboxesPerPage(parts.middle);

  const images: MineruImage[] = [];
  const idByBasename = new Map<string, string>();
  const perPageCount = new Map<number, number>();

  const registerImage = (
    base: string,
    pageIdx: number,
    caption: string | null
  ): string | null => {
    const existing = idByBasename.get(base);
    if (existing) return existing;
    if (!base) return null;
    if (images.length >= MAX_IMAGES) {
      warnings.push(`Figure index capped at ${MAX_IMAGES} — extra figures were ignored.`);
      return null;
    }
    const n = (perPageCount.get(pageIdx) ?? 0) + 1;
    perPageCount.set(pageIdx, n);
    const id = `page${pageIdx + 1}-image${n}`;
    const bbox = (bboxesByPage.get(pageIdx) ?? [])[n - 1] ?? null;
    images.push({
      id,
      pageNumber: pageIdx + 1,
      caption,
      bytes: parts.files.get(base) ?? null,
      bbox,
    });
    idByBasename.set(base, id);
    return id;
  };

  // 1. content_list order is authoritative for figure numbering.
  const items: ContentListItem[] = Array.isArray(parts.contentList)
    ? (parts.contentList as ContentListItem[])
    : [];
  if (!Array.isArray(parts.contentList) && parts.contentList !== null) {
    warnings.push("Unexpected content_list shape — figure captions/pages degraded.");
  }
  for (const item of items) {
    if (item.type !== "image" || !item.img_path) continue;
    registerImage(
      basename(decodeURIComponentSafe(String(item.img_path))),
      Number(item.page_idx ?? 0),
      captionOf(item)
    );
  }

  // 2. Markdown image refs missing from content_list still resolve —
  //    registered with unknown page (idx 0 → "page1-imageN").
  const mdRefs = [...parts.markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) =>
    basename(decodeURIComponentSafe(m[1]))
  );
  for (const base of mdRefs) {
    if (idByBasename.has(base)) continue;
    const id = registerImage(base, 0, null);
    if (id) warnings.push(`Figure "${base}" had no page metadata — treated as page 1.`);
  }

  // 3. Relink the Markdown: hashed filenames → stable ids (encoded too).
  let markdown = parts.markdown;
  for (const [base, id] of idByBasename) {
    markdown = markdown.split(base).join(id);
    const encoded = encodeURIComponent(base);
    if (encoded !== base) markdown = markdown.split(encoded).join(id);
  }

  // 4. Page count — middle.json is authoritative, else best effort.
  const middlePages = (parts.middle as any)?.pdf_info;
  const pages =
    Array.isArray(middlePages) && middlePages.length > 0
      ? middlePages.length
      : images.length > 0
        ? Math.max(...images.map((i) => i.pageNumber))
        : 1;

  // 5. Context ceiling — an oversized document would hard-fail the AI step.
  if (markdown.length > MAX_MARKDOWN_CHARS) {
    warnings.push(
      `Parsed document exceeded ${MAX_MARKDOWN_CHARS} characters and was truncated for the AI step — consider splitting the PDF.`
    );
    markdown = `${markdown.slice(0, MAX_MARKDOWN_CHARS)}\n\n[DOCUMENT TRUNCATED — original length ${parts.markdown.length} characters]`;
  }

  return { markdown, pages, transport: parts.transport, images, warnings };
}
