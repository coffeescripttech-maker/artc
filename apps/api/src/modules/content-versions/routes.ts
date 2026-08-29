import { Router, type Request, type Response, type NextFunction, type IRouter } from "express";
import { authenticate } from "../../middleware/auth";
import {
  draftController,
  publishController,
  rollbackController,
  listController,
} from "./service";

/**
 * Versioning API (CS#10b).
 *
 * All routes require an authenticated org-scoped session. Mutations
 * (draft/publish/rollback) additionally require the VERSION_ROLES set.
 *
 * Handlers are wrapped so sync throws AND async rejections both route to
 * the app-level errorHandler via next(err) — never an uncaught exception.
 */
const router: IRouter = Router({ mergeParams: true });

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

function wrap(fn: Handler): Handler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(authenticate);

router.post("/:resourceType/:resourceId/draft", wrap(draftController));
router.post("/:resourceType/:resourceId/publish", wrap(publishController));
router.post("/:resourceType/:resourceId/rollback/:version", wrap(rollbackController));
router.get("/:resourceType/:resourceId/versions", wrap(listController));

export default router;
