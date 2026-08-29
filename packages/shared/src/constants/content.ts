export const CONTENT_STATUS = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

/**
 * Content approval workflow (Change Set #6) — §17 of the architecture doc.
 *
 * DRAFT ──submit──> UNDER_REVIEW ──approve──> APPROVED ──publish──> PUBLISHED
 *   ▲                    │
 *   └───────reject───────┘
 *
 * Publishing from DRAFT/UNDER_REVIEW is only permitted when the owning
 * organization's policy allows direct publishing
 * (Organization.metadata.teacher_auto_publish, default: true) or when the
 * caller is a platform admin.
 */
export const CONTENT_TRANSITIONS = {
  SUBMIT_REVIEW: { from: ["DRAFT"], to: "UNDER_REVIEW" },
  APPROVE: { from: ["UNDER_REVIEW"], to: "APPROVED" },
  REJECT: { from: ["UNDER_REVIEW"], to: "DRAFT" },
  PUBLISH: { from: ["DRAFT", "UNDER_REVIEW", "APPROVED"], to: "PUBLISHED" },
  ARCHIVE: { from: ["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED"], to: "ARCHIVED" },
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
  ORDERING: "ORDERING",
  NUMERIC: "NUMERIC",
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

/** Question type metadata for UI display */
export const QUESTION_TYPE_META: Record<QuestionType, { label: string; description: string; autoGradable: boolean }> = {
  MULTIPLE_CHOICE: { label: "Multiple Choice", description: "Select one answer from options", autoGradable: true },
  TRUE_FALSE: { label: "True/False", description: "Select true or false", autoGradable: true },
  MULTIPLE_SELECT: { label: "Multiple Select", description: "Select all that apply", autoGradable: true },
  FILL_IN_THE_BLANK: { label: "Fill in the Blank", description: "Type the answer", autoGradable: true },
  MATCHING: { label: "Matching", description: "Match items correctly", autoGradable: true },
  ESSAY: { label: "Essay", description: "Write a response", autoGradable: false },
  ORDERING: { label: "Ordering", description: "Arrange items in correct sequence", autoGradable: true },
  NUMERIC: { label: "Numeric", description: "Enter a number answer", autoGradable: true },
};

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
