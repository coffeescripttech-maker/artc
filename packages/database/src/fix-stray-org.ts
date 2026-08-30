/**
 * CS#22.7 (M-1) — organization data repair (idempotent).
 *
 * Two data defects found on the shared dev DB:
 *
 * 1. STRAY duplicated organization:
 *      name: "Accelerated Review Center Accelerated Review Center"
 *      slug: "accelerated-review-center-accelerated-review-center"
 *    Zero members / zero programs; created manually during platform-org-create
 *    testing. The real demo org is "ARC Review Center" (slug
 *    `arc-review-center`, seeded by seed.ts / demo-memberships.ts).
 *    → Archived via the SAME soft-delete lifecycle as the superadmin platform
 *      endpoint (`metadata.deletedAt` + status ARCHIVED). Recoverable.
 *
 * 2. BOGUS deletedAt markers on the LIVE demo orgs:
 *      "ARC Review Center" and "Sto. Niño Academy" both carry a
 *      metadata.deletedAt timestamp from an earlier E2E delete-test run. They
 *      were restored to status PUBLISHED but the marker was never cleared, so
 *      the platform list (which filters `metadata.deletedAt`) showed neither —
 *      the superadmin platform page appeared empty.
 *    → Cleared for orgs that are PUBLISHED with active memberships.
 *
 * IDEMPOTENT: running repeatedly is a no-op.
 *
 * Usage: npx dotenv-cli -e ../../.env -- npx tsx src/fix-stray-org.ts
 */
import { prisma } from "@aratc/database";

const STRAY_SLUG = "accelerated-review-center-accelerated-review-center";
// Guard: only ever archive a memberless, programless org matching this slug.
const EXPECTED_NAME_PREFIX = "Accelerated Review Center Accelerated Review Center";

async function archiveStrayOrg() {
  const org = await prisma.organization.findUnique({
    where: { slug: STRAY_SLUG },
    select: { id: true, name: true, slug: true, status: true, metadata: true, _count: { select: { memberships: true, programs: true } } },
  });

  if (!org) {
    console.log(`OK: stray org "${STRAY_SLUG}" not present — nothing to do.`);
    return;
  }
  if (!org.name.startsWith(EXPECTED_NAME_PREFIX)) {
    console.log(`SKIP: org "${STRAY_SLUG}" has unexpected name "${org.name}" — not touching it.`);
    return;
  }
  if (org._count.memberships > 0 || org._count.programs > 0) {
    console.log(
      `SKIP: org "${STRAY_SLUG}" has ${org._count.memberships} member(s) / ${org._count.programs} program(s) — not safe to archive automatically.`
    );
    return;
  }

  const metadata = { ...((org.metadata ?? {}) as Record<string, unknown>) };
  if (org.status === "ARCHIVED" && typeof metadata.deletedAt === "string") {
    console.log(`OK: stray org "${org.name}" already archived — nothing to do.`);
    return;
  }

  metadata.deletedAt = new Date().toISOString();
  await prisma.organization.update({
    where: { id: org.id },
    data: { status: "ARCHIVED", metadata: metadata as never },
  });
  console.log(
    `FIXED: archived stray org "${org.name}" (slug ${org.slug}). Recoverable by clearing metadata.deletedAt.`
  );
}

async function clearBogusDeletedMarkers() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, status: true, metadata: true, _count: { select: { memberships: true } } },
  });
  for (const org of orgs) {
    const metadata = { ...((org.metadata ?? {}) as Record<string, unknown>) };
    if (typeof metadata.deletedAt !== "string") continue;
    // A live org: published and actively used. The marker is stale (restore
    // path never cleared it), so remove it.
    if (org.status === "PUBLISHED" && org._count.memberships > 0) {
      delete metadata.deletedAt;
      await prisma.organization.update({
        where: { id: org.id },
        data: { metadata: metadata as never },
      });
      console.log(`FIXED: cleared stale deletedAt marker on live org "${org.name}".`);
    } else {
      console.log(`OK: org "${org.name}" keeps its deleted marker (status ${org.status}).`);
    }
  }
}

async function main() {
  await archiveStrayOrg();
  await clearBogusDeletedMarkers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
