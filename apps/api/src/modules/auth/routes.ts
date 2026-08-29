import { Router, type IRouter } from "express";
import { register, login, me } from "./controller";
import { authenticate } from "../../middleware/auth";
import { createRateLimiter } from "../../lib/rate-limit";

const router: IRouter = Router();

/**
 * Abuse protection for credential endpoints (brute force / registration spam).
 * 50 attempts per 15 min per IP — generous for real users, hostile to scripts.
 * Swap the in-memory store for Redis when the API scales horizontally.
 */
const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyPrefix: "auth",
});

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", authenticate, me);

export { router as authRoutes };
