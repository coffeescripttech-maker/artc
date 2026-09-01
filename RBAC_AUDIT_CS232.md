# CS#23.2 — Enterprise RBAC: Complete Role Discovery Audit

> Produced before any implementation code (Phase 1 gate). Every fact below was
> verified against the live database (2026-09-01) and the current source tree.

## 1. Platform (global) roles — `roles` table

| Role name       | Display name  | Users | Authorization footprint today |
| --------------- | ------------- | ----- | ----------------------------- |
| `super_admin`   | Super Admin   | 2     | Everything: platform org management (`requirePlatformAdmin`), all deletes, CET universities, settings, admin stats + audit, content CRUD, versioning, imports, batches. Bypasses org scoping (`PLATFORM_ADMIN_ROLES`). |
| `content_admin` | Content Admin | 1     | Content CRUD across programs/subjects/modules/topics/lessons/assessments/questions/passages/curriculum, CET exams + profiles + links, template triggers, media upload, settings, admin stats + audit, versioning, question import/review, org listing + member management (platform-admin class). **No** deletes (super_admin only), **no** CET universities, **no** platform org management. |
| `school_admin`  | School Admin  | 2     | Batches create/manage, question import, admin stats + audit, content versioning (`VERSION_ROLES`), org member management **via OWNER/ADMIN membership**, org-scoped content editing via membership. |
| `teacher`       | Teacher       | 7     | Batches create/manage, question import, org-scoped content **drafts** via TEACHER membership (`requireContentEditor`). |
| `student`       | Student       | 25    | Learner flows: assessment attempts, lesson progress, lesson question responses (hard-gated `requireRole("student", …)`), self enrollments, progression. |
| `parent`        | Parent        | 7     | **None today.** No route or middleware references the role. Admin "Parents" page uses mock data. Reserved for future children-view features. |

## 2. Organization membership roles — `OrganizationMembership.role`

Separate authorization axis from platform roles (live counts: OWNER 1, ADMIN 8,
TEACHER 2, LEARNER 4):

| Membership role | Grants |
| --------------- | ------ |
| `OWNER` / `ADMIN` | Org content editor + approver (`requireContentEditor` / `requireContentApprover`), org member management (`canManageOrgMembers`), user search. |
| `TEACHER` | Org content editor (drafts + submit-review only; approval excluded). |
| `LEARNER` | Learner flows within the org. |

Assignable set: `OWNER, ADMIN, TEACHER, LEARNER` (`ASSIGNABLE_ROLES` in
`organizations/service.ts`). Platform admins may manage any org's members.

## 3. Hard-coded role sets (to be absorbed by the permission catalog)

| Constant | Location | Values |
| -------- | -------- | ------ |
| `PLATFORM_ADMIN_ROLES` | `lib/tenant-scope.ts` (+ duplicate in `organizations/service.ts`) | `super_admin`, `content_admin` |
| `PLATFORM_CONTENT_ROLES` | `middleware/content-editor.ts` | `content_admin`, `super_admin` |
| `ORG_MANAGER_MEMBERSHIP_ROLES` | `middleware/content-editor.ts` | `OWNER`, `ADMIN` |
| `ORG_EDITOR_MEMBERSHIP_ROLES` | `middleware/content-editor.ts` | `OWNER`, `ADMIN`, `TEACHER` |
| `VERSION_ROLES` | `modules/content-versions/service.ts` | `school_admin`, `content_admin`, `super_admin` |
| `importRoles` | `modules/question-bank/routes.ts` | `super_admin`, `school_admin`, `content_admin`, `teacher` |

## 4. Route → authorization inventory (all 21 routers)

**Public (no auth):** program/subject/curriculum/module/topic/lesson/question/passage/assessment/CET list + detail reads, `/settings/brand`.

**Content CRUD (`content_admin`, `super_admin`; deletes `super_admin` only):**
programs, subjects, modules (+reorder), topics (+reorder), assessments (+questions manage, auto-generate), questions (+review, links), passages, curriculum (+items), CET exams/profiles/coverage/links.

**Org-scoped content workflow:** create/update/publish/archive/submit-review → `requireContentEditor()`; approve/reject → `requireContentApprover()` (programs, lessons).

**Special:**
- program template + CET generation → `content_admin`, `super_admin`
- program delete → `content_admin`, `super_admin` (notably NOT super_admin-only like other deletes)
- lesson delete + reorder → `super_admin` / `content_admin`+`super_admin`
- lesson question responses → `student`, `content_admin`, `super_admin`
- media upload → `content_admin`, `super_admin`
- settings read/update → `content_admin`, `super_admin`
- admin stats + audit → `super_admin`, `school_admin`, `content_admin`
- batches (all 6 routes) → `teacher`, `super_admin`, `school_admin`
- question import (3 routes) → `super_admin`, `school_admin`, `content_admin`, `teacher`
- platform orgs (all 7 routes) → `super_admin` (`requirePlatformAdmin`)
- organizations list → `super_admin`, `content_admin`; members/user-search → service-level `canManageOrgMembers`
- content versions → `VERSION_ROLES` (in-service check)
- enrollments → service-level view/manage checks
- learner routes (attempts, progress, responses, recommendations) → `authenticate` only

## 5. Known anomalies found during audit

1. **`parent` role is a dead letter** — 7 real users hold it; zero enforcement anywhere.
2. **Program delete is `content_admin`+`super_admin`** while every other resource's delete is `super_admin`-only (inconsistent; preserved as-is in the default catalog).
3. **Roles are stored in the JWT** — permission changes must take effect without re-issuing tokens (drives the design decision: resolve permissions from DB by role name, not from the token).
4. **No `Permission`/`RolePermission` models exist** — authorization is entirely hard-coded today.
