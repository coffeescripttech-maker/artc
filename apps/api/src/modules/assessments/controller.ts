import { Request, Response, NextFunction } from "express";
import { validateRequest, getAuthUserId } from "../../lib/validate";
import { canViewUnpublishedContent, getRequestRoles } from "../../lib/visibility";
import {
  canReadContent,
  hasPlatformAdminRole,
  assessmentListScope,
} from "../../lib/tenant-scope";
import { NotFoundError } from "../../lib/errors";
import {
  listAssessments,
  getAssessmentById,
  getAssessmentBySlug,
  createAssessment,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  deleteAssessment,
  addQuestion,
  removeQuestion,
  reorderQuestions,
  autoGenerateQuestions,
  startAttempt,
  saveAttemptAnswers,
  submitAttempt,
  getAssessmentStats,
  getMyAttempts,
  getRetryRecommendations,
  getAttemptWithAnswers,
} from "./service";
import { prisma } from "@aratc/database";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // CS#22.7 (C-2) — tenant scoping for the assessment list. The list route
    // stays public for the catalog, so the role/org signals are resolved the
    // same opportunistic way visibility.ts does (never granting access, only
    // narrowing scope). Authorization for single resources is unchanged.
    const roles = getRequestRoles(req);
    const isPlatformAdmin = hasPlatformAdminRole(roles);
    const privileged = canViewUnpublishedContent(req);
    const orgId = req.organizationId;

    let organizationScope: Record<string, unknown> | undefined = assessmentListScope(
      orgId,
      isPlatformAdmin
    );
    if (orgId && !isPlatformAdmin) {
      organizationScope = privileged
        ? // Org admins/teachers: their org's content in any lifecycle state,
          // plus the published platform catalog — but never platform DRAFTs
          // (e.g. the legacy CET_SIMULATION seeds) and never other tenants.
          { OR: [{ organizationId: orgId }, { organizationId: null, status: "PUBLISHED" }] }
        : // Students: their own organization's assessments ONLY. Platform-orphan
          // records (organizationId null) are admin-catalog content, not
          // student-facing, and other tenants are invisible by isolation.
          { organizationId: orgId };
    }

    const assessments = await listAssessments({
      programId: req.query.programId as string | undefined,
      type: req.query.type as string | undefined,
      // Non-privileged callers are pinned to published assessments,
      // regardless of any status filter they pass.
      status: privileged
        ? (req.query.status as string | undefined)
        : "PUBLISHED",
      organizationScope,
    });
    res.json(assessments);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await getAssessmentById(req.params.id);
    // Same read scope as programs (§44) — org-owned assessments stay in their
    // organization. Platform content (organizationId null) stays public.
    // getRequestRoles: public routes have no `authenticate`, and callers without
    // an x-organization-id header never pass through resolveOrgContext's role
    // assignment — so roles must be resolved from the Bearer token here
    // (super_admin has no memberships, hence never sends the header).
    if (!canReadContent(req.organizationId, getRequestRoles(req), assessment.organizationId)) {
      next(new NotFoundError("Assessment not found"));
      return;
    }
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await getAssessmentBySlug(req.params.slug);
    // Same read scope as by-id (§44) — org-owned assessments stay in their org.
    if (!canReadContent(req.organizationId, getRequestRoles(req), assessment.organizationId)) {
      next(new NotFoundError("Assessment not found"));
      return;
    }
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createAssessmentSchema } = await import("./schemas.js");
    const input = validateRequest(createAssessmentSchema, req.body);
    const assessment = await createAssessment(input);
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateAssessmentSchema } = await import("./schemas.js");
    const input = validateRequest(updateAssessmentSchema, req.body);
    const assessment = await updateAssessment(req.params.id, input);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function publish(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await publishAssessment(req.params.id);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function archive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await archiveAssessment(req.params.id);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteAssessment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Questions management
export async function addQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { addQuestionSchema } = await import("./schemas.js");
    const input = validateRequest(addQuestionSchema, req.body);
    const question = await addQuestion(req.params.id, input);
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
}

export async function removeQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await removeQuestion(req.params.id, req.params.questionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function reorder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      res.status(400).json({ error: "questionIds must be an array" });
      return;
    }
    const questions = await reorderQuestions(req.params.id, questionIds);
    res.json(questions);
  } catch (error) {
    next(error);
  }
}

export async function autoGenerate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { autoGenerateSchema } = await import("./schemas.js");
    const input = validateRequest(autoGenerateSchema, req.body);
    const questions = await autoGenerateQuestions(req.params.id, input);
    res.status(201).json(questions);
  } catch (error) {
    next(error);
  }
}

// Learner operations
export async function myAttempts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const attempts = await getMyAttempts(userId);
    res.json(attempts);
  } catch (error) {
    next(error);
  }
}

export async function start(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const result = await startAttempt(req.params.id, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function submit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: "answers must be an array" });
      return;
    }
    const attempt = await submitAttempt(req.params.attemptId, req.userId!, answers);
    res.json(attempt);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /assessments/attempts/:attemptId/answers — CS#22.8 incremental
 * autosave. Only the attempt owner may save, only while IN_PROGRESS; the
 * service upserts idempotently (one row per question per attempt).
 */
export async function saveAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const answers = (req.body?.answers ?? []) as {
      questionId: string;
      answer: unknown;
      timeSpentSeconds?: number;
    }[];
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: "answers must be an array" });
      return;
    }
    const result = await saveAttemptAnswers(req.params.attemptId, req.userId!, answers);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function stats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getAssessmentStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function recommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
    if (!learner) {
      res.status(401).json({ error: "No learner profile found" });
      return;
    }
    const result = await getRetryRecommendations(learner.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthUserId(req);
    const attempt = await getAttemptWithAnswers(req.params.attemptId, userId);
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }
    res.json(attempt);
  } catch (error) {
    next(error);
  }
}
