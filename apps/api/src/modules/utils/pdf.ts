import { extractText } from "unpdf";
import { getPdfjs } from "./pdf-render";

export interface PdfTextBlock {
  /** 0-indexed page number. */
  pageNumber: number;
  /** Bounding box as percentages of page width/height: {x, y, width, height}. */
  bbox: { x: number; y: number; width: number; height: number };
  /** The text content of this block. */
  text: string;
}

export interface PdfImageBlock {
  /** 0-indexed page number. */
  pageNumber: number;
  /** Stable id (e.g. "page3-image1") so the AI can reference images by id
   *  without ever computing coordinates itself. */
  id: string;
  /** Bounding box as percentages of page width/height. */
  bbox: { x: number; y: number; width: number; height: number };
  /** Image format detected from the XObject. */
  format: "jpeg" | "png" | "unknown";
}

export interface PdfParsedPage {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  textBlocks: PdfTextBlock[];
  images: PdfImageBlock[];
}

export interface PdfParsedDocument {
  totalPages: number;
  pages: PdfParsedPage[];
  /** Full text with pages merged (for AI prompt). */
  fullText: string;
}

/**
 * Extracts parsed PDF structure: text blocks with bounding boxes,
 * images with bounding boxes, and page dimensions. Uses pdfjs-dist.
 */
async function parsePdfStructure(fileBuffer: Buffer): Promise<PdfParsedDocument> {
  const pdfjs = await getPdfjs();

  const uint8 = Buffer.isBuffer(fileBuffer) ? new Uint8Array(fileBuffer) : fileBuffer;

  const loadingTask = pdfjs.getDocument({ data: uint8, disableWorker: true });
  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;
  const pages: PdfParsedPage[] = [];
  const fullTextParts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page: any = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // --- Text content with bounding boxes ---
    const textContent = await page.getTextContent({
      normalizeWhitespace: false,
      disableAutoScaling: false,
    });

    const textBlocks: PdfTextBlock[] = [];
    const itemTexts: string[] = [];

    for (const item of textContent.items) {
      const str: string = item.str;
      if (!str || !str.trim()) continue;

      const transform = pdfjs.Util.transform(
        pdfjs.Util.transform(
          pdfjs.Util.transform(viewport.transform, page.getAnnotations ? [] : []),
          item.transform
        )
      );

      const x = (item.transform[4] / pageWidth) * 100;
      const y = ((pageHeight - item.transform[5] - (item.height || 0)) / pageHeight) * 100;
      const width = ((item.width || 0) / pageWidth) * 100;
      const height = ((item.height || 0) / pageHeight) * 100;

      textBlocks.push({
        pageNumber: i - 1,
        bbox: { x, y, width, height },
        text: str,
      });
      itemTexts.push(str);
    }

    const pageText = itemTexts.join(" ");
    fullTextParts.push(pageText);

    // --- Images ---
    const images: PdfImageBlock[] = [];
    try {
      const annotations = await page.getAnnotations({ intent: "display" });
      for (const annot of annotations) {
        if (annot.subtype === "XObject" && annot.content) {
          const x = (annot.rect[0] / pageWidth) * 100;
          const y = ((pageHeight - annot.rect[3]) / pageHeight) * 100;
          const width = ((annot.rect[2] - annot.rect[0]) / pageWidth) * 100;
          const height = ((annot.rect[3] - annot.rect[1]) / pageHeight) * 100;
          images.push({
            pageNumber: i - 1,
            id: `page${i}-image${images.length + 1}`,
            bbox: { x, y, width, height },
            format: "jpeg",
          });
        }
      }
    } catch {
      // Annotation extraction can fail on some PDFs — that's OK.
    }

    pages.push({
      pageNumber: i - 1,
      width: pageWidth,
      height: pageHeight,
      text: pageText,
      textBlocks,
      images,
    });
  }

  return {
    totalPages,
    pages,
    fullText: fullTextParts.join("\n\n--- PAGE BREAK ---\n\n"),
  };
}

/**
 * Extracts text from a PDF Buffer using unpdf (fast, text-only, in-memory).
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    const result: any = await extractText(new Uint8Array(fileBuffer), {
      mergePages: true,
    });

    const text =
      typeof result === "string"
        ? result
        : typeof result?.text === "string"
          ? result.text
          : Array.isArray(result?.text)
            ? result.text.join("\n\n")
            : String(result ?? "");

    return text.trim();
  } catch (err) {
    throw new Error(
      `Could not read this PDF: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }
}

/**
 * Extracts parsed PDF structure including text blocks with bounding boxes
 * and image annotations. Falls back to text-only extraction on error.
 */
export async function extractPdfWithBlocks(fileBuffer: Buffer): Promise<PdfParsedDocument> {
  try {
    return await parsePdfStructure(fileBuffer);
  } catch (err) {
    // Fallback: text-only, no blocks/images.
    const text = await extractTextFromPdf(fileBuffer).catch(() => "");
    return {
      totalPages: 1,
      pages: [
        {
          pageNumber: 0,
          width: 0,
          height: 0,
          text,
          textBlocks: [],
          images: [],
        },
      ],
      fullText: text,
    };
  }
}

/**
 * Builds a structured prompt for Gemini that includes text blocks and image
 * bounding boxes alongside the raw text, so Gemini can produce precise
 * imageBox coordinates even without vision.
 */
export function buildStructuredPdfContext(doc: PdfParsedDocument): string {
  const lines: string[] = [];

  lines.push("=== PDF DOCUMENT STRUCTURE ===");
  lines.push(`Total pages: ${doc.totalPages}`);
  lines.push("");

  for (const page of doc.pages) {
    lines.push(
      `--- PAGE ${page.pageNumber + 1} (width=${page.width.toFixed(0)}, height=${page.height.toFixed(0)}) ---`
    );
    lines.push("");

    if (page.images.length > 0) {
      lines.push("IMAGES/FIGURES DETECTED:");
      for (const img of page.images) {
        lines.push(
          `  [IMAGE id="${img.id}"] x=${img.bbox.x.toFixed(1)}%, y=${img.bbox.y.toFixed(1)}%, ` +
            `width=${img.bbox.width.toFixed(1)}%, height=${img.bbox.height.toFixed(1)}%`
        );
      }
      lines.push("");
    }

    // Add text blocks with their positions for layout-aware parsing.
    if (page.textBlocks.length > 0) {
      lines.push("TEXT BLOCKS (with bounding boxes):");
      for (const block of page.textBlocks) {
        if (block.text.trim().length > 0) {
          lines.push(
            `  [x=${block.bbox.x.toFixed(1)}%, y=${block.bbox.y.toFixed(1)}%, ` +
              `w=${block.bbox.width.toFixed(1)}%, h=${block.bbox.height.toFixed(1)}%] ${block.text.trim()}`
          );
        }
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Detects pages that appear to be scanned images using a two-signal heuristic
 * to reduce false positives:
 *
 *   scannedCandidate = textChars < 20 AND page has a large image
 *
 * - Page with 8 chars + an image covering 94% of the page → VERY LIKELY scanned.
 * - Page with 12 chars and no large image → probably blank/decorative, NOT flagged.
 *
 * Budget (structured) mode cannot read scanned pages without vision/OCR, so
 * callers surface a warning. Returns 1-indexed page numbers.
 */
export function detectScannedPages(doc: PdfParsedDocument): number[] {
  return doc.pages
    .filter((p) => {
      const textChars = p.text.replace(/\s+/g, "").length;
      if (textChars >= 20) return false;
      // "Large image" = covers at least 50% of the page area.
      const hasLargeImage = p.images.some((img) => img.bbox.width * img.bbox.height >= 50);
      return hasLargeImage;
    })
    .map((p) => p.pageNumber + 1);
}
