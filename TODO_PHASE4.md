# Phase 4 — Lesson Question Integration

## Status: IN PROGRESS

### Goal
Enable interactive questions embedded directly within lesson content. Students can answer questions while reading lessons, with responses tracked for progress and mastery.

---

## User Workflow

### Admin Side
1. Go to `/admin/lessons/[lessonId]`
2. Click "Add content" → select "Question" block
3. Opens question picker modal → select from Question Bank (filter by topic)
4. Question block appears in lesson with a badge showing linked question
5. Publish lesson

### Student Side
1. Go to `/dashboard/lessons/[lessonId]`
2. Read lesson content
3. When encountering a question block, see interactive question UI
4. Submit answer → response saved
5. See immediate feedback (correct/incorrect)
6. Can retry or continue

---

## Implementation Progress

### Completed ✅
- [x] **Question Picker Modal** (`components/admin/question-picker-modal.tsx`)
  - Search questions by text
  - Filter by type and topic
  - Select to link question
- [x] **Interactive Question Renderer** (`components/lesson/question-renderer.tsx`)
  - All 8 question types supported
  - Submit button with feedback
  - Retry functionality
  - Points tracking
- [x] **Block Renderer Updated** (`components/lesson/block-renderer.tsx`)
  - Replaced placeholder with `<QuestionRenderer />`
- [x] **Question Block Fields** (`components/admin/lesson-block-fields.tsx`)
  - Show linked question info
  - Points, Required, ShowFeedback toggles
  - "Change Question" button
- [x] **Lesson Editor Integration**
  - Added question picker modal
  - Event listener for "Change Question"
- [x] **API Client** - Added `topicsApi.listAll()`

### Pending (Response Tracking)
- [ ] **Response Tracking API**
  - `POST /lessons/:id/questions/:questionId/respond`
  - Save student answers
- [ ] **Progress Tracking**
  - Track completed lesson questions
  - Update student mastery

---

## Files Created/Modified

### New Files
| File | Status |
|------|--------|
| `components/admin/question-picker-modal.tsx` | ✅ Created |
| `components/lesson/question-renderer.tsx` | ✅ Created |

### Modified Files
| File | Status |
|------|--------|
| `components/lesson/block-renderer.tsx` | ✅ Updated |
| `components/admin/lesson-block-fields.tsx` | ✅ Updated |
| `app/admin/lessons/[lessonId]/page.tsx` | ✅ Updated |
| `lib/api/client.ts` | ✅ Updated |

### Still Needed
| File | Description |
|------|-------------|
| `api/modules/lessons/service.ts` | Add respond endpoint |
| `api/modules/lessons/routes.ts` | Add response route |
| `lib/api/client.ts` | Add lessonQuestionsApi |

---

## Question Block Data Structure

```typescript
interface QuestionBlock extends LessonBlock {
  type: "question";
  questionId: string;
  points?: number;      // Default: 1
  required?: boolean;   // Default: false
  showFeedback?: boolean; // Show correct answer after submit
}
```

---

## Verification

1. Go to lesson editor `/admin/lessons/[id]`
2. Click "Add content" → select "Question"
3. Question picker modal opens → select a question
4. Question block appears → edit properties (points, required, etc.)
5. Publish lesson
6. Open as student `/dashboard/lessons/[id]`
7. See interactive question rendered
8. Submit answer → see feedback
9. Click "Try Again" to retry
