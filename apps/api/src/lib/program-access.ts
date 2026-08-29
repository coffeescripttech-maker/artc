import { prisma } from "@aratc/database";

/**
 * Program access policy (CS#9 — architecture §19/§20).
 *
 * Single source of truth for "may this learner access this program?":
 *   learner profile → ACTIVE enrollment → not expired → program PUBLISHED.
 *
 * Enrollment is deliberately kept separate from organization membership:
 * membership grants the ability to *see org content*; enrollment grants
 * *learning access* to a program. They are never conflated (§19, principle 9).
 */

export interface EnrollmentLike {
  status: string;
  expiresAt: Date | null;
}

/** An enrollment grants access only while ACTIVE and unexpired. */
export function isActiveEnrollment(
  enrollment: Pick<EnrollmentLike, "status" | "expiresAt">,
  now: Date = new Date()
): boolean {
  if (enrollment.status !== "ACTIVE") return false;
  if (enrollment.expiresAt && enrollment.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Resolve the learner's active, unexpired enrollment for a program
 * (or across all programs when programId is omitted). Returns null when
 * the learner has no current access.
 */
export async function findActiveEnrollment(learnerProfileId: string, programId?: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      learnerId: learnerProfileId,
      ...(programId ? { programId } : {}),
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { startedAt: "asc" },
  });
  return enrollment && isActiveEnrollment(enrollment) ? enrollment : null;
}

/**
 * Whether the user (by userId) currently has learning access to a program.
 * Does NOT throw — use assertLearnerProgramAccess for guard semantics.
 */
export async function hasLearnerProgramAccess(userId: string, programId: string): Promise<boolean> {
  const learner = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!learner) return false;
  const enrollment = await findActiveEnrollment(learner.id, programId);
  if (!enrollment) return false;
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { status: true },
  });
  return program?.status === "PUBLISHED";
}