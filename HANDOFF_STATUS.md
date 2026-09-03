
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



---

# CS#23.1 — Student Learning Workspace (backend foundation)

## What was built
- **`GET /lessons/:id/workspace`** (authenticated) — one authorized read for the
  whole student lesson workspace: current PUBLISHED lesson, the ordered
  PUBLISHED curriculum tree of the program the learner is enrolled in, the
  learner's real completion state (`completedLessonIds`, `progressById`),
  question-level practice stats, flattened prev/next lesson ordering
  (`flatLessons`, `lessonIndex`), and the program's PUBLISHED assessments
  (with real question counts) for "assessment next" CTAs.
- **Completion authorization hardening (`setLessonProgress`)** — marking a
  lesson complete now requires the lesson to be PUBLISHED *and* belong to a
  program the learner has ACTIVE access to (enrollment → program PUBLISHED).
  404 (not 403) so unrelated/draft content existence is never revealed.
  Progress rows are now scoped with programId/curriculumId/subjectId/moduleId.
  Idempotency preserved (upsert semantics, never duplicates).
- Access resolution: subject → curriculum items → FIRST PUBLISHED curriculum
  whose program the learner can access (`hasLearnerProgramAccess`).

## Files
- `apps/api/src/modules/lessons/service.ts` — `getLessonWorkspace()`,
  `findAccessibleCurriculumForSubject()`, hardened `setLessonProgress()`
- `apps/api/src/modules/lessons/controller.ts` — `getWorkspace` controller
- `apps/api/src/modules/lessons/routes.ts` — `GET /:id/workspace` route
- `apps/api/src/__tests__/lesson-workspace.test.ts` — 10 tests

## Gates
- API typecheck: 0 errors
- API lint: 0 errors (1 pre-existing `JsonInput` warning)
- Vitest: **182/182** (172 post-CS#22.9 baseline + 10 new)

## Security
- 404 on: unenrolled learner, DRAFT lesson, DRAFT curriculum, denied program
  access, orphan subject — no enumeration leaks (tested).
- No new roles; no frontend authorization; tenant/org isolation untouched.

## Frontend integration (DONE)
- `lessonsApi.getWorkspace(id)` added to the API client.
- `/dashboard/lessons/[lessonId]` now prefers the workspace read (one call
  replaces lesson + topic-siblings + progress), with graceful fallback to the
  legacy public flow when the workspace is not applicable (staff preview /
  non-enrolled contexts).
- **Course outline sidebar** (desktop sticky / mobile collapsible `<details>`)
  built from the real curriculum tree: subject → module → topic → lesson,
  green check for real completed lessons, orange highlight for the current
  lesson, every lesson a real `<Link>`.
- **Curriculum-wide prev/next** navigation from `flatLessons`/`lessonIndex`
  (previously limited to same-topic siblings).
- **Program assessment next-step CTA** (purple, domain-correct) from the
  program's real PUBLISHED assessments with real question counts/time limits.
- Mark-complete keeps the sidebar in sync locally (no refetch).

## Gates after frontend integration
- Web typecheck: 0 errors
- Web lint (lesson page + client.ts): 0 errors, 0 new warnings (3 pre-existing
  unused-symbol warnings in the page cleaned up)
- API suite untouched: 182/182

## Live E2E (student, org header as the web client sends)
- `GET /lessons/{crp-lesson}/workspace` → 200: program "College Readiness
  Program", 4 courses, 11 flatLessons, lessonIndex 0, 8 completed lessons,
  program assessments CRP Foundations Practice (12q) + College Readiness
  Check (8q), real prev/next titles.
- Scoped assessment list with org header: exactly the 3 ARC PUBLISHED
  assessments (no `matth quiz 1`) — CS#22.7 behavior intact.
- Lesson page route → 200.

## Completion & next-lesson flow (CS#23.1 final scope)
- **Error/retry (§19):** completion failure renders a `role="alert"` red banner
  ("We couldn't save your progress. Please try again."); the completion button
  itself is the retry. No fake completed state on failure.
- **Post-completion card (§9/§12):** after persisted completion, a green
  success card shows "Lesson completed" + "Up next" with a
  "Continue to Next Lesson →" CTA (real `flatLessons` ordering).
- **Final lesson (§14):** when the completed lesson is last in the curriculum,
  the card shows "Program complete" + "Back to Program".
- **Accessibility (§23):** `aria-live="polite"` on the completion button,
  `role="alert"` on the error banner, real `<Link>`/`<Button>` elements.
- Existing free prev/next navigation preserved (pre-existing product rule);
  the next-step card is additive. Server stays authoritative (§15).
- Idempotency: the completion upserts the unique progress row — verified live
  (two consecutive PUTs → exactly one row; count 7→8, never 9).
- Security verified live: unauthenticated PUT → 401; non-member PUT → 404.

## Live E2E — completion flow (student, org header)
```text
BEFORE: completed=7/11, current not completed
PUT #1  → {completed:true, 100%, MASTERED}
PUT #2  → identical (idempotent, single row)
GET     → completed:true 100%  (persisted)
workspace → completed=8/11, includes current, next = "Functions &
            Relationships: Inputs, Outputs, and Change"
RESTORE → set back to incomplete (clean demo state)
```

## Lesson UX polish (enterprise learning experience)
- **Course Outline** — collapsible on desktop (260px panel ⇄ 64px icon rail
  with per-lesson status icons + tooltips); course progress bar with real
  `done/total` counts inside the outline. All completion states from real
  Progress rows.
- **Mobile** — permanent outline replaced by a compact "Lesson Outline"
  button (with `done/total completed`) opening a slide-in drawer
  (`role="dialog"`, `aria-modal`, overlay click + Escape + X to close,
  auto-close on lesson navigation, 200ms transitions).
- **Lesson header** — de-duplicated (removed the separate "Mastered" badge);
  now type · duration → title → description → dual progress bars
  (Lesson % orange, Course `X of Y` green), all from persisted values.
- **Single completion state (§3)** — removed the "Mastered" badge +
  standalone "Completed" button + old completion panel trio. Now exactly one:
  green "Lesson Mastered — You completed this lesson." card appears only when
  the server has persisted completion (plus program-complete line on the
  final lesson).
- **State-aware primary CTA (§9)** — bottom nav:
  not completed → "Complete Lesson & Continue →" (persists via the existing
  authoritative endpoint, then client-navigates; never navigates on failure);
  completed → "Continue to Next Lesson →"; final lesson completed →
  "Back to Program". "Next lesson" title shown beneath the CTA. Previous
  lesson kept as secondary card.
- **Check-for-understanding (§7)** — already provided by the existing
  `LessonBlockRenderer` → `QuestionRenderer` question blocks (interactive
  MCQ with correct/incorrect feedback + practice score card); reused, not
  duplicated.
- Content width unchanged at `max-w-3xl` (768px, within the 700-820px target);
  block types already cover worked example, key point, callouts, formula,
  media (lazy), resources.

## Lesson completion → progression rollup (backend, CS#23.1 final)
- **Problem:** completing a lesson only wrote a lesson-level Progress row
  (`lessonId` set). The `/progression` ladder reads **topic-level** rows
  (`lessonId: null`), so lesson completion never moved subject/program
  percentages — only assessment practice did.
- **Fix (`lessons/service.ts → setLessonProgress`):** after upserting the
  lesson row, the service recomputes the parent topic's completion from real
  counts: `completed PUBLISHED lessons in topic / total PUBLISHED lessons in
  topic`, then updates or creates the topic-level rollup row with the mapped
  mastery band (`masteryFromCompletion`). Same `findFirst → update/create`
  pattern as the existing assessment rollups (no null-in-unique-where upserts).
- **Idempotent & bidirectional:** un-completing a lesson drops the topic
  percentage back; repeating the same completion never creates duplicates.
  Verified live on the demo student (CRP):
  - uncompleted → "Expressions & Equations" topic 0% (NOT_STARTED)
  - completed → 100% (MASTERED); uncompleted again → 0% (back)
  - demo lesson restored to completed afterwards (1/11, clean state)
- **Tests:** `lesson-workspace.test.ts` +2 — topic rollup row is created with
  the real ratio (2 total / 1 completed → 50% PRACTICING); idempotency test
  now also asserts the topic update (4 updates across 2 completions, zero
  creates).

## Next
- None outstanding for CS#23.1. Owner review + manual UI validation.

## Post-CS#23.1 fix: superadmin 403 on organ organization pages (org-context + auth-context)
- **Reported:** superadmin could not browse several pages � API returned 403
  "You are not an active member of this organization" (seen when opening an
  organization / navigating after org switch).
- **Root cause (two layers):**
  1. `resolveOrgContext` (globally mounted) required an ACTIVE
     `organizationMembership` for every caller � including `super_admin`, who
     historically had no membership rows. The web client always sends a
     persisted `x-organization-id`, so a stale org id from a previous session
     could cause the 403 before any platform-admin authorization was considered.
  2. Frontend `login()` in `auth-context.tsx` returned `/admin` for platform
     admins BEFORE the `setActiveOrgId()` block ran, so `super_admin`/`content_admin`/
     `school_admin` never populated `localStorage.activeOrganizationId` on login �
     leaving whatever stale org id a prior session/user had written.
- **Backend fix (`middleware/org-context.ts`):** platform admins operate at the
  Platform layer and may act in ANY organization context without requiring a
  local membership row. `resolveOrgContext` now resolves roles (from
  `req.userRoles` or the signed JWT), and if `hasPlatformAdminRole(roles)` sets
  `req.organizationId` + `req.membership` and skips the membership lookup.
  The header only names a context; authorization comes from the platform role
  verified via the JWT � never from the client.
- **Frontend fix (`auth-context.tsx`):** `login()` now populates the active-org
  context (from returned memberships) for ALL roles BEFORE the admin redirect;
  `logout()` clears `activeOrganizationId` so stale org ids never leak across
  sessions/users.
- **Tests (`org-context.test.ts` +4):** super_admin bypass (OWNER), content_admin
  bypass (ADMIN), bypass via signed JWT on the global-mount path, and non-member
  non-platform still rejected (403) � tenant isolation preserved.
- **Verification:** API vitest 187/187 (20 files); full live probe �
  superadmin login ? platform org list/detail 200 ? org member list 200 (valid
  AND stale org headers); web typecheck + lint clean.

---

# CS#23.1/23.2 - Public-read superadmin 404 fix + Enterprise RBAC (2026-09-01)

## Part 1 - CS#23.1 bug: superadmin 404 on public read routes
- **Root cause:** public routes (GET /by-id/:id, /by-slug/:slug) lack
  `authenticate`, so `req.userRoles` was never set when no `x-organization-id`
  header was sent (super_admin has no memberships). The visibility layer then
  treated the superadmin as anonymous -> 404.
- **Fix:** replaced `req.userRoles` with `getRequestRoles(req)` at 4 call sites
  (programs/controller.ts, assessments/controller.ts); `getRequestRoles`
  opportunistically decodes the Bearer JWT on public routes. Removed a stray
  console.log from programs/service.ts.
- **Verified live:** superadmin GET /api/programs/by-id/:id without org header
  -> 200 (regression probe kept in apps/api/cs232-probe.cjs).

## Part 2 - CS#23.2 Enterprise RBAC (all system roles, configurable UI)
- **Phase 1 audit (RBAC_AUDIT_CS232.md):** full role inventory before any code.
  6 platform roles in DB (super_admin 2, content_admin 1, school_admin 2,
  teacher 7, student 25, parent 7) + separate org-membership axis
  (OWNER/ADMIN/TEACHER/LEARNER) + every hard-coded role set and route gate.
- **Schema (migration 20260901020907_cs232_rbac):** new `Permission`
  (resource.action key, display metadata, isEnforced) and `RolePermission`
  (roleId+permissionId unique, grantedBy/grantedAt) models.
- **Catalog + seed (packages/database/src/permission-catalog.ts, seed-rbac.ts,
  `npm run db:seed-rbac [-- --reset]`):** 77 permissions, 151 default grants
  seeded idempotently. Defaults preserve today's behavior exactly (content_admin:
  CRUD minus deletes; school_admin: stats/audit/versions/import/batches;
  teacher: batches/import; student: learner set; parent: children.view advisory
  placeholder). Learner/parent permissions are catalogued as isEnforced=false
  (advisory) - their flows stay authenticate-gated.
- **Middleware (apps/api/src/middleware/permissions.ts):** `requirePermission` /
  `hasAnyPermission` resolve effective grants from the DB by JWT role NAMES
  (roles live in the token, grants live in the DB -> permission edits apply
  without re-login), 30s in-memory cache + invalidatePermissionCache().
  super_admin hard-bypasses (system role - can never lock itself out).
- **All role-gated routes migrated** from requireRole(...) to
  requirePermission("<resource>.<action>") across assessments, subjects,
  modules, topics, curriculum, questions, passages, cet, media, settings,
  admin-stats, admin-audit, batches, lessons, programs, organizations,
  platform/organizations (replaces requirePlatformAdmin guard), question
  import, and content versioning (content.versions).
- **Access Control API (/api/admin/access, mounted in app.ts):** GET /roles,
  GET /permissions, GET /roles/:id, PUT /roles/:id/permissions (transactional
  replace, refuses system-locked roles, audit-logged ROLE_PERMISSIONS_UPDATED,
  cache-invalidating), and POST /simulate (grants/denied + org-membership axis).
  Guarded by platform.orgs_manage (default: super_admin only). New audit event
  type in lib/audit-log.ts.
- **Frontend (apps/web/src/app/admin/access/page.tsx + sidebar ADMINISTRATION
  section, superadmin-only):** role cards, resource-grouped permission matrix
  with save (system roles locked), grant simulator, advisory badges.
  Server-side enforcement is authoritative; the UI only renders it.
- **Tests:** added rolePermission.findMany mock to admin-audit, org-members,
  platform-orgs test DB mocks (RBAC middleware now reads the DB; super_admin
  bypasses untouched). API vitest 187/187 (20 files).
- **Live end-to-end probe (apps/api/cs232-probe.cjs, 12/12 PASS):** CS#23.1
  regression, access-control reads/writes, teacher 403 on access console,
  permission PUT + revert, super_admin lock refusal, simulator, real-token
  enforcement (teacher passes questions.import guard -> 400 handler; student
  403 on import + settings), audit event written.
- **Known pre-existing gaps surfaced by the audit (not fixed here):**
  batchRoutes is defined but never mounted in app.ts (web client calls would
  404); the parent role has 7 real users but zero enforcement; program delete
  was content_admin+super_admin while other deletes are super_admin-only
  (behavior preserved in the default catalog).

## 2026-09-01 � CS#23.2 fix: superadmin 403 deleting org-owned programs

- **Bug:** `assertCanEditContent` (apps/api/src/lib/tenant-scope.ts) applied
  the platform-admin bypass ONLY to platform-owned (null-org) content. For
  org-owned programs the superadmin fell through to the strict org-match
  check and got 403 "You do not have access to content in this organization"
  whenever the active org header did not match the owning org (or was absent).
- **Fix:** platform admins (super_admin / content_admin) now bypass the
  org-match branch too, mirroring resolveOrgContext's platform-admin bypass
  and canReadContent (CS#23.2 #12/#44: super admin is not restricted by
  organization boundaries). Org-scoped roles (school_admin/teacher/student)
  remain strictly tenant-isolated � cross-org writes still 403.
- **Tests:** 4 new unit cases in tenant-scope.test.ts; tenant-api.test.ts
  cross-org denial actor changed from content_admin (a platform role) to
  school_admin (correctly org-scoped) + new superadmin cross-org 200 case.
  Full suite 192/192 (20 files), tsc clean.
- **Live E2E (apps/api/cs232-delete-probe.cjs):** superadmin created a
  throwaway program in ARC Review Center and deleted it both WITH the org
  header and with NO header � 204/204 PASS; self-cleaning. Full cs232-probe
  still 12/12.

## 2026-09-01 � CS#23.2 COMPLETE: Enterprise Global RBAC + Org Role Management (final pass)

Closed the remaining spec gaps on top of the earlier RBAC implementation:

- **�34 Org role-assignment audit:** `organizations/service.ts` now writes
  `MEMBERSHIP_GRANTED` (incl. reactivation), `MEMBERSHIP_ROLE_CHANGED`
  (with before/after role+status) and `MEMBERSHIP_REVOKED` audit events under
  the organization tenant. New `MEMBERSHIP_ROLE_CHANGED` type in
  `lib/audit-log.ts`. Best-effort (`.catch`) so logging never breaks the action.
- **�21/�23/�50/�52 Org Admin Roles & Access:** new read-only
  `GET /api/admin/access/capabilities` (authenticated; deliberately NOT behind
  the platform guard) returning live platform-role permission keys from the DB
  plus membership-role capability summaries mirroring actual middleware.
  `/admin/members` shows role-distribution cards, capability preview + the
  "Permissions are managed centrally" note in the Add Member dialog.
- **�34/�35 Superadmin Audit tab:** `/admin/access` has a Permissions/Audit Log
  tab pair; audit fetch passes `x-tenant-id: platform` (global RBAC events are
  stored under tenant `platform`). `admin-audit/controller.ts` now honors the
  explicit header **only for super_admin** � other roles stay org-pinned.
- **�55 Final authorization audit:** zero `requireRole()` call sites remain in
  routes (definition retained in `middleware/auth.ts` as a utility); deleted
  dead `middleware/platform-admin.ts` (replaced by
  `requirePermission("platform.orgs_manage")`). Remaining role-list checks are
  intentionally retained: `PLATFORM_ADMIN_ROLES`/`PLATFORM_CONTENT_ROLES`
  bypasses in `tenant-scope.ts`/`content-editor.ts` (�27 resource-level rules)
  and the `super_admin` hard bypass in `permissions.ts` (�36 lockout protection).

**Validation:** API+Web typecheck OK � lint 0 errors (warnings pre-existing) �
192/192 API tests (20 files) � live probes: `cs232-probe.cjs` 12/12,
`cs232-delete-probe.cjs` PASS, new `cs232-capabilities-probe.cjs` 8/8
(capabilities read-only OK for student, 401 anon, platform-tenant audit for
superadmin, teacher header ignored, mutation guards intact).

## 2026-09-01 � CS#23.3 COMPLETE: Enterprise Organization Administration & Real Tenant Management

Commit ``ab70fdf`` (pushed to origin/main). Builds **on** the CS#23.2 authorization
foundation � no new RBAC, no new database models.

**Backend (organizations module extended; all mutations behind ``requirePermission``
+ ``assertCanManageOrg``):**
- ``GET /:orgId/members`` � server-side search/filters/pagination, real users with
  membership + system roles; ``GET /:orgId/members/:membershipId`` member detail
  (profile, membership, system role, enrollments/teaching assignments).
- **Parents � mock page replaced with real API:** ``GET /:orgId/parents``,
  ``GET /:orgId/parents/:id``, ``POST /:orgId/parents/:id/links``,
  ``DELETE /:orgId/parents/:id/links/:linkId`` (reuses existing ``ParentStudent``
  model; org-scoping enforced via shared org membership).
- ``GET /:orgId/overview`` � real DB counts (members/teachers/students/parents/
  programs/enrollments/lessons/assessments).
- ``GET|PATCH /:orgId/settings`` � contact fields stored in ``Organization.metadata``.
- ``POST /:orgId/users`` � create org user (bcrypt + role + membership); �25
  server-enforced: only school_admin/teacher/student/parent assignable.
- Audit events added to the CS#23.2 infra: ``PARENT_LINKED``, ``PARENT_UNLINKED``,
  ``ORG_SETTINGS_UPDATED``, ``USER_CREATED``.
- Permission catalog 77 ? **81 keys** (``users.create``, ``parents.read``,
  ``parents.manage``, ``organization.update``); seeded idempotently, ``parent`` role
  granted ``parents.read`` only.

**Frontend:** ``/admin/parents`` rebuilt on the real API (link/unlink, cross-org-safe
student pickers); ``/admin/organization`` Overview + Settings; ``/admin/teachers``
real list; ``member-detail-modal.tsx`` drawer; ``lib/permissions.ts`` frontend
``hasPermission`` helper (UX only) + ``use-manageable-orgs.ts``; sidebar restructured.

**Security validation:** cross-tenant parent access & student linking ? 403;
student/teacher on parent/settings endpoints ? 403; anonymous ? 401; last-OWNER
guard and superadmin-only OWNER edits preserved; server resolves org from
authenticated membership (never trusts browser orgId).

**Regression:** CS#23.1 delete-probe PASS; CS#23.2 ``cs232-probe.cjs`` 12/12
(count assertion updated 77?81), capabilities 8/8, cache/bypass/audit preserved.

**Validation:** API + Web typecheck OK � lint 0 errors (warnings pre-existing) �
**207/207 API tests (21 files, +15 new)** � ``cs233-probe.cjs`` live probe PASS.

**Known limitations:** parent-facing portal (viewing linked children's progress)
not built � parent role is read-only for now; org branding has no schema fields,
so that settings section was intentionally omitted (�21).

---
# CS#24 - DEPLOYMENT READINESS (COMPLETE)
Date: 2026-09-03

## What was hardened
1. **Production build unblocked** - verified `next build` exits 0 (previously-documented admin-route failure no longer reproduces).
2. **API security headers** - new `apps/api/src/lib/security-config.ts`: Helmet-equivalent headers with zero new dependencies (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, `Cross-Origin-Opener-Policy`, `x-powered-by` disabled); wired via `applyApiSecurity(app)` first-in-app.
3. **CORS allowlist** - `CORS_ORIGINS` (comma-separated) configures `cors({ origin: CORS_ORIGIN_LIST, credentials: true })`; empty list = allow-all (dev fallback; production should set the web origin(s).)
4. **Production secrets guard** - `assertProductionSecrets()` refuses boot in `NODE_ENV=production` when: `JWT_SECRET`/`SESSION_SECRET` missing or < 32 chars, or `DEMO_PASSWORD` still set (demo accounts must not exist in prod).)
5. **Credential leak scrubbed** - hardcoded Gemini API key removed from `apps/api/src/config/index.ts` - now `process.env.GEMINI_API_KEY || ""`;`gemini.ts` consumes it. Verified: zero tracked copies of the leaked key remain.
6. **Web security headers** - `apps/web/next.config.js` headers(): nosniff, DENY frames, strict-origin referrer, permissions-policy, DNS-prefetch off.
7. **Env documentation** - `.env.example` documents `CORS_ORIGINS`, `JWT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY` (empty placeholders for prod).

## Gates (all PASS)
- API typecheck 0 - Web typecheck 0 - Vitest **226/226** - ESLint (changed API files) 0 - **`next build` exit 0**

## Files
- `apps/api/src/lib/security-config.ts` (new)
- `apps/api/src/app.ts` (applyApiSecurity + CORS_ORIGIN_LIST + indent normalization)
- `apps/api/src/config/index.ts` (scrub key; drop dead corsOrigin/assertProductionSecrets -- consolidated into security-config)
- `apps/web/next.config.js` (security headers)
- `.env.example` (document new vars)

## Notes
- CSP intentionally deferred (Next App Router + inline styles makes a safe CSP a follow-up with testing; other header coverage is complete).
- `JWT_REFRESH_SECRET` dropped -- was only referenced inside a dead function;ever used by auth.

---

# CS#26 - Platform Admin Data Reset (Superadmin Clean-Slate Tool)

Status: COMPLETE

## Purpose
Lets a superadmin wipe tenant/academic data from the UI to test from a clean state.

## Backend
- `GET /api/platform/admin/reset/preview[?orgId=]` - live counts, zero mutation
- `POST /api/platform/admin/reset/reset` (body `{ confirm: "RESET" }`) - FULL wipe:
  orgs, memberships, programs, curriculum chain, lessons, questions, assessments,
  attempts, enrollments, batches, tests, progress, parent links, non-superadmin users.
  PRESERVED: super_admin accounts, RBAC definitions (Role/Permission/RolePermission), SiteSettings.
- `POST /api/platform/admin/reset/orgs/:orgId/reset` - per-organization wipe only.
- Auth: `authenticate` + `platform.admin_reset` permission + in-service super_admin role assert.
- Audit: `PLATFORM_RESET` / `ORG_RESET` events (union extended in audit-log.ts).
- Validation: `validateRequest(resetSchema)` - wrong/missing confirm = 400 (never 500).

## Frontend
- `/platform/settings` - superadmin-only Platform Settings page: live preview counts,
  full reset + per-org reset with typed "RESET" confirmation dialogs.
- Sidebar: PLATFORM > Settings (super_admin only).

## Validation
- API tests 226/226; API typecheck 0; Web typecheck 0; lint 0 errors on changed files.
- Live E2E: superadmin preview 200 (full + org-scoped), teacher 403, anon 401,
  wrong/missing confirm 400. Destructive resets left to the owner via the UI.

## Known Limitations
- Full reset also clears audit history (a fresh PLATFORM_RESET event is written after).
- Legacy Test/TestAttempt tables wiped in full reset; not org-scoped in org reset.
