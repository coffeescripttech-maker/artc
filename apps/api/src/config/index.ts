export const config = {
  jwtSecret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  sessionSecret: process.env.SESSION_SECRET || "default-session-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  /** Gemini model for AI features — must support Structured Output (JSON mode). */
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
} as const;
