import { config } from "../../config";

/**
 * Core fetch to the Gemini generateContent endpoint. Shared by both the
 * plain-text and structured-output callers so error handling and
 * finish-reason logic stay in one place.
 */
async function requestGemini(
  documentText: string,
  prompt: string,
  generationConfig: Record<string, unknown>
): Promise<string> {
  if (!config.geminiApiKey) {
    throw new Error(
      "Gemini API key not configured. Set GEMINI_API_KEY in your environment."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  const fullPrompt = `${prompt}\n\n--- DOCUMENT TEXT BELOW ---\n${documentText}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
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
 * fast and the output budget fully dedicated to the response. */
function thinkingConfigFor(model: string): Record<string, unknown> | undefined {
  return model.startsWith("gemini-2.5")
    ? { thinkingConfig: { thinkingBudget: 0 } }
    : undefined;
}

/**
 * Calls the Gemini API with a text prompt and returns the raw text response.
 * Uses the modern generateContent API with a simple text-only request.
 */
export async function callGemini(
  documentText: string,
  prompt: string
): Promise<string> {
  return requestGemini(documentText, prompt, thinkingConfigFor(config.geminiModel));
}

/**
 * Calls Gemini with Structured Output enabled — responseMimeType set to
 * "application/json" plus an optional responseSchema. This guarantees a
 * JSON-shaped response at the API level instead of relying on prompt
 * instructions like "Return ONLY JSON", which the model may ignore.
 */
export async function callGeminiJson(
  documentText: string,
  prompt: string,
  responseSchema?: Record<string, unknown>
): Promise<string> {
  return requestGemini(documentText, prompt, {
    ...thinkingConfigFor(config.geminiModel),
    responseMimeType: "application/json",
    ...(responseSchema ? { responseSchema } : {}),
  });
}
