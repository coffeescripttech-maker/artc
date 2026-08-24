"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { assessmentsApi } from "@/lib/api/client";
import { masteryBand } from "@/lib/mastery";
import { CheckCircle2, XCircle, Clock, Calendar, Target } from "lucide-react";

interface ReportOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface ReportQuestion {
  id: string;
  type: string;
  difficulty?: string;
  stem: string;
  hint?: string | null;
  options?: string | ReportOption[];
  correctAnswer?: unknown;
  explanation?: string | null;
  tolerance?: number | null;
  points?: number;
}

interface ReportAnswer {
  id: string;
  questionId: string;
  answer: unknown;
  isCorrect: boolean | null;
  score: number;
  timeSpentSeconds?: number | null;
  createdAt: string;
  question: ReportQuestion;
}

interface ReportAttempt {
  id: string;
  status: string;
  score: number;
  maxScore: number;
  percentage: number | null;
  timeSpentSeconds?: number | null;
  startedAt: string;
  completedAt?: string | null;
  learner?: {
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  assessment: {
    id: string;
    name: string;
    type: string;
    timeLimitMinutes?: number | null;
    passingScore?: number | null;
    masteryThreshold?: number | null;
  };
  answers: ReportAnswer[];
}

function parseOptions(options: unknown): ReportOption[] {
  if (!options) return [];
  if (Array.isArray(options)) return options as ReportOption[];
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? (parsed as ReportOption[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseCorrectAnswer(correctAnswer: unknown): string[] {
  if (Array.isArray(correctAnswer)) return correctAnswer.map(String);
  if (typeof correctAnswer === "string") {
    try {
      const parsed = JSON.parse(correctAnswer);
      return Array.isArray(parsed) ? parsed.map(String) : [correctAnswer];
    } catch {
      return [correctAnswer];
    }
  }
  if (correctAnswer !== undefined && correctAnswer !== null) return [String(correctAnswer)];
  return [];
}

function isOptionCorrect(question: ReportQuestion, option: ReportOption): boolean {
  if (option.isCorrect !== undefined) return option.isCorrect;
  const correctIds = parseCorrectAnswer(question.correctAnswer);
  return correctIds.includes(option.id);
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function optionLabel(opt: ReportOption, index: number): string {
  return `${String.fromCharCode(65 + index)}. ${opt.text}`;
}

function renderStudentAnswer(answer: unknown, q: ReportQuestion, options: ReportOption[]): string {
  switch (q.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      if (typeof answer === "string") {
        const opt = options.find((o) => o.id === answer || o.text === answer);
        return opt ? optionLabel(opt, options.indexOf(opt)) : String(answer);
      }
      return String(answer ?? "");
    }
    case "MULTIPLE_SELECT": {
      if (Array.isArray(answer)) {
        return answer
          .map((a) => {
            const opt = options.find((o) => o.id === a || o.text === a);
            return opt ? optionLabel(opt, options.indexOf(opt)) : String(a);
          })
          .join(", ");
      }
      return String(answer ?? "");
    }
    case "ORDERING":
    case "MATCHING": {
      if (Array.isArray(answer)) {
        return answer
          .map((a, idx) => {
            const opt = options.find((o) => o.id === a || o.text === a);
            return opt ? `${idx + 1}. ${opt.text}` : String(a);
          })
          .join(" → ");
      }
      return String(answer ?? "");
    }
    case "ESSAY":
      return typeof answer === "string" ? answer : String(answer ?? "");
    default:
      return typeof answer === "string" ? answer : String(answer ?? "");
  }
}

function renderCorrectAnswer(q: ReportQuestion, options: ReportOption[]): string {
  const correctIds = parseCorrectAnswer(q.correctAnswer);
  if (correctIds.length === 0) {
    return q.correctAnswer !== undefined ? String(q.correctAnswer) : "N/A";
  }
  return correctIds
    .map((id) => {
      const opt = options.find((o) => o.id === id);
      const idx = options.indexOf(opt!);
      return opt ? optionLabel(opt, idx) : id;
    })
    .join(", ");
}

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  MULTIPLE_SELECT: "Multiple Select",
  TRUE_FALSE: "True/False",
  ORDERING: "Ordering",
  MATCHING: "Matching",
  FILL_IN_THE_BLANK: "Fill in the Blank",
  IDENTIFICATION: "Identification",
  SHORT_ANSWER: "Short Answer",
  NUMERIC: "Numeric",
  ESSAY: "Essay",
};

export default function AssessmentReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const assessmentId = params.assessmentId as string;
  const attemptId = searchParams.get("attemptId") || "";

  const [attempt, setAttempt] = useState<ReportAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    setIsLoading(true);
    try {
      const data = (await assessmentsApi.getAttempt(attemptId)) as ReportAttempt;
      setAttempt(data);
    } catch (err) {
      console.error("Failed to load attempt:", err);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  // Auto-trigger print when attempt loads — user clicked "Download PDF" intentionally
  useEffect(() => {
    if (attempt) {
      window.print();
    }
  }, [attempt]);

  if (isLoading || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report…</p>
        </div>
      </div>
    );
  }

  const pct = attempt.percentage ?? 0;
  const gate = attempt.assessment.masteryThreshold ?? attempt.assessment.passingScore ?? 75;
  const band = masteryBand(pct, gate);

  const answers = attempt.answers;
  const total = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect === true).length;
  const incorrectCount = answers.filter((a) => a.isCorrect === false).length;
  const unansweredCount = answers.filter((a) => a.isCorrect === null).length;

  const studentName =
    attempt.learner?.user
      ? `${attempt.learner.user.firstName ?? ""} ${attempt.learner.user.lastName ?? ""}`.trim() ||
        attempt.learner.user.email
      : "Learner";

  const reportDate = new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media screen {
          body { background: #f3f4f6; }
          .no-print { display: block; }
        }
        @media print {
          body { background: white; margin: 0; }
          .no-print { display: none !important; }
          .print-shadow { box-shadow: none !important; border: 1px solid #e5e7eb; }
          .page-break-after { page-break-after: always; }
          .page-break-before { page-break-before: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          .no-break-inside { page-break-inside: avoid; }
        }
        .print-container {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
          background: white;
        }
        .report-header {
          border-bottom: 3px solid #ea580c;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }
        .score-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin: 1.5rem 0;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
        }
        .summary-card .value { font-size: 1.5rem; font-weight: 700; }
        .summary-card .label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; }
        .question-block {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .question-block.correct { border-left: 4px solid #16a34a; }
        .question-block.incorrect { border-left: 4px solid #dc2626; }
        .question-block.unanswered { border-left: 4px solid #9ca3af; }
        .answer-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .answer-label { font-weight: 600; font-size: 0.75rem; color: #4b5563; text-transform: uppercase; }
        .answer-value { font-size: 0.875rem; }
        .answer-correct { color: #16a34a; }
        .answer-incorrect { color: #dc2626; }
        .explanation-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          color: #1f2937;
        }
        .badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-secondary { background: #f3f4f6; color: #374151; }
        .badge-easy { background: #dcfce7; color: #166534; }
        .badge-medium { background: #fef3c7; color: #92400e; }
        .badge-hard { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; }
        th { background: #f9fafb; font-weight: 600; }
      `}</style>

      {/* Print button for screen view */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7m-6 4l-3-3-3 3h6z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Report content */}
      <div className="print-container">
        {/* Header */}
        <div className="report-header">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Score Report</h1>
          <p className="text-gray-600 mt-1">{attempt.assessment.name}</p>
        </div>

        {/* Student & Attempt Info */}
        <table>
          <tbody>
            <tr>
              <th>Student</th>
              <td>{studentName}</td>
              <th>Assessment</th>
              <td>{typeLabels[attempt.assessment.type] || attempt.assessment.type}</td>
            </tr>
            <tr>
              <th>Date Completed</th>
              <td>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {reportDate}
                </div>
              </td>
              <th>Status</th>
              <td>
                <span className="score-badge bg-green-100 text-green-700">
                  {attempt.status}
                </span>
              </td>
            </tr>
            <tr>
              <th>Time Spent</th>
              <td>
                {attempt.timeSpentSeconds ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {fmtTime(attempt.timeSpentSeconds)}
                  </div>
                ) : (
                  "N/A"
                )}
              </td>
              <th>Mastery Level</th>
              <td>
                <span className={`score-badge ${band.cls}`}>{band.label}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Score Summary */}
        <div className="section-title">Score Summary</div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="value text-blue-600">{Math.round(pct)}%</div>
            <div className="label">Score</div>
          </div>
          <div className="summary-card">
            <div className="value text-green-600">{correctCount}</div>
            <div className="label">Correct</div>
          </div>
          <div className="summary-card">
            <div className="value text-red-600">{incorrectCount}</div>
            <div className="label">Incorrect</div>
          </div>
          <div className="summary-card">
            <div className="value text-gray-500">{unansweredCount}</div>
            <div className="label">Unanswered</div>
          </div>
        </div>

        {/* Points breakdown */}
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Earned Points</th>
              <th>Total Points</th>
              <th>Questions</th>
              <th>Time Limit</th>
              <th>Passing Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{attempt.score ?? 0}</td>
              <td>{attempt.maxScore}</td>
              <td>{total}</td>
              <td>
                {attempt.assessment.timeLimitMinutes
                  ? `${attempt.assessment.timeLimitMinutes} min`
                  : "None"}
              </td>
              <td>
                {attempt.assessment.passingScore
                  ? `${attempt.assessment.passingScore}%`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Question-by-Question Results */}
        <div className="section-title">Detailed Results</div>
        {answers.map((a, idx) => {
          const q = a.question;
          const options = parseOptions(q.options);
          const status =
            a.isCorrect === true ? "correct" : a.isCorrect === false ? "incorrect" : "unanswered";
          const statusIcon =
            a.isCorrect === true ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : a.isCorrect === false ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Target className="h-4 w-4 text-gray-400" />
            );

          return (
            <div
              key={a.id}
              className={`question-block ${status} no-break-inside`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700">Q{idx + 1}</span>
                  {statusIcon}
                  <span className="text-sm font-medium text-gray-700">
                    {a.isCorrect === true
                      ? "Correct"
                      : a.isCorrect === false
                      ? "Incorrect"
                      : "Unanswered"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${typeLabels[q.type] ? "badge-secondary" : "badge-secondary"}`}>
                    {typeLabels[q.type] || q.type}
                  </span>
                  {q.difficulty && (
                    <span
                      className={`badge ${
                        q.difficulty === "EASY"
                          ? "badge-easy"
                          : q.difficulty === "MEDIUM"
                          ? "badge-medium"
                          : "badge-hard"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {a.score ?? 0}/{(q.points ?? 1)} pts
                  </span>
                </div>
              </div>

              <p className="font-medium text-gray-900 mb-3 whitespace-pre-wrap">{q.stem}</p>

              <div className="answer-row">
                <div>
                  <div className="answer-label">Your Answer</div>
                  <div className={`answer-value ${a.isCorrect ? "answer-correct" : "answer-incorrect"}`}>
                    {renderStudentAnswer(a.answer, q, options) || (
                      <span className="text-gray-400 italic">No answer provided</span>
                    )}
                  </div>
                </div>
                {a.isCorrect === false && q.type !== "ESSAY" && (
                  <div>
                    <div className="answer-label">Correct Answer</div>
                    <div className="answer-value answer-correct">
                      {renderCorrectAnswer(q, options)}
                    </div>
                  </div>
                )}
              </div>

              {a.timeSpentSeconds && (
                <div className="mt-2 text-xs text-gray-500">
                  Time spent: {fmtTime(a.timeSpentSeconds)}
                </div>
              )}

              {q.explanation && (
                <div className="explanation-box">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
