# ARATC LMS — Final Handoff Status (CS#1–15 + Hardening)

> Generated 2026-08-29. All gates verified on the shared dev DB (Neon).

## Change Set Tracker

| CS | Deliverable | Status | Verified via |
|----|-------------|--------|--------------|
| CS#1–3 | Auth, RBAC, organizations, tenant isolation | ✅ | 121-test suite + live smoke |
| CS#4 | Program/content ownership (`createdById` FKs) | ✅ | suite |
| CS#5 | Content editor roles | ✅ | suite |
| CS#6 | Batches + import | ✅ | suite |
| CS#7–9 | Enrollments: sources, expiry, admin grant/list/update, student block | ✅ | suite + live smoke |
| CS#10a | Versioning schema (`ContentVersion`, optimistic `version`) | ✅ | `db push` sync |
| CS#10b | Version service: draft / publish / rollback / history | ✅ | 7/7 live HTTP smoke |
| CS#10c | Version backfill script (idempotent, dry-run) | ✅ | real run: 359 snapshots |
| CS#11 | Approval workflow + assessment/question-bank ownership | ✅ | suite |
| CS#12 | Learning-event analytics + admin rollup | ✅ | suite |
| CS#13 | Billing hardening: idempotency, transactions, webhook HMAC | ✅ | suite |
| CS#14 | Audit log service + `/api/admin/audit` + enrollment instrumentation | ✅ | 7 tests + live smoke |
| CS#15 | Assessment/Question org ownership + version-route error hardening | ✅ | 7/7 live smoke, server-crash bug fixed |
| CS#19 | Persist served question set per assessment attempt | ✅ | 134-test suite + live E2E smoke |

## Final Gates

| Gate | Result |
|------|--------|
| Tests | 134/134 (15 files) |
| typecheck | 0 errors |
| ESLint | clean |
| `prisma migrate status` | "Database schema is up to date!" |
| `prisma migrate deploy` | exit 0 (no-op) — production-safe |

## Migration Baseline (CS#17)

The DB was originally shaped with `db push`, so `migrate deploy` would have failed in prod. Fixed:

- Stale/failed migration rows (`20260815091448_init` unfinished, orphaned `20260825000000_add_parent_student_links`) removed from `_prisma_migrations`
- Single **`20260829000000_baseline`** migration generated from the full schema (43 tables)
- Marked as applied via `prisma migrate resolve` — no DDL executed against existing data
- Pre-baseline migration folders archived in `packages/database/prisma/migrations_archive_pre_baseline/` (safe to delete)

> Note: `migration.sql` must stay UTF-8 (no BOM). A UTF-16 BOM made the Prisma CLI unable to read the migration.

## CS#19 — Persist Served Question Set Per Attempt (deterministic CBT)

Roadmap §26: randomization must be deterministic for the lifetime of an attempt.

**Changes:**
- Schema (`AssessmentAttempt`): `servedQuestionIds TEXT[] NOT NULL DEFAULT ARRAY[]` + `choiceOrderSeed INTEGER` — additive; empty array = legacy attempt (Prisma has no optional lists)
- `grading.ts`: seeded PRNG helpers (`mulberry32`, `seededShuffle`, `randomChoiceSeed`) — choice order replayable from a persisted seed
- `assessments/service.ts`:
  - New attempt → served set + seed computed once, persisted atomically in the single `create`
  - Resume with persisted set → reconstruct exact rows/order/choices from DB (never reshuffles)
  - Legacy attempt (`servedQuestionIds = []`) → backfill once on first resume via guarded `updateMany` (concurrency-safe), then deterministic
  - Grading → restricted to the persisted served set; percentage measured against the attempt's persisted `maxScore`
- Tests: `apps/api/src/__tests__/assessment-attempt.test.ts` (9 tests: initial persistence, resume order stability, pool stability, legacy NULL backfill, backfill race, grading basis, choice determinism, seeded shuffle, seed validity)

**Migration:** `20260829010000_cs19_attempt_served_questions` (deployed + verified; baseline untouched)

**Verification:** full live E2E smoke — start → refresh/resume ×2 → submit → result. DB row confirmed `servedQuestionIds` populated in start order; resume returned identical question AND choice order; submit scored 3/3 = 100%.

## Known Good Demo Script

1. Version history: `GET /api/versions/PROGRAM/:id/versions` (admin) — no-auth→401, student→403
2. Draft → publish → rollback cycle on a published program
3. Org isolation: cross-org content edits → 403
4. Enrollment expiry → student 403 after window; withdrawal stamps `endedAt`
5. Audit trail: enrollment grant/revoke → `GET /api/admin/audit/events`
