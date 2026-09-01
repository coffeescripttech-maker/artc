# CS#23.4 — RBAC & Organization Access Coverage Matrix

> **Authoritative engineering reference** for authorization coverage in ARC LMS.
> Produced by the CS#23.4 audit (2026-09-01) against commit `a3c91ad` + hardening fixes.
> Sources of truth: `packages/database/src/permission-catalog.ts` (seeded to DB),
> `apps/api/src/middleware/permissions.ts`, `apps/api/src/middleware/content-editor.ts`,
> and the per-module route files. Do not hand-edit the matrix without re-running
> the audit extraction (`apps/api/cs234-*.cjs` scratch scripts).

---

## 1. System Roles

| Role | Type | Scope | Users (live) | Enforcement model |
|---|---|---|---|---|
| `super_admin` | System | Platform | 2 | **Hard bypass** in `requirePermission` (cannot be locked out, §36). All 81 keys effectively granted. |
| `content_admin` | System | Platform (content) | 1 | Permission catalog + platform content roles (`PLATFORM_CONTENT_ROLES`). |
| `school_admin` | System | Organization | 2 | Permission catalog + OWNER/ADMIN org membership for org-scoped resources. |
| `teacher` | System | Organization | 7 | Permission catalog (batches, question import) + TEACHER membership for draft content. |
| `student` | System | Enrollment | 25 | Resource rules: active enrollment + published resource (CS#23.1). |
| `parent` | System | — | 7 | **Reserved — zero enforcement today** (see §10 Known Limitations). |

## 2. Organization Membership Roles (separate axis — do NOT merge with Role)

| Membership role | Grants (mirrors actual middleware) |
|---|---|
| `OWNER` / `ADMIN` | Org member management (`assertCanManageOrg`), org content editor + review-queue approver, user search, org settings. |
| `TEACHER` | Org content **drafts** (`requireContentEditor`), batches. |
| `LEARNER` | Enrolled content consumption only. |

Guards: last-OWNER removal protection, super_admin-only OWNER edits,
cross-org membership writes denied (`assertCanManageOrg` resolves membership
from the authenticated user — client `organizationId` is never trusted, §17).

## 3. Permission Catalog — Full 81-Key Matrix

Status legend: **ACTIVE** = enforced by `requirePermission` middleware (or layered
middleware/service check) on every consuming route. **ACTIVE (resource-rule)** =
permission key is catalog/advisory; the route is enforced by dedicated
role/ownership/enrollment rules (CS#23.1 model — deliberately not double-gated).
**RESERVED** = defined for future functionality, intentionally not enforced.

### Admin & Platform

| Permission | Roles granted | Route(s) | UI | Tenant scoped | Tested | Status |
|---|---|---|---|---|---|---|
| `admin.audit_view` | content_admin, school_admin, super_admin | GET /admin-audit/events | /admin/access → Audit tab | org-scoped; `x-tenant-id: platform` honored **only for super_admin** | ✅ admin-audit.test | ACTIVE |
| `admin.stats_view` | content_admin, school_admin, super_admin | GET /admin-stats | Admin dashboard | org-scoped | ✅ | ACTIVE |
| `platform.orgs_manage` | super_admin | all /platform/organizations/*, /admin/access mutations | Platform Organizations, /admin/access | platform | ✅ cs232-probe | ACTIVE |

### Organizations & Members

| Permission | Roles granted | Route(s) | UI | Tenant scoped | Tested | Status |
|---|---|---|---|---|---|---|
| `orgs.list` | content_admin, super_admin | GET /organizations | Members org picker | platform | ✅ org-members.test | ACTIVE |
| `orgs.update` | content_admin, school_admin, super_admin | PATCH /organizations/:orgId/settings | Org Settings | org membership verified | ✅ org-settings.test | ACTIVE |
| `orgs.users_search` | content_admin, school_admin, super_admin | GET /organizations/users/search | Member pickers | **layered**: permission **+** canManageOrgMembers (CS#23.4 fix) | ✅ org-users-search.test (new) | ACTIVE |
| `users.create` | content_admin, school_admin, super_admin | POST /organizations/:orgId/users | Org user creation | org-scoped; super_admin category **blocked** | ✅ org-users.test | ACTIVE |

### Parents

| Permission | Roles granted | Route(s) | UI | Tenant scoped | Tested | Status |
|---|---|---|---|---|---|---|
| `parents.read` | content_admin, school_admin, super_admin | GET /organizations/:orgId/parents | /admin/parents | org membership verified | ✅ org-parents-settings.test | ACTIVE |
| `parents.manage` | school_admin, super_admin | POST/PATCH/DELETE parent + ParentStudent links | /admin/parents | org-scoped; cross-org link denied; soft revoke | ✅ org-parents-settings.test | ACTIVE |
| `children.view` | parent, super_admin | — (parent portal §37 out of scope) | — | — | — | **RESERVED** |

### Programs

| Permission | Roles granted | Route(s) | Tenant scoped | Tested | Status |
|---|---|---|---|---|---|
| `programs.create` | content_admin, super_admin | POST /programs | ownership set on create | ✅ content-permission.test (new) | ACTIVE (layered) |
| `programs.update` | content_admin, super_admin | PUT /programs/:id | `assertCanEditContent` + permission | ✅ (new) | ACTIVE (layered) |
| `programs.publish` | content_admin, super_admin | PATCH /programs/:id/publish | + permission | ✅ (new) | ACTIVE (layered) |
| `programs.archive` | content_admin, school_admin, super_admin | PATCH /programs/:id/archive | + permission | ✅ (new) | ACTIVE (layered) |
| `programs.delete` | super_admin | DELETE /programs/:id | + permission; audit `PROGRAM_DELETED` | ✅ cs232-delete-probe | ACTIVE |
| `programs.template` | content_admin, super_admin | POST /programs/template | platform | ✅ | ACTIVE |
| `programs.cet_generate` | content_admin, super_admin | POST /programs/:id/cet-generate | platform | ✅ | ACTIVE |

### Subjects / Modules / Topics / Curriculum

| Permission | Roles granted | Tested | Status |
|---|---|---|---|
| `subjects.create/update/publish/archive` | content_admin, super_admin | ✅ | ACTIVE (`subjects.delete` → super_admin only) |
| `modules.create/update/publish/archive/reorder` | content_admin, super_admin | ✅ | ACTIVE (`modules.delete` → super_admin only) |
| `topics.create/update/publish/archive/reorder` | content_admin, super_admin | ✅ | ACTIVE (`topics.delete` → super_admin only) |
| `curriculum.create/update/publish/archive/items_manage` | content_admin, school_admin, super_admin | ✅ | ACTIVE (`curriculum.delete` → school_admin, super_admin) |

### Lessons

| Permission | Roles granted | Route(s) | Tenant scoped | Tested | Status |
|---|---|---|---|---|---|
| `lessons.create` | content_admin, super_admin | POST /lessons | ownership on create | ✅ (new) | ACTIVE (layered) |
| `lessons.update` | content_admin, super_admin | PUT /lessons/:id | `assertCanEditContent` + permission | ✅ (new) | ACTIVE (layered) |
| `lessons.publish` | content_admin, super_admin | PATCH /lessons/:id/publish | + permission | ✅ (new) | ACTIVE (layered) |
| `lessons.archive` | content_admin, super_admin | PATCH /lessons/:id/archive | + permission | ✅ (new) | ACTIVE (layered) |
| `lessons.delete` | super_admin | DELETE /lessons/:id | + permission; audit `LESSON_DELETED` | ✅ | ACTIVE |
| `lessons.reorder` | content_admin, super_admin | POST /lessons/reorder | + permission | ✅ | ACTIVE |
| `lessons.questions_respond` | content_admin, student, super_admin | POST lesson question responses | student + enrollment + published | ✅ cs231 tests | ACTIVE (resource-rule) |
| `lessons.progress` | student, super_admin | PUT /lessons/:id/progress | **self only** (Student A → B denied) | ✅ cs231/progression tests | ACTIVE (resource-rule) |

### Questions / Passages / Assessments

| Permission | Roles granted | Tested | Status |
|---|---|---|---|
| `questions.create/update/publish/archive/review/links_manage` | content_admin, super_admin | ✅ | ACTIVE (`questions.delete` → super_admin only) |
| `questions.import` | content_admin, school_admin, super_admin, teacher | ✅ | ACTIVE |
| `passages.create/update/publish/archive` | content_admin, super_admin | ✅ | ACTIVE (`passages.delete` → super_admin only) |
| `assessments.create/update/publish/archive/auto_generate/questions_manage` | content_admin, super_admin | ✅ | ACTIVE (`assessments.delete` → super_admin only) |
| `assessments.take` | student, super_admin | ✅ | ACTIVE (resource-rule: attempt ownership — Student A cannot read/submit Student B's attempt; IDOR-tested) |

### Enrollment / Progression / Batches / CET / Media / Settings / Versions

| Permission | Roles granted | Tested | Status |
|---|---|---|---|
| `enrollments.self` | student, super_admin | ✅ | ACTIVE (resource-rule, self-enroll route) |
| `progression.view` | student, super_admin | ✅ | ACTIVE (resource-rule, self-scoped) |
| `batches.manage` | school_admin, super_admin, teacher | ✅ cs232-probe | ACTIVE |
| `cet.exams_manage`, `cet.profiles_manage`, `cet.programs_link` | content_admin, super_admin | ✅ | ACTIVE |
| `cet.universities_manage` | super_admin | ✅ | ACTIVE |
| `media.upload` | content_admin, super_admin | ✅ | ACTIVE |
| `settings.read` / `settings.update` / `settings.brand_update` | content_admin, super_admin | ✅ | ACTIVE |
| `content.versions` | content_admin, school_admin, super_admin | ✅ | ACTIVE (service-level: `VERSION_ROLES` in content-versions/service.ts) |

## 4. Classification Summary

| Classification | Count | Keys |
|---|---|---|
| **ACTIVE** (middleware/service-enforced) | 75 | 67 pre-existing `requirePermission` keys + `orgs.users_search` + 7 layered content keys (CS#23.4 fixes) + `content.versions` (service) |
| **ACTIVE** (resource-rule enforced by design) | 5 | `assessments.take`, `lessons.progress`, `lessons.questions_respond`, `enrollments.self`, `progression.view` |
| **RESERVED** | 1 | `children.view` (parent portal — explicitly out of scope, §37) |
| ORPHANED | 0 | — |
| MISSING_ENFORCEMENT | 0 | — (after CS#23.4 fixes) |
| INCORRECT_SCOPE | 0 | — |

*Count check: 75 + 5 + 1 = 81.*

## 5. API Coverage Audit (§6, §19, §20)

Route inventory extracted from all module routers (`apps/api/cs234-route-inventory.txt`):

| Metric | Result |
|---|---|
| Routes audited | every `router.(get|post|put|patch|delete)` across 21 module routers + `app.ts` mount points |
| Authenticated | all routes except `GET /health` and public endpoints (login, register, forgot-password) |
| Permission protected | all administrative mutations + sensitive reads |
| Org-membership scoped | all `/organizations/*` resources via `assertCanManageOrg` / `resolveOrgContext` |
| Resource scoped | content via `assertCanEditContent` / `canReadContent`; student flows via enrollment + ownership |
| DELETE scrutiny (§19) | `PROGRAM_DELETED`, `LESSON_DELETED`, `MEMBERSHIP_REVOKED`, `PARENT_UNLINKED`, `USER_DELETED` audit events verified; unauthorized deletion denied by tests |
| Publish/archive (§20) | permission + content-approver axis; students denied (probe-verified) |

**Gaps found & fixed in CS#23.4:**

1. **7 content routes gated only by the membership axis.** Programs update/publish/archive and lessons create/update/publish/archive were protected by `requireContentEditor`/`requireContentApprover` alone — the corresponding DB permissions were granted and super-admin-editable but never checked. **Fixed:** layered `requirePermission` checks into the content middleware (and route level for programs), preserving org-scoped editor behavior (OWNER/ADMIN/TEACHER membership rules unchanged). New tests: `content-permission.test.ts`.
2. **`orgs.users_search` permission never checked.** The route relied only on `canManageOrgMembers`. **Fixed:** layered enforcement — permission OR platform admin, PLUS org-member-manager — in both service and route. New tests: `org-users-search.test.ts`.

## 6. Security Validation (§14–§19, §28, §29)

| Check | Result |
|---|---|
| Cross-tenant (ARC ↔ Sto. Niño, both directions, GET/POST/PUT/PATCH/DELETE) | PASS (`tenant-scope.test`, `tenant-api.test`, cs233-probe) |
| IDOR — changed IDs on program/lesson/assessment/attempt/progress/member/parent/settings | PASS — every `findUnique({ id })` on org/student resources carries ownership or tenant constraints; attempts and progress are strictly self-scoped |
| `x-tenant-id` audit (§18) | platform tenant context accepted **only** for super_admin (admin-audit controller); normal org users cannot impersonate platform scope |
| Client `organizationId` never trusted (§17) | verified — org access resolves from authenticated membership, never from the browser payload |
| User creation blocklist (§21) | `super_admin` category denied for org-created users (org-users tests) |
| Last-OWNER protection (§36) | verified in org-members tests |
| Error semantics (§28) | 401 unauthenticated / 403 unauthorized / 404 resource-hiding preserved; no cross-org metadata leakage |
| CS#23.1 regression (workspace + progress) | PASS (probe + full suite) |

## 7. Frontend & Sidebar Audit (§24, §25)

- Role/permission UX checks are centralized in `lib/permissions.ts`, `auth-context.tsx`, and `use-manageable-orgs.ts`. **Zero** scattered `role ===` checks in pages — frontend is a UX hint only; the backend remains the security authority.
- Sidebar: PLATFORM and ADMINISTRATION groups gated on the `super_admin` JWT role; all hrefs resolve to existing pages (no dead links, no duplicates); Organization Admins never see global Access Control.
- `/admin/access` (Permissions + Audit tabs) remains gated server-side by `platform.orgs_manage`.

## 8. Audit Events (§27)

Verified live and in tests: `MEMBERSHIP_GRANTED`, `MEMBERSHIP_ROLE_CHANGED`, `MEMBERSHIP_REVOKED`, `PARENT_LINKED`, `PARENT_UNLINKED`, `ORG_SETTINGS_UPDATED`, `USER_CREATED`, `ROLE_PERMISSIONS_UPDATED`, `PROGRAM_DELETED`, `LESSON_DELETED`, `PROGRAM_PUBLISHED`, `LESSON_PUBLISHED`, `VERSION_PUBLISHED`, `VERSION_ROLLBACK`, `ENROLLMENT_GRANTED/REVOKED/EXPIRED`. No missing audit coverage found for existing sensitive mutations.

## 9. CS#23.4 Validation Results

| Check | Result |
|---|---|
| API tests | **221/221 (23 files)** — includes 14 new authorization tests |
| Typecheck (API + Web) | PASS |
| Lint (API + Web) | PASS |
| cs232-probe (CS#23.2 regression) | 12/12 |
| cs232-delete-probe (CS#23.1 regression) | PASS |
| cs233-probe (CS#23.3 regression) | 30/30 |
| Git tree | clean after commit |

## 10. Known Limitations (documented, not fixed — by scope)

1. `parent` role: 7 users, no enforced capabilities (`children.view` reserved). Parent portal is a separate ticket (§37).
2. `programs.delete` is super_admin-only while `programs.archive` is granted to school_admin — intentional preservation of pre-CS#23.2 behavior (documented in the CS#23.2 seed).
3. Scratch audit scripts (`apps/api/cs234-*.cjs` / `cs234-*.txt`) are untracked re-audit tooling; kept for future coverage re-extraction.
4. `requireRole` remains defined in `middleware/auth.ts` as a utility with **zero production call sites** (verified by grep, §7).

