import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aratc/database', () => ({
  prisma: {
    assessment: { findUnique: vi.fn() },
    learnerProfile: { findUnique: vi.fn(), create: vi.fn() },
    assessmentAttempt: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    question: { findMany: vi.fn(), findUnique: vi.fn() },
    passage: { findMany: vi.fn() },
    assessmentQuestion: { findMany: vi.fn() },
    attemptAnswer: { create: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    questionExposure: { upsert: vi.fn() },
    progress: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../modules/progression/service', () => ({
  assertAssessmentUnlocked: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@aratc/database';
import { startAttempt, submitAttempt, saveAttemptAnswers } from '../modules/assessments/service';
import { NotFoundError, BadRequestError } from '../lib/errors';

const mockedPrisma = vi.mocked(prisma, true);

const USER_ID = 'user-1';
const LP_ID = 'lp-1';
const ASSESSMENT_ID = 'asmt-1';
const ATTEMPT_ID = 'att-1';

function makeQuestion(id: string) {
  return {
    id,
    type: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    stem: `Stem for ${id}`,
    hint: null,
    options: [
      { id: `${id}-a`, text: 'A', isCorrect: true },
      { id: `${id}-b`, text: 'B', isCorrect: false },
      { id: `${id}-c`, text: 'C', isCorrect: false },
      { id: `${id}-d`, text: 'D', isCorrect: false },
    ],
    passageId: null,
  };
}

const Q1 = makeQuestion('q1');
const Q2 = makeQuestion('q2');
const Q3 = makeQuestion('q3');
const ALL_QUESTIONS = [Q1, Q2, Q3];

function makeAssessment(overrides: Record<string, unknown> = {}) {
  return {
    id: ASSESSMENT_ID,
    name: 'Mock Exam',
    type: 'MOCK_EXAM',
    status: 'PUBLISHED',
    slug: 'mock-exam',
    topicIds: [],
    questionTags: [],
    difficultyLevels: [],
    questionCount: null,
    timeLimitMinutes: 30,
    passingScore: 75,
    masteryThreshold: null,
    randomizeQuestions: false,
    randomizeChoices: false,
    showExplanations: true,
    allowRetake: false,
    maxAttempts: 1,
    scoringConfig: null,
    programId: null,
    questions: ALL_QUESTIONS.map((q, i) => ({ orderIndex: i, score: 1, question: q })),
    ...overrides,
  };
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: ATTEMPT_ID,
    assessmentId: ASSESSMENT_ID,
    learnerId: LP_ID,
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    completedAt: null,
    score: null,
    maxScore: ALL_QUESTIONS.length,
    percentage: null,
    timeSpentSeconds: null,
    servedQuestionIds: ['q1', 'q2', 'q3'],
    choiceOrderSeed: 12345,
    assessment: {
      id: ASSESSMENT_ID,
      topicIds: [],
      scoringConfig: null,
      programId: null,
      passingScore: null,
      masteryThreshold: null,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.learnerProfile.findUnique.mockResolvedValue({ id: LP_ID, userId: USER_ID } as never);
  mockedPrisma.passage.findMany.mockResolvedValue([] as never);
  mockedPrisma.attemptAnswer.findMany.mockResolvedValue([] as never);
  mockedPrisma.attemptAnswer.upsert.mockResolvedValue({} as never);
  mockedPrisma.$transaction.mockResolvedValue([] as never);
});
describe('CS#22.8 — incremental answer autosave (saveAttemptAnswers)', () => {
  it('upserts answers for the owner IN_PROGRESS attempt — idempotent by composite key', async () => {
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(makeAttempt() as never);

    const result = await saveAttemptAnswers(ATTEMPT_ID, USER_ID, [
      { questionId: 'q1', answer: 'q1-a', timeSpentSeconds: 11 },
      { questionId: 'q2', answer: 'q2-b', timeSpentSeconds: 9 },
    ]);

    expect(result.saved).toBe(2);
    expect(mockedPrisma.attemptAnswer.upsert).toHaveBeenCalledTimes(2);
    // Composite where key guarantees one row per (attemptId, questionId)
    expect(mockedPrisma.attemptAnswer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          attemptId_questionId: { attemptId: ATTEMPT_ID, questionId: 'q1' },
        },
      }),
    );
  });

  it('rejects a non-owner attempt with 404 (no existence leak)', async () => {
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(
      makeAttempt({ learnerId: 'other-learner' }) as never,
    );

    await expect(
      saveAttemptAnswers(ATTEMPT_ID, USER_ID, [{ questionId: 'q1', answer: 'x' }]),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedPrisma.attemptAnswer.upsert).not.toHaveBeenCalled();
  });

  it('rejects autosave on a COMPLETED attempt (immutable after submit)', async () => {
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(
      makeAttempt({ status: 'COMPLETED' }) as never,
    );

    await expect(
      saveAttemptAnswers(ATTEMPT_ID, USER_ID, [{ questionId: 'q1', answer: 'x' }]),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('drops answers for questions never served to the attempt (CS#19)', async () => {
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(
      makeAttempt({ servedQuestionIds: ['q1', 'q2'] }) as never,
    );

    const result = await saveAttemptAnswers(ATTEMPT_ID, USER_ID, [
      { questionId: 'q1', answer: 'q1-a' },
      { questionId: 'q3', answer: 'q3-a' }, // not served → dropped
    ]);

    expect(result.saved).toBe(1);
    expect(mockedPrisma.attemptAnswer.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('CS#22.8 — resume hydrates saved answers', () => {
  it('startAttempt returns savedAnswers for an existing IN_PROGRESS attempt', async () => {
    const assessment = makeAssessment();
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(
      makeAttempt({ servedQuestionIds: ['q1', 'q2', 'q3'] }) as never,
    );
    mockedPrisma.question.findMany.mockResolvedValue(ALL_QUESTIONS as never);
    mockedPrisma.attemptAnswer.findMany.mockResolvedValue([
      { questionId: 'q1', answer: 'q1-a', timeSpentSeconds: 15 },
      { questionId: 'q3', answer: 'q3-c', timeSpentSeconds: 22 },
    ] as never);

    const result = await startAttempt(ASSESSMENT_ID, USER_ID);

    expect(result.questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
    expect(result.savedAnswers).toEqual([
      { questionId: 'q1', answer: 'q1-a', timeSpentSeconds: 15 },
      { questionId: 'q3', answer: 'q3-c', timeSpentSeconds: 22 },
    ]);
    expect(mockedPrisma.assessmentAttempt.create).not.toHaveBeenCalled();
  });

  it('submitAttempt refuses to submit another learner attempt (IDOR regression)', async () => {
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(
      makeAttempt({ learnerId: 'other-learner' }) as never,
    );

    await expect(
      submitAttempt(ATTEMPT_ID, USER_ID, [{ questionId: 'q1', answer: 'q1-a' }]),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedPrisma.assessmentAttempt.update).not.toHaveBeenCalled();
  });
});