-- OrganizationMembership: tenant membership layer (Change Set #2)
-- Purely additive: new table + enums, no existing table altered.

CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'TEACHER', 'LEARNER');

CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED');

CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'LEARNER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships"("user_id");

ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- Backfill (idempotent, derivation-only, safe to re-run).
-- Derives memberships from relationships that already exist. If the database
-- has no organizations yet, every INSERT below matches zero rows (no-op).
-- ----------------------------------------------------------------------------

-- 1) Platform staff (super_admin / content_admin / school_admin) join the
--    first-created organization as ADMIN so they can administer it.
INSERT INTO "organization_memberships" ("id", "organization_id", "user_id", "role", "status", "created_at", "updated_at")
SELECT
    md5('backfill_staff_' || u."id" || '_' || o."id"),
    o."id",
    u."id",
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
JOIN "user_roles" ur ON ur."user_id" = u."id"
JOIN "roles" r ON r."id" = ur."role_id"
CROSS JOIN LATERAL (
    SELECT "id" FROM "organizations" ORDER BY "created_at" ASC LIMIT 1
) o
WHERE r."name" IN ('super_admin', 'content_admin', 'school_admin')
  AND NOT EXISTS (
    SELECT 1 FROM "organization_memberships" om
    WHERE om."user_id" = u."id" AND om."organization_id" = o."id"
  );

-- 2) Learners with an organization on their learner profile.
INSERT INTO "organization_memberships" ("id", "organization_id", "user_id", "role", "status", "created_at", "updated_at")
SELECT
    md5('backfill_lp_' || lp."user_id" || '_' || lp."organization_id"),
    lp."organization_id",
    lp."user_id",
    'LEARNER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "learner_profiles" lp
WHERE lp."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_memberships" om
    WHERE om."user_id" = lp."user_id" AND om."organization_id" = lp."organization_id"
  );

-- 3) Batch teachers: org derived via batch -> program -> organization.
INSERT INTO "organization_memberships" ("id", "organization_id", "user_id", "role", "status", "created_at", "updated_at")
SELECT
    md5('backfill_bt_' || bt."teacher_id" || '_' || p."organization_id"),
    p."organization_id",
    bt."teacher_id",
    'TEACHER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "batch_teachers" bt
JOIN "batches" b ON b."id" = bt."batch_id"
JOIN "programs" p ON p."id" = b."program_id"
WHERE p."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_memberships" om
    WHERE om."user_id" = bt."teacher_id" AND om."organization_id" = p."organization_id"
  );

-- 4) Batch members: org derived via batch -> program -> organization.
INSERT INTO "organization_memberships" ("id", "organization_id", "user_id", "role", "status", "created_at", "updated_at")
SELECT
    md5('backfill_bm_' || bm."learner_id" || '_' || p."organization_id"),
    p."organization_id",
    lp."user_id",
    'LEARNER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "batch_members" bm
JOIN "batches" b ON b."id" = bm."batch_id"
JOIN "programs" p ON p."id" = b."program_id"
JOIN "learner_profiles" lp ON lp."id" = bm."learner_id"
WHERE p."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_memberships" om
    WHERE om."user_id" = lp."user_id" AND om."organization_id" = p."organization_id"
  );