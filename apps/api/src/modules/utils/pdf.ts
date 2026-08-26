import { extractText } from "unpdf";

/**
 * Extracts text from a PDF Buffer using unpdf.
 * Works entirely in memory — no temp files needed.
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    const result: any = await extractText(new Uint8Array(fileBuffer), {
      mergePages: true,
    });

    // mergePages: true → { totalPages, text: string }
    // (older versions / mergePages: false → text: string[])
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
      `Could not read this PDF: ${
        err instanceof Error ? err.message : "unknown error"
      }`
    );
  }
}
