import { config } from "../../config";

/**
 * Inline-data requests must stay under ~20MB total. We cap the PDF we attach
 * at 15MB so there's headroom for the prompt + JSON output. Larger PDFs fall
 * back to text-only extraction (with a warning surfaced to the caller).
 */
const MAX_PDF_INLINE_BYTES = 15 * 1024 * 1024;

/**
 * Core fetch to the Gemini generateContent endpoint. Takes the raw `parts`
 * array so callers can attach either a single text part (plain prompt) or a
 * text part plus an inlineData part (the original PDF, for vision).
 */
async function requestGemini(
  parts: unknown[],
  generationConfig: Record<string, unknown>
): Promise<string> {
  if (!config.geminiApiKey) {
    throw new Error(
      "Gemini API key not configured. Set GEMINI_API_KEY in your environment."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 65536,
        ...generationConfig,
      },
    }),
  });

  if (!response.ok) {
    const errorBody: any = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error ${response.status}: ${
        errorBody?.error?.message || "Unknown error"
      }`
    );
  }

  const result: any = await response.json();

  const candidate = result?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const text = candidate?.content?.parts?.[0]?.text;

  // MAX_TOKENS means the JSON was truncated — useless for parsing. Catch it
  // explicitly with an actionable message.
  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      "The document is too long for the AI to process in one pass. Try a shorter PDF or split it into parts."
    );
  }

  if (!text) {
    if (finishReason && finishReason !== "STOP") {
      throw new Error(
        `The AI response ended early (${finishReason}). Please try again.`
      );
    }
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

/** Disable thinking for Gemini 2.5 models — keeps structured JSON extraction
 * fast and the output budget fully dedicated to the response. Returns {} on
 * other models so the spread is always a clean record. */
function thinkingConfigFor(model: string): Record<string, unknown> {
  return model.startsWith("gemini-2.5")
    ? { thinkingConfig: { thinkingBudget: 0 } }
    : {};
}

/**
 * Calls the Gemini API with a text prompt and returns the raw text response.
 */
export async function callGemini(
  documentText: string,
  prompt: string
): Promise<string> {
  return requestGemini(
    [{ text: `${prompt}\n\n--- DOCUMENT TEXT BELOW ---\n${documentText}` }],
    thinkingConfigFor(config.geminiModel)
  );
}

/**
 * Structured-output call (JSON mode). Optionally attaches the original PDF as
 * inline data so Gemini can read images, diagrams, graphs, tables, and
 * formulas that text extraction misses. Silently skips the attachment when the
 * PDF is too large for inline upload — callers surface a warning in that case.
 */
export async function callGeminiJson(
  documentText: string,
  prompt: string,
  responseSchema?: Record<string, unknown>,
  pdfBuffer?: Buffer
): Promise<string> {
  const parts: any[] = [];

  if (pdfBuffer && pdfBuffer.length > 0 && pdfBuffer.length <= MAX_PDF_INLINE_BYTES) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBuffer.toString("base64"),
      },
    });
  }

  parts.push({ text: `${prompt}\n\n--- DOCUMENT TEXT BELOW ---\n${documentText}` });

  return requestGemini(parts, {
    ...thinkingConfigFor(config.geminiModel),
    responseMimeType: "application/json",
    ...(responseSchema ? { responseSchema } : {}),
  });
}

/** Size ceiling (bytes) for attaching a PDF inline to a Gemini request. */
export function pdfInlineSizeLimit(): number {
  return MAX_PDF_INLINE_BYTES;
}
