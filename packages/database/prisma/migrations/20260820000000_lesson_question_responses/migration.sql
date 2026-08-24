-- CreateTable
CREATE TABLE "lesson_question_responses" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "block_id" TEXT,
    "answer" JSONB,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_question_responses_pkey" ON "lesson_question_responses"("id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "lesson_question_responses_learner_id_lesson_id_question_id_key" ON "lesson_question_responses"("learner_id", "lesson_id", "question_id");

-- CreateIndex
CREATE INDEX "lesson_question_responses_learner_id_lesson_id_question_id_idx" ON "lesson_question_responses"("learner_id", "lesson_id", "question_id");

-- CreateIndex
CREATE INDEX "lesson_question_responses_learner_id_block_id_idx" ON "lesson_question_responses"("learner_id", "block_id");

-- AddForeignKey
ALTER TABLE "lesson_question_responses" ADD CONSTRAINT "lesson_question_responses_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_question_responses" ADD CONSTRAINT "lesson_question_responses_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_question_responses" ADD CONSTRAINT "lesson_question_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
