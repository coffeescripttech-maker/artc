/**
 * CS#22.5 — Investor demo accounts seed (IDEMPOTENT).
 *
 * Creates dedicated demo identities using the EXISTING roles/authorization
 * system (no new roles). Safe to run repeatedly — second run creates 0 rows.
 *
 * Run: npx dotenv-cli -e ../../.env tsx src/seed-demo.ts
 * Password: DEMO_PASSWORD env var, falling back to the existing local seed
 * demo password convention (packages/database/src/seed.ts).
 */
import { prisma } from "./client";
import { hash } from "bcryptjs";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Test@1234";
const ARC_SLUG = "arc-review-center";
const EXTERNAL_ORG_SLUG = "sto-nino-academy";
const BUCET_SLUG = "bucet-reviewer";
const CRP_SLUG = "college-readiness-program";

const DEMO = {
  superadmin: "demo.superadmin@aratc.edu.ph",
  admin: "demo.admin@aratc.edu.ph",
  teacher: "demo.teacher@aratc.edu.ph",
  student: "demo.student@aratc.edu.ph",
  external: "demo.external@aratc.edu.ph",
};

const counts = { created: 0, updated: 0, skipped: 0 };
function tally(action: "created" | "updated" | "skipped") {
  counts[action]++;
}

async function ensureUser(email: string, firstName: string, lastName: string, roleName: string) {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  let user = existing;
  if (!user) {
    user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, status: "ACTIVE" },
    });
    tally("created");
  } else {
    tally("skipped");
  }

  // Ensure global role (idempotent)
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" not found — run the base seed first`);
  const hasRole = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id },
  });
  if (!hasRole) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    tally("created");
  }
  return user;
}

async function ensureMembership(
  userId: string,
  organizationId: string,
  role: "OWNER" | "ADMIN" | "TEACHER" | "LEARNER"
) {
  const existing = await prisma.organizationMembership.findFirst({
    where: { userId, organizationId },
  });
  if (!existing) {
    await prisma.organizationMembership.create({
      data: { userId, organizationId, role, status: "ACTIVE" },
    });
    tally("created");
  } else if (existing.role !== role || existing.status !== "ACTIVE") {
    await prisma.organizationMembership.update({
      where: { id: existing.id },
      data: { role, status: "ACTIVE" },
    });
    tally("updated");
  } else {
    tally("skipped");
  }
}

async function ensureLearnerProfile(userId: string) {
  const existing = await prisma.learnerProfile.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.learnerProfile.create({ data: { userId } });
    tally("created");
  }
  return prisma.learnerProfile.findUnique({ where: { userId } });
}

async function ensureEnrollment(learnerId: string, programId: string, label: string) {
  const existing = await prisma.enrollment.findUnique({
    where: { learnerId_programId: { learnerId, programId } },
  });
  if (!existing) {
    await prisma.enrollment.create({
      data: { learnerId, programId, status: "ACTIVE" },
    });
    console.log(`  enrollment ${label}: created (ACTIVE)`);
    tally("created");
  } else if (existing.status !== "ACTIVE") {
    await prisma.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
    console.log(`  enrollment ${label}: reactivated`);
    tally("updated");
  } else {
    console.log(`  enrollment ${label}: already ACTIVE`);
    tally("skipped");
  }
}

async function main() {
  console.log("== CS#22.5 Investor Demo Accounts Seed ==");
  const arc = await prisma.organization.findUnique({ where: { slug: ARC_SLUG } });
  if (!arc) throw new Error(`Organization "${ARC_SLUG}" not found — run seed-bucet first`);
  const externalOrg = await prisma.organization.findUnique({ where: { slug: EXTERNAL_ORG_SLUG } });

  // 1. Super Admin (platform-level, no org membership required)
  await ensureUser(DEMO.superadmin, "Demo", "SuperAdmin", "super_admin");

  // 2. Organization Admin — ARC Review Center
  const admin = await ensureUser(DEMO.admin, "Demo", "Admin", "school_admin");
  await ensureMembership(admin.id, arc.id, "ADMIN");

  // 3. Teacher — ARC Review Center
  const teacher = await ensureUser(DEMO.teacher, "Demo", "Teacher", "teacher");
  await ensureMembership(teacher.id, arc.id, "TEACHER");

  // 4. Student (PRIMARY investor demo) — ARC Review Center + enrollments
  const student = await ensureUser(DEMO.student, "Demo", "Student", "student");
  await ensureMembership(student.id, arc.id, "LEARNER");
  const studentProfile = await ensureLearnerProfile(student.id);
  if (studentProfile) {
    const bucet = await prisma.program.findUnique({ where: { slug: BUCET_SLUG } });
    if (bucet) await ensureEnrollment(studentProfile.id, bucet.id, "BUCET Reviewer");
    else console.log("  WARN: BUCET program not found (run seed-bucet)");
    const crp = await prisma.program.findUnique({ where: { slug: CRP_SLUG } });
    if (crp) await ensureEnrollment(studentProfile.id, crp.id, "College Readiness");
    else console.log("  WARN: CRP program not found (run seed-crp)");
  }

  // 5. External tenant-isolation user — different organization
  if (externalOrg) {
    const ext = await ensureUser(DEMO.external, "Demo", "External", "student");
    await ensureMembership(ext.id, externalOrg.id, "LEARNER");
    await ensureLearnerProfile(ext.id);
  } else {
    console.log("  External org not available — external demo account skipped");
  }

  console.log(`\nSeed complete: created=${counts.created} updated=${counts.updated} skipped=${counts.skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
