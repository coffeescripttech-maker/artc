# Phase 3 — TODO

## Status: NEARLY COMPLETE

### Backend ✅
- [x] Schema: ORDERING, NUMERIC added to QuestionType
- [x] Schema: Passage model created
- [x] Schema: QuestionExposure for anti-memorization
- [x] Grading: ORDERING and NUMERIC cases added
- [x] Passages API module created (schemas, service, controller, routes)
- [x] Retry engine: trackQuestionExposure(), getWeakTopics(), getRetryRecommendations()
- [x] Fixed autoGenerateQuestions shuffle bug
- [x] New API endpoints: /progression/weak-topics, /progression/assessments/:id/recommendations

### Frontend ✅
- [x] QuestionForm: All 8 question types (ORDERING, NUMERIC, etc.)
- [x] QuestionForm: Passage selector dropdown
- [x] Assessment Player: NUMERIC input (type="number")
- [x] Assessment Player: ORDERING with up/down arrows
- [x] Assessment Player: Passage rendering
- [x] Passages admin page created
- [x] Sidebar: Added Passages link

### Need to Run Manually
```bash
# First, kill any running processes locking the Prisma client
taskkill /F /IM node.exe 2>$null

# Then regenerate Prisma client
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

---

## Phase 3 Summary

### New Features Added:
1. **Question Types**: ORDERING (sequence arrangement), NUMERIC (numerical answer with tolerance)
2. **Passages**: Create reading passages to link comprehension questions
3. **Retry Engine**: Question exposure tracking, weak topic identification, retry recommendations
4. **Improved Shuffle**: Fixed autoGenerateQuestions to use proper randomization

### Files Created:
- `apps/api/src/modules/passages/` (4 new files)
- `apps/web/src/app/admin/passages/page.tsx`

### Files Modified:
- `packages/database/prisma/schema.prisma` (3 additions)
- `packages/shared/src/constants/content.ts`
- `apps/api/src/modules/assessments/grading.ts`
- `apps/api/src/modules/assessments/service.ts` (major updates)
- `apps/api/src/modules/progression/controller.ts`
- `apps/api/src/modules/progression/routes.ts`
- `apps/api/src/index.ts`
- `apps/web/src/components/admin/forms/question-form.tsx`
- `apps/web/src/app/dashboard/assessments/[assessmentId]/page.tsx`
- `apps/web/src/components/dashboard/sidebar.tsx`

---

## Next: Phase 4 (Lesson Question Integration)
- See `TODO_PHASE4.md` for details
- [ ] Question picker modal for lesson editor
- [ ] Interactive question renderer for students
- [ ] Response tracking API
- [ ] Block properties for question blocks

---
## Future: Phase 5 (Reports)
- [ ] Academic Mastery score computation
- [ ] College Readiness Index
- [ ] CET Readiness score
- [ ] Readiness snapshot model
- [ ] Student/parent report
