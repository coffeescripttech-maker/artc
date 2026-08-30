/**
 * CS#22.5 — Demo environment verifier (READ-ONLY, idempotent).
 *
 * Verifies demo accounts, ARC organization, enrollments, content, and tenant
 * isolation without mutating data.
 *
 * Run: npx dotenv-cli -e ../../.env tsx src/verify-demo.ts
 */
import { prisma } from "./client";

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

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, extra = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function main() {
  console.log("== CS#22.5 Demo Env Verifier (read-only) ==\n");

  // --- Accounts ---
  const superadmin = await prisma.user.findUnique({ where: { email: DEMO.superadmin } });
  const admin = await prisma.user.findUnique({ where: { email: DEMO.admin } });
  const teacher = await prisma.user.findUnique({ where: { email: DEMO.teacher } });
  const student = await prisma.user.findUnique({ where: { email: DEMO.student } });
  const external = await prisma.user.findUnique({ where: { email: DEMO.external } });

  check("Super Admin exists", !!superadmin, superadmin?.email ?? "missing");
  check("Org Admin exists", !!admin, admin?.email ?? "missing");
  check("Teacher exists", !!teacher, teacher?.email ?? "missing");
  check("Student exists", !!student, student?.email ?? "missing");
  check("External exists (tenant isolation)", !!external, external ? external.email : "missing");

  // --- Roles ---
  const roleOf = async (userId: string | undefined, name: string) => {
    if (!userId) return false;
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role) return false;
    return !!(await prisma.userRole.findFirst({ where: { userId, roleId: role.id } }));
  };
  check("Super Admin has super_admin role", await roleOf(superadmin?.id, "super_admin"));
  check("Admin has school_admin role", await roleOf(admin?.id, "school_admin"));
  check("Teacher has teacher role", await roleOf(teacher?.id, "teacher"));
  check("Student has student role", await roleOf(student?.id, "student"));
  check("External has student role", await roleOf(external?.id, "student"));

  // --- Organization ---
  const arc = await prisma.organization.findUnique({ where: { slug: ARC_SLUG } });
  check("ARC Review Center exists", !!arc, arc?.name ?? "missing");
  const externalOrg = await prisma.organization.findUnique({ where: { slug: EXTERNAL_ORG_SLUG } });

  const memberRole = async (userId: string | undefined, orgId: string) => {
    if (!userId || !orgId) return null;
    const m = await prisma.organizationMembership.findFirst({ where: { userId, organizationId: orgId } });
    return m ?? null;
  };
  const adminMem = await memberRole(admin?.id, arc?.id ?? "");
  const teacherMem = await memberRole(teacher?.id, arc?.id ?? "");
  const studentMem = await memberRole(student?.id, arc?.id ?? "");
  const externalMem = await memberRole(external?.id, externalOrg?.id ?? "");

  check("Admin → ARC (ADMIN)", adminMem?.role === "ADMIN" && adminMem.status === "ACTIVE", adminMem?.role ?? "no membership");
  check("Teacher → ARC (TEACHER)", teacherMem?.role === "TEACHER" && teacherMem.status === "ACTIVE", teacherMem?.role ?? "no membership");
  check("Student → ARC (LEARNER)", studentMem?.role === "LEARNER" && studentMem.status === "ACTIVE", studentMem?.role ?? "no membership");
  check("External → other org (not ARC)", !!externalMem && externalMem.organizationId !== arc?.id, externalMem ? "correctly isolated" : "no membership");

  // --- Program enrollment ---
  const bucet = await prisma.program.findUnique({ where: { slug: BUCET_SLUG } });
  const crp = await prisma.program.findUnique({ where: { slug: CRP_SLUG } });
  check("BUCET program exists", !!bucet, bucet?.name ?? "missing");
  check("CRP program exists", !!crp, crp?.name ?? "missing");

  const learner = student ? await prisma.learnerProfile.findUnique({ where: { userId: student.id } }) : null;
  const enrollFor = async (learnerId: string | undefined, programId: string | undefined) => {
    if (!learnerId || !programId) return null;
    return prisma.enrollment.findUnique({ where: { learnerId_programId: { learnerId, programId } } });
  };
  const bucetEnroll = await enrollFor(learner?.id, bucet?.id);
  const crpEnroll = await enrollFor(learner?.id, crp?.id);
  check("Student BUCET enrollment ACTIVE", bucetEnroll?.status === "ACTIVE", bucetEnroll?.status ?? "missing");
  check("Student CRP enrollment ACTIVE", crpEnroll?.status === "ACTIVE", crpEnroll?.status ?? "missing");

  // --- Content ---
  const bucetAssessments = await prisma.assessment.findMany({ where: { programId: bucet?.id } });
  const crpAssessments = await prisma.assessment.findMany({ where: { programId: crp?.id } });
  check("BUCET has at least 1 assessment", (bucetAssessments ?? []).length > 0, `${bucetAssessments?.length ?? 0} assessment(s)`);
  check("CRP has at least 1 assessment", (crpAssessments ?? []).length > 0, `${crpAssessments?.length ?? 0} assessment(s)`);
  const bucetCurricula = await prisma.curriculum.count({ where: { programId: bucet?.id } });
  const crpCurricula = await prisma.curriculum.count({ where: { programId: crp?.id } });
  check("BUCET curriculum exists", bucetCurricula > 0, `${bucetCurricula} curriculum`);
  check("CRP curriculum exists", crpCurricula > 0, `${crpCurricula} curriculum`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());