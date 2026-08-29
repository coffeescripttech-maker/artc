-- CS#19: persist the exact served question set + choice-order seed per attempt
-- (roadmap §26 — deterministic randomization for the lifetime of an attempt).
-- Prisma does not support optional lists, so the array is NOT NULL with an
-- empty-array default; empty = legacy attempt (backfilled on first resume).
ALTER TABLE "assessment_attempts" ADD COLUMN "served_question_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "assessment_attempts" ADD COLUMN "choice_order_seed" INTEGER;