-- CS#22.8: one answer per question per attempt (idempotent autosave).
-- Enables PATCH /assessments/attempts/:attemptId/answers (upsert) and
-- guarantees submit + autosave can never produce duplicate rows.
-- Verified safe on the shared demo DB (0 existing duplicate pairs).
CREATE UNIQUE INDEX "attempt_answers_attempt_id_question_id_key" ON "attempt_answers"("attempt_id", "question_id");