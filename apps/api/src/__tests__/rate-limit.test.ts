import { describe, it, expect, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createRateLimiter } from "../lib/rate-limit";
import { errorHandler } from "../middleware/error-handler";

describe("createRateLimiter (in-memory fixed window)", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 3, keyPrefix: "test" });

  const app = express();
  app.use(limiter);
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);

  afterEach(() => {
    limiter.reset();
  });

  it("allows requests up to the limit and sets RateLimit headers", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/ping");
      expect(res.status).toBe(200);
      expect(res.headers["ratelimit-limit"]).toBe("3");
    }
  });

  it("returns 429 with Retry-After once the limit is exceeded", async () => {
    await request(app).get("/ping");
    await request(app).get("/ping");
    await request(app).get("/ping");

    const blocked = await request(app).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toMatch(/too many requests/i);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("serves again after the limiter is reset (new window)", async () => {
    limiter.reset();
    const res = await request(app).get("/ping");
    expect(res.status).toBe(200);
  });

  it("tracks clients independently (different IPs)", async () => {
    limiter.reset();
    // supertest binds 127.0.0.1; simulate a second client via X-Forwarded-For
    // by trusting the proxy layer.
    const proxied = express();
    proxied.set("trust proxy", true);
    proxied.use(createRateLimiter({ windowMs: 60_000, max: 1, keyPrefix: "px" }));
    proxied.get("/ping", (_req, res) => res.json({ ok: true }));

    const first = await request(proxied).get("/ping").set("X-Forwarded-For", "10.0.0.1");
    const second = await request(proxied).get("/ping").set("X-Forwarded-For", "10.0.0.2");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});