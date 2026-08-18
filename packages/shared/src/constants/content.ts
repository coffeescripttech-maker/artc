export const CONTENT_STATUS = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export const LESSON_TYPES = {
  VIDEO: "VIDEO",
  ARTICLE: "ARTICLE",
  MIXED: "MIXED",
  ACTIVITY: "ACTIVITY",
  PRACTICE: "PRACTICE",
} as const;

export type LessonType = (typeof LESSON_TYPES)[keyof typeof LESSON_TYPES];

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  MULTIPLE_SELECT: "MULTIPLE_SELECT",
  FILL_IN_THE_BLANK: "FILL_IN_THE_BLANK",
  MATCHING: "MATCHING",
  ESSAY: "ESSAY",
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const DIFFICULTY_LEVELS = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

export const EXAM_TYPES = {
  ENTRANCE: "ENTRANCE",
  BOARD: "BOARD",
  CERTIFICATION: "CERTIFICATION",
  SCHOLARSHIP: "SCHOLARSHIP",
  INTERNAL: "INTERNAL",
} as const;

export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];

export const ASSESSMENT_TYPES = {
  QUIZ: "QUIZ",
  PRACTICE: "PRACTICE",
  DIAGNOSTIC: "DIAGNOSTIC",
  MOCK_EXAM: "MOCK_EXAM",
  ASSIGNMENT: "ASSIGNMENT",
  CET_SIMULATION: "CET_SIMULATION",
} as const;

export type AssessmentType = (typeof ASSESSMENT_TYPES)[keyof typeof ASSESSMENT_TYPES];

export const ATTEMPT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
  TIMED_OUT: "TIMED_OUT",
} as const;

export type AttemptStatus = (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS];
