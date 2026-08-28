export const config = {
  jwtSecret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  sessionSecret: process.env.SESSION_SECRET || "default-session-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  geminiApiKey:
    process.env.GEMINI_API_KEY || "AQ.Ab8RN6L-jHcOcPGEJ_vj0c_KsWxXqOrti8KNryX2njyuu0C_OQ",
  /** Gemini model for AI features — must support Structured Output (JSON mode). */
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  /** MinerU — optional high-fidelity PDF parsing workflow (utils/mineru.ts):
   *  layout-aware Markdown, OCR for scans, tables → HTML, formulas → LaTeX,
   *  figure extraction with captions. Opt-in: Smart/Budget work without it. */
  mineru: {
    enabled: process.env.MINERU_ENABLED === "true",
    /** Self-hosted mineru-api base URL (recommended transport). */
    apiUrl: process.env.MINERU_API_URL || "",
    /** Local CLI executable (fallback transport; `-p <in> -o <out>` appended). */
    cliCmd: process.env.MINERU_CLI_CMD || "mineru",
    /** Max wait for a MinerU parse (HTTP or CLI). */
    timeoutMs: Number(process.env.MINERU_TIMEOUT_MS || 300000),
  },
} as const;
