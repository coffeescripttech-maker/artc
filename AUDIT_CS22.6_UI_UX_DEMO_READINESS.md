# CS#22.6 — Read-Only UI/UX & Investor-Demo Readiness Audit (ARC LMS)

**Date:** 2026-08-30 · **HEAD:** `953802f` (main, clean tree) · **Mode:** Read-only audit, no code changes
**Environment:** API on `:4000`, Web on `:8000` (note: web is on 8000, not the conventional 3000)
**Method:** Live API probing with all 5 demo accounts + static source inspection. No headless browser (Playwright/Puppeteer not installed; none added per read-only constraint) — SSR pages return empty shells because auth lives in `localStorage` and pages are client-rendered. This is an audit-method limitation, noted in §5.

---

## 1. What was verified and PASSED ✅

| Area | Verification | Result |
|---|---|---|
| Demo accounts (CS#22.5) | All 5 demo accounts log in via `POST /api/auth/login` with `Test@1234` | ✅ |
| Role boundaries (API) | Student → `/admin-stats` = 403; teacher → platform-admin surface blocked; external-tenant token cannot read ARC data | ✅ |
| Sidebar navigation | Every href in `sidebar.tsx` resolves to an existing route; no dead links | ✅ |
| `ProtectedRoute` | Client-side auth + role guards render "Access Denied" and redirect correctly (`protected-route.tsx`) | ✅ |
| `/platform/organizations` | Returns **200** for demo superadmin. Prior "401 for superadmin" observation was a probe artifact (missing/stale token in the earlier probe script), **not a product bug**. Guard chain (`authenticate` → `requirePlatformAdmin` hard-checks `super_admin`) works as designed | ✅ |
| Assessment player | "Before You Begin" gate (CS#21), auto-submit timer, resume-on-refresh, Question Navigator grid fix (CS#22 HEAD) all present in source | ✅ |
| Multi-tenancy | External tenant correctly isolated from ARC data | ✅ |

---

## 2. Findings — by severity

### 🔴 CRITICAL (breaks demo credibility or blocks a core flow)

**C-1. `/dashboard/exams` ("Exams & Mock Tests") is 100% fabricated data — not wired to any API.**
- `apps/web/src/app/dashboard/exams/page.tsx` hardcodes three const arrays: `upcomingExams`, `pastExams`, `mockExams` (fictional "UPCAT Math Practice Exam", "Science Quarterly Exam", ranks, scores, "+3 Completed" stat cards, dates like "Aug 20, 2026"). Nothing is fetched; the stat values are literals (`stats` array, lines 156–161).
- Impact: an investor clicking "Exams" after seeing the real dashboard will immediately hit invented data that contradicts everything else (ranks out of 45 students that don't exist; scores for exams never taken). Highest demo-risk item in the app.

**C-2. Student assessments list leaks legacy/foreign records.**
- `GET /api/assessments` for the student demo account returns the legacy `"matth quiz 1"` (typo, `organizationId = null` platform-orphan record) among the student's visible assessments.
- The admin list returns ~70 items including DRAFT `CET_SIMULATION` legacy exams — drafts exposed on a list that students/teachers consume.
- Impact: visible typos and draft/unreleased content undermine the "polished product" story; a null-org record reaching a tenant-scoped list also hints at a visibility-filter gap (see M-2).

### 🟠 HIGH (functional defect visible in a demo walkthrough)

**H-1. Program-overview payload returns `questionCount: undefined` for assessments.**
- The program detail endpoint omits `questionCount` on assessment entries, so the "N Questions" labels on `/dashboard/programs/{programId}` render as `undefined Questions` / blank.
- Trivial fix (include count in the service select), but it appears on a page every walkthrough touches.

**H-2. Dashboard "My Enrollments" rows are not clickable — discovery dead-end.**
- In `apps/web/src/app/dashboard/page.tsx`, enrollment rows render as a plain `<div>` (program name + expiry badge) with no `Link`. A student with a program name on screen cannot click through to it. The "My Programs" link lives only in the sidebar.
- Impact: the enrollment→program journey silently dies in the middle of the page.

**H-3. CRP (College Readiness Program) is invisible to enrolled users — single-program dead-end.**
- `GET /api/progression` without a `programId` returns **only the currentProgram** (BUCET) — confirmed live for both student and teacher demo accounts. `/dashboard/programs` ("My Programs") renders exactly one card from this endpoint; there is no program switcher or list.
- A demo account enrolled in both BUCET and CRP (seeded in CS#22.5) has no UI path to reach CRP content. The CRP seed work is unreachable from the student UI.
- Compounded by **H-4**: `/dashboard/programs/[programId]` hard-codes the BUCET mock-exam CTA regardless of which program is displayed.

**H-4. Program overview hard-codes BUCET mock-exam CTA** (see above) — CRP overview shows BUCET's call-to-action.


### 🟡 MEDIUM (data-integrity / polish issues)

**M-1. Seeded organization name is doubled.**
- `GET /api/platform/organizations` returns a single org: **"Accelerated Review Center Accelerated Review Center"** (slug `accelerated-review-center-accelerated-review-center`), `memberCount: 0, programCount: 0`.
- Root cause is in the seed pipeline (name concatenated twice and slug derived from the doubled name). Appears on the superadmin platform page. The zero counts also suggest this org record may be a stray duplicate rather than the live ARC org — worth verifying which org the demo memberships point to.

**M-2. Visibility filter permits `organizationId = null` records into tenant lists** (root cause behind C-2's "matth quiz 1"). `apps/api/src/lib/visibility.ts` should exclude platform-orphan assessments from student-facing lists unless explicitly intended.

**M-3. Login page marketing claim is dishonest: "10,000+ practice questions" vs ~728 actual.**
- Investor demos fail hard when a stakeholder counts. Either fix the copy or fix the content count before the demo.

**M-4. Auth architecture: JWT in `localStorage` + client-side guards.**
- Functional for the demo, but: XSS-stealable token, no httpOnly cookie, no server-side route protection (SSR pages are empty shells until hydration). Architectural observation, not a pre-demo blocker.

### ⚪ LOW

**L-1. Web runs on port 8000** (docs/conventions typically say 3000) — harmless, just document it in `SAMPLE_CREDENTIALS.md`/README for demo operators.
**L-2. "matth quiz 1"** typo record should be deleted from the DB regardless of the M-2 filter fix.
**L-3. Legacy DRAFT `CET_SIMULATION` exams** clutter the admin assessments list (~70 items); archive or delete before demo.

---

## 3. Remediation roadmap (proposed CS numbers)

| CS | Title | Severity | Scope | Est. effort |
|---|---|---|---|---|
| **CS#23.1** | Rewire `/dashboard/exams` to real API data (or hide the page pre-demo) | 🔴 C-1 | Web `exams/page.tsx`; either fetch `assessmentsApi` + real attempts/stats, or temporarily remove from sidebar | 0.5–1d (hide: 15 min) |
| **CS#23.2** | Fix assessment visibility: exclude `organizationId=null` + DRAFT items from student/teacher lists; delete `matth quiz 1` | 🔴 C-2 + M-2 + L-2/L-3 | API `visibility.ts` / assessments service; DB cleanup script | 0.5d |
| **CS#23.3** | Add `questionCount` to program-overview assessment payload | 🟠 H-1 | API programs service select + type | 1–2h |
| **CS#23.4** | Make My Enrollments rows link to `/dashboard/programs/{programId}` | 🟠 H-2 | Web dashboard `page.tsx` (wrap row in `Link`) | 30 min |
| **CS#23.5** | Multi-program support in My Programs: list all enrolled programs + switcher; remove hardcoded BUCET CTA from program overview | 🟠 H-3 + H-4 | API `progression` route (accept/list enrollments), web `programs/page.tsx` + `[programId]/page.tsx` | 1–2d |
| **CS#23.6** | Seed fixes: dedupe org name/slug; verify demo memberships point at the live ARC org | 🟡 M-1 | `packages/database/src/seed*` | 2–4h |
| **CS#23.7** | Copy honesty pass: correct "10,000+ questions" claim (login + any marketing copy) to real counts | 🟡 M-3 | Web login page + copy sweep | 1h |
| **CS#23.8** | (Post-demo) Auth hardening: httpOnly-cookie sessions + middleware protection | ⚪ M-4 | API auth + web auth-context | 2–3d |
| **CS#23.9** | (Post-demo) Adopt Playwright E2E; add demo-journey specs (login→program→assessment→result for each role) | ⚪ limitation | tooling + `e2e/` | 1–2d |
| **CS#23.10** | Demo-ops hygiene: document web port 8000; archive legacy CET_SIMULATION exams | ⚪ L-1/L-3 | docs + DB | 1h |

**Pre-demo critical path:** CS#23.1 → CS#23.2 → CS#23.3 → CS#23.4 → CS#23.6 → CS#23.7 (≈2 days total). CS#23.5 is strongly recommended if the CRP story is part of the pitch.

---

## 4. Audit traceability

- Probes executed (live API): all-demo-account logins; role-boundary matrix (student/teacher/superadmin/external-tenant); `/progression` (student + teacher → BUCET only, 1 grade); `/platform/organizations` (200, doubled-name org); `/assessments` (student list contains `matth quiz 1`; admin list ~70 items with DRAFT CET_SIMULATION).
- Source inspected: `dashboard/page.tsx`, `programs/page.tsx` (+`[programId]`), `assessments/*`, `exams/page.tsx`, `admin/layout.tsx`, `dashboard/layout.tsx`, `protected-route.tsx`, `sidebar.tsx`, `auth-context.tsx`; API `platform/organizations/router.ts`, `platform-admin.ts`, `visibility.ts`, `admin-stats/routes.ts`, `enrollments/routes.ts`, `organizations/routes.ts`, `assessments/service.ts`; seeds in `packages/database/src`.
- False alarms cleared: `undefined` strings in fetched SSR HTML are Next.js RSC `$undefined` tokens, not page bugs. `/platform/organizations` 401 was a probe-token artifact.

## 5. Limitations

1. **No headless browser** (Playwright/Puppeteer absent; none installed per read-only constraint). UI verified via API responses + source reading only; no pixel-level/rendered-DOM verification of layout, overlap, or client-only rendering errors.
2. Dev-server logs were captured but not exhaustively analyzed for runtime warnings.
3. Findings reflect HEAD `953802f`; anything merged after this audit is out of scope.


