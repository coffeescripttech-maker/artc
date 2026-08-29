/**
 * Demo data for testing the organization membership UI (Change Sets #2–3).
 *
 * Idempotent: safe to run repeatedly. Creates two organizations (if missing)
 * and links the seeded sample users to them. Existing data is never deleted.
 *
 * Run from packages/database:
 *   pnpm exec dotenv -e ../../.env -- tsx src/demo-memberships.ts
 */
import { prisma } from "./index";

async function main() {
  const orgs = [
    {
      slug: "arc-review-center",
      name: "ARC Review Center",
      type: "REVIEW_CENTER",
    },
    {
      slug: "sto-nino-academy",
      name: "Sto. Niño Academy",
      type: "SCHOOL",
    },
  ];

  const created: Record<string, string> = {};
  for (const org of orgs) {
    const row = await prisma.organization.upsert({
      where: { slug: org.slug },
      update: {},
      create: { ...org, status: "PUBLISHED" },
    });
    created[org.slug] = row.id;
    console.log(`organization: ${row.name} (${row.id})`);
  }

  const memberships: Array<{
    email: string;
    slug: string;
    role: "OWNER" | "ADMIN" | "TEACHER" | "LEARNER";
  }> = [
    { email: "admin@aratc.edu.ph", slug: "arc-review-center", role: "ADMIN" },
    { email: "admin@aratc.edu.ph", slug: "sto-nino-academy", role: "ADMIN" },
    { email: "content@aratc.edu.ph", slug: "arc-review-center", role: "ADMIN" },
    { email: "school@aratc.edu.ph", slug: "sto-nino-academy", role: "OWNER" },
    { email: "teacher@aratc.edu.ph", slug: "arc-review-center", role: "TEACHER" },
    { email: "student@aratc.edu.ph", slug: "arc-review-center", role: "LEARNER" },
    { email: "student2@aratc.edu.ph", slug: "sto-nino-academy", role: "LEARNER" },
  ];

  for (const m of memberships) {
    const user = await prisma.user.findUnique({ where: { email: m.email } });
    if (!user) {
      console.log(`skip ${m.email} (user not found — run db:seed first)`);
      continue;
    }
    const existing = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: created[m.slug],
          userId: user.id,
        },
      },
    });
    if (existing && existing.status === "ACTIVE") {
      console.log(`membership: ${m.email} @ ${m.slug} (${existing.role}) — already active`);
      continue;
    }
    if (existing) {
      await prisma.organizationMembership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", role: m.role },
      });
      console.log(`membership: ${m.email} @ ${m.slug} (${m.role}) — reactivated`);
      continue;
    }
    await prisma.organizationMembership.create({
      data: {
        organizationId: created[m.slug],
        userId: user.id,
        role: m.role,
        status: "ACTIVE",
      },
    });
    console.log(`membership: ${m.email} @ ${m.slug} (${m.role}) — created`);
  }

  console.log("\nDone. Log in as admin@aratc.edu.ph / Test@1234 and visit /admin/members");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
