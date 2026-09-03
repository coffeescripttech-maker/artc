import type { Request, Response, NextFunction } from "express";
import { prisma } from "@aratc/database";
import { auditLog } from "../../../lib/audit-log";
import { ForbiddenError, NotFoundError } from "../../../lib/errors";
import { resetSchema } from "./schemas";
import { validateRequest } from "../../../lib/validate";

// === CS#26 - Superadmin Data Reset (full-platform + per-organization) ===
// Clean-slate testing / recovery tool. Only a real super_admin may execute;
// a typed literal confirmation ("RESET") is required; every reset is audited.
// Preserved across FULL reset: RBAC definitions, SiteSettings, super_admin users.

async function getSuperAdminIds(): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { role: { name: "super_admin" } },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

function assertSuperAdmin(
  actorId: string | undefined,
  admins: string[],
): asserts actorId is string {
  if (!actorId || !admins.includes(actorId)) {
    throw new ForbiddenError("Only a super admin can reset platform data");
  }
}

/** PREVIEW - live counts, zero mutation. `?orgId=` scopes to one organization. */
export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const admins = await getSuperAdminIds();
    assertSuperAdmin(req.userId, admins);

    const orgId =
      typeof req.query.orgId === "string" && req.query.orgId
        ? req.query.orgId
        : undefined;

    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true },
      });
      if (!org) throw new NotFoundError("Organization not found");
      const counts = {
        memberships: await prisma.organizationMembership.count({ where: { organizationId: orgId } }),
        learners: await prisma.learnerProfile.count({ where: { organizationId: orgId } }),
        enrollments: await prisma.enrollment.count({ where: { program: { organizationId: orgId } } }),
        programs: await prisma.program.count({ where: { organizationId: orgId } }),
        curriculums: await prisma.curriculum.count({ where: { organizationId: orgId } }),
        lessons: await prisma.lesson.count({ where: { organizationId: orgId } }),
        questions: await prisma.question.count({ where: { organizationId: orgId } }),
        assessments: await prisma.assessment.count({ where: { organizationId: orgId } }),
      };
      return res.json({ scope: "organization" as const, organizationId: orgId, organization: org, counts });
    }

    const counts = {
      organizations: await prisma.organization.count(),
      memberships: await prisma.organizationMembership.count(),
      learners: await prisma.learnerProfile.count(),
      enrollments: await prisma.enrollment.count(),
      programs: await prisma.program.count(),
      curriculums: await prisma.curriculum.count(),
      subjects: await prisma.subject.count(),
      modules: await prisma.module.count(),
      topics: await prisma.topic.count(),
      lessons: await prisma.lesson.count(),
      passages: await prisma.passage.count(),
      questions: await prisma.question.count(),
      assessments: await prisma.assessment.count(),
      attempts: await prisma.assessmentAttempt.count(),
      batches: await prisma.batch.count(),
      users: await prisma.user.count(),
      superUsers: await prisma.user.count({
        where: { roles: { some: { role: { name: "super_admin" } } } },
      }),
    };
    return res.json({ scope: "full" as const, counts });
  } catch (e) {
    next(e);
  }
}
/**
 * FULL RESET - wipes ALL tenant/academic data platform-wide in one transaction.
 * Preserved: super_admin accounts, RBAC definitions, site settings.
 * Body must contain the literal confirm: "RESET".
 */
export async function fullReset(req: Request, res: Response, next: NextFunction) {
  try {
    const admins = await getSuperAdminIds();
    assertSuperAdmin(req.userId, admins);
    validateRequest(resetSchema, req.body ?? {});

    const keep = admins;
    const counts = await prisma.$transaction([
      prisma.auditEvent.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.subscription.deleteMany({}),
      prisma.attemptAnswer.deleteMany({}),
      prisma.assessmentAttempt.deleteMany({}),
      prisma.assessmentQuestion.deleteMany({}),
      prisma.assessment.deleteMany({}),
      prisma.questionExposure.deleteMany({}),
      prisma.questionBankLink.deleteMany({}),
      prisma.question.deleteMany({}),
      prisma.passage.deleteMany({}),
      prisma.progress.deleteMany({}),
      prisma.lesson.deleteMany({}),
      prisma.topic.deleteMany({}),
      prisma.module.deleteMany({}),
      prisma.subject.deleteMany({}),
      prisma.programCet.deleteMany({}),
      prisma.examCoverage.deleteMany({}),
      prisma.cetProfile.deleteMany({}),
      prisma.cetExam.deleteMany({}),
      prisma.program.deleteMany({}),
      prisma.enrollment.deleteMany({}),
      prisma.batchMember.deleteMany({}),
      prisma.batchTeacher.deleteMany({}),
      prisma.batch.deleteMany({}),
      // CS#22.8: Legacy Test/TestQuestion/TestAttempt models were consolidated
      // into Assessment/AssessmentQuestion/AttemptAnswer — no separate cleanup needed.
      prisma.contentVersion.deleteMany({}),
      prisma.parentStudent.deleteMany({}),
      prisma.learnerProfile.deleteMany({}),
      prisma.organizationMembership.deleteMany({}),
      prisma.session.deleteMany({}),
      prisma.userRole.deleteMany({ where: { userId: { notIn: keep } } }),
      prisma.user.deleteMany({ where: { id: { notIn: keep } } }),
      prisma.organization.deleteMany({}),
    ]);

    await auditLog({
      tenantId: "platform",
      actorId: req.userId,
      eventType: "PLATFORM_RESET",
      actedOn: "platform",
      metadata: { mode: "full", preservedSuperAdmins: keep.length },
    });

    return res.json({ ok: true, mode: "full", deleted: counts });
  } catch (e) {
    next(e);
  }
}

/**
 * ORGANIZATION RESET - wipes one organization's academic + people data.
 * Platform/global content and other organizations are untouched.
 */
export async function orgReset(req: Request, res: Response, next: NextFunction) {
  try {
    const admins = await getSuperAdminIds();
    assertSuperAdmin(req.userId, admins);
    validateRequest(resetSchema, req.body ?? {});

    const orgId = req.params.orgId;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    if (!org) throw new NotFoundError("Organization not found");

    // gather org-scoped ID sets (subjects hang off curricula via CurriculumItem)
    const programs = await prisma.program.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const pids = programs.map((p) => p.id);
    const curriculums = await prisma.curriculum.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const cids = curriculums.map((c) => c.id);
    const items = await prisma.curriculumItem.findMany({ where: { curriculumId: { in: cids } }, select: { subjectId: true } });
    const sids = [...new Set(items.map((i) => i.subjectId))];
    const mods = await prisma.module.findMany({ where: { subjectId: { in: sids } }, select: { id: true } });
    const mids = mods.map((m) => m.id);
    const lessons = await prisma.lesson.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const lids = lessons.map((l) => l.id);
    const memberships = await prisma.organizationMembership.findMany({ where: { organizationId: orgId }, select: { userId: true } });
    const muIds = memberships.map((m) => m.userId);
    const learners = await prisma.learnerProfile.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const lpids = learners.map((l) => l.id);
    const learnerIds = [...new Set([...lpids, ...muIds])];

    const counts = await prisma.$transaction([
      prisma.auditEvent.deleteMany({
        where: { OR: [{ tenantId: orgId }, { targetUserId: { in: muIds } }, { actorId: { in: muIds } }] },
      }),
      prisma.attemptAnswer.deleteMany({
        where: { attempt: { OR: [{ assessment: { organizationId: orgId } }, { learnerId: { in: muIds } }] } },
      }),
      prisma.assessmentAttempt.deleteMany({
        where: { OR: [{ assessment: { organizationId: orgId } }, { learnerId: { in: muIds } }] },
      }),
      prisma.assessmentQuestion.deleteMany({ where: { assessment: { organizationId: orgId } } }),
      prisma.assessment.deleteMany({ where: { organizationId: orgId } }),
      prisma.questionExposure.deleteMany({ where: { question: { organizationId: orgId } } }),
      prisma.questionBankLink.deleteMany({ where: { OR: [{ question: { organizationId: orgId } }, { topicId: { in: mids.length > 0 || sids.length > 0 ? undefined : [] } }] } }),
      prisma.question.deleteMany({ where: { organizationId: orgId } }),
      prisma.progress.deleteMany({
        where: { OR: [{ lessonId: { in: lids } }, { learnerId: { in: learnerIds } }] },
      }),
      prisma.lesson.deleteMany({ where: { organizationId: orgId } }),
      prisma.topic.deleteMany({ where: { moduleId: { in: mids } } }),
      prisma.module.deleteMany({ where: { subjectId: { in: sids } } }),
      prisma.curriculumItem.deleteMany({ where: { curriculumId: { in: cids } } }),
      prisma.subject.deleteMany({ where: { id: { in: sids } } }),
      prisma.programCet.deleteMany({ where: { programId: { in: pids } } }),
      prisma.curriculum.deleteMany({ where: { organizationId: orgId } }),
      prisma.program.deleteMany({ where: { organizationId: orgId } }),
      prisma.enrollment.deleteMany({ where: { programId: { in: pids } } }),
      prisma.batchMember.deleteMany({ where: { batch: { program: { organizationId: orgId } } } }),
      prisma.batchTeacher.deleteMany({ where: { batch: { program: { organizationId: orgId } } } }),
      prisma.batch.deleteMany({ where: { program: { organizationId: orgId } } }),
      prisma.contentVersion.deleteMany({ where: { entityId: { in: [...pids, ...lids] } } }),
      prisma.parentStudent.deleteMany({
        where: { OR: [{ parentUserId: { in: muIds } }, { studentUserId: { in: muIds } }] },
      }),
      prisma.learnerProfile.deleteMany({ where: { organizationId: orgId } }),
      prisma.organizationMembership.deleteMany({ where: { organizationId: orgId } }),
      prisma.session.deleteMany({ where: { userId: { in: muIds } } }),
    ]);

    await auditLog({
      tenantId: orgId,
      actorId: req.userId,
      eventType: "ORG_RESET",
      actedOn: "organization:" + orgId,
      metadata: { mode: "organization", organization: org.name },
    });

    return res.json({ ok: true, mode: "organization", organizationId: orgId, deleted: counts });
  } catch (e) {
    next(e);
  }
}
