/**
 * Server-side PDF page rendering for image-based questions.
 *
 * Renders individual PDF pages to PNG buffers using `pdfjs-dist` (legacy
 * Node build). The pdfjs worker is configured via
 * `GlobalWorkerOptions.workerSrc` (a file:// URL so Node's ESM loader
 * accepts it on Windows), and the `Worker` global is populated from
 * `worker_threads` so pdfjs can instantiate it.
 *
 * Canvas rendering is provided by the `canvas@3` package (installed as a
 * dependency). `canvas@3` exports `createCanvas`, `DOMMatrix`, and
 * `ImageData` — all of which pdfjs needs as globals in a Node environment.
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import { Worker } from "worker_threads";
import { Buffer } from "buffer";

// CommonJS require for resolving the worker module path under ESM.
const requireLocal = createRequire(import.meta.url);

// Polyfill global canvas constructors that pdfjs expects in a Node
// environment.  `canvas@3` exports these, but pdfjs checks `globalThis`
// directly so we must hoist them there.
let canvasModule: any = null;
let globalsInjected = false;
async function injectCanvasGlobals(): Promise<void> {
  if (globalsInjected) return;

  const g = globalThis as any;

  // NOTE: We do NOT set globalThis.Worker here because the worker_threads.Worker
  // resolves modules from the pnpm store, causing a version mismatch with the
  // main pdfjs import (6.2.108 vs 6.1.200). Instead, we disable workers entirely
  // in getPdfjs() below and render synchronously.

  // canvas@3 provides createCanvas, DOMMatrix, ImageData, Image, and 2D
  // rendering context — pdfjs checks for them globally when running in Node.
  canvasModule = await import("canvas");

  if (typeof g.DOMMatrix === "undefined" && canvasModule.DOMMatrix) {
    g.DOMMatrix = canvasModule.DOMMatrix;
  }
  if (typeof g.ImageData === "undefined" && canvasModule.ImageData) {
    g.ImageData = canvasModule.ImageData;
  }
  // pdfjs needs Image available as a global for rendering.
  if (typeof g.Image === "undefined" && canvasModule.Image) {
    g.Image = canvasModule.Image;
  }
  // pdfjs legacy build uses CanvasRenderingContext2D and HTMLCanvasElement.
  if (typeof g.HTMLCanvasElement === "undefined" && canvasModule.createCanvas) {
    g.HTMLCanvasElement = canvasModule.createCanvas(1, 1).constructor;
  }

  if (typeof g.navigator === "undefined") {
    g.navigator = {
      language: "en-US",
      platform: "node",
      userAgent: "Node.js/pdf-render",
    };
  }

  globalsInjected = true;
}

// --- pdfjs singleton -------------------------------------------------------

let pdfjs: any = null;
let workerStarted = false;

/**
 * Lazily imports pdfjs-dist (legacy Node build) and configures the worker.
 *
 * We explicitly disable the pdfjs worker (set workerSrc to empty string)
 * because in the tsx runtime environment there is a version mismatch
 * issue when the worker thread loads pdfjs-dist from a different resolution
 * path. Synchronous rendering in the main thread is fine for our use case.
 */
export async function getPdfjs(): Promise<any> {
  if (pdfjs) return pdfjs;

  await injectCanvasGlobals();

  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs = mod;

  // Disable the worker entirely — prevents "API version does not match
  // Worker version" errors in the tsx/pnpm environment.
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  return pdfjs;
}

/**
 * Renders a single PDF page (1-indexed) to a PNG buffer.
 *
 * @param pdfBuffer  Raw PDF file bytes (Buffer or Uint8Array).
 * @param pageNumber 1-indexed page number.
 * @param scale      Render scale (2 = 2x → good for hiDPI display).
 * @returns PNG buffer, or `null` if the page can't be read.
 */
export async function renderPdfPage(
  pdfBuffer: Buffer | Uint8Array,
  pageNumber: number,
  scale = 2
): Promise<Buffer | null> {
  if (process.env.DEBUG_PDF === "1") {
    console.log(`[pdf-render] renderPdfPage called: page=${pageNumber}, scale=${scale}`);
  }
  const pdfjs = await getPdfjs();
  if (process.env.DEBUG_PDF === "1") {
    console.log(`[pdf-render] pdfjs loaded, canvasModule:`, canvasModule ? "yes" : "no");
  }

  // pdfjs expects a Uint8Array for the `data` option.
  const uint8 = Buffer.isBuffer(pdfBuffer) ? new Uint8Array(pdfBuffer) : pdfBuffer;

  // Disable the worker to avoid version mismatch issues in the tsx environment.
  // pdfjs will render synchronously in the main thread — fine for server-side use.
  let doc: any;
  try {
    const loadingTask = pdfjs.getDocument({ data: uint8, disableWorker: true });
    doc = await loadingTask.promise;
  } catch (err: any) {
    console.error(`[pdf-render] Failed to load PDF for page ${pageNumber}:`, err?.message || err);
    return null;
  }

  if (pageNumber < 1 || pageNumber > doc.numPages) {
    console.warn(`[pdf-render] Page ${pageNumber} out of range (1..${doc.numPages}).`);
    return null;
  }

  const page: any = await doc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);

  // Ensure canvas module is loaded (injectCanvasGlobals sets it).
  if (!canvasModule) {
    if (process.env.DEBUG_PDF === "1") {
      console.log("[pdf-render] canvasModule is null, loading now...");
    }
    try {
      canvasModule = await import("canvas");
    } catch (e: any) {
      console.error("[pdf-render] Failed to import canvas:", e?.message || e);
      return null;
    }
  }

  const canvas = canvasModule!.createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("[pdf-render] Failed to get 2D canvas context.");
    return null;
  }

  try {
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: canvas,
    }).promise;
  } catch (err: any) {
    console.error(`[pdf-render] Failed to render page ${pageNumber}:`, err?.message || err);
    return null;
  }

  return canvas.toBuffer("image/png");
}

/**
 * Returns the total number of pages in the PDF. Returns 0 on failure.
 */
export async function getPdfPageCount(pdfBuffer: Buffer | Uint8Array): Promise<number> {
  const pdfjs = await getPdfjs();

  const uint8 = Buffer.isBuffer(pdfBuffer) ? new Uint8Array(pdfBuffer) : pdfBuffer;

  try {
    const loadingTask = pdfjs.getDocument({ data: uint8, disableWorker: true });
    const doc = await loadingTask.promise;
    return doc.numPages;
  } catch (err: any) {
    console.error("[pdf-render] Failed to get page count:", err?.message || err);
    return 0;
  }
}

/**
 * Returns the version string of the loaded pdfjs-dist build.
 */
export async function getPdfjsVersion(): Promise<string> {
  const pdfjs = await getPdfjs();
  return pdfjs.version ?? "unknown";
}

/**
 * Renders a specific image region of a PDF page to a PNG buffer.
 *
 * Unlike `renderPdfPage` which renders the whole page, this function crops
 * to just the relevant portion — the bounding box of the image/diagrams
 * that Gemini identified for the question.
 *
 * @param pdfBuffer    Raw PDF file bytes (Buffer or Uint8Array).
 * @param pageNumber   1-indexed page number.
 * @param imageBox     Bounding box in percentages: { x, y, width, height }
 *                     (0-100 relative to full page dimensions).
 * @param scale        Render scale (2 = 2x → good for hiDPI display).
 * @returns PNG buffer of the cropped region, or `null` if it fails.
 */
export async function renderPdfImageRegion(
  pdfBuffer: Buffer | Uint8Array,
  pageNumber: number,
  imageBox: { x: number; y: number; width: number; height: number },
  scale = 2
): Promise<Buffer | null> {
  // Render the full page at higher resolution to preserve image quality when cropping.
  const fullPage = await renderPdfPage(pdfBuffer, pageNumber, scale);
  if (!fullPage) return null;

  // Load the canvas module to access the Image class for cropping.
  const { loadImage } = await import("canvas");

  try {
    const img = await loadImage(fullPage);
    const fullW = img.width;
    const fullH = img.height;

    // Convert percentage coordinates to pixel coordinates.
    const px = Math.round((imageBox.x / 100) * fullW);
    const py = Math.round((imageBox.y / 100) * fullH);
    const pw = Math.round((imageBox.width / 100) * fullW);
    const ph = Math.round((imageBox.height / 100) * fullH);

    // Add 10% padding on each side so the image region isn't cropped too tightly.
    const padX = Math.round((10 / 100) * fullW);
    const padY = Math.round((10 / 100) * fullH);
    const srcX = Math.max(0, px - padX / 2);
    const srcY = Math.max(0, py - padY / 2);
    const srcW = Math.min(fullW - srcX, pw + padX);
    const srcH = Math.min(fullH - srcY, ph + padY);

    // Ensure canvas module is loaded.
    if (!canvasModule) {
      canvasModule = await import("canvas");
    }
    const canvas = canvasModule.createCanvas(srcW, srcH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    return canvas.toBuffer("image/png");
  } catch (err: any) {
    console.error(
      `[pdf-render] Failed to crop image region from page ${pageNumber}:`,
      err?.message || err
    );
    return null;
  }
}
