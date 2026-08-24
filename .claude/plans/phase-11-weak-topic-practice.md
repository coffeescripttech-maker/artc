# Phase 11: Targeted Weak-Topic Practice

## Context

Students can identify weak topics from the dashboard (Phase 7), review failed assessment answers (Phase 8), and see their full activity timeline (Phase 10), but there's no way to **drill into** those specific weak areas with targeted practice questions. The learning loop is: *see problem → know the problem → can't act on it*.

**Goal:** Build a practice page where students click a weak topic, get auto-generated questions from that topic's question bank, answer them interactively via `QuestionRenderer`, and see their accuracy + mastery improve.

## Current State

### Already Working (Backend + Frontend)
- `GET /questions/topic/:topicId` → `questionsApi.getByTopic(topicId)` — questions tagged to a topic
- `GET /progression/weak-topics` → `progressionApi.weakTopics()` — returns `{ topics: [...] }` with topic + subject info
- `GET /topics/:id` → `topicsApi.getById(id)` — returns topic with module.subject
- `QuestionRenderer` component — handles all question types with real-time grading, explanations, retry logic
- `DashboardHeader` component with breadcrumbs support

### What Was Added
- New page: `/dashboard/practice/weak-topics` — lists prioritized weak topics from API
- New page: `/dashboard/practice/topic/[topicId]` — pulls questions by topic, renders `QuestionRenderer`, tracks answered/correct, shows summary
- Sidebar updated: "Practice" link now points to `/dashboard/practice/weak-topics` with `Target` icon

## Implementation

### 1. Weak Topics Index Page

**File:** `apps/web/src/app/dashboard/practice/weak-topics/page.tsx` (new)

- Fetch weak topics from `progressionApi.weakTopics()`
- Show each weak topic with:
  - Topic name + subject name
  - Mastery % (completion percentage with progress bar)
  - "Study Now" button → links to `/dashboard/practice/topic/[topicId]`
- Loading skeleton + empty state ("No weak topics identified. Great job!")
- Color-coded mastery badges (green/yellow/orange/slate)

### 2. Topic Practice Page

**File:** `apps/web/src/app/dashboard/practice/topic/[topicId]/page.tsx` (new)

- Fetch topic info via `topicsApi.getById(topicId)` + questions via `questionsApi.getByTopic(topicId)`
- Render questions using `QuestionRenderer` component (no `lessonId` — free practice mode, answers not persisted to lessons)
- Track per-question results with `onComplete` callback
- Navigation between questions (Previous/Next)
- "See Results" button when on last question
- Final summary: accuracy %, badges, review incorrect questions
- "Try Again" button to reset

### 3. Sidebar Update

**File:** `apps/web/src/components/dashboard/sidebar.tsx`

- Updated "Practice" nav item: `href: "/dashboard/practice/weak-topics"`, `icon: Target`
- Added `Target` to lucide-react imports

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/app/dashboard/practice/weak-topics/page.tsx` | **NEW** — Weak topics index with API-driven list |
| `apps/web/src/app/dashboard/practice/topic/[topicId]/page.tsx` | **NEW** — Topic practice with `QuestionRenderer` |
| `apps/web/src/components/dashboard/sidebar.tsx` | Updated "Practice" link + added `Target` icon import |

## Verification

1. ✅ Student navigates to `/dashboard/practice/weak-topics` → sees API-driven weak topics list
2. ✅ Each topic shows name, subject, mastery %, progress bar, and "Study Now" button
3. ✅ Clicking "Study Now" → loads questions for that topic via `questionsApi.getByTopic()`
4. ✅ Questions render using `QuestionRenderer` with all 10 question type support
5. ✅ Student answers questions → real-time grading + explanation shown
6. ✅ After all questions answered → summary page with accuracy % + ability to retry incorrect answers
7. ✅ Type checks: 0 new errors (web: 45 pre-existing, API: 86 pre-existing)

## Status: Complete