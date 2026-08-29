# ARC LMS — PHASE 1 ORGANIZATION & REVIEW CENTER

## Production-Ready Implementation Specification

**Product:** Accelerated Review Center (ARC) Platform
**Phase:** Phase 1 — Organization / Review Center
**Priority:** BUCET Reviewer & College Readiness Program
**Status:** Implementation Target
**Architecture Strategy:** Incremental enhancement of existing LMS
**Critical Requirement:** Preserve existing frontend, backend, routes, APIs, and learning-content architecture wherever possible.

---

# 1. PHASE 1 OBJECTIVE

The immediate objective is to transform the existing LMS into a production-ready **organization-based learning platform** for ARC Review Center.

The first production organization will be:

> **ARC Review Center**

ARC will offer:

1. **BUCET Reviewer & CBT Mock Exam**
2. **College Readiness Program (CRP)**

The system must support:

- Organization management
- Organization administration
- Teachers
- Students
- Programs
- Curriculum
- Subjects
- Modules
- Topics
- Lessons
- Questions
- Assessments
- Enrollment
- Student progress
- Analytics
- Parent monitoring foundations
- Production-grade authentication and authorization

---

# 2. IMPORTANT SCOPE RULE

This phase focuses ONLY on:

> **Review Center / Organization use case**

Do NOT build the full School/K-12 multi-school architecture yet.

The architecture must remain extensible enough to support schools later, but school-specific workflows are OUT OF SCOPE for Phase 1.

Future organization types may include:

```text
REVIEW_CENTER
SCHOOL
TRAINING_CENTER
UNIVERSITY
CORPORATE
OTHER
```

For Phase 1:

```text
Organization Type = REVIEW_CENTER
```

---

# 3. HIGH-LEVEL ARCHITECTURE

```text
                         ARC LMS PLATFORM
                                │
                                ▼
                         PLATFORM ADMIN
                         / SUPER ADMIN
                                │
                                ▼
                      ORGANIZATION MANAGEMENT
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    ARC REVIEW CENTER   │
                    │       ORGANIZATION     │
                    │   type: REVIEW_CENTER  │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ORGANIZATION          TEACHERS           STUDENTS
           ADMIN                  │                  │
              │                   │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                              PROGRAMS
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
                   ▼                           ▼
          BUCET REVIEWER & CBT            COLLEGE READINESS
                  PROGRAM                     PROGRAM
                   │                           │
                   ▼                           ▼
              CURRICULUM                  CURRICULUM
                   │                           │
                   ▼                           ▼
        SUBJECT → MODULE → TOPIC → LESSON
                   │
                   ▼
             QUESTION BANK
                   │
                   ▼
              ASSESSMENTS
                   │
                   ▼
          ATTEMPTS / RESULTS
                   │
                   ▼
                PROGRESS
                   │
                   ▼
               ANALYTICS
```

---

# 4. MULTI-TENANT MODEL

The platform must be organization-aware.

Conceptually:

```text
Platform
   │
   ├── Organization A
   │
   ├── Organization B
   │
   └── Organization C
```

Phase 1 only needs:

```text
Platform
   │
   └── ARC Review Center
```

However, all organization-owned resources must be designed with organization scope.

Examples:

```text
program.organization_id
subject.organization_id
lesson.organization_id
question.organization_id
assessment.organization_id
enrollment.organization_id
```

Do NOT blindly add duplicate organization columns if the existing data model already establishes ownership through another relationship.

First inspect the existing schema.

---

# 5. ORGANIZATION

## Organization Entity

An Organization represents a client/business operating on the ARC platform.

Example:

```text
Organization
-----------------------------
ID
Name
Slug
Type
Description
Logo
Status
Created At
Updated At
```

Example:

```text
Name:
ARC Review Center

Slug:
arc-review-center

Type:
REVIEW_CENTER

Status:
ACTIVE
```

---

# 6. ORGANIZATION LIFECYCLE

The recommended initial onboarding flow is:

```text
SUPER ADMIN
     │
     ▼
Create Organization
     │
     ▼
ARC Review Center
     │
     ▼
Create / Invite Organization Admin
     │
     ▼
Organization Admin Login
     │
     ▼
Configure Organization
     │
     ▼
Create Programs
```

The Organization Admin then manages the organization.

---

# 7. SUPER ADMIN / PLATFORM ADMIN

The Super Admin is a platform-level role.

Recommended internal naming:

```text
PLATFORM_ADMIN
```

UI may display:

> Super Admin

or:

> Platform Administrator

## Responsibilities

```text
Organizations
Organization onboarding
Organization activation/deactivation
Organization administration
Platform configuration
Platform-level analytics
Platform security
Audit logs
Subscription management
Feature configuration
System support
```

The Super Admin can see multiple organizations.

Example:

```text
Platform Admin
│
├── ARC Review Center
├── Powerline Review Center
└── Future Organization
```

---

# 8. ORGANIZATION ADMIN

The Organization Admin operates ONLY within their organization.

Example:

```text
ARC Review Center
    │
    └── Organization Admin
```

Permissions include:

```text
Manage teachers
Manage students
Manage programs
Manage curriculum
Manage content
Manage questions
Manage assessments
Manage enrollments
View organization analytics
Manage organization settings
```

They MUST NOT access:

```text
Other organizations
Platform settings
Platform billing
Other tenants' users
Other organizations' content
```

---

# 9. TEACHER

Teacher belongs to an organization.

Example:

```text
Teacher
   │
   └── ARC Review Center
```

Teachers may be assigned to programs, subjects, modules, or other appropriate teaching scopes.

Teacher capabilities:

```text
Create lessons
Edit lessons they are authorized to manage
Create questions
Manage assigned question content
Create quizzes
Create assessments
Review student performance
View assigned students
View learning analytics
```

Teacher permissions must be organization-scoped.

---

# 10. STUDENT

Student belongs to an organization through membership/enrollment.

Example:

```text
Student
   │
   └── ARC Review Center
           │
           └── Enrollment
                  │
                  └── BUCET Reviewer
```

A student should NOT be given unrestricted access to every organization program simply because they belong to the organization.

Program access must be controlled through enrollment/entitlement.

---

# 11. ROLE MODEL

Phase 1 roles:

```text
PLATFORM_ADMIN

ORGANIZATION_ADMIN

TEACHER

STUDENT

PARENT
```

Parent is included as a foundation but advanced parent features may be implemented later.

Do NOT create unnecessary roles unless required by the current system.

---

# 12. MEMBERSHIP MODEL

Prefer a membership relationship rather than hard-coding organization ownership directly into the user.

Conceptually:

```text
User
  │
  ▼
Organization Membership
  │
  ├── Organization
  ├── Role
  ├── Status
  └── Permissions
```

Example:

```text
Juan
│
└── Membership
      ├── Organization: ARC Review Center
      └── Role: TEACHER
```

Another user:

```text
Maria
│
└── Membership
      ├── Organization: ARC Review Center
      └── Role: STUDENT
```

Platform administrator:

```text
Dexter
│
└── Platform Role
      └── PLATFORM_ADMIN
```

Use the existing authentication and role architecture where possible.

---

# 13. ORGANIZATION SECURITY

Every organization-owned API request must enforce organization scope server-side.

Never rely only on frontend filtering.

BAD:

```text
GET /programs
```

and return all organizations' programs.

GOOD:

```text
Authenticated User
      │
      ▼
Organization Context
      │
      ▼
Authorization
      │
      ▼
Organization-scoped Query
```

Example:

```text
WHERE organization_id = currentOrganizationId
```

The exact implementation must follow the existing backend architecture.

---

# 14. PROGRAM MODEL

A Program represents an offering provided by the organization.

ARC Review Center will initially have two Programs.

## Program 1

```text
BUCET Reviewer & CBT Mock Exam
```

Purpose:

Immediate preparation for students preparing for BUCET and relevant SUC entrance examinations.

## Program 2

```text
College Readiness Program (CRP)
```

Purpose:

Long-term academic readiness for Grade 9–11 learners.

---

# 15. PROGRAM HIERARCHY

The existing LMS hierarchy MUST be preserved.

The conceptual hierarchy is:

```text
Organization
    │
    ▼
Program
    │
    ▼
Curriculum
    │
    ▼
Subject
    │
    ▼
Module
    │
    ▼
Topic
    │
    ▼
Lesson
```

Questions and assessments operate alongside the curriculum.

---

# 16. PROGRAM NAVIGATION

The existing navigation should remain compatible with:

```text
Overview
Curriculum
Subjects
Modules
Topics
Lessons
Questions
Assessments
```

Do NOT create a second competing curriculum system.

The improved conceptual UI is:

```text
Program
│
├── Overview
├── Curriculum
│   ├── Subjects
│   ├── Modules
│   ├── Topics
│   └── Lessons
│
├── Question Bank
├── Assessments
├── Students
├── Teachers
├── Enrollments
├── Progress
├── Analytics
└── Settings
```

Existing routes may remain unchanged if changing them would break the frontend.

---

# 17. BUCET PROGRAM

Create:

```text
Program Name:
BUCET Reviewer & CBT Mock Exam
```

Recommended description:

```text
A comprehensive digital reviewer and computer-based testing
platform designed to help students prepare for BUCET and
other participating State University and College admission
examinations through structured practice, diagnostic testing,
mock examinations, and performance analysis.
```

---

# 18. BUCET CURRICULUM

Recommended curriculum name:

```text
BUCET Entrance Exam Curriculum
```

Primary subjects:

```text
Language Proficiency
Reading Comprehension
Science
Mathematics
```

Optional/dynamic:

```text
Abstract Reasoning
```

Abstract Reasoning should be configurable because not every exam track necessarily requires it.

---

# 19. BUCET CURRICULUM STRUCTURE

```text
BUCET Entrance Exam Curriculum
│
├── Language Proficiency
│   ├── Grammar
│   ├── Vocabulary
│   ├── Syntax
│   ├── Error Identification
│   └── Sentence Completion
│
├── Reading Comprehension
│   ├── Main Idea
│   ├── Inference
│   ├── Context Clues
│   ├── Critical Reading
│   └── Tone
│
├── Science
│   ├── General Science
│   ├── Biology
│   ├── Chemistry
│   ├── Physics
│   └── Earth & Space Science
│
└── Mathematics
    ├── Arithmetic
    ├── Intermediate Algebra
    ├── Geometry
    ├── Trigonometry
    └── Statistics
```

---

# 20. QUESTION BANK

The Question Bank must be independent from individual assessments.

Conceptually:

```text
Question Bank
    │
    ├── Questions
    │
    └── Assessment Question Mapping
```

A question can be reused.

Example:

```text
Question Q1024
     │
     ├── Lesson Practice
     ├── Diagnostic Exam
     ├── Practice Exam 1
     └── Full Mock Exam
```

Do NOT duplicate question records unnecessarily.

---

# 21. QUESTION METADATA

Questions should support metadata such as:

```text
Question ID
Organization
Subject
Module
Topic
Difficulty
Competency
Question Type
Stem
Choices
Correct Answer
Explanation
Rationale
Tags
Status
Created By
Updated By
Created At
Updated At
```

Possible difficulty:

```text
EASY
MEDIUM
HARD
```

Possible status:

```text
DRAFT
REVIEW
APPROVED
ARCHIVED
```

---

# 22. ASSESSMENT MODEL

Assessment is the general testing entity.

Types may include:

```text
QUIZ
PRACTICE_TEST
DIAGNOSTIC
MOCK_EXAM
ENTRANCE_EXAM
```

Do NOT create a separate technical engine for every assessment type.

Use one configurable Assessment Engine.

---

# 23. BUCET ASSESSMENTS

The BUCET Program can contain:

```text
Assessments
│
├── BUCET Diagnostic Exam
│
├── BUCET Practice Exam 1
│
├── BUCET Practice Exam 2
│
└── BUCET Entrance Exam Simulation
```

The actual official exam name should be used only if ARC has the appropriate rights/authorization and the naming is accurate.

---

# 24. CBT CONFIGURATION

An assessment may define:

```text
Assessment Type
Duration
Total Items
Passing Score
Maximum Attempts
Randomize Questions
Randomize Choices
Allow Review
Allow Flagging
Show Results
Show Explanations
Auto Submit
Availability Window
```

Example:

```text
BUCET Full Mock Exam

Type:
MOCK_EXAM

Duration:
Configurable

Question Count:
Configurable

Randomize Questions:
YES

Randomize Choices:
YES

Flag Questions:
YES

Auto Submit:
YES
```

Do not hard-code these values into the engine.

---

# 25. EXAM SECTIONS

A full exam should support sections.

Conceptually:

```text
Assessment
│
├── Section
│   ├── Language
│   ├── Reading
│   ├── Science
│   └── Mathematics
│
└── Question Selection
```

Each section may have:

```text
Section Name
Order
Duration
Question Count
Question Pool
Scoring Rule
```

This allows different examination configurations without rebuilding the system.

---

# 26. QUESTION RANDOMIZATION

The engine should support:

```text
Random Question Order
Random Answer Choice Order
```

Randomization must be deterministic for an individual attempt once the attempt begins.

Do not reshuffle questions every time the student refreshes the page.

Example:

```text
Exam Attempt Created
      │
      ▼
Generate Question Set
      │
      ▼
Persist Attempt Question Order
      │
      ▼
Student Takes Exam
```

The same attempt must maintain the same question ordering.

---

# 27. EXAM ATTEMPT

Every exam session should create an attempt.

Conceptually:

```text
Student
   │
   ▼
Assessment
   │
   ▼
Attempt
   │
   ├── Started At
   ├── Submitted At
   ├── Status
   ├── Question Set
   ├── Answers
   ├── Score
   └── Result
```

Possible statuses:

```text
NOT_STARTED
IN_PROGRESS
SUBMITTED
AUTO_SUBMITTED
ABANDONED
```

---

# 28. ASSESSMENT RESULT

Results should support:

```text
Raw Score
Maximum Score
Percentage
Correct Answers
Incorrect Answers
Unanswered
Time Used
Subject Performance
Topic Performance
```

Example:

```text
BUCET Mock Exam

Overall:
78%

Language:
82%

Reading:
75%

Science:
71%

Mathematics:
84%
```

---

# 29. PERFORMANCE ANALYTICS

The system should identify weaknesses.

Example:

```text
Student Performance
│
├── Mathematics
│   ├── Algebra       WEAK
│   ├── Geometry      GOOD
│   └── Statistics    NEEDS REVIEW
│
├── Science
│   └── Biology      GOOD
│
└── Reading
    └── Inference     WEAK
```

This data can later power adaptive learning recommendations.

---

# 30. COLLEGE READINESS PROGRAM

Create:

```text
Program:
College Readiness Program (CRP)
```

Target:

```text
Grade 9
Grade 10
Grade 11
```

Optional foundation:

```text
Grade 8 Algebra & Foundation Bridging
```

---

# 31. CRP CURRICULUM

Recommended structure:

```text
College Readiness Program
│
├── Grade 8 Foundation
│   └── Algebra Bridging
│
├── Grade 9
│   ├── Mathematics
│   ├── Science
│   └── English
│
├── Grade 10
│   ├── Mathematics
│   ├── Science
│   └── English
│
└── Grade 11
    ├── Mathematics
    ├── Science
    └── English
```

The exact curriculum mapping should be configurable rather than permanently hard-coded.

---

# 32. ENROLLMENT

Student membership and program enrollment are different concepts.

Membership:

```text
Student
   ↓
ARC Review Center
```

Enrollment:

```text
Student
   +
BUCET Reviewer
   ↓
Enrollment
```

Therefore:

A student can belong to ARC without being enrolled in every program.

---

# 33. ENROLLMENT STATES

Recommended:

```text
PENDING
ACTIVE
SUSPENDED
COMPLETED
CANCELLED
EXPIRED
```

Example:

```text
Maria
│
├── ARC Organization Membership
│
└── BUCET Reviewer Enrollment
       └── ACTIVE
```

---

# 34. PROGRAM ACCESS

Do not equate:

```text
organization membership = program access
```

Instead:

```text
Organization Membership
          │
          ▼
Enrollment
          │
          ▼
Program Access
```

Later, the system may add:

```text
Entitlement
Subscription
Payment
Access Period
```

without changing the fundamental learning architecture.

---

# 35. TEACHER ASSIGNMENT

Teachers belong to the organization.

They may then be assigned to:

```text
Program
Subject
Module
```

Example:

```text
ARC Review Center
│
└── BUCET Reviewer
      │
      ├── Mathematics → Teacher A
      ├── Science     → Teacher B
      └── English     → Teacher C
```

The exact assignment granularity should follow what the current system already supports.

---

# 36. CONTENT OWNERSHIP

Important distinction:

```text
Organization
    owns the learning content context

Teacher
    creates/manages content

Student
    consumes content
```

Example:

```text
Teacher A
   │
   ▼
Creates Lesson
   │
   ▼
ARC Review Center
   │
   ▼
BUCET Program
```

Do not make the teacher the sole owner of organization content.

---

# 37. CONTENT WORKFLOW

Recommended production workflow:

```text
DRAFT
  ↓
SUBMITTED FOR REVIEW
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
ARCHIVED
```

For initial MVP, this can be simplified if the existing system does not yet support approval.

Do not over-engineer the first deployment.

---

# 38. LESSON CONTENT

Lessons may contain:

```text
Title
Description
Rich Text
Images
Files
Video
Examples
Activities
Practice Questions
Resources
Teacher Notes
```

The existing lesson system should be reused.

---

# 39. RESOURCE REPOSITORY

ARC should be able to manage:

```text
PDF Reviewer
Formula Guide
Study Guide
Video Walkthrough
Image
Document
```

Resources should be organization-scoped.

Example:

```text
ARC Review Center
   │
   └── BUCET Reviewer
         │
         └── Resources
              ├── Mathematics Reviewer.pdf
              ├── Science Guide.pdf
              └── Formula Sheet.pdf
```

---

# 40. PRINT ENGINE

The existing system may support:

```text
A4
Short Bond
Long Bond
```

This should remain independent from the web/mobile UI.

Recommended architecture:

```text
Assessment
   │
   ▼
Print Configuration
   │
   ├── A4
   ├── Short Bond
   └── Long Bond
```

Do not modify the core assessment data just to support printing.

---

# 41. STUDENT PORTAL

The student should see:

```text
My Programs
│
├── BUCET Reviewer
│
└── College Readiness Program
```

Inside BUCET:

```text
Overview
Practice
Mock Exams
Lessons
Progress
Results
```

---

# 42. STUDENT CBT EXPERIENCE

Expected flow:

```text
Assessment Details
       ↓
Instructions
       ↓
Start Exam
       ↓
Timer Starts
       ↓
Question
       ↓
Answer
       ↓
Next
       ↓
Flag / Review
       ↓
Submit
       ↓
Score
       ↓
Performance Analysis
```

The timer must be server-aware enough to prevent simple client-side manipulation.

---

# 43. PARENT FOUNDATION

Phase 1 may establish parent relationships:

```text
Parent
   │
   └── Student
```

Parent can later receive:

```text
Assessment Results
Progress
Study Time
Weak Areas
Readiness
Alerts
```

Advanced parent functionality can be Phase 2.

---

# 44. BUCET COMPOSITE CALCULATOR

The supplied business specification describes:

```text
Composite Rating =
(BUCET Raw Score % × 0.65)
+
(SF10 HS Average Grade % × 0.20)
+
(Socio-Economic Score % × 0.15)
```

IMPORTANT:

Do not hard-code these percentages into the core application.

Create a configurable scoring profile.

Example:

```text
Scoring Profile
│
├── BUCET Raw Score
│   └── Weight: 65%
│
├── SF10 Academic Average
│   └── Weight: 20%
│
└── Socio-Economic Score
    └── Weight: 15%
```

The actual admissions methodology must be verified by ARC against the applicable official admission policy before this calculator is presented as authoritative.

---

# 45. SCORING PROFILE

Recommended conceptual model:

```text
Scoring Profile
│
├── Name
├── Description
├── Version
├── Status
│
└── Components
    ├── Component
    ├── Weight
    ├── Calculation Type
    └── Configuration
```

This allows future changes without rewriting the assessment engine.

---

# 46. SOCIO-ECONOMIC SCORING

Do not hard-code the business rule into unrelated student fields.

If ARC confirms the rule, model it as a scoring component.

Example:

```text
Socio-Economic Component
    │
    ├── Input
    ├── Threshold
    ├── Weight
    └── Calculation Rule
```

Sensitive financial information should be protected using appropriate access controls and should not be exposed to teachers unless explicitly required.

---

# 47. ANALYTICS

Organization dashboard:

```text
ARC Review Center Dashboard
│
├── Total Students
├── Active Students
├── Active Enrollments
├── Active Test Takers
├── Exams Completed
├── Average Score
├── Average Study Time
├── Weakest Subjects
└── Program Performance
```

Program dashboard:

```text
BUCET Reviewer
│
├── Enrolled Students
├── Active Learners
├── Mock Exams Taken
├── Average Score
├── Completion Rate
└── Weak Topics
```

---

# 48. AUDIT LOGGING

Production-critical administrative actions should be auditable.

Examples:

```text
Organization Created
Organization Updated
User Invited
Role Changed
Program Created
Program Published
Lesson Published
Question Created
Question Updated
Assessment Created
Assessment Published
Enrollment Created
Enrollment Cancelled
```

Audit records should include:

```text
Actor
Action
Resource
Resource ID
Timestamp
Organization
Metadata
```

---

# 49. API AUTHORIZATION

Every protected API must validate:

```text
Authentication
      ↓
User Status
      ↓
Organization Membership
      ↓
Role
      ↓
Permission
      ↓
Resource Ownership
```

Do not trust:

```text
organizationId
userId
role
```

sent from the client without server-side verification.

---

# 50. FRONTEND INTEGRATION RULE

The current frontend is already working.

Therefore:

> DO NOT rewrite the frontend just to introduce the new architecture.

Instead:

```text
Existing UI
     │
     ▼
Existing routes
     │
     ▼
Existing API layer
     │
     ▼
Incremental organization-aware enhancements
```

Preserve existing components where possible.

---

# 51. BACKEND INTEGRATION RULE

Do not rewrite the backend.

First determine:

```text
What already exists?
What can be extended?
What must be migrated?
What must remain backward compatible?
```

New organization logic should be introduced through:

```text
Middleware
Services
Repositories
Authorization
Database migrations
```

according to the current architecture.

---

# 52. DATABASE MIGRATION RULE

Never modify production data destructively without a migration strategy.

Required approach:

```text
Existing Database
      │
      ▼
Schema Audit
      │
      ▼
Compatibility Design
      │
      ▼
Migration
      │
      ▼
Data Backfill
      │
      ▼
Validation
      │
      ▼
Production
```

Do not:

```text
DROP TABLE
DROP COLUMN
RENAME TABLE
```

unless the migration has been explicitly reviewed and proven safe.

---

# 53. BACKWARD COMPATIBILITY

Existing functionality must continue working.

Before migration:

```text
Existing User
Existing Program
Existing Subject
Existing Lesson
Existing Question
Existing Assessment
```

After migration:

```text
Same User
Same Program
Same Subject
Same Lesson
Same Question
Same Assessment
```

with organization context added safely.

---

# 54. DATA MIGRATION STRATEGY

If the existing LMS currently has no organizations:

Create a default organization:

```text
ARC Review Center
```

Then associate existing organization-owned records with it.

Example:

```text
Existing Programs
      ↓
ARC Review Center
```

Do NOT create duplicate programs.

Existing IDs should remain stable whenever possible.

---

# 55. PRODUCTION ENVIRONMENT

Minimum production requirements:

```text
HTTPS
Secure Authentication
Secure Cookies / Tokens
Environment Variables
Database Backups
Error Logging
Application Monitoring
Rate Limiting
Input Validation
Authorization
Audit Logging
CORS Configuration
Secure File Uploads
Database Connection Security
```

---

# 56. SECURITY REQUIREMENTS

At minimum:

```text
Authentication required
Password hashing
Authorization middleware
Organization isolation
Input validation
Output sanitization where required
Rate limiting
CSRF protection where applicable
XSS protection
SQL injection protection
Secure file handling
Secure session handling
Audit logs
```

Never rely on frontend authorization.

---

# 57. FILE STORAGE

Uploaded resources should not be stored directly in the application database as large binary blobs unless the existing architecture explicitly requires it.

Prefer:

```text
Application
    ↓
Object Storage
    ↓
File Metadata in Database
```

Metadata:

```text
File Name
Storage Key
MIME Type
Size
Organization
Owner
Created At
```

---

# 58. NOTIFICATIONS

Phase 1 foundation may support:

```text
Email
In-app notification
```

Optional:

```text
SMS
```

Potential events:

```text
Enrollment
Assessment Result
Low Performance
Program Announcement
Teacher Feedback
```

Do not make SMS mandatory for core LMS operation.

---

# 59. PRODUCTION DEPLOYMENT STRATEGY

Deploy in controlled stages.

```text
LOCAL
  ↓
DEVELOPMENT
  ↓
STAGING
  ↓
SMOKE TEST
  ↓
PRODUCTION
```

Never test database migrations directly against production first.

---

# 60. PHASE 1 IMPLEMENTATION ORDER

Implement in this order:

```text
STEP 1
Existing System Audit

STEP 2
Database + Architecture Gap Analysis

STEP 3
Organization Entity

STEP 4
Organization Membership

STEP 5
Platform Admin / Super Admin

STEP 6
Organization Admin

STEP 7
Organization-scoped Authorization

STEP 8
Existing Program Organization Ownership

STEP 9
Teacher Assignment

STEP 10
Student Membership + Enrollment

STEP 11
BUCET Program

STEP 12
CRP Program

STEP 13
Curriculum Integration

STEP 14
Question Bank Integration

STEP 15
Assessment / CBT Configuration

STEP 16
Attempts + Results

STEP 17
Progress

STEP 18
Analytics

STEP 19
Parent Foundation

STEP 20
Security / Audit / Production Hardening

STEP 21
Staging Deployment

STEP 22
Production Deployment

STEP 23
Demo Readiness
```

---

# 61. DEMO DATA

Before the demo, create realistic data.

Organization:

```text
ARC Review Center
```

Programs:

```text
BUCET Reviewer & CBT Mock Exam
College Readiness Program (CRP)
```

Teachers:

```text
Mathematics Teacher
Science Teacher
English Teacher
```

Students:

```text
Demo Student 1
Demo Student 2
Demo Student 3
```

Curriculum:

```text
Language
Reading
Science
Mathematics
```

Assessments:

```text
BUCET Diagnostic Exam
BUCET Practice Exam 1
BUCET Practice Exam 2
BUCET Full Mock Exam
```

---

# 62. DEMO FLOW

The complete demo should be possible through:

```text
SUPER ADMIN
     ↓
ARC Review Center
     ↓
Organization Admin
     ↓
Create / Manage Program
     ↓
BUCET Reviewer
     ↓
Curriculum
     ↓
Questions
     ↓
Assessment
     ↓
Student Enrollment
     ↓
Student Login
     ↓
Take Mock Exam
     ↓
Submit
     ↓
Result
     ↓
Performance Analytics
```

This should be the primary demonstration path.

---

# 63. WHAT IS NOT IN PHASE 1

Do NOT prioritize:

```text
School administration
DepEd school workflows
Section management for schools
Grade-level school management
School report cards
School registrar workflows
School faculty hierarchy
School-specific SF10 management
University administration
Corporate training
Marketplace
Full SaaS billing automation
Advanced AI
Complex subscription automation
```

These can be introduced later.

---

# 64. FUTURE SCHOOL SUPPORT

The Phase 1 architecture must remain compatible with:

```text
Organization
│
├── Review Center
│
├── School
│
├── Training Center
│
└── Other Institution
```

Later:

```text
School
│
├── Academic Year
├── Grade Levels
├── Sections
├── Teachers
├── Students
├── Subjects
└── Curriculum
```

But NONE of this should complicate Phase 1 unnecessarily.

---

# 65. FUTURE MULTI-TENANT EXAMPLE

Eventually:

```text
ARC LMS PLATFORM
│
├── ARC Review Center
│   ├── BUCET Reviewer
│   └── College Readiness
│
├── Powerline Review Center
│   ├── REE Reviewer
│   └── RME Reviewer
│
└── School ABC
    ├── Grade 8
    ├── Grade 9
    ├── Grade 10
    └── Grade 11
```

All use the same core platform.

---

# 66. CORE ARCHITECTURAL PRINCIPLE

Do NOT build:

```text
BUCET System
CRP System
School System
```

as separate applications.

Build:

```text
ARC LMS CORE
     │
     ├── Organization
     ├── Program
     ├── Curriculum
     ├── Content
     ├── Assessment
     ├── Enrollment
     ├── Progress
     └── Analytics
```

Then configure the platform for different use cases.

---

# 67. FINAL PHASE 1 ARCHITECTURE

```text
                         ARC LMS PLATFORM
                                │
                         PLATFORM ADMIN
                                │
                                ▼
                       ORGANIZATION LAYER
                                │
                       ARC REVIEW CENTER
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
        ORG ADMIN           TEACHERS           STUDENTS
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                                ▼
                            PROGRAMS
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
       BUCET REVIEWER & CBT              COLLEGE READINESS
                 │                             │
                 ▼                             ▼
             CURRICULUM                    CURRICULUM
                 │                             │
                 ▼                             ▼
             SUBJECTS                       SUBJECTS
                 │                             │
              MODULES                       MODULES
                 │                             │
               TOPICS                         TOPICS
                 │                             │
              LESSONS                       LESSONS
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
                          QUESTION BANK
                                │
                                ▼
                           ASSESSMENTS
                                │
                                ▼
                             ATTEMPTS
                                │
                                ▼
                             RESULTS
                                │
                                ▼
                             PROGRESS
                                │
                                ▼
                            ANALYTICS
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
                 STUDENT                   PARENT
```

---

# 68. SUCCESS CRITERIA

Phase 1 is considered complete when:

## Organization

- [ ] Super Admin can create organizations
- [ ] ARC Review Center exists as an organization
- [ ] Organization status works
- [ ] Organization data is isolated

## Users

- [ ] Organization Admin works
- [ ] Teacher works
- [ ] Student works
- [ ] Roles are enforced server-side

## Programs

- [ ] ARC can create programs
- [ ] Existing Program UI remains functional
- [ ] BUCET Reviewer exists
- [ ] CRP exists

## Curriculum

- [ ] Subjects work
- [ ] Modules work
- [ ] Topics work
- [ ] Lessons work
- [ ] Existing curriculum data remains intact

## Questions

- [ ] Question Bank works
- [ ] Questions can be categorized
- [ ] Questions can be reused in assessments

## Assessments

- [ ] Diagnostic exam works
- [ ] Practice exam works
- [ ] Mock exam works
- [ ] Entrance exam simulation works
- [ ] Randomization works
- [ ] Timer works
- [ ] Attempts work
- [ ] Results work

## Enrollment

- [ ] Student can belong to ARC
- [ ] Student can enroll in a Program
- [ ] Program access is enforced

## Analytics

- [ ] Student progress works
- [ ] Assessment performance works
- [ ] Organization analytics works

## Production

- [ ] HTTPS
- [ ] Secure authentication
- [ ] Authorization
- [ ] Tenant isolation
- [ ] Database backup
- [ ] Error monitoring
- [ ] Audit logging
- [ ] Production deployment
- [ ] Demo data
- [ ] End-to-end demo flow

---

# 69. IMPLEMENTATION RULE

This document is the TARGET for Phase 1.

However:

> The existing codebase is the source of truth for what already exists.

Before modifying anything:

1. Inspect the current implementation.
2. Map existing entities.
3. Map existing database relationships.
4. Map existing APIs.
5. Map existing frontend routes.
6. Identify conflicts.
7. Create an incremental migration plan.
8. Only then implement changes.

Never rewrite working functionality simply to match this document.

The objective is:

```text
EXISTING LMS
     +
ORGANIZATION ARCHITECTURE
     +
SAFE MIGRATION
     =
PRODUCTION-READY ARC REVIEW CENTER
```

---

# 70. IMMEDIATE DEVELOPMENT PRIORITY

Do NOT attempt to implement the entire future ARC LMS at once.

The immediate target is:

```text
1. Organization
2. Super Admin
3. Organization Admin
4. Organization-scoped users
5. Program ownership
6. BUCET Program
7. CRP Program
8. Existing Curriculum
9. Question Bank
10. Assessments
11. Student Enrollment
12. Student Testing
13. Results
14. Analytics
15. Production deployment
```

School support comes AFTER this phase is stable.

---

# END OF PHASE 1 SPECIFICATION
