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
| CS#20 | BUCET Reviewer + CBT mock-exam content package (deterministic CBT practice) | ✅ | 142-test suite + live E2E smoke |
| CS#21 | BUCET investor demo polish + ARC branding (UI/UX) | ✅ | gates + 14-check live E2E flow |
| CS#22 | College Readiness Program (CRP) content package + deterministic assessments | ✅ | 153-test suite + 23-check live E2E flow |
| CS#22.5 | Dedicated investor demo accounts + idempotent demo seed + verifier | ✅ | 23-check verifier + 15-check live login/auth + 15-check student journey |

## Final Gates

| Gate | Result |
|------|--------|
| Tests | 153/153 (17 files) |
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

## CS#20 — BUCET Reviewer & CBT Mock Exam Content Package

Demo content for the investor capstone: an admission-test ("BUCET") reviewer program with a randomized, deterministic CBT mock exam, fully tenant-isolated under the ARC org.

**Content package** (`packages/shared/src/content/bucet-demo.ts`, exported via `content/index.ts`):
- **4 subjects** (Reading, Math, Science, English) → **9 modules** → **12 topics** → **12 lessons**
- **48 questions**: 41 MC + 2 NUMERIC + 2 MULTI_SELECT + 3 TRUE_FALSE (17 EASY / 22 MEDIUM / 9 HARD), one passage-linked; engine-compatible formats (TF defs transformed to `options[]` + `["true"|"false"]` answer, numeric `{value,tolerance}`, multi-select answer array)
- **1 mock exam** (`bucet-mock-exam-demo`): 60 min, passing 60, randomize questions+choices, `maxAttempts` 3, **`allowRetake: true`**, honest "demo" labeling
- `validateBucetSeed()` + shared `typecheck` (0 errors)

**Seeder** (`packages/database/src/seed-bucet.ts`, idempotent: upserts + `createMany skipDuplicates`, per-slice 500) + verifier (`verify-bucet.ts`, 15 checks: org-scoped, PUBLISHED, TF transform, passage link, assessment config, ACTIVE `ADMIN_GRANT` demo enrollment for `student@aratc.edu.ph`).

**Tenant-isolation hardening** (`assessments/controller.ts`): `getById` + `getBySlug` now wrap with `canReadContent(req.organizationId, req.userRoles, assessment.organizationId)` → 404 for cross-org (mirrors the programs pattern).

**Bug fixed (root cause of live submit 500):** `rollupMastery` used `prisma.progress.upsert` with a compound-unique `where` containing `null` members (`curriculumId: null`, etc.) — a pattern Prisma 5.22's runtime rejects ("Argument `curriculumId` must not be null") on write. Replaced both subject- and program-level rollups with findFirst + update/create (identical NULL-row semantics, no null-in-unique-where). The BUCET program (first to carry real topics/modules through a full mock-exam submit) surfaced this latent bug; it was pre-existing and unrelated to CS#20 content.

**Tests** (`apps/api/src/__tests__/bucet-content.test.ts`, 8 tests): structural validation, hierarchy, 40–60 budget, difficulty mix, types/answer refs, engine-compatible formats, passage links, CS#19 randomization config (served-set determinism), honest demo labeling.

**Live E2E smoke (10 checks, all PASS):** student login → enrollment (ACTIVE/ADMIN_GRANT) → assessment fetch (org header) → start (48 questions) → deterministic resume (3× identical order) → deterministic choices → **submit (48/48 = 100%)** → tenant isolation (outsider student 404 by id and slug) → org-admin access.

## CS#21 — BUCET Investor Demo Polish + ARC Branding
Status: COMPLETE

UI/UX polish of the student-facing BUCET flow (program overview → curriculum → lesson → mock exam → instructions gate → CBT player → result → review). All data comes from live API endpoints — no hard-coded statistics.

**Major UI areas changed:**
- **Program overview** (`dashboard/programs/[programId]/page.tsx`, new): restrained ARC-branded program header (org eyebrow, program title, description), real derived metadata (subjects / lessons / mock-exam count from the program payload), per-subject progress bars fed by `/progression` (percent omitted when unavailable), curriculum presented as Subject → Module → Topic → Lesson expandable hierarchy (no wall of cards), prominent mock-exam card with real metadata (questions / minutes / passing score / "Demo" label) + "Before You Begin" instructions.
- **My Programs** (`dashboard/programs/page.tsx`): consistent ARC card styling, real enrollment/progress data, clear empty state.
- **Assessment detail/player** (`dashboard/assessments/[assessmentId]/page.tsx`): added a **"Before You Begin" instructions gate** before `start` (only real rules: question count, time limit, randomized order, resume preserved, submit when finished — no invented proctoring/lockdown claims); polished result screen hierarchy (score %, mastery band badge, correct-of-total, Review Answers / Back actions); result breakdown unchanged in data, presentation cleaned.
- **API fix** (`assessments/controller.ts`): `getAttempt` used `req.params.id` (assessment id) instead of `req.params.attemptId` — the review endpoint could never resolve an attempt. Fixed; review now returns all 48 answers.

**Design discipline:** existing ARC tokens only (arc-navy/arc-orange/arc-green/arc-purple, slate neutrals); no new dependencies, no chart library, no heavy animation; subtle hover/transition only. Tenant isolation untouched (server-side enforcement authoritative).

**Verification:**
- Responsive: existing Tailwind responsive architecture preserved; no horizontal overflow, hover-only interactions, or tiny touch targets introduced.
- Live E2E investor flow (**14 checks, all PASS**): student login → ARC org membership → program hierarchy (4S/9M/12T/12L) → mock exam exposed → 4 subject progress bars → exam instructions (48 q / 60 min / pass 60 / randomized) → demo label → start (48 served) → deterministic resume → submit → **result/review returns 48 answers** → tenant isolation (outsider blocked).
- Gates: API + Web typecheck 0 errors; API + Web ESLint 0 errors (baseline warnings); Vitest 142/142.

## CS#22 — College Readiness Program (CRP) Content Package

Status: COMPLETE

A second demo program (**College Readiness Program**) demonstrating ARC LMS as a broader learning + practice + assessment + progression platform beyond the BUCET exam simulator.

**Content package** (`packages/shared/src/content/crp-demo.ts`):

| Dimension | Count |
|---|---|
| Program | 1 (`college-readiness-program`, slug, COLLEGE type) |
| Curriculum | 1 (`college-readiness-curriculum`, COLLEGE stage) |
| Subjects | 4 (Mathematics Foundations âº blue, Science Foundations âº green, Language & Communication âº purple, Critical Thinking âº orange) |
| Modules | 9 (Algebra Essentials, Quantitative Reasoning, Problem Solving, Scientific Thinking, Life & Physical Science, Grammar & Usage, Reading Comprehension, Logical Reasoning, Data Interpretation) |
| Topics | 11 (one lesson per topic) |
| Lessons | 11 (rich block content: intro, core concept, worked example, key takeaway, tip callout) |
| Questions | 36 (MULTIPLE_CHOICE, TRUE_FALSE, MULTIPLE_SELECT, NUMERIC â balanced Easy ~30% / Medium ~50% / Hard ~20%) |
| Assessments | 2 (`crp-foundations-practice` 12q/15min PRACTICE, `college-readiness-check` 8q/12min DIAGNOSTIC) â both randomized, allowRetake |

**Files added/changed:**

- `packages/shared/src/content/crp-demo.ts` â CRP content definition + `crpQuestionStats()` + `validateCrpSeed()` (structural integrity validation)
- `packages/shared/src/content/index.ts` â export wiring (`export * from "./crp-demo"`)
- `packages/database/src/seed-crp.ts` â idempotent seeder (upsert by stable slug/id)
- `apps/api/src/modules/assessments/service.ts` â `getServedQuestions()` CS#22 fix: fixed-set assessments that already satisfy `questionCount` are no longer silently re-drawn from the whole bank when they also declare `topicIds`; genuine pool assessments still draw a fresh random sample. Preserves CS#19 deterministic attempt persistence.
- `apps/api/src/__tests__/crp-content.test.ts` â 11 structural tests
- `e2e-cs22.cjs` â 23-check live investor flow

**Seeding:** `pnpm --filter @aratc/database exec tsx src/seed-crp.ts` (idempotent â 0 newly created on second run).

**Verification:**

- Live E2E (**23 checks, all PASS**): student login âº ARC org âº CRP program (id, name, COLLEGE type) âº hierarchy 4S/9M/11T/11L âº curriculum âº lesson (4 blocks) âº practice (PRACTICE, 12q/15min/pass60, randomized) âº diagnostic (DIAGNOSTIC, 8q) âº start (12 served) âº deterministic resume (same set+order) âº submit (result) âº result/review (12 answers returned) âº assessments listed under program âº tenant isolation (outsider blocked by id + slug) âº BUCET regression (program + mock exam still accessible).
- Gates: API + Web typecheck 0 errors; API + Web ESLint 0 errors (92/347 baseline warnings); Vitest 153/153 (142 original + 11 new CRP).

## CS#22.5 — Dedicated Investor Demo Accounts

Dedicated, repeatable investor-demo identities using the EXISTING roles and authorization system (no new roles, no bypassed guards). The demo student is `demo.student@aratc.edu.ph` with ACTIVE enrollments in both BUCET and CRP.

### Investor Demo Accounts

| Account               | Role        | Organization      | Org Role | Status | Purpose                  |
| --------------------- | ----------- | ----------------- | -------- | ------ | ------------------------ |
| demo.superadmin@aratc.edu.ph | Super Admin | Platform (global)  | —        | ACTIVE | Platform administration  |
| demo.admin@aratc.edu.ph      | Org Admin   | ARC Review Center | ADMIN    | ACTIVE | Organization management  |
| demo.teacher@aratc.edu.ph    | Teacher     | ARC Review Center | TEACHER  | ACTIVE | Teacher experience       |
| demo.student@aratc.edu.ph ⭐ | Student     | ARC Review Center | LEARNER  | ACTIVE | Primary investor journey |
| demo.external@aratc.edu.ph   | Student     | Sto. Niño Academy  | LEARNER  | ACTIVE | Tenant isolation         |

**Password:** use the existing local demo convention — `DEMO_PASSWORD` env var (see `.env.example`), defaulting to the project's documented local seed password (`Test@1234`, same as `seed.ts`). Local-only; never a production secret.

### Demo Student State

```text
Email:            demo.student@aratc.edu.ph
Organization:     ARC Review Center (LEARNER, ACTIVE)
BUCET enrollment: ACTIVE  → BUCET Reviewer & CBT Mock Exam (4S/9M/12T/12L, 48q mock exam)
CRP enrollment:   ACTIVE  → College Readiness Program (4S/9M/11T/11L, practice + diagnostic)
```

### Available Demo Flow

```text
Login
→ My Programs
→ BUCET Reviewer
→ Program Overview
→ Curriculum
→ Lesson
→ Mock Exam
→ Result
→ CRP
→ Lesson
→ Practice
→ Result
→ Progress
```

### Files

- `packages/database/src/seed-demo.ts` — idempotent demo-account seed (users, global roles, org memberships, learner profiles, BUCET + CRP enrollments). Second run creates 0 rows.
- `packages/database/src/verify-demo.ts` — read-only 23-check verifier.
- `packages/database/package.json` — scripts `demo:seed` / `demo:verify`.
- `.env.example` — documented `DEMO_PASSWORD` local-only variable.

**Commands:**

```bash
pnpm --filter @aratc/database demo:seed     # idempotent seed (run twice → created=0)
pnpm --filter @aratc/database demo:verify   # read-only 23-check PASS/FAIL report
```

**Verification (live):**

- Validator: **23/23 PASS** (accounts, roles, ARC org memberships, both enrollments ACTIVE, BUCET + CRP content/assessments/curricula, external tenant isolation).
- Live login + authorization: **15/15 PASS** (all five accounts log in; Org Admin → ARC programs readable; Student enrollments list shows both programs; Student → `/admin-stats/overview` 403; Teacher → `/admin-stats/overview` 403; External forced with ARC headers still blocked).
- Demo student journey smoke: **15/15 PASS** (My Programs shows BUCET + CRP; BUCET overview 4S/9M/12T/12L; mock exam 48q; start 48 served; refresh/resume same set+order (CS#19); submit result; review 48 answers; progress 4 subjects; CRP overview; practice 12q start + resume + submit).
- Idempotency: run-1 `created=18`; run-2 `created=0 updated=0`; DB counts stable.

## Known Good Demo Script

1. Version history: `GET /api/versions/PROGRAM/:id/versions` (admin) — no-auth→401, student→403
2. Draft → publish → rollback cycle on a published program
3. Org isolation: cross-org content edits → 403
4. Enrollment expiry → student 403 after window; withdrawal stamps `endedAt`
5. Audit trail: enrollment grant/revoke → `GET /api/admin/audit/events`
