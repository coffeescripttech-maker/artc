import { Router, type IRouter } from "express";
import { register, login, me } from "./controller";
import { authenticate } from "../../middleware/auth";

const router: IRouter = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

export { router as authRoutes };
