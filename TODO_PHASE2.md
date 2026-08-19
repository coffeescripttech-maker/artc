# Phase 2 Completion — TODO

## Status: ✅ COMPLETE

### 1. Create Progression Dashboard Page ✅
- [x] `apps/web/src/app/dashboard/progression/page.tsx`
- [x] Show program → grades → subjects → topics ladder
- [x] Display 🔒/🔓 status per grade
- [x] Show mastery band badges
- [x] Link to assessments per topic

### 2. Fix hardcoded DEFAULT_GATE (95) ✅
- [x] Read gate from Program.metadata.requireMasteryToUnlock
- [x] Update `progression/service.ts` to use configurable gate
- [x] Added `getMasteryGate()` function

### 3. Add timeSpentSeconds calculation ✅
- [x] Updated `submitAttempt` to accept timeSpentSeconds per answer
- [x] Calculate startedAt → completedAt elapsed time
- [x] Store total in AssessmentAttempt.timeSpentSeconds

### 4. Improve mastery rollups ✅
- [x] Calculate subject-level mastery from topic rollups
- [x] Calculate program-level mastery from subject rollups
- [x] Added `rollupMastery()` function in service.ts

### 5. Create shared mastery constants ✅
- [x] `apps/web/src/lib/mastery-constants.ts`
- [x] Band labels as shared exports (MASTERY_BANDS)
- [x] Gate default value (DEFAULT_MASTERY_GATE)
- [x] Band CSS classes and threshold values

### 6. Update sidebar navigation ✅
- [x] Changed My Progress link to /dashboard/progression

---

## Completed:
- ✅ Assessment model has masteryThreshold
- ✅ Progress model exists with mastery field
- ✅ Mastery band helper exists (mastery.ts)
- ✅ Unlock logic implemented (assertAssessmentUnlocked)
- ✅ Curriculum unlock map implemented
- ✅ Progression dashboard page created
- ✅ Mastery gate configurable via Program.metadata
- ✅ Subject/program level mastery rollups
- ✅ timeSpentSeconds calculated and stored

---

## Files Modified:
1. `apps/api/src/modules/progression/service.ts` - Added getMasteryGate(), updated getProgression()
2. `apps/api/src/modules/assessments/service.ts` - Added rollupMastery(), updated submitAttempt()
3. `apps/web/src/lib/mastery-constants.ts` - New shared constants file
4. `apps/web/src/app/dashboard/progression/page.tsx` - New progression dashboard
5. `apps/web/src/components/dashboard/sidebar.tsx` - Updated nav link

## Next: Phase 3
- [ ] Retry engine / variant generation
- [ ] ORDERING, NUMERIC question types
- [ ] Passage-based grouping
- [ ] Anti-memorization Level-3 randomization
