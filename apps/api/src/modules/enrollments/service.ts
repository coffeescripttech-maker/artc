import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@aratc/database";
import { validateRequest } from "../../lib/validate";
import { NotFoundError, ForbiddenError } from "../../lib/errors";
import { createEnrollmentSchema, updateEnrollmentSchema } from "./schemas";
import { isActiveEnrollment } from "../../lib/program-access";
import { auditLog } from "../../lib/audit-log";

async function fireAudit(params: Parameters<typeof auditLog>[0]) {
  // Best-effort: a logging failure must never break the API response (principle 16).
  try {
    await auditLog(params);
  } catch {
    /* logger.warn("audit failed") — intentionally swallowed */
  }
}

/**
 * Enrollments module (CS#9).
 *
 * Admin-side enrollment management: list a program's learners, grant an
 * enrollment (source = ADMIN_GRANT, traceable to the granting admin), and
 * update status/expiry. Existing access semantics are preserved — this is
 * additive around the existing Enrollment table (architecture §19).
 */

// Enrollment management is an admin function. Teachers can view rosters for
// programs they teach (coarse role gate, same privileged set as visibility).
const ENROLLMENT_VIEW_ROLES = ["teacher", "school_admin", "content_admin", "super_admin"];
const ENROLLMENT_MANAGE_ROLES = ["school_admin", "content_admin", "super_admin"];

function requireRoles(req: Request, roles: string[]) {
  if (!req.userId) throw new ForbiddenError("Authentication required");
  if (!req.userRoles?.some((r) => roles.includes(r))) {
    throw new ForbiddenError("Insufficient permissions for enrollment management");
  }
}

const enrollmentInclude = {
  learner: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  enrolledBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.EnrollmentInclude;

function serializeEnrollment(e: {
  id: string;
  status: string;
  sourceType: string | null;
  expiresAt: Date | null;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  curriculumId: string | null;
  learner: {
    id: string;
    userId: string;
    user: { firstName: string; lastName: string; email: string } | null;
  };
  enrolledBy?: { id: string; firstName: string; lastName: string } | null;
}) {
  return {
    id: e.id,
    status: e.status,
    sourceType: e.sourceType,
    expiresAt: e.expiresAt,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    createdAt: e.createdAt,
    curriculumId: e.curriculumId,
    active: isActiveEnrollment(e),
    learner: {
      id: e.learner.id,
      userId: e.learner.userId,
      name:
        [e.learner.user?.firstName, e.learner.user?.lastName].filter(Boolean).join(" ") || null,
      email: e.learner.user?.email ?? null,
    },
    enrolledBy: e.enrolledBy
      ? {
          id: e.enrolledBy.id,
          name: [e.enrolledBy.firstName, e.enrolledBy.lastName].filter(Boolean).join(" "),
        }
      : null,
  };
}

export async function listProgramEnrollments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { programId } = req.params;
    requireRoles(req, ENROLLMENT_VIEW_ROLES);
    const enrollments = await prisma.enrollment.findMany({
      where: { programId },
      include: enrollmentInclude,
      orderBy: { createdAt: "desc" },
    });
    return res.json(enrollments.map(serializeEnrollment));
  } catch (e) {
    next(e);
  }
}
/**
 * Student-facing "my enrollments" (dashboard track).
 * Returns the caller's enrollments — including expired/ended ones — with the
 * program summary attached, so the learner dashboard can show status and
 * expiry. No role gate beyond authentication: learners see only their own rows.
 */
export async function listMyEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new ForbiddenError("Authentication required");
    const learner = await prisma.learnerProfile.findUnique({ where: { userId: req.userId } });
    if (!learner) return res.json([]);

    const enrollments = await prisma.enrollment.findMany({
      where: { learnerId: learner.id },
      include: {
        ...enrollmentInclude,
        program: { select: { id: true, name: true, slug: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(
      enrollments.map((e) => ({
        ...serializeEnrollment(e),
        program: e.program,
      })),
    );
  } catch (e) {
    next(e);
  }
}

export async function createEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    requireRoles(req, ENROLLMENT_MANAGE_ROLES);
    const data = validateRequest(createEnrollmentSchema, { ...req.params, ...req.body });

    // Resolve the learner profile: direct id, or via user id.
    let learnerId = data.learnerProfileId ?? null;
    if (!learnerId && data.userId) {
      const profile = await prisma.learnerProfile.findUnique({ where: { userId: data.userId } });
      if (!profile) throw new NotFoundError(`No learner profile for user ${data.userId}`);
      learnerId = profile.id;
    }
    if (!learnerId) {
      throw new NotFoundError("learnerProfileId or userId is required");
    }

    const learner = await prisma.learnerProfile.findUnique({ where: { id: learnerId } });
    if (!learner) throw new NotFoundError(`Learner profile ${learnerId} not found`);

    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      select: { id: true },
    });
        if (!program) throw new NotFoundError(`Program ${data.programId} not found`);

    // Capture pre-existing state for the audit 'before' snapshot (upsert path).
    const preExisting = await prisma.enrollment.findUnique({
      where: { learnerId_programId: { learnerId, programId: data.programId } },
    });

    const enrollment = await prisma.enrollment.upsert({
      where: { learnerId_programId: { learnerId, programId: data.programId } },
      create: {
        learnerId,
        programId: data.programId,
        curriculumId: data.curriculumId ?? null,
        status: "ACTIVE",
        sourceType: "ADMIN_GRANT",
        enrolledById: req.userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      // Re-granting revives an ended enrollment (unique constraint on pair).
      update: {
        status: "ACTIVE",
        endedAt: null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        sourceType: "ADMIN_GRANT",
        enrolledById: req.userId,
        ...(data.curriculumId ? { curriculumId: data.curriculumId } : {}),
      },
      include: enrollmentInclude,
    });

    void fireAudit({
      tenantId: req.organizationId ?? "platform",
      actorId: req.userId!,
      eventType: "ENROLLMENT_GRANTED",
      targetUserId: enrollment.learner.userId,
      targetResourceId: enrollment.id,
      actedOn: enrollment.learner.user
        ? `${enrollment.learner.user.firstName} ${enrollment.learner.user.lastName}`.trim()
        : enrollment.id,
            before: preExisting ? { status: preExisting.status, endedAt: preExisting.endedAt } : undefined,
      after: {
        status: enrollment.status,
        sourceType: enrollment.sourceType,
        expiresAt: enrollment.expiresAt?.toISOString() ?? null,
        curriculumId: enrollment.curriculumId,
      },
    });

    return res.status(201).json(serializeEnrollment(enrollment));
  } catch (e) {
    next(e);
  }
}

export async function updateEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    requireRoles(req, ENROLLMENT_MANAGE_ROLES);
    const data = validateRequest(updateEnrollmentSchema, { ...req.params, ...req.body });

    const existing = await prisma.enrollment.findUnique({ where: { id: data.id } });
    if (!existing) throw new NotFoundError(`Enrollment ${data.id} not found`);

    const terminating = data.status && data.status !== "ACTIVE";
        const enrollment = await prisma.enrollment.update({
      where: { id: data.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        // Ending an enrollment stamps endedAt; reactivating clears it.
        ...(terminating && !existing.endedAt ? { endedAt: new Date() } : {}),
        ...(data.status === "ACTIVE" ? { endedAt: null } : {}),
        ...(data.expiresAt !== undefined
          ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
          : {}),
      },
      include: enrollmentInclude,
    });

    if (terminating) {
      const eventType = existing.status === "ACTIVE" && !existing.endedAt
        ? data.expiresAt && new Date(data.expiresAt) < new Date()
          ? "ENROLLMENT_EXPIRED"
          : "ENROLLMENT_REVOKED"
        : "ENROLLMENT_REVOKED";
      void fireAudit({
        tenantId: req.organizationId ?? "platform",
        actorId: req.userId!,
        eventType,
        targetUserId: enrollment.learner.userId,
        targetResourceId: enrollment.id,
        actedOn: enrollment.learner.user
          ? `${enrollment.learner.user.firstName} ${enrollment.learner.user.lastName}`.trim()
          : enrollment.id,
        before: { status: existing.status, endedAt: existing.endedAt, expiresAt: existing.expiresAt?.toISOString() ?? null },
        after: { status: enrollment.status, endedAt: enrollment.endedAt?.toISOString() ?? null, expiresAt: enrollment.expiresAt?.toISOString() ?? null },
      });
    }

    return res.json(serializeEnrollment(enrollment));
  } catch (e) {
    next(e);
  }
}