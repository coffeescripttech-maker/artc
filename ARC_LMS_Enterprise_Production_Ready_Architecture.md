# ARC LMS — Enterprise & Production-Ready Platform Architecture

> **Status:** Target architecture  
> **Scope:** Multi-tenant Education SaaS + School LMS + Review Center Platform + Learning Marketplace + Enterprise LMS  
> **Design goal:** Production-ready foundation that can start as a shared SaaS platform and evolve into enterprise/dedicated deployments without rewriting the domain model.

---

## 1. Executive Summary

ARC LMS should not be rebuilt from scratch. The existing learning hierarchy remains the foundation:

```text
Program
  ↓
Curriculum
  ↓
Subject
  ↓
Module
  ↓
Topic
  ↓
Lesson
  ↓
Questions / Assessments
  ↓
Progress / Analytics
```

The major architectural enhancement is to add the platform, organization, identity, access, enrollment, content ownership, billing, enterprise, security, and operational layers around that learning model.

The central rule is:

> **A user does not receive access merely because they belong to an organization. Access is granted through an authorized membership plus an active enrollment/entitlement, subject to organization, product, policy, subscription, and resource permissions.**

ARC should support:

- Schools
- Review centers
- Universities
- Training centers
- Corporate learning organizations
- Individual/B2C students
- Platform-owned content
- Organization-owned content
- Teacher-created content
- Paid programs
- Organization subscriptions
- Enterprise contracts
- AI-powered content workflows
- Multi-organization users
- Shared and dedicated infrastructure

---

# 2. Target Platform Model

```text
                                  ARC LMS
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
   PLATFORM LAYER             ORGANIZATION LAYER          MARKETPLACE
          │                          │                          │
   Super Admin                Schools / Centers          Paid Programs
   Content Admin              Members                    Mock Exams
   Platform Content           Classes / Sections         Review Packages
   Global Settings             Batches / Cohorts         Individual Students
   Platform Analytics          Organization Content
                               Branding
                               Reports
          │                          │
          └──────────────────────────┬─────────────────────────┘
                                     ▼
                              LEARNING DOMAIN
                                     │
                                  Program
                                     ↓
                                Curriculum
                                     ↓
                                  Subject
                                     ↓
                                  Module
                                     ↓
                                   Topic
                                     ↓
                                  Lesson
                                     ↓
                           Questions / Assessments
                                     ↓
                             Attempts / Progress
                                     ↓
                                  Analytics

          ┌──────────────────────────────────────────────────────┐
          │                  PLATFORM SERVICES                   │
          │ Identity • RBAC • Billing • Payments • AI           │
          │ Media • Notifications • Search • Audit • Reporting  │
          │ Security • Observability • Background Jobs          │
          └──────────────────────────────────────────────────────┘
```

---

# 3. Core Architectural Principles

## 3.1 Multi-tenancy first

Every organization-owned resource must have an explicit tenant boundary.

```text
Organization
    ↓
Membership
    ↓
Authorized User
    ↓
Organization-owned Resource
```

Never trust an `organization_id` supplied by the browser.

The API derives the active organization from the authenticated session/context and verifies membership and permissions before accessing organization data.

---

## 3.2 Separate identity, membership, enrollment, and entitlement

These are different concepts.

```text
USER
  ↓
MEMBERSHIP
  ↓
ENROLLMENT
  ↓
ENTITLEMENT
  ↓
RESOURCE ACCESS
```

Example:

```text
Juan
 ├── Member of ABC High School
 │      └── Student
 │
 └── Member of ARATC Review Center
        └── Student
```

And independently:

```text
Juan
 ├── Enrollment → ARC Grade 9
 └── Enrollment → CET Review 2027
```

A user may belong to an organization without being enrolled in every program owned by that organization.

---

## 3.3 Content ownership is separate from access

ARC must support both platform content and organization content.

```text
PLATFORM CONTENT
    ↓
Reusable across authorized organizations

ORGANIZATION CONTENT
    ↓
Owned by one organization

TEACHER CONTENT
    ↓
Created inside an organization
    ↓
May be private, class-scoped, organization-wide, or submitted for approval
```

---

## 3.4 Least privilege

Permissions should be granted at the smallest practical scope.

Do not rely on:

```text
role === "admin"
```

Prefer:

```text
organization.members.view
content.lesson.create
content.lesson.publish
assessment.results.view
billing.manage
```

---

## 3.5 Backend authorization is authoritative

Frontend route guards improve UX but are not security.

Every protected API operation must independently validate:

1. Authentication
2. Organization context
3. Membership
4. Role/permission
5. Resource ownership/scope
6. Product entitlement
7. Subscription/feature limits where applicable
8. Resource state

---

# 4. Organization Types

Do not build separate technical systems for schools and review centers.

Use a single organization model:

```text
organization.type
```

Supported initially:

```text
SCHOOL
REVIEW_CENTER
```

Designed for future:

```text
UNIVERSITY
TRAINING_CENTER
CORPORATE
NON_PROFIT
GOVERNMENT
OTHER
```

## School

```text
Organization
 ├── Academic Years
 ├── Grade Levels
 ├── Sections
 ├── Teachers
 ├── Students
 ├── Parents
 ├── Classes
 ├── Enrollments
 └── Organization Content
```

## Review Center

```text
Organization
 ├── Programs
 ├── Batches / Cohorts
 ├── Instructors
 ├── Students
 ├── Enrollments
 └── Organization Content
```

The shared domain model allows ARC to add new organization types later without creating another LMS.

---

# 5. Identity Architecture

## 5.1 Users

Recommended fields:

```text
users
--------------------------------
id
public_id
email
email_normalized
password_hash
first_name
last_name
display_name
avatar_media_id
status
email_verified_at
last_login_at
created_at
updated_at
deleted_at
```

Use an immutable internal primary key and, where appropriate, a non-sequential public identifier.

Never expose internal database IDs unnecessarily.

---

## 5.2 Organizations

```text
organizations
--------------------------------
id
public_id
name
slug
type
status
logo_media_id
domain
timezone
locale
settings_json
created_at
updated_at
deleted_at
```

Organization status:

```text
PENDING
ACTIVE
SUSPENDED
ARCHIVED
```

---

## 5.3 Organization memberships

```text
organization_memberships
--------------------------------
id
organization_id
user_id
role_id
status
joined_at
invited_at
created_at
updated_at
```

Membership status:

```text
INVITED
ACTIVE
SUSPENDED
REMOVED
```

A unique constraint should prevent duplicate active memberships for the same user and organization.

---

# 6. Roles and Permissions

Keep the existing major roles:

```text
SUPER_ADMIN
CONTENT_ADMIN
SCHOOL_ADMIN
TEACHER
STUDENT
PARENT
```

Add extensibility for:

```text
REVIEW_CENTER_ADMIN
INSTRUCTOR
ORG_CONTENT_ADMIN
BILLING_ADMIN
REPORT_VIEWER
SUPPORT_AGENT
```

These should be permission bundles rather than hard-coded authorization rules.

## Permission examples

```text
organization.view
organization.update
organization.members.view
organization.members.invite
organization.members.remove

student.view
student.create
student.update
student.import
student.enroll

teacher.view
teacher.create
teacher.update

content.program.view
content.program.create
content.program.update
content.program.publish
content.program.archive

content.curriculum.create
content.subject.create
content.module.create
content.topic.create
content.lesson.create
content.lesson.update
content.lesson.publish
content.lesson.delete

question.view
question.create
question.update
question.import
question.publish

assessment.create
assessment.update
assessment.publish
assessment.grade
assessment.results.view

class.create
class.update
class.assign_teacher
class.assign_student

reports.view
reports.export

billing.view
billing.manage

organization.settings.manage
organization.branding.manage

audit.view
```

---

# 7. School Content Creation — Required Enhancement

## 7.1 School Admin can create content

A School Admin should be able to create:

```text
Program
Curriculum
Subject
Module
Topic
Lesson
Question
Assessment
```

subject to organization permissions.

Example:

```text
ABC High School
 └── Grade 9 Mathematics
      ├── Algebra
      ├── Geometry
      └── Statistics
```

---

## 7.2 Teachers can create content

Teachers should also be able to create:

```text
Subject
Module
Topic
Lesson
Question
Assessment
Learning Activity
Assignment
```

However, teacher permissions must be configurable.

Recommended default:

```text
Teacher
 ├── Create lesson                  YES
 ├── Edit own content               YES
 ├── Create questions               YES
 ├── Create assessments             YES
 ├── Assign content to own classes  YES
 ├── Publish own content            CONFIGURABLE
 ├── Publish organization content   APPROVAL REQUIRED
 ├── Edit another teacher's content NO
 ├── Edit platform content          NO
 └── Delete published content       NO
```

---

## 7.3 Teacher approval workflow

Default production workflow:

```text
Teacher
   ↓
DRAFT
   ↓
SUBMITTED_FOR_REVIEW
   ↓
School Admin / Content Manager
   ↓
APPROVED
   ↓
PUBLISHED
```

Trusted organizations may enable:

```text
teacher_auto_publish = true
```

but this should be an explicit organization setting.

---

# 8. Content Scope and Ownership

Every content entity should have a clear ownership model.

Recommended:

```text
content_scope
----------------
PLATFORM
ORGANIZATION
```

For finer control, add:

```text
visibility
----------------
PRIVATE
ORGANIZATION
CLASS
PUBLIC_CATALOG
```

Recommended metadata:

```text
organization_id
created_by
updated_by
content_scope
visibility
approval_status
published_at
archived_at
```

## Example

```text
ARC Platform Content
      ↓
ARC Grade 9 Mathematics
      ↓
Used by:
 ├── School A
 ├── School B
 └── Review Center A
```

Organization-specific content:

```text
ABC School
      ↓
Special Mathematics Reviewer
      ↓
Teacher-created
      ↓
Visible only to ABC School
```

---

# 9. Platform Content vs Organization Content

Never duplicate platform content unnecessarily.

Use:

```text
PLATFORM CONTENT
      ↓
REFERENCE / ASSIGN
      ↓
ORGANIZATION
```

If a school needs a customized version:

```text
Platform Lesson
      ↓
Create Organization Copy
      ↓
ABC School Lesson
      ↓
Teacher edits
```

Store the relationship:

```text
source_content_id
derived_from_version_id
```

This preserves traceability.

---

# 10. Content Versioning

Production LMS content should be versioned.

Recommended:

```text
content_versions
--------------------------------
id
content_type
content_id
version_number
status
snapshot_json
created_by
created_at
published_at
```

Version lifecycle:

```text
DRAFT
   ↓
IN_REVIEW
   ↓
APPROVED
   ↓
PUBLISHED
   ↓
SUPERSEDED
```

Published versions should be immutable.

When content changes:

```text
Published v1
     ↓
Create Draft v2
     ↓
Review
     ↓
Publish v2
```

Existing learners should have deterministic behavior based on the enrollment/program policy.

---

# 11. Learning Content Hierarchy

Keep the current architecture:

```text
Program
   ↓
Curriculum
   ↓
Subject
   ↓
Module
   ↓
Topic
   ↓
Lesson
```

A lesson can contain blocks:

```text
Lesson
 ├── Text
 ├── Heading
 ├── Image
 ├── Video
 ├── Audio
 ├── PDF
 ├── Formula
 ├── Example
 ├── Question
 ├── Practice
 ├── Embed
 └── Callout
```

The editor should save structured content rather than arbitrary HTML whenever possible.

Example:

```json
{
  "type": "lesson",
  "version": 3,
  "blocks": [
    {
      "type": "text",
      "data": {}
    },
    {
      "type": "video",
      "data": {}
    }
  ]
}
```

---

# 12. Curriculum Architecture

Formalize curriculum as a versioned domain concept.

```text
Program
   ↓
Curriculum
   ↓
Subjects
```

Example:

```text
ARC Senior High School Program
 ├── Grade 9 Curriculum
 ├── Grade 10 Curriculum
 ├── Grade 11 Curriculum
 └── Grade 12 Curriculum
```

Recommended:

```text
curriculums
--------------------------------
id
program_id
organization_id
name
code
version
status
effective_from
effective_until
created_by
created_at
updated_at
```

Curriculum status:

```text
DRAFT
ACTIVE
RETIRED
ARCHIVED
```

---

# 13. Program Lifecycle

```text
DRAFT
  ↓
IN_REVIEW
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Rules:

```text
DRAFT
  → no normal learner access

IN_REVIEW
  → no normal learner access

PUBLISHED
  → eligible for enrollment/access

ARCHIVED
  → no new enrollment
```

Do not delete published learning products casually.

Use archival and soft deletion.

---

# 14. Program Access Policy

Each program should support an explicit enrollment policy:

```text
ADMIN_ONLY
CODE
SELF_ENROLL
PURCHASE
APPROVAL
INVITATION
```

Examples:

```text
School Program
→ ADMIN_ONLY

Teacher Class Material
→ CODE / INVITATION

Review Center Product
→ PURCHASE

Public Free Course
→ SELF_ENROLL
```

---

# 15. Enrollment Architecture

Create:

```text
enrollments
--------------------------------
id
public_id
user_id
organization_id
program_id
curriculum_id
source_type
source_id
status
enrollment_method
started_at
expires_at
completed_at
created_by
created_at
updated_at
```

Status:

```text
PENDING
ACTIVE
SUSPENDED
COMPLETED
CANCELLED
EXPIRED
```

Enrollment method:

```text
ADMIN
TEACHER
CODE
PURCHASE
SELF
INVITATION
IMPORT
SYSTEM
```

Use database constraints/idempotency to prevent accidental duplicate active enrollments.

---

# 16. Enrollment Sources

Enrollment should be traceable.

Examples:

```text
source_type = ORDER
source_id = order_123
```

or:

```text
source_type = CLASS
source_id = class_456
```

or:

```text
source_type = ENROLLMENT_CODE
source_id = code_789
```

This makes support, auditing, refunds, and reporting much easier.

---

# 17. School Enrollment

```text
School Admin
     ↓
Students
     ↓
Select students / section
     ↓
Select program
     ↓
Select curriculum
     ↓
Confirm
     ↓
Enrollment ACTIVE
```

Bulk enrollment must be supported.

```text
Select Section A
       ↓
Select Program
       ↓
Enroll 40 students
```

The operation should be transactional and idempotent.

---

# 18. Teacher Class-Based Access

Teachers should not manually enroll every learner when a class already exists.

```text
Teacher
  ↓
My Classes
  ↓
Grade 9 Section A
  ↓
Assign Learning
  ↓
Program / Lesson / Assessment
```

The system can resolve eligible learners through class membership.

For durable access, create explicit assignment/enrollment records where required.

---

# 19. School Academic Structure

Recommended entities:

```text
academic_years
grade_levels
sections
classes
class_members
class_teachers
```

Relationship:

```text
Organization
   ↓
Academic Year
   ↓
Grade Level
   ↓
Section
   ↓
Class
   ↓
Students + Teachers
```

Example:

```text
ABC High School
  ↓
2026–2027
  ↓
Grade 9
  ↓
Section A
  ↓
Students
```

---

# 20. Review Center Structure

Recommended:

```text
cohorts
cohort_members
cohort_instructors
```

Example:

```text
ARATC Review Center
   ↓
CET Review 2027
   ↓
Batch A
   ↓
Students
```

---

# 21. Enrollment Codes

Create:

```text
enrollment_codes
--------------------------------
id
code_hash
display_code
organization_id
program_id
curriculum_id
max_uses
used_count
expires_at
status
created_by
created_at
revoked_at
```

Do not store sensitive access codes in plaintext if they function as bearer credentials.

Prefer hashing where feasible and show the code only when generated.

Flow:

```text
Student
   ↓
Join Program
   ↓
Enter Code
   ↓
Validate
   ↓
Check expiration / usage / policy
   ↓
Create Enrollment
   ↓
ACTIVE
```

---

# 22. Entitlement Architecture

Entitlement represents access rights.

```text
entitlements
--------------------------------
id
user_id
organization_id
resource_type
resource_id
source_type
source_id
status
starts_at
expires_at
metadata_json
created_at
revoked_at
```

Possible resource types:

```text
PROGRAM
CURRICULUM
COURSE
ASSESSMENT
FEATURE
AI_CREDITS
```

An entitlement may come from:

```text
SUBSCRIPTION
PURCHASE
ENROLLMENT
GRANT
PROMOTION
ENTERPRISE_CONTRACT
```

---

# 23. Access Decision

A protected learning request should conceptually execute:

```text
Authenticate user
      ↓
Resolve organization context
      ↓
Verify membership
      ↓
Verify permission
      ↓
Verify resource scope
      ↓
Verify enrollment
      ↓
Verify entitlement
      ↓
Verify product status
      ↓
Verify dates/expiration
      ↓
ALLOW
```

Never implement access as:

```text
if user.loggedIn then allow
```

---

# 24. Student "My Learning"

The student dashboard should aggregate active learning access.

```text
MY LEARNING

Continue Learning
 ├── ARC Grade 9
 └── CET Review 2027

My Programs
 ├── ARC Grade 9
 ├── CET Review 2027
 └── Science Reviewer
```

Only active/valid learning access should appear as actionable learning.

Expired programs should be clearly labeled rather than silently disappearing when historical reporting is important.

---

# 25. Student "Explore"

Marketplace/public catalog:

```text
Explore Programs
   ↓
Program Details
   ↓
Pricing
   ↓
Purchase / Enroll
```

Example:

```text
CET Review 2027
College Entrance Preparation

✓ Mathematics
✓ Science
✓ Language
✓ Reading
✓ Abstract Reasoning
✓ Mock Exams

₱1,499
[ View Program ]
```

Catalog visibility must be controlled by program publication and marketplace settings.

---

# 26. B2C Revenue Architecture

Separate organization subscriptions from student purchases.

## SaaS

```text
Organization
   ↓
Subscription
   ↓
Plan
```

## B2C

```text
Student
   ↓
Order
   ↓
Payment
   ↓
Entitlement
   ↓
Enrollment
```

Never mix these two financial domains.

---

# 27. Subscription Plans

Recommended:

```text
subscription_plans
--------------------------------
id
name
code
description
billing_interval
base_price
currency
max_students
max_teachers
max_storage_bytes
max_ai_operations
max_programs
features_json
status
created_at
updated_at
```

Example plans can be:

```text
STARTER
GROWTH
PROFESSIONAL
ENTERPRISE
```

Pricing should remain configurable rather than hard-coded.

---

# 28. Organization Subscriptions

```text
subscriptions
--------------------------------
id
organization_id
plan_id
status
billing_interval
currency
current_period_start
current_period_end
trial_end
cancel_at_period_end
cancelled_at
provider
provider_subscription_id
created_at
updated_at
```

Status:

```text
TRIALING
ACTIVE
PAST_DUE
PAUSED
CANCELLED
EXPIRED
```

Never delete organization data simply because a subscription expires.

Use grace periods and feature restrictions.

---

# 29. Usage Limits

Plan limits should be enforced centrally.

Examples:

```text
max_students
max_teachers
max_storage
max_ai_operations
max_programs
max_classes
```

Before creating a resource:

```text
current_usage < plan_limit
```

For concurrency-sensitive limits, enforce the final constraint transactionally at the database/service layer.

---

# 30. Orders and Payments

Recommended:

```text
orders
order_items
payments
payment_transactions
invoices
refunds
```

Order lifecycle:

```text
CREATED
   ↓
PENDING_PAYMENT
   ↓
PAID
   ↓
FULFILLED
```

Failure:

```text
PAYMENT_FAILED
CANCELLED
EXPIRED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 31. Payment Architecture

Never activate paid access solely because the browser reports success.

Correct flow:

```text
Student
   ↓
Create Order
   ↓
Payment Gateway
   ↓
GCash / Maya / Card / QR / etc.
   ↓
Gateway Webhook
   ↓
Verify webhook authenticity
   ↓
Idempotency check
   ↓
Mark payment PAID
   ↓
Create entitlement
   ↓
Create enrollment
   ↓
ACTIVE
```

Payment providers must be hidden behind an internal payment abstraction.

Example:

```text
PaymentService
 ├── PayMongoAdapter
 ├── MayaAdapter
 └── FutureProviderAdapter
```

This avoids coupling the core LMS to one gateway.

---

# 32. Payment Webhook Requirements

Webhook handlers must be:

- Authenticated
- Signature-verified
- Idempotent
- Retry-safe
- Transaction-aware
- Audited
- Observable

Store:

```text
provider_event_id
provider_transaction_id
event_type
payload_hash
received_at
processed_at
processing_status
error_message
```

Unique constraint:

```text
provider + provider_event_id
```

prevents duplicate processing.

---

# 33. Refunds and Revocation

A refund may require:

```text
Payment
   ↓
Refund
   ↓
Entitlement review
   ↓
Enrollment ACTIVE → REVOKED / EXPIRED
```

The exact policy should be configurable.

Historical learning records should normally remain available for reporting even after access is revoked.

---

# 34. Enterprise Revenue

Enterprise customers can receive:

```text
Dedicated Database
Dedicated Infrastructure
Custom Domain
SSO
Advanced RBAC
Audit Logs
API Access
SLA
Priority Support
Data Migration
Custom Integrations
Custom Reports
```

Pricing can be based on:

```text
students
storage
AI usage
support tier
infrastructure
integrations
SLA
contract duration
```

Do not hard-code enterprise pricing into the application.

---

# 35. Enterprise Tenant Isolation

Start with shared infrastructure:

```text
Shared App
   ↓
Shared MySQL
   ↓
organization_id isolation
```

Support enterprise isolation later:

```text
Enterprise Organization
   ↓
Dedicated Application
   ↓
Dedicated Database
   ↓
Dedicated Storage
   ↓
Dedicated Monitoring
```

The domain model should remain identical.

Use a tenant/infrastructure resolver so application code does not care whether a tenant uses shared or dedicated infrastructure.

---

# 36. Parent Architecture

Create:

```text
parent_student_relationships
--------------------------------
id
parent_user_id
student_user_id
relationship_type
status
created_at
```

Parents can view:

```text
Progress
Scores
Completed Lessons
Assessment Results
Activity
Reports
```

Parent permissions must not automatically become student-management permissions.

---

# 37. Assessment Architecture

```text
Assessment
 ├── Questions
 ├── Time Limit
 ├── Attempts Allowed
 ├── Passing Score
 ├── Randomization
 ├── Availability
 └── Settings
```

Tables:

```text
assessments
assessment_questions
assessment_attempts
assessment_answers
```

Attempt lifecycle:

```text
STARTED
   ↓
IN_PROGRESS
   ↓
SUBMITTED
   ↓
GRADED
```

Also support:

```text
ABANDONED
EXPIRED
CANCELLED
```

Assessment submissions must be server-authoritative.

---

# 38. Question Bank

Keep:

```text
questions
question_choices
question_media
question_imports
```

Question metadata may include:

```text
subject_id
topic_id
difficulty
question_type
learning_objective
skill
answer
explanation
status
content_scope
organization_id
created_by
```

Question lifecycle:

```text
DRAFT
IN_REVIEW
APPROVED
PUBLISHED
ARCHIVED
```

---

# 39. PDF Question Import

Existing PDF import capability should remain.

Production pipeline:

```text
PDF
 ↓
Secure Upload
 ↓
File Validation
 ↓
Object Storage
 ↓
Parser
 ↓
Text / Layout / Images
 ↓
AI Extraction
 ↓
Question Drafts
 ↓
Image Mapping
 ↓
Validation
 ↓
Human Review
 ↓
Question Bank
```

Modes:

```text
SMART
BUDGET
```

AI extraction must never automatically publish unreviewed content unless an explicit trusted workflow is enabled.

Track each import:

```text
question_imports
--------------------------------
id
organization_id
uploaded_by
source_media_id
mode
status
pages_processed
questions_detected
questions_created
errors_count
model
model_version
cost_units
created_at
completed_at
```

---

# 40. AI Architecture

AI should be a platform service, not embedded directly into controllers.

```text
AI Service
 ├── Extraction
 ├── Question Generation
 ├── Explanation
 ├── Lesson Generation
 ├── Tutoring
 ├── Grading
 └── Classification
```

Every AI operation should record:

```text
tenant
user
operation
provider
model
model_version
input_reference
output_reference
token/usage metrics
cost estimate
status
created_at
```

Use quotas:

```text
Growth
 → 100 AI operations

Professional
 → 500 AI operations

Enterprise
 → Custom
```

The exact commercial values remain configurable.

---

# 41. AI Safety and Reliability

AI output should be treated as untrusted generated content.

Requirements:

- Human review for high-impact content
- Prompt/version tracking
- Model/version tracking
- Input/output size limits
- Timeout handling
- Retry policy
- Cost controls
- Abuse protection
- PII minimization
- Tenant isolation
- Auditability
- Moderation where applicable

Never expose provider secrets to the browser.

---

# 42. Learning Progress

Use materialized progress where performance matters:

```text
lesson_progress
topic_progress
module_progress
subject_progress
program_progress
```

Example:

```text
Lesson
 ↓
Topic
 ↓
Module
 ↓
Subject
 ↓
Curriculum
 ↓
Program
```

Progress should be derived from authoritative learning events and persisted summaries.

Avoid trusting a client-supplied `progress = 100`.

---

# 43. Learning Event System

Create:

```text
learning_events
--------------------------------
id
organization_id
user_id
event_type
resource_type
resource_id
session_id
occurred_at
metadata_json
```

Events:

```text
LESSON_STARTED
LESSON_COMPLETED
VIDEO_STARTED
VIDEO_COMPLETED
QUESTION_ANSWERED
ASSESSMENT_STARTED
ASSESSMENT_SUBMITTED
ASSESSMENT_COMPLETED
PROGRAM_COMPLETED
```

Events should be append-oriented.

Do not mutate historical event records casually.

---

# 44. Analytics Architecture

Analytics should have two layers:

```text
Operational Data
      ↓
Learning Events
      ↓
Aggregations / Materialized Views
      ↓
Dashboards
```

Dashboards:

```text
Student Analytics
Teacher Analytics
Class Analytics
School Analytics
Review Center Analytics
Platform Analytics
```

Large analytics queries should not repeatedly scan the transactional database.

---

# 45. Media Architecture

Do not store large files in MySQL.

Use object storage:

```text
Application
   ↓
Object Storage
   ↓
S3-compatible provider
```

Database stores metadata:

```text
media
--------------------------------
id
organization_id
uploaded_by
file_key
original_filename
mime_type
size_bytes
checksum
visibility
status
created_at
```

Use signed URLs for private files.

Validate:

- MIME type
- Extension
- File signature where appropriate
- Size
- Upload permissions
- Malware/security scanning where required

---

# 46. Organization Branding

Each tenant should support:

```text
logo
favicon
primary_color
secondary_color
custom_domain
email_branding
portal_name
timezone
locale
```

Branding must be tenant-scoped.

Never allow arbitrary tenant CSS/JavaScript injection.

---

# 47. Organization Context

A user can belong to multiple organizations.

Example:

```text
Juan

Active Organization:
[ ABC High School ▼ ]

Organizations:
 ├── ABC High School
 └── ARATC Review Center
```

The session should maintain an active organization context.

The backend verifies that the authenticated user is actually a member of that organization.

Student "My Learning" may optionally aggregate across organizations.

---

# 48. API Architecture

Organize the Express backend by domain:

```text
/modules

auth
users
organizations
memberships
roles
permissions

schools
academic-years
grades
sections
classes

programs
curriculums
subjects
modules
topics
lessons
content-versions

questions
question-imports
assessments

enrollments
entitlements
enrollment-codes

progress
learning-events
analytics
reports

billing
subscription-plans
subscriptions
orders
payments
refunds
invoices

media
notifications
ai

audit
support
```

Avoid one giant controller/service.

---

# 49. API Design Rules

Use:

```text
/api/v1
```

Example:

```text
GET    /api/v1/me
GET    /api/v1/me/learning

GET    /api/v1/organizations
POST   /api/v1/organizations

GET    /api/v1/organizations/:id/members
POST   /api/v1/organizations/:id/members

GET    /api/v1/programs
POST   /api/v1/programs
GET    /api/v1/programs/:id
PATCH  /api/v1/programs/:id

POST   /api/v1/programs/:id/publish

GET    /api/v1/programs/:id/learners
POST   /api/v1/programs/:id/enrollments

POST   /api/v1/enrollments/code

POST   /api/v1/orders
GET    /api/v1/orders/:id

POST   /api/v1/payments
POST   /api/v1/payments/webhooks/:provider
```

Use consistent:

- Pagination
- Filtering
- Sorting
- Validation
- Error format
- Correlation IDs
- Idempotency keys
- Rate limits

---

# 50. API Error Contract

Use a consistent response shape:

```json
{
  "error": {
    "code": "ENROLLMENT_ALREADY_EXISTS",
    "message": "The student is already enrolled in this program.",
    "requestId": "req_..."
  }
}
```

Do not expose stack traces or internal SQL errors to clients.

---

# 51. Idempotency

Required for:

```text
Payments
Webhook processing
Enrollment creation
Bulk imports
Provisioning
Important asynchronous commands
```

Example:

```http
Idempotency-Key: <unique-client-key>
```

Store the result for safe retries.

---

# 52. Database Architecture

Recommended domains:

```text
IDENTITY
--------------------------------
users
organizations
organization_memberships
roles
permissions
role_permissions
sessions


SCHOOL
--------------------------------
academic_years
grade_levels
sections
classes
class_members
class_teachers


REVIEW CENTER
--------------------------------
cohorts
cohort_members
cohort_instructors


CONTENT
--------------------------------
programs
curriculums
subjects
modules
topics
lessons
content_versions
media


QUESTION BANK
--------------------------------
questions
question_choices
question_media
question_imports


ASSESSMENT
--------------------------------
assessments
assessment_questions
assessment_attempts
assessment_answers


LEARNING
--------------------------------
enrollments
entitlements
lesson_progress
topic_progress
module_progress
subject_progress
program_progress
learning_events


BILLING
--------------------------------
subscription_plans
subscriptions
orders
order_items
payments
payment_transactions
invoices
refunds


ACCESS
--------------------------------
enrollment_codes
invitations


COMMUNICATION
--------------------------------
notifications
notification_preferences
notification_deliveries


SECURITY
--------------------------------
audit_logs
security_events
sessions


AI
--------------------------------
ai_operations
ai_usage
ai_jobs
```

---

# 53. Database Production Rules

Use:

- Foreign keys
- Unique constraints
- Check constraints where supported
- Composite indexes
- Soft deletion where appropriate
- Transactions for multi-step state changes
- UTC timestamps
- Decimal/fixed precision for money
- Integer minor currency units where appropriate
- Optimistic locking for editable content
- Database migrations
- Backups
- Restore testing

Never use floating-point values for monetary amounts.

---

# 54. Important Database Indexes

At minimum, index common tenant and access paths:

```text
organization_memberships:
  (organization_id, user_id)
  (user_id, status)

programs:
  (organization_id, status)
  (status, visibility)

enrollments:
  (organization_id, user_id, status)
  (user_id, status)
  (program_id, status)

entitlements:
  (user_id, resource_type, resource_id, status)
  (organization_id, status)

learning_events:
  (organization_id, user_id, occurred_at)
  (resource_type, resource_id, occurred_at)

audit_logs:
  (organization_id, created_at)
  (actor_user_id, created_at)

payments:
  (provider, provider_transaction_id)
```

Exact indexing should be validated from real query plans.

---

# 55. Transactions

Use database transactions for operations such as:

```text
Create order + order items
Payment state transition
Payment → entitlement → enrollment
Bulk enrollment
Program publishing
Content version publishing
Organization provisioning
Refund → access revocation
```

Do not allow partially completed state transitions.

---

# 56. Concurrency and Race Conditions

Production systems must handle two requests arriving simultaneously.

Examples:

```text
Two payment webhooks
Two enrollment requests
Two teachers editing the same lesson
Two users consuming the last enrollment-code use
Two admins exceeding a plan limit
```

Use:

- Unique constraints
- Transactions
- Row locks where appropriate
- Optimistic locking
- Idempotency keys
- Atomic counters
- Retry-safe commands

---

# 57. Content Editing Concurrency

Use a version field:

```text
content.version
```

Client sends:

```text
expected_version = 7
```

If current version is 8:

```text
409 CONFLICT
```

The client must reload/merge instead of silently overwriting another user's changes.

---

# 58. Authentication

Production authentication should support:

```text
Email + Password
Email Verification
Password Reset
Session Management
Refresh Token Rotation where applicable
Logout
Logout All Sessions
Account Lock / Risk Controls
MFA
```

Enterprise later:

```text
OIDC
SAML
SSO
SCIM
```

Passwords must use a modern adaptive password hash.

Never store plaintext passwords.

---

# 59. Session Security

Use:

- Secure cookies where appropriate
- HttpOnly cookies
- SameSite protection
- Short-lived access credentials
- Rotation/revocation
- Device/session listing
- Logout-all capability
- Suspicious-session detection

Do not put long-lived sensitive secrets in localStorage by default.

---

# 60. Authorization Middleware

Conceptually:

```text
authenticate()
    ↓
resolveOrganization()
    ↓
requireMembership()
    ↓
requirePermission()
    ↓
loadResource()
    ↓
verifyResourceScope()
    ↓
handler()
```

Resource authorization must happen close to the data access layer as well.

---

# 61. Tenant Isolation

Every organization-owned resource must be scoped.

Bad:

```sql
SELECT * FROM lessons WHERE id = ?
```

Better:

```sql
SELECT *
FROM lessons
WHERE id = ?
  AND organization_id = ?
```

For platform-owned content, explicitly identify:

```text
content_scope = PLATFORM
```

Never assume `NULL organization_id` automatically means accessible.

---

# 62. Super Admin Safety

Super Admin is platform-wide and therefore extremely sensitive.

Recommended:

- MFA required
- Strong session controls
- Separate audit trail
- IP/device/risk monitoring where appropriate
- Step-up authentication for destructive actions
- No routine use of Super Admin for normal school administration

Use support/admin impersonation only with explicit authorization and complete auditing.

---

# 63. Audit Logging

Create:

```text
audit_logs
--------------------------------
id
organization_id
actor_user_id
action
resource_type
resource_id
request_id
ip_hash / appropriate network metadata
user_agent
before_json
after_json
metadata_json
created_at
```

Log important events:

```text
Organization created
Member invited
Role changed
Student enrolled
Content created
Content published
Content deleted
Question imported
Assessment published
Payment state changed
Refund issued
Subscription changed
Permissions changed
API key created/revoked
SSO configuration changed
```

Audit records should be append-oriented and access-controlled.

---

# 64. Security Events

Separate security-sensitive events from ordinary product audit events where useful:

```text
security_events
--------------------------------
login_failed
login_success
password_changed
mfa_enabled
mfa_disabled
session_revoked
suspicious_activity
rate_limit_triggered
permission_denied
```

This enables security monitoring without polluting product analytics.

---

# 65. Rate Limiting and Abuse Protection

Apply different limits to:

```text
Login
Password reset
OTP/email verification
Enrollment codes
Public catalog
Search
AI operations
File uploads
Assessment submission
Payment endpoints
Webhook endpoints
```

Use distributed rate limiting when the application is horizontally scaled.

---

# 66. File Upload Security

For every upload:

```text
Authenticate
 ↓
Authorize
 ↓
Validate size
 ↓
Validate type
 ↓
Validate file signature
 ↓
Generate safe object key
 ↓
Store object
 ↓
Scan where required
 ↓
Persist metadata
```

Never trust the original filename or extension.

Do not allow user-controlled paths.

---

# 67. Notifications

Create:

```text
notifications
notification_preferences
notification_deliveries
```

Channels:

```text
IN_APP
EMAIL
PUSH
SMS
```

Events:

```text
Enrollment
Assignment
Assessment result
Program announcement
Payment receipt
Subscription renewal
Payment failure
Security alert
```

Notification delivery should be asynchronous.

---

# 68. Background Jobs

Use a queue/job system for:

```text
Email
Notifications
PDF processing
AI extraction
AI generation
Video processing
Report generation
Bulk imports
CSV exports
Analytics aggregation
Webhook retries
Subscription reconciliation
```

Do not run heavy jobs synchronously inside HTTP requests.

Job records should support:

```text
PENDING
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

with retry counts and error details.

---

# 69. Search Architecture

Start with database-backed search if scale allows.

As the platform grows, introduce a search service for:

```text
Programs
Lessons
Questions
Students
Organizations
Reports
```

Search must remain tenant-aware.

A search result must never leak another organization's data.

---

# 70. Reporting and Exports

Reports should support:

```text
Student Progress
Class Performance
Assessment Results
Program Completion
Organization Usage
Subscription Usage
AI Usage
Revenue
Enrollment
Teacher Activity
```

Large exports should run as background jobs.

Generate a temporary signed download link rather than blocking the request.

---

# 71. Data Retention

Define retention policies for:

```text
Learning events
Audit logs
Security events
Payment records
Invoices
Deleted users
Deleted organizations
AI logs
Temporary files
```

Retention should be configurable according to contractual, operational, and legal requirements.

Do not permanently delete financial/audit records merely because a user requests account deletion when retention is required.

---

# 72. Privacy

Production privacy architecture should support:

```text
Data minimization
Purpose limitation
Access controls
Export
Correction
Deletion workflows
Retention policies
Consent/preferences where applicable
```

Sensitive data should not be unnecessarily included in logs, analytics, AI prompts, or support tools.

---

# 73. Observability

Every request should have:

```text
request_id
trace_id
user_id where appropriate
organization_id where appropriate
```

Monitor:

```text
API latency
Error rate
Database latency
Queue latency
Job failures
Payment failures
Webhook failures
AI failures
Storage failures
Authentication failures
```

Use structured logs rather than plain unstructured strings.

Never log:

```text
passwords
tokens
payment secrets
API secrets
raw sensitive personal data unnecessarily
```

---

# 74. Health Checks

Expose separate health concepts:

```text
/liveness
/readiness
```

Readiness should verify critical dependencies such as:

```text
Database
Queue
Required external services
```

Liveness should remain lightweight.

---

# 75. Monitoring and Alerting

Production alerts should cover:

```text
High 5xx rate
Database unavailable
Queue backlog
Payment webhook failures
Repeated failed jobs
Storage failures
Authentication attack patterns
Subscription reconciliation failures
High AI spend
Unexpected usage spikes
```

Alerts should be actionable and routed to the correct operational owner.

---

# 76. Deployment Architecture

Recommended initial production model:

```text
                    CDN / WAF
                       ↓
                Load Balancer
                       ↓
              Next.js Web / API
                       ↓
                Express API
                 /         \
                ↓           ↓
             MySQL        Redis/Queue
                │             │
                │             ↓
                │        Worker Services
                │
                ↓
          Object Storage
```

As scale grows:

```text
CDN/WAF
   ↓
Load Balancer
   ↓
Web + API instances
   ↓
Service layer
   ├── Primary DB
   ├── Read replicas
   ├── Redis
   ├── Queue
   ├── Object Storage
   └── Search
```

---

# 77. Environment Separation

Maintain:

```text
LOCAL
DEVELOPMENT
STAGING
PRODUCTION
```

Never use production credentials locally.

Never point staging at production databases.

Use separate:

```text
Database
Storage
Queues
Secrets
Payment credentials
AI credentials
Domains
```

---

# 78. Secrets Management

Secrets must live outside source code.

Examples:

```text
DATABASE_URL
JWT_SECRET
SESSION_SECRET
PAYMENT_SECRET
PAYMENT_WEBHOOK_SECRET
OBJECT_STORAGE_SECRET
AI_PROVIDER_KEY
EMAIL_PROVIDER_KEY
```

Use a proper secret manager in production where possible.

Rotate credentials periodically and immediately after suspected exposure.

---

# 79. CI/CD

Production pipeline:

```text
Pull Request
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Security Checks
   ↓
Migration Validation
   ↓
Staging
   ↓
Smoke Tests
   ↓
Approval
   ↓
Production
```

Database migrations must be backward-compatible where rolling deployments are used.

---

# 80. Database Migration Strategy

Never manually edit production tables as the normal deployment process.

Use versioned migrations:

```text
migration_001
migration_002
migration_003
...
```

For dangerous changes:

```text
Expand
 ↓
Deploy compatible code
 ↓
Backfill
 ↓
Switch reads/writes
 ↓
Contract
```

Avoid destructive schema changes in the same release as code that still depends on the old schema.

---

# 81. Backup and Disaster Recovery

Production must have:

```text
Automated backups
Point-in-time recovery where available
Off-site/independent backup strategy
Backup encryption
Restore testing
Documented recovery procedures
```

Define:

```text
RPO = Recovery Point Objective
RTO = Recovery Time Objective
```

Do not claim a backup strategy is sufficient until restores have actually been tested.

---

# 82. Disaster Recovery

For critical production:

```text
Primary Region
     ↓
Backups / Replication
     ↓
Recovery Environment
```

Document:

```text
Database recovery
Object storage recovery
Secret recovery
Queue recovery
DNS recovery
Payment reconciliation
Tenant recovery
```

---

# 83. Enterprise SSO

Design for:

```text
OIDC
SAML
```

Enterprise organization settings:

```text
sso_enabled
sso_provider
issuer
client_id
certificate/configuration reference
domain_mapping
```

Never store private certificates/secrets as ordinary database plaintext where a secret manager can be used.

---

# 84. Enterprise SCIM

Future provisioning:

```text
Enterprise IdP
      ↓
SCIM
      ↓
ARC
      ↓
Users / Memberships / Groups
```

Support:

```text
Create user
Update user
Deactivate user
Group mapping
Role mapping
```

---

# 85. Enterprise API and Webhooks

Organizations may receive:

```text
API Keys
OAuth/OIDC integrations
Outbound Webhooks
```

API keys should have:

```text
key_id
hashed_secret
organization_id
scopes
created_by
created_at
expires_at
revoked_at
last_used_at
```

Store only hashes of secrets when possible.

Webhook delivery must support:

```text
Signed payloads
Retries
Exponential backoff
Idempotency
Delivery logs
Replay protection
```

---

# 86. Custom Domains

Enterprise and higher-tier organizations may use:

```text
learn.school.edu
lms.example.org
```

Domain lifecycle:

```text
Requested
 ↓
DNS Verification
 ↓
Certificate Provisioning
 ↓
Active
```

Never activate a custom domain before ownership verification.

---

# 87. Organization Provisioning

Provisioning workflow:

```text
Create Organization
   ↓
Select Plan
   ↓
Create Owner Membership
   ↓
Configure Branding
   ↓
Configure Academic/Org Structure
   ↓
Configure Limits
   ↓
Configure Billing
   ↓
Ready
```

Enterprise:

```text
Contract
 ↓
Provision tenant
 ↓
Provision infrastructure
 ↓
Configure SSO
 ↓
Migrate data
 ↓
Validate
 ↓
Go Live
```

Provisioning should be resumable and idempotent.

---

# 88. Support and Admin Operations

Build internal support tools for:

```text
Search user
Search organization
View membership
View enrollment
View payment
View audit history
View job failures
View subscription
```

Support access must be permissioned and audited.

Avoid unrestricted "impersonate user" functionality.

If impersonation exists:

```text
Explicit authorization
 ↓
Short-lived session
 ↓
Visible impersonation state
 ↓
Full audit trail
 ↓
Automatic expiry
```

---

# 89. Frontend Architecture

Admin:

```text
/dashboard
/dashboard/overview
/dashboard/organizations
/dashboard/programs
/dashboard/programs/:id
/dashboard/programs/:id/curriculum
/dashboard/programs/:id/subjects
/dashboard/programs/:id/modules
/dashboard/programs/:id/topics
/dashboard/programs/:id/lessons
/dashboard/programs/:id/questions
/dashboard/programs/:id/assessments
/dashboard/programs/:id/learners

/dashboard/students
/dashboard/teachers
/dashboard/classes
/dashboard/sections
/dashboard/batches
/dashboard/enrollments

/dashboard/question-bank
/dashboard/question-bank/import

/dashboard/billing
/dashboard/subscriptions
/dashboard/reports
/dashboard/settings
```

Student:

```text
/student
/student/dashboard
/student/learning
/student/explore
/student/programs/:id
/student/lessons/:id
/student/assessments
/student/practice
/student/progress
/student/profile
```

Do not force students to use the admin interface.

---

# 90. Program Management UI

A program detail page should support:

```text
Overview
Curriculum
Subjects
Modules
Topics
Lessons
Questions
Assessments
Learners
Settings
Versions
Activity
```

Example:

```text
ARATC Senior High School Curriculum
DRAFT

4 Curriculums
0 Learners
0 Assessments

[ Edit ] [ Preview ] [ Submit for Review ] [ Publish ]

Overview
Curriculum
Subjects
Modules
Topics
Lessons
Questions
Assessments
Learners
Versions
Activity
```

---

# 91. Program Learners UI

Add a dedicated learner management view:

```text
Learners

[ + Enroll Students ]

Search...

Active
Pending
Completed
Expired

Student
Organization
Class/Batch
Curriculum
Progress
Status
```

Bulk operations:

```text
Enroll
Suspend
Resume
Change curriculum
Export
```

Dangerous operations require confirmation and permission.

---

# 92. Teacher Content UI

Teacher dashboard:

```text
My Classes
My Content
Assignments
Assessments
Question Bank
Student Progress
```

Create content:

```text
[ + Create ]

Subject
Module
Topic
Lesson
Question
Assessment
Assignment
```

Teacher content should clearly display:

```text
DRAFT
PENDING REVIEW
PUBLISHED
ARCHIVED
```

and ownership:

```text
Created by You
Organization Content
Platform Content
```

---

# 93. School Admin Content UI

School Admin should see:

```text
Organization Content
Platform Content
Teacher Content
```

Actions:

```text
Create
Edit
Review
Approve
Publish
Archive
Duplicate
Assign
```

Platform content should be read-only unless the user has explicit platform-content permissions.

---

# 94. Student Experience

The student should have:

```text
Home
My Learning
Explore
Practice
Assessments
Progress
Notifications
Profile
```

The core experience should emphasize:

```text
Continue Learning
Upcoming Assessments
Recent Results
Recommended Practice
Progress
```

---

# 95. Complete Student Journey — School

```text
School Admin
   ↓
Create/import student
   ↓
Student membership
   ↓
Assign grade/section
   ↓
Enroll / assign program
   ↓
Enrollment ACTIVE
   ↓
Student logs in
   ↓
My Learning
   ↓
Lessons
   ↓
Practice
   ↓
Assessments
   ↓
Progress
```

Teacher-created content can enter the same learning experience.

---

# 96. Complete Student Journey — Review Center

```text
Student
   ↓
Create account
   ↓
Explore
   ↓
CET Review 2027
   ↓
Purchase
   ↓
Payment
   ↓
Verified webhook
   ↓
Entitlement
   ↓
Enrollment
   ↓
My Learning
```

---

# 97. Complete Student Journey — Enrollment Code

```text
Student
   ↓
Join Program
   ↓
Enter Code
   ↓
Validate
   ↓
Check policy
   ↓
Enrollment ACTIVE
   ↓
My Learning
```

---

# 98. Complete Teacher Journey

```text
Teacher
   ↓
My Classes
   ↓
Select Class
   ↓
Create Lesson
   ↓
Save Draft
   ↓
Add Questions / Practice
   ↓
Assign to Class
   ↓
Submit for Review
   ↓
School Admin Approves
   ↓
Publish
   ↓
Students Access
   ↓
Teacher Monitors Progress
```

If auto-publish is enabled:

```text
Teacher
   ↓
Create
   ↓
Publish
```

---

# 99. Complete School Admin Journey

```text
School Admin
   ↓
Organization Dashboard
   ├── Students
   ├── Teachers
   ├── Academic Years
   ├── Classes
   ├── Content
   ├── Programs
   ├── Enrollments
   ├── Reports
   └── Settings
```

---

# 100. Complete Platform Admin Journey

```text
Super Admin
   ↓
Organizations
   ↓
Subscriptions
   ↓
Platform Content
   ↓
Users
   ↓
Billing
   ↓
Analytics
   ↓
Audit / Security
   ↓
System Settings
```

---

# 101. Revenue Streams

ARC can support five major revenue streams:

```text
                    ARC REVENUE
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
      SaaS              B2C            Enterprise
       │                 │                 │
   Schools          Paid Programs    Dedicated Infra
   Centers          Review Courses   SSO
   Organizations    Mock Exams       SLA
       │
       └───────────────┬───────────────────
                       │
                      AI
                       │
                 Usage / Credits

Additional:
Professional Services
Data Migration
Training
Custom Integrations
```

---

# 102. Professional Services

Charge separately where appropriate for:

```text
Setup
Data Migration
Student Import
Question Bank Migration
Custom Branding
Custom Domain
Training
Integration
Custom Reports
Enterprise Onboarding
```

These should be represented as commercial products/contracts rather than hard-coded fees.

---

# 103. Billing State Machines

Subscription:

```text
TRIALING
   ↓
ACTIVE
   ↓
PAST_DUE
   ↓
ACTIVE / CANCELLED
```

Payment:

```text
PENDING
   ↓
PAID
```

or:

```text
PENDING
   ↓
FAILED
```

Order:

```text
CREATED
   ↓
PENDING_PAYMENT
   ↓
PAID
   ↓
FULFILLED
```

State transitions must be validated by the backend.

---

# 104. Feature Flags

Use feature flags for gradual rollout:

```text
teacher_content_creation
teacher_auto_publish
ai_question_generation
marketplace
custom_domains
sso
advanced_reports
```

Flags should be scoped by:

```text
platform
organization
plan
user
```

Do not use feature flags as the only security boundary.

---

# 105. Configuration Management

Separate:

```text
Environment Configuration
Tenant Configuration
Product Configuration
Feature Flags
```

Avoid putting business rules into scattered frontend constants.

Examples:

```text
MAX_UPLOAD_SIZE
DEFAULT_SESSION_DURATION
SUPPORTED_FILE_TYPES
PLAN_LIMITS
ENROLLMENT_POLICIES
```

---

# 106. Production Data Consistency

Authoritative state must live on the backend.

Examples:

```text
Payment status
Enrollment status
Assessment score
Program publication
Subscription status
Plan limits
Permissions
```

Frontend state is a representation, not the source of truth.

---

# 107. Caching

Cache carefully:

```text
Public program catalog
Organization settings
Permission snapshots
Frequently accessed platform content
```

Do not cache sensitive authorization decisions indefinitely.

Invalidate cache when:

```text
Role changes
Membership changes
Content publishes
Subscription changes
Entitlement revoked
Organization settings change
```

---

# 108. Queue Reliability

Every important job should support:

```text
Retry
Backoff
Dead-letter handling
Idempotency
Timeout
Cancellation
Monitoring
```

Never retry indefinitely without an operational limit.

---

# 109. External Service Reliability

For payment, email, AI, storage, and other providers:

```text
Timeouts
Retries
Circuit breakers where appropriate
Fallback behavior
Provider status tracking
Webhook reconciliation
```

A temporary provider outage must not corrupt LMS state.

---

# 110. Payment Reconciliation

Scheduled reconciliation should compare:

```text
ARC Orders
ARC Payments
Provider Transactions
Subscriptions
Entitlements
Enrollments
```

Detect:

```text
Paid externally but unpaid internally
Paid internally but missing provider confirmation
Duplicate transaction
Missing webhook
Unexpected refund
Expired subscription still active
```

Reconciliation jobs are essential for production billing.

---

# 111. Enrollment Reconciliation

Run consistency checks for:

```text
Active enrollment without entitlement
Active entitlement without valid source
Expired entitlement with active access
Cancelled order with active paid entitlement
Duplicate active enrollment
```

Do not rely exclusively on scheduled reconciliation; enforce consistency during writes too.

---

# 112. Data Import

Support:

```text
CSV
Excel where required
Bulk student import
Teacher import
Class import
Question import
```

Import pipeline:

```text
Upload
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Process asynchronously
 ↓
Result report
```

Never import directly from an unvalidated spreadsheet into production tables.

---

# 113. Import Error Reporting

Provide:

```text
Rows processed
Rows succeeded
Rows failed
Rows skipped
Error reasons
Downloadable error CSV
```

Allow safe retry of failed rows.

---

# 114. Soft Delete

Use soft deletion for important entities:

```text
Users
Organizations
Programs
Lessons
Questions
Assessments
```

Typical:

```text
deleted_at
deleted_by
```

Do not automatically soft-delete everything. Some append-only/event/financial records require different retention models.

---

# 115. Data Ownership Rules

Every important resource must answer:

```text
Who owns this?
Who created it?
Which organization owns it?
Which version is active?
Who can modify it?
Who can publish it?
Who can access it?
What grants access?
```

If those questions cannot be answered from the model, the entity needs clearer ownership/access metadata.

---

# 116. Production Readiness Checklist

## Identity

```text
[ ] Email verification
[ ] Password reset
[ ] Secure sessions
[ ] Session revocation
[ ] MFA
[ ] Account security events
```

## Authorization

```text
[ ] RBAC
[ ] Permission checks
[ ] Tenant isolation
[ ] Resource authorization
[ ] Least privilege
[ ] Super Admin protection
```

## Content

```text
[ ] Platform content
[ ] Organization content
[ ] Teacher content
[ ] Content approval
[ ] Content versioning
[ ] Publish workflow
[ ] Archive workflow
```

## Learning

```text
[ ] Programs
[ ] Curriculums
[ ] Subjects
[ ] Modules
[ ] Topics
[ ] Lessons
[ ] Questions
[ ] Assessments
[ ] Enrollment
[ ] Entitlements
[ ] Progress
[ ] Learning events
```

## School

```text
[ ] Academic years
[ ] Grades
[ ] Sections
[ ] Classes
[ ] Students
[ ] Teachers
[ ] Parents
[ ] Bulk enrollment
[ ] Bulk import
```

## Billing

```text
[ ] Plans
[ ] Subscriptions
[ ] Orders
[ ] Payments
[ ] Webhooks
[ ] Idempotency
[ ] Refunds
[ ] Invoices
[ ] Reconciliation
```

## Enterprise

```text
[ ] SSO-ready architecture
[ ] SAML/OIDC design
[ ] SCIM-ready model
[ ] Custom domains
[ ] API keys
[ ] Webhooks
[ ] Audit logs
[ ] Dedicated infrastructure option
```

## Infrastructure

```text
[ ] CDN/WAF
[ ] TLS
[ ] Database backups
[ ] Restore testing
[ ] Queue
[ ] Object storage
[ ] Monitoring
[ ] Alerting
[ ] Structured logs
[ ] Health checks
```

---

# 117. Recommended Implementation Phases

## Phase 0 — Foundation

```text
Authentication
Authorization
Database migrations
Validation
Logging
Error handling
API versioning
```

## Phase 1 — Multi-tenancy

```text
Organizations
Memberships
Organization context
Tenant authorization
Organization settings
```

## Phase 2 — School Management

```text
Academic years
Grades
Sections
Classes
Students
Teachers
Parents
```

## Phase 3 — Content Ownership

```text
Platform content
Organization content
Teacher content
Content permissions
Content approval
```

## Phase 4 — Content Versioning

```text
Drafts
Reviews
Published versions
Archive
Derived organization copies
```

## Phase 5 — Enrollment

```text
Enrollments
Enrollment codes
Class-based assignment
Bulk enrollment
My Learning
```

## Phase 6 — Assessment

```text
Question bank
Assessments
Attempts
Answers
Grading
Results
```

## Phase 7 — Progress & Analytics

```text
Progress summaries
Learning events
Teacher dashboards
School dashboards
```

## Phase 8 — Marketplace & Billing

```text
Catalog
Orders
Payments
Webhooks
Entitlements
B2C purchases
```

## Phase 9 — SaaS Billing

```text
Plans
Subscriptions
Usage limits
Invoices
Reconciliation
```

## Phase 10 — AI Platform

```text
AI service
PDF extraction
Question generation
Usage metering
Quotas
Human review
```

## Phase 11 — Enterprise

```text
SSO
Advanced RBAC
SCIM
Custom domains
API keys
Webhooks
Dedicated infrastructure
```

## Phase 12 — Scale & Operations

```text
Read replicas
Search
Advanced analytics
Disaster recovery
Multi-region strategy
Advanced observability
```

---

# 118. What Should NOT Be Over-Engineered Initially

Do not immediately build:

```text
Microservices for every domain
Separate database for every school
Multi-region active-active
Complex event sourcing everywhere
Custom search cluster
Full AI agent platform
SCIM
SAML
Complex revenue recognition
```

Start with a modular monolith:

```text
Next.js
   ↓
Express Modular API
   ↓
MySQL
   ↓
Redis / Queue
   ↓
Object Storage
```

But enforce clean domain boundaries so services can be extracted later.

---

# 119. Recommended Initial Architecture

```text
                    CDN / WAF
                       │
                       ▼
                Next.js Application
                       │
                       ▼
                Express API
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
      MySQL          Redis           Queue
        │                              │
        │                              ▼
        │                           Workers
        │                              │
        └──────────────┬───────────────┘
                       ▼
                Object Storage
```

Application modules:

```text
Identity
Organizations
Authorization
School
Content
Learning
Assessment
Enrollment
Billing
AI
Media
Notifications
Analytics
Audit
```

This is enterprise-capable without unnecessary microservice complexity.

---

# 120. Final Domain Architecture

```text
                              ARC LMS
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
         PLATFORM                                TENANTS
              │                                     │
      ┌───────┼────────┐                 ┌──────────┴──────────┐
      │       │        │                 │                     │
 Super Admin Content  Global           SCHOOL             REVIEW CENTER
            Admin    Content             │                     │
                                         │                     │
                                     Classes               Cohorts
                                         │                     │
                                         └──────────┬──────────┘
                                                    │
                                                  USERS
                                                    │
                                              Memberships
                                                    │
                                                    ▼
                                              ENROLLMENTS
                                                    │
                              ┌─────────────────────┼──────────────────┐
                              │                     │                  │
                           PROGRAM              ENTITLEMENT        ASSIGNMENT
                              │                     │                  │
                         Curriculum                │                  │
                              │                     │                  │
                           Subject                 │                  │
                              │                     │                  │
                           Module                  │                  │
                              │                     │                  │
                            Topic                   │                  │
                              │                     │                  │
                           Lesson                  │                  │
                              │                     │                  │
                       Assessment                   │                  │
                              │                     │                  │
                           Progress ◄───────────────┴──────────────────┘
                              │
                           Analytics


                         REVENUE ENGINE
                              │
              ┌───────────────┼────────────────┐
              │               │                │
             SaaS            B2C          Enterprise
              │               │                │
        Subscriptions      Orders         Contracts
        Organizations      Programs       Dedicated Infra
        Usage Limits       Courses        SSO / SLA
              │               │                │
              └───────────────┼────────────────┘
                              │
                       Payment Gateway
                              │
                    Orders / Payments
                              │
                         Entitlements


                       PLATFORM SERVICES
                              │
       ┌────────┬────────┬────┼───────┬────────┬─────────┐
       │        │        │    │       │        │         │
     Identity Security  AI  Media  Queue   Audit  Notifications
       │                 │
       │             PDF Extraction
       │             Question Generation
       │             AI Tutoring
       │
       └────────────── Observability
```

---

# 121. The Most Important Rules

### Rule 1 — Organization is not enrollment

```text
Membership ≠ Enrollment
```

### Rule 2 — Enrollment is not entitlement

```text
Enrollment = learning relationship
Entitlement = permission/access right
```

### Rule 3 — Platform content is not organization content

```text
PLATFORM
   ≠
ORGANIZATION
```

### Rule 4 — Teachers can create content

Teachers should be first-class content creators inside their organization, with configurable publishing/approval permissions.

### Rule 5 — School Admins can create content

School Admins should be able to build and manage organization-owned curriculum/content.

### Rule 6 — Platform content must be protected

Organization users cannot modify ARC global content unless explicitly granted platform-level permissions.

### Rule 7 — Backend owns authorization

Frontend hiding is not security.

### Rule 8 — Payments activate access only after verified server-side confirmation

```text
Payment Webhook
   ↓
Verification
   ↓
Transaction
   ↓
Entitlement
   ↓
Enrollment
```

### Rule 9 — Published content is versioned

Never silently mutate what an existing learner is consuming.

### Rule 10 — Everything important must be auditable

```text
Who
What
When
Where
Before
After
Request ID
```

---

# 122. Final Product Vision

ARC LMS should become:

> **A multi-tenant education operating platform where ARC provides reusable learning content and infrastructure, organizations manage their own learners and content, teachers create and deliver learning experiences, students access authorized programs through enrollments and entitlements, and enterprises receive configurable security, integrations, billing, and dedicated infrastructure.**

The existing learning architecture remains the core:

```text
Program
 → Curriculum
 → Subject
 → Module
 → Topic
 → Lesson
 → Assessment
 → Progress
```

The production-ready architecture surrounds it with:

```text
Identity
 → Organization
 → Membership
 → Role / Permission
 → Enrollment
 → Entitlement
 → Billing
 → Learning
 → Analytics
 → Audit
 → Security
 → Operations
```

This gives ARC a foundation for:

```text
Schools
Review Centers
Universities
Training Centers
Corporate Learning
Individual Students
B2C Marketplace
SaaS Subscriptions
Enterprise Contracts
AI Learning Services
```

without requiring a platform rewrite as the business grows.
