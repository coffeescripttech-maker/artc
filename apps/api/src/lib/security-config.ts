import type { Express } from "express";

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";

export const CORS_ORIGIN_LIST = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isInsecureSecret(v: string | undefined | null): boolean {
  return !v || v.length < 32 || /^(dev|test|change|secret|default|insecure)/i.test(v);
}

/** CS#24: refuse to boot in production with weak/missing secrets. */
export function assertProductionSecrets(): void {
  if (!IS_PRODUCTION) return;
  if (isInsecureSecret(process.env.JWT_SECRET)) {
    throw new Error("Refusing to start: JWT_SECRET must be a strong (32+ char) value in production");
  }
  if (isInsecureSecret(process.env.SESSION_SECRET)) {
    throw new Error("Refusing to start: SESSION_SECRET must be a strong (32+ char) value in production");
  }
  if (process.env.DEMO_PASSWORD) {
    throw new Error("Refusing to start: DEMO_PASSWORD must not be set in production (demo accounts are local-only)");
  }
}

/** CS#24: harden every API response (Helmet-equivalent headers, no new dependency). */
export function applyApiSecurity(app: Express): void {
  assertProductionSecrets();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });
}