import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "./errors";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Deliberately dependency-free: sufficient for a single API process.
 * When the API is horizontally scaled (per target architecture §65),
 * swap the Map for Redis — the middleware contract stays identical.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed per window per client. */
  max: number;
  /** Distinguishes limiters that share an IP (e.g. "auth"). */
  keyPrefix?: string;
}

export interface RateLimiterMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
  /** Clears all buckets (used by tests). */
  reset: () => void;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiterMiddleware {
  const { windowMs, max, keyPrefix = "global" } = options;
  const buckets = new Map<string, Bucket>();

  // Periodically drop expired buckets so the map cannot grow unbounded.
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, Math.min(windowMs, 60_000));
  // Never keep the process alive just for the sweeper.
  sweeper.unref?.();

  const middleware = ((req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      next(new RateLimitError("Too many requests. Please try again later."));
      return;
    }

    next();
  }) as RateLimiterMiddleware;

  middleware.reset = () => buckets.clear();

  return middleware;
}