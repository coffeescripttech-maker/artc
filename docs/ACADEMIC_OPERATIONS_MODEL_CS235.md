# ACADEMIC OPERATIONS MODEL — CS#23.5

> Scope: the **College Readiness / Review Center academic operations** as actually implemented.
> This documents the **existing** entity/ownership model (verified against
> `packages/database/prisma/schema.prisma`), so enhancements build on real structure —
> nothing invented.

---

## 1. Ownership hierarchy (verified)

```text
PLATFORM (super_admin, content_admin — global scope)
   │
   ▼
Organization  ── OrganizationMembership (OWNER/ADMIN/TEACHER/LEARNER)
   │
   ├──● Program        (programType: BUCET/COLLEGE/…, metadata, imageUrl)
   │     └── Curriculum (stage+gradeLevel; programId, organizationId)
   │           └── CurriculumItem (ordered subject binding, isRequired, customName)
   │                 └── Subject
   │                       └── Module
   │                             └── Topic
   │                                   └── Lesson (orgId too — via owner)
   │
   ├── Assessment      (programId, organizationId) → AssessmentQuestion (join+order)
   │     └── AssessmentAttempt → AttemptAnswer (per-question autosave rows)
   │
   ├── LearnerProfile   (user → organizationId, currentStage/curriculum/program)
   │     ├── Enrollment  (unique learner+program; status/expiry/source)
   │     ├── Progress    (rollup rows: subject/module/topic level, lesson rows)
   │     └── BatchMember (optional review-center grouping)
   │
   └── Parent           (role `parent`; ParentStudent links children)
```

## 2. Entity matrix — owner + scope + lifecycle

| Entity | Owner | Org scope | Program scope | Lifecycle | Locking |
|---|---|---|---|---|---|
| Program | createdBy + org (nullable = platform) | orgId or platform | self | DRAFT→PUBLISHED→ARCHIVED | publish state machine |
| Curriculum | org | orgId or platform | programId | ContentStatus | — |
| Subject | org (platform templates) | orgId via item | curriculum items | — | — |
| Module / Topic / Lesson | org lesson | lessons orgId | topic chain | lesson status PUBLISHED sets visibility | versioning ($content_versions) |
| Assessment | org | orgId | programId | PUBLISHED → attempts | randomizeQ/choice flags + servedQuestionIds (CS#19) |
| Question | org | orgId | topic tags | question status | — |
| Enrollment | who granted | org of program+learner | programId (unique) | ACTIVE/COMPLETED/CANCELLED + expiresAt | isActiveEnrollment |
| Progress | learner + program + level | learner's org | program/curriculum/subject/module/topic/lesson | completion 0–100 → mastery band | unique tuple |
| ParentStudent | parent + student user | cross-org enforced | — | PENDING/ACTIVE/REJECTED/REVOKED | unique pair |

## 3. Academic structure — CLASS/SECTION decision

- **Existing:** `Batch` / `BatchMember` / `BatchTeacher` (program-scoped cohort grouping,
  with start/end date, owner/teacher assignments, learner membership). This is the
  review-center **"batch / class / cohort"** concept. It exists and is **reused**.
- **Not introduced:** separate `AcademicYear`, `ClassSection`, `Section`,
  `SubjectTeacher` tables — the product does not need school-grade semantics
  (roadmap: K-12 explicitly out of scope). No duplicate academic structure created.

## 4. Permissions (CS#23.4 RBAC catalog → academic ops)

| Capability | Key | Scope |
|---|---|---|
| See org members | `users.search` | org OWNER/ADMIN |
| Org membership mgmt | `org.members.manage` | org OWNER/ADMIN (last-OWNER guard) |
| Curri/progs create/edit/publish | `curriculum.…` / `programs.*` | content-editor + own-org |
| Enroll learner | `enrollments.manage` | org OWNER/ADMIN |
| Take assessment | `assessments.take` | learner enrollment gate |
| Progress view | `progression.view` | learner-own |

## 5. Academic lifecycle pipeline (as-implemented)

```text
Create program (org) → draft → submit-review → approve → publish
→ Add curriculum/subjects/modules/topics/lessons
→ Add assessments + question bank (teacher/org)
→ Student granted an ACTIVE enrollment (ADMIN_GRANT)
→ Learner sees program (enrolled scope) → lessons → marks complete
→ lesson completion rolls up to topic/subject/program Progress rows
→ assessment attempt scored against served set (deterministic)
→ progress/mastery shown in /progression ladder + program overview
```

## 6. Gaps / debt (documented, not introduced)

- `Parent` role exists + `parents.read` but **no parent-facing portal** (children's
  progress not yet surfaced). READ-ONLY for now.
- `Batch` (cohort) exists but is not yet wired into the demo enroll path
  (enrollment is the working access model).
- Program delete (`programs.delete`) is super_admin-only + archive is
  content-editor-scoped (intentional, CS#23.4 preservation).