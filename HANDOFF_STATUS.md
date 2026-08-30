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
| CS#22.7 | Investor demo integrity & UX fixes (C-1/C-2/H-1/H-2/H-3/H-4/M-1 from the CS#22.6 audit) | ✅ | 164-test suite + 29-check live 5-role E2E probe + CS#19 determinism re-verified |
| CS#22.8 | Student Portal enterprise UX audit & demo polish (real-data stats, My Programs redesign, progression program switcher) | ✅ | 164-test suite + live data-derivation E2E probe + route smoke tests |

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
## CS#22.7 — Investor Demo Integrity & UX Fixes

Implements the confirmed findings from `AUDIT_CS22.6_UI_UX_DEMO_READINESS.md`. No fabricated data anywhere; every student-visible screen is now backed by real backend data with truthful empty/loading/error states.

### Findings fixed

| Finding | Fix |
|---------|-----|
| **C-1** fabricated exam dashboard | `/dashboard/exams` fully rewritten on real data: `GET /assessments` (tenant-scoped, PUBLISHED) + `GET /assessments/me/attempts`. Stats (Available / Completed / Avg Score / In Progress) computed from real rows; "—" and empty states when there is no data. Tabs: Available · Mock Exams · My Attempts (resume/review wired to real attempt routes). |
| **C-2** legacy/DRAFT assessment leakage | Root cause: `GET /assessments` had **no organization scoping**. New scope matrix (`assessmentListScope` in `tenant-scope.ts`): platform admins keep the global catalog; members see own-org content only; students pinned to own-org **PUBLISHED** (null-orphan records like `matth quiz 1` and other tenants can never match); org admins/teachers see own-org any-status + PUBLISHED platform content (the 66 legacy null-org DRAFT CET_SIMULATION records are hidden). Single-resource by-id/by-slug 404 semantics unchanged. `matth quiz 1` remains in the DB (not deleted) but is invisible to students. |
| **H-1** `questionCount: undefined` | `getProgramBySlug` now selects `questionCount`, `timeLimitMinutes`, `passingScore`, `randomizeQuestions`, `allowRetake`, `maxAttempts`, `description`, `_count.questions` on the program's assessments. "N Questions" renders from real configuration (BUCET 48q, CRP practice 12q, check 8q). |
| **H-2** enrollment rows dead | Dashboard "My Enrollments" rows are real `<Link>`s to `/dashboard/programs/{programId}` with hover + visible focus ring and a chevron affordance. |
| **H-3** CRP unreachable | `/dashboard/programs` rewritten: lists every ACTIVE enrollment from `GET /my/enrollments` with real per-program mastery from `GET /progression?programId=…` (API already supported programId — no progression rewrite). BUCET + CRP cards both render; truthful "No progress recorded yet" when a program has no tracked progress. |
| **H-4** hardcoded BUCET CTA | `/dashboard/programs/[programId]` derives the assessment card from the program payload's own assessments (MOCK_EXAM preferred, else first) — no `bucet-mock-exam-demo` slug hardcoding. Type-aware labels (Mock Examination / Practice / Diagnostic) + truthful empty state. |
| **M-1** duplicated org name | Root cause = bad data, not code: a stray manually-created org (0 members / 0 programs, created by no seed) PLUS stale `metadata.deletedAt` markers on the live "ARC Review Center" and "Sto. Niño Academy" orgs from an earlier E2E delete-test (restored to PUBLISHED but never unmarked), which made the superadmin platform list empty. `packages/database/src/fix-stray-org.ts` (idempotent, script `db:fix-org-data`) archives the stray org via the platform soft-delete lifecycle and clears stale markers from live orgs. Platform list now shows exactly ARC Review Center + Sto. Niño Academy. |

### Files

- `apps/api/src/lib/tenant-scope.ts` — `assessmentListScope()` + `hasPlatformAdminRole()`
- `apps/api/src/lib/visibility.ts` — exported `getRequestRoles()` (was private)
- `apps/api/src/modules/assessments/controller.ts` — tenant-scoped `list`
- `apps/api/src/modules/assessments/service.ts` — `organizationScope` filter passthrough
- `apps/api/src/modules/programs/service.ts` — enriched program-overview assessment select
- `apps/web/src/app/dashboard/exams/page.tsx` — full rewrite (real data)
- `apps/web/src/app/dashboard/programs/page.tsx` — full rewrite (multi-program)
- `apps/web/src/app/dashboard/programs/[programId]/page.tsx` — data-driven assessment CTA
- `apps/web/src/app/dashboard/page.tsx` — clickable enrollment rows
- `apps/api/src/__tests__/assessment-list-scope.test.ts` — 11 new tests
- `packages/database/src/fix-stray-org.ts` + `db:fix-org-data` script — org data repair
- `.gitignore` — `*.log` (dev-server logs never committed)

### Verification

- **Gates:** API typecheck 0 errors · Web typecheck 0 errors · API lint 0 errors · Web lint 0 errors · **Vitest 164/164 (18 files)** — 153 pre-existing + 11 new, zero regressions.
- **Live E2E probe (29/29 PASS, all 5 demo accounts):**
  - Student: list = 3 ARC PUBLISHED assessments, no `matth quiz 1`, no DRAFT leakage; both enrollments ACTIVE; BUCET payload 48q/60min; CRP payload 12q/8q; CRP progression reachable by `programId`; myAttempts real; admin-stats 403.
  - Org admin: scoped list (ARC + platform PUBLISHED only, zero platform DRAFTs); programs + analytics 200.
  - Teacher: same scoping; platform-admin 403; admin-stats 403.
  - Superadmin: platform orgs = exactly ARC Review Center + Sto. Niño Academy (doubled-name org gone); global catalog preserved (70 records — admin tooling unchanged).
  - External (Sto. Niño): zero ARC assessments/programs; direct ARC program read 404.
- **CS#19 regression:** BUCET mock exam start → 48 served; resume returns identical set+order on the same attempt (no duplicate rows). Deterministic CBT untouched.
- **Servers:** web hot-reloads the rewritten pages (`:8000` 200); API restarted on the new code (`:4000` health 200).

### Remaining (documented, intentionally NOT in CS#22.7 scope)

- **P2:** Single-resource reads (`GET /assessments/{id|slug}`) of null-org platform content remain "public catalog" by design — a student cannot discover `matth quiz 1` via any list, but a direct-ID read still succeeds. Recommend tightening in a future CS if desired.
- **P2:** ~8 archived test orgs (E2E scratch, "review center", "Delete Test …") remain soft-deleted — invisible on the platform page, harmless.
- **P2 (from CS#22.6):** login-page "10,000+ questions" copy claim; localStorage-JWT architecture; web port 8000 documentation. All on the CS#23.x roadmap — future work per owner sequencing.

### Post-commit fix (CS#22.7.1)

- **Bug found during E2E verification:** `Cannot GET /my/enrollments` in the browser console.
- **Root cause:** `NEXT_PUBLIC_API_URL` env var is `http://localhost:4000` (no `/api` suffix), and the web `apiFetch` client (`lib/api/client.ts`) builds URLs as `${API_BASE_URL}${endpoint}` where endpoints are prefix-less (e.g. `/my/enrollments`). So requests resolved to `http://localhost:4000/my/enrollments` instead of `http://localhost:4000/api/my/enrollments`. The API mounts enrollment routes at `/api/my/enrollments`, so Express returned `Cannot GET`.
- **Fix:** Changed `API_BASE_URL` to always append `/api` with trailing-slash normalization:
  ```ts
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "") + "/api";
  ```
- **Commit:** `22132d8` — "fix(cs22.7): correct API_BASE_URL to always include /api prefix"
- **Verified:** Full 5-role E2E probe re-run through the Next.js proxy layer (`/api/*` → `localhost:4000/api/*`): all endpoints return 200 with real data (enrollments, assessments, attempts).
## CS#22.8 — Student Portal Enterprise UX Audit & Production-Ready Demo Polish

### Objective

Make the Student Portal feel enterprise-grade with real data only: no fabricated
dashboard deltas, a compact information-dense My Programs page, and every enrolled
program reachable from Progress.

### Audit summary (read-only Phase 1)

- **Navigation:** audited every Student sidebar item — all routes exist and load; no dead links.
- **`/dashboard`:** stat cards showed **fabricated deltas** (`+12%`, `+5%`, `3 new`, `+2`) and an invented
  "Mastery Points" metric (`subject.percent × 10`); a fallback `?` when lesson totals were empty.
- **`/dashboard/programs`:** oversized, full-width, heavily colored cards (2-per-row), no description,
  no subject/lesson counts, no last-activity, no progress bar, and no clear primary action.
- **`/dashboard/progression`:** only ever rendered the backend-default current program (BUCET); a
  student enrolled in both BUCET and CRP had no way to view CRP progression from Progress.
- Confirmed via live probes that `matth quiz 1` / foreign DRAFTs remain invisible to students (CS#22.7
  C-2 intact) and that all APIs return plain arrays (the `{value, Count}` shape seen in an earlier
  PowerShell probe was a PowerShell serialization artifact, not a server envelope — verified with node).

### Changes

1. **`apps/web/src/app/dashboard/page.tsx`** — removed all fabricated stat deltas and the invented
   "Mastery Points" metric. New honest quick-stats card row, all derived from real data:
   - **Overall Mastery** — mean of current program ladder's subject percentages (or `—`).
   - **Active Programs** — count of ACTIVE enrollments.
   - **Assessments Taken** — real attempt count.
   - **Average Score** — mean of COMPLETED attempt percentages only (or `—`).
   Removed the decorative gradient top borders and swapped orange icon tiles for calm navy tiles.
   Removed now-unused `ArrowUpRight` / `ArrowDownRight` / `Flame` imports.

2. **`apps/web/src/app/dashboard/programs/page.tsx`** — full redesign (the main CS#22.8 deliverable):
   - Enterprise list-style rows (max-w-4xl container, one program per row, neutral white surfaces,
     subtle borders, restrained shadows, small navy accent tile). No giant colored cards.
   - Real data per program: description, subject count, lesson count, assessment count (derived from
     `GET /programs/{slug}` published curriculum tree), mastery percent (`GET /progression?programId=`),
     and last-activity date only when a real attempt exists (mapped via scoped
     `GET /assessments` + `GET /assessments/me/attempts`).
   - Semantic link regions (real `<Link>` with focus ring), separate explicit "Continue Learning"
     CTA, skeleton loading, useful error state with retry, and truthful empty state.
   - Programs without progress sort to the end; no invented progress values.

3. **`apps/web/src/app/dashboard/progression/page.tsx`** — added an enrolled-program switcher
   (chip row) built from `GET /my/enrollments` (ACTIVE only). Selecting a chip re-fetches
   `/progression?programId=…`, so **both BUCET and CRP progression are discoverable** from Progress.
   Null selection preserves the previous default (backend current-program) behavior.

### Verification

- **Gates:** API typecheck 0 errors · Web typecheck 0 errors · API lint 0 errors · Web lint 0 errors
  (334 warnings, −1 from the 335 baseline) · **Vitest 164/164 (18 files)** — no regressions.
- **Route smoke tests:** `/dashboard`, `/dashboard/programs`, `/dashboard/progression` all 200.
- **Live data-derivation E2E probe (demo.student):** enrollments = `college-readiness-program`,
  `bucet-reviewer` (both ACTIVE). Program cards derive exactly:
  - CRP: description ✓ · 4 subjects · 11 lessons · 2 assessments · 58% mastery (real progression).
  - BUCET: description ✓ · 4 subjects · 12 lessons · 1 assessment · 0% mastery (real — no BUCET
    curriculum progress recorded yet).
  - Scoped assessment list = the 3 ARC PUBLISHED only (no legacy `matth quiz 1`, no DRAFT), 7 real attempts.
  - These match the CS#20/CS#22 regression spec exactly (4 subjects · 12 lessons BUCET, 4 · 11 CRP).
- **Security/authorization:** no auth or tenant rules touched; every value the new pages render is
  fetched through existing server-enforced scoped endpoints (the frontend only narrows *display*, and
  never fabricates data).

### Remaining (documented, intentionally not in CS#22.8 scope)

- **P2:** Single-resource reads of null-org platform content remain "public catalog" by design
  (unchanged from CS#22.7 — students cannot discover them via any list).
- **P2:** login-page "10,000+ questions" copy claim; localStorage-JWT architecture notes. On CS#23.x
  roadmap per owner sequencing.
- **P3:** the dashboard's "Continue Learning" lesson snapshot is limited to the first unlocked
  grade's first 3 lessons per subject (pre-existing behavior, unchanged).

### Test-coverage note

The CS#22.8 fixes are frontend presentation/navigation; `apps/web` has no test harness (no
jsdom/@testing-library deps), and adding one would introduce new dependencies against the milestone's
"Do not introduce new dependencies" rule. Backend behavior was untouched (0 API file changes), so the
existing 164-test suite remains fully green and the fixes were verified via live E2E data-derivation
probes instead.

---

# CS#22.9 � Student Portal Final Polish, Resilience & Production Hardening

**Commit:** (see git log � `feat(cs22.9): student portal resilience and production hardening`)
**Date:** 2026-08-30

## What was done

### 1. Autosave resilience (assessment player, CS#22.8 foundation preserved)
- Replaced the `forceSaveToken` retry hack with a resilient save engine:
  - **Mutation sequencing** � every save gets a sequence number; only the
    latest request may transition the visible save state (stale in-flight
    responses are ignored, fixing race conditions).
  - **Bounded automatic retry** � 2 automatic retries with exponential backoff
    (1.6s, 3.2s), then a persistent error state with a manual Retry button.
  - **No data loss on failure** � a failed save never discards the answer; the
    answer stays in player state and is included in the final submit payload.
  - **Pending-save flush before submit** � if an autosave is pending when the
    student submits, one final save is attempted (non-fatal on failure; the
    submit payload always carries the full latest answers).
  - **`beforeunload` guard** � warns only when genuinely unsaved changes exist
    on an in-progress attempt.
  - **Submission failure UX** � a failed submit now shows an inline recovery
    banner (`role=alert` + Try again) instead of replacing the player with an
    error page; the attempt and every answer remain intact.
  - Save state model: `idle ? saving ? saved`, with `retrying` and `error`
    states; status is text+icon (never color-only, a11y).

### 2. My Attempts (reused existing route � no dead links)
- Added **status filter chips** (All / Completed / In Progress, `aria-pressed`)
  to the existing `/dashboard/assessments/history` page.
- Added **"My Attempts"** to the student sidebar (ClipboardList icon), pointing
  at the existing route. In-progress attempts show **Resume**, completed show
  **Review / Retry / Study Plan** per existing authorization rules.

### 3. Fabricated-data elimination (P0 finding from the pre-work audit)
- **`/dashboard/analytics`** � was 100% hardcoded (fake weekly hours, fake
  subject scores with fake trends, fake weak/strong areas, fake insights like
  "2:00 PM most productive time", fake weekly rank). Rewritten on real data:
  stat cards from `GET /assessments/me/attempts` (taken/completed/avg score),
  Subject Mastery from the real progression ladder, Areas to Improve from
  `GET /progression/weak-topics` with real Practice links, Strongest Subjects
  derived from real mastery >= 75%. Skeletons, error+Retry, truthful empty
  states throughout. Removed the fake time-range selector (no server support).
- **`/dashboard/achievements`** � was 100% hardcoded (fake badges, fake
  leaderboard with invented people, fake streaks). Replaced with **milestones
  derived from real data** (first assessment, 5 assessments, 75%+ score,
  perfect score, subject mastery) with real progress labels. No leaderboard.
- **`/dashboard/questions`** � removed the hardcoded mock question table;
  students do not author questions. Truthful empty state with a real link to
  Assessments.
- Sidebar: removed the decorative "New" badge on Achievements; dashboard stat
  cards calmed (`transition-shadow hover:shadow-sm`).

### 4. Tests (+2, all green)
- `attempt-autosave.test.ts` (CS#22.9 block):
  - retried save after a failed transaction is safe � identical composite-key
    upserts, no duplicate rows possible (retry idempotency regression);
  - empty answer batch is a no-op (no transaction, no error).
- Attempted a server-side default-org fallback in `resolveOrgContext` for
  headerless authenticated callers; **reverted** after it cascade-failed 31
  tests that encode the deliberate "no header ? no org context" contract
  (org-context.test.ts). The headerless public-catalog path remains a
  documented P2; real web clients always send `x-organization-id`, and scoped
  behavior through the app was re-verified live (student: 3 own-org PUBLISHED,
  zero legacy/other-tenant; external: zero ARC). The middleware now carries a
  comment documenting this decision.

### 5. Gates
- API typecheck: 0 errors. Web typecheck: 0 errors.
- API lint: 0 errors (97 pre-existing warnings). Web lint: 0 errors
  (327 warnings, improved from 334).
- Vitest: **172/172** (170 CS#22.8 baseline + 2 new).
- Live E2E probe (student + external, real header flow as the web client
  sends): 13/13 PASS � login, org-scoped listing, resume same attempt, CS#19
  deterministic served questions, autosave PATCH, retry idempotent, resume
  hydration, completed-attempt immutability (400), student?admin 403,
  external zero ARC exposure.

### Remaining issues
- **P2 (unchanged):** headerless authenticated API callers reach the public
  null-org catalog in lists (e.g. legacy `matth quiz 1`). Not reachable via
  the web app; fixing requires changing the tested org-context contract.
- **P2 (pre-existing):** `next build` fails on two admin dynamic routes
  (documented in CS#22.8) � separate admin/build CS.
- **P3:** two stray IN_PROGRESS attempts exist on the demo student from E2E
  probing (real records, harmless; they surface as "Resume" rows).
