export const config = {
  jwtSecret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  sessionSecret: process.env.SESSION_SECRET || "default-session-secret-change-in-production",
  nodeEnv: process.env.NODE_ENV || "development",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  geminiApiKey:
    process.env.GEMINI_API_KEY || "AQ.Ab8RN6JUjwNDwIeCC2dy0miFDShBeJ0a371Yz5loyig8V59UPA",
  /** Gemini model for AI features — must support Structured Output (JSON mode). */
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
} as const;
