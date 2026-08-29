import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seededShuffle, randomChoiceSeed } from '../modules/assessments/grading';

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
    attemptAnswer: { create: vi.fn() },
    questionExposure: { upsert: vi.fn() },
    progress: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../modules/progression/service', () => ({
  assertAssessmentUnlocked: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@aratc/database';
import { startAttempt, submitAttempt } from '../modules/assessments/service';

const mockedPrisma = vi.mocked(prisma, true);

const USER_ID = 'user-1';
const LP_ID = 'lp-1';
const ASSESSMENT_ID = 'asmt-1';
const ATTEMPT_ID = 'att-1';

/** Deterministic question fixture factory — 4 options, first is correct. */
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
});

describe('CS#19 — served question set persistence', () => {
  it('Test 1: persists the exact ordered served set on a NEW attempt', async () => {
    const assessment = makeAssessment({ randomizeQuestions: true });
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(null);
    mockedPrisma.assessmentAttempt.count.mockResolvedValue(0);
    mockedPrisma.assessmentAttempt.create.mockImplementation(
      (({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(makeAttempt({ ...data }))) as never,
    );

    const result = await startAttempt(ASSESSMENT_ID, USER_ID);

    const createArg = mockedPrisma.assessmentAttempt.create.mock.calls[0][0] as {
      data: { servedQuestionIds: string[]; choiceOrderSeed: number };
    };
    // Every fixed question served exactly once, in the returned order
    expect(createArg.data.servedQuestionIds).toHaveLength(3);
    expect(new Set(createArg.data.servedQuestionIds)).toEqual(new Set(['q1', 'q2', 'q3']));
    expect(typeof createArg.data.choiceOrderSeed).toBe('number');
    expect(result.questions.map((q) => q.id)).toEqual(createArg.data.servedQuestionIds);
  });

  it('Test 2: resume returns the persisted order, never reshuffled', async () => {
    const persistedOrder = ['q3', 'q1', 'q2'];
    const assessment = makeAssessment({ randomizeQuestions: true });
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(
      makeAttempt({ servedQuestionIds: persistedOrder }) as never,
    );
    // DB returns rows in a DIFFERENT order — app code must restore stored order
    mockedPrisma.question.findMany.mockResolvedValue([Q2, Q3, Q1] as never);

    const result = await startAttempt(ASSESSMENT_ID, USER_ID);

    expect(mockedPrisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: persistedOrder } } }),
    );
    expect(result.questions.map((q) => q.id)).toEqual(persistedOrder);
    expect(mockedPrisma.assessmentAttempt.create).not.toHaveBeenCalled();
  });

  it('Test 3: pool-based attempt serves the SAME ids on every resume', async () => {
    const persistedOrder = ['q2', 'q3', 'q1'];
    const assessment = makeAssessment({ randomizeQuestions: true });
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(
      makeAttempt({ servedQuestionIds: persistedOrder }) as never,
    );

    const orders: string[][] = [];
    for (let i = 0; i < 3; i++) {
      // Even if the DB physically returns rows in a new order each time…
      mockedPrisma.question.findMany.mockResolvedValue([...ALL_QUESTIONS].reverse() as never);
      const result = await startAttempt(ASSESSMENT_ID, USER_ID);
      orders.push(result.questions.map((q) => q.id));
    }
    // …the attempt always gets the identical persisted question set + order
    expect(orders[0]).toEqual(persistedOrder);
    expect(orders[1]).toEqual(orders[0]);
    expect(orders[2]).toEqual(orders[0]);
  });

  it('Test 5: legacy attempt (empty served set) backfills on first resume, then stays stable', async () => {
    const assessment = makeAssessment(); // no randomization → fixed order
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst
      .mockResolvedValueOnce(makeAttempt({ servedQuestionIds: [], choiceOrderSeed: null }) as never)
      .mockResolvedValueOnce(makeAttempt({ servedQuestionIds: ['q1', 'q2', 'q3'] }) as never);
    mockedPrisma.assessmentAttempt.updateMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.question.findMany.mockResolvedValue(ALL_QUESTIONS as never);

    // First resume: fallback draw, persisted immediately
    const first = await startAttempt(ASSESSMENT_ID, USER_ID);
    expect(first.questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
    expect(mockedPrisma.assessmentAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ATTEMPT_ID, servedQuestionIds: { isEmpty: true } },
        data: {
          servedQuestionIds: ['q1', 'q2', 'q3'],
          choiceOrderSeed: expect.any(Number),
        },
      }),
    );

    // Second resume: deterministic from the persisted set (no re-draw)
    const second = await startAttempt(ASSESSMENT_ID, USER_ID);
    expect(second.questions.map((q) => q.id)).toEqual(first.questions.map((q) => q.id));
    expect(mockedPrisma.assessmentAttempt.updateMany).toHaveBeenCalledTimes(1);
  });

  it('concurrent resume loses the backfill race and adopts the winner set', async () => {
    const assessment = makeAssessment();
    const winnerOrder = ['q2', 'q1', 'q3'];
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(
      makeAttempt({ servedQuestionIds: [], choiceOrderSeed: null }) as never,
    );
    mockedPrisma.assessmentAttempt.updateMany.mockResolvedValue({ count: 0 } as never); // someone else claimed it
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(
      makeAttempt({ servedQuestionIds: winnerOrder, choiceOrderSeed: 999 }) as never,
    );
    mockedPrisma.question.findMany.mockResolvedValue(ALL_QUESTIONS as never);

    const result = await startAttempt(ASSESSMENT_ID, USER_ID);
    expect(result.questions.map((q) => q.id)).toEqual(winnerOrder);
  });
});

describe('CS#19 — grading uses the persisted served set', () => {
  it('Test 4: ignores answers for questions not served; result basis is the persisted maxScore', async () => {
    const attempt = makeAttempt({ servedQuestionIds: ['q1', 'q2'], maxScore: 2 });
    mockedPrisma.assessmentAttempt.findUnique.mockResolvedValue(attempt as never);
    mockedPrisma.assessmentQuestion.findMany.mockResolvedValue([
      { questionId: 'q1', score: 1 },
      { questionId: 'q2', score: 1 },
    ] as never);
    mockedPrisma.question.findUnique.mockImplementation(
      (({ where }: { where: { id: string } }) => Promise.resolve(makeQuestion(where.id))) as never,
    );
    mockedPrisma.$transaction.mockResolvedValue([] as never);
    mockedPrisma.attemptAnswer.create.mockResolvedValue({} as never);
    mockedPrisma.assessmentAttempt.update.mockImplementation(
      (({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(makeAttempt({ ...data, status: 'COMPLETED' }))) as never,
    );

    // q3 was NEVER served to this attempt — submitting it must not be graded
    const result = await submitAttempt(ATTEMPT_ID, [
      { questionId: 'q1', answer: 'q1-a' }, // correct
      { questionId: 'q3', answer: 'q3-a' }, // not served — ignored
    ]);

    expect(mockedPrisma.attemptAnswer.create).toHaveBeenCalledTimes(1);
    expect(result.score).toBe(1);
    // percentage = 1 correct / persisted maxScore (2 served questions) = 50%
    expect(result.percentage).toBe(50);
  });
});

describe('CS#19 — choice randomization is deterministic per attempt', () => {
  it('Test 6: resuming with the same seed reproduces the identical choice order', async () => {
    const assessment = makeAssessment({ randomizeChoices: true });
    mockedPrisma.assessment.findUnique.mockResolvedValue(assessment as never);
    mockedPrisma.assessmentAttempt.findFirst.mockResolvedValue(
      makeAttempt({ servedQuestionIds: ['q1'], choiceOrderSeed: 777 }) as never,
    );
    mockedPrisma.question.findMany.mockResolvedValue([Q1] as never);

    const first = await startAttempt(ASSESSMENT_ID, USER_ID);
    const second = await startAttempt(ASSESSMENT_ID, USER_ID);

    expect(first.questions[0].options.map((o: { id: string }) => o.id)).toEqual(
      second.questions[0].options.map((o: { id: string }) => o.id),
    );
    // and it really is a shuffle of the original four options
    expect(
      [...first.questions[0].options]
        .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id))
        .map((o: { id: string }) => o.id),
    ).toEqual(['q1-a', 'q1-b', 'q1-c', 'q1-d']);
  });

  it('seededShuffle is stable for a seed and varies across seeds', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = seededShuffle(input, 42);
    const b = seededShuffle(input, 42);
    const c = seededShuffle(input, 43);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(input); // same multiset
    expect(c).not.toEqual(a); // different seed ⇒ different permutation (10! space)
  });

  it('randomChoiceSeed produces valid 31-bit seeds', () => {
    for (let i = 0; i < 20; i++) {
      const seed = randomChoiceSeed();
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 31);
      expect(Number.isInteger(seed)).toBe(true);
    }
  });
});


