# Program Completion Rollup — CS#23.5 (analysis)

> Goal: derive a **single, deterministic, truthful "Program Completion %"** for the
> student program overview — from real tables, no fabricated stats.

## Problem (why the naive approach fails)

The `progress` table has one row **per level** (lesson rows, topic rollups,
subject/module rollups). A lesson row is created when a learner marks a lesson
complete; `setLessonProgress` separately maintains a **topic-level** rollup row
(`lessonId: null`) equal to `completed published lessons / total published
lessons` for that topic.

But the existing program-overview page computed its "overall %" as the **mean of
subject percentages** derived from `/progression` — which in turn means topic
rollups only. That works once rollups exist, but it is:
1. **Indirect** (depends on rollup rows being present/kept in sync), and
2. **Not lesson-weighted** (a topic with 1 of 1 lessons done counts the same as a
   topic with 1 of 10 done).

## Design — deterministic lesson-weighted rollup

Compute directly from real rows, in one function (no new tables):

```text
1. Published scope of the program
   curriculum(PUBLISHED) → items → subjects → modules(PUBLISHED) → topics(PUBLISHED) → lessons(PUBLISHED)
   → totalLessons = count of PUBLISHED lessons in the program hierarchy

2. Learner's completed lessons
   progress rows WHERE
     learnerId = <learner>
     AND programId = <program id>          (rows are tagged at write time)
     AND lessonId IS NOT NULL
     AND completionPercentage = 100        (marked complete; mastery MASTERED)
   → completedLessons = unique count

3. completionPercentage = round(completedLessons / totalLessons * 100)
   → mastery band via existing masteryFromCompletion mapping
```

Per-subject breakdown uses the same rule scoped to each subject (sum its topics'
published lessons, count completed rows among them) — matching what the
curriculum outline shows, so the progress bar and the number always agree.

## Why this is deterministic
- It reads **only real data** (program hierarchy + progress rows at write time).
- It needs **no rollup maintenance** — row correctness is the single source of truth.
- It is **idempotent** — same data → same %, always.
- It is **authorized** — same enrollment-gated scope as every learner read
  (`findActiveEnrollment` + program PUBLISHED), so non-enrolled / cross-tenant
  callers get 404.

## Edge cases handled
| Case | Behavior |
|---|---|
| No published lessons | `completionPercentage = 0`, `totalLessons = 0` (truthful, no divide-by-zero) |
| No progress rows | `0%` |
| Unpublished program | 404 (resource hiding — never enumerated) |
| Non-enrolled / expired enrollment | 404 (same) |
| Orphan lesson not in program hierarchy | excluded (scope is program hierarchy) |

## Consistency with existing surfaces
- The new `/programs/:id/completion` endpoint is the **single** source that the
  program overview **Completion stat card** renders, so card = number.
- `/progression` (ladder/mastery) keeps its existing topic-based semantics — the
  two are complementary, not duplicated (ladder is for mastery gating; the
  completion card is a summary metric).