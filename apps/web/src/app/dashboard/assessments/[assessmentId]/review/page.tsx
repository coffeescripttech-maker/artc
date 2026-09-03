"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { assessmentsApi } from "@/lib/api/client";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { masteryBand } from "@/lib/mastery";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Info,
  Target,
  SkipForward,
  SkipBack,
  Download,
  Printer,
  Lightbulb,
} from "lucide-react";

interface ReviewOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface ReviewQuestion {
  id: string;
  type: string;
  difficulty?: string;
  stem: string;
  hint?: string | null;
  options?: string | ReviewOption[];
  correctAnswer?: unknown;
  explanation?: string | null;
  tolerance?: number | null;
  passageId?: string | null;
}

interface AttemptAnswer {
  id: string;
  questionId: string;
  answer: unknown;
  isCorrect: boolean | null;
  score: number;
  timeSpentSeconds?: number | null;
  createdAt: string;
  question: ReviewQuestion;
}

interface ReviewAttempt {
  id: string;
  status: string;
  score: number;
  maxScore: number;
  percentage: number | null;
  timeSpentSeconds?: number | null;
  startedAt: string;
  completedAt?: string | null;
  assessment: {
    id: string;
    name: string;
    type: string;
    timeLimitMinutes?: number | null;
    passingScore?: number | null;
    masteryThreshold?: number | null;
    showExplanations?: boolean | null;
    allowRetake?: boolean | null;
  };
  answers: AttemptAnswer[];
}

function parseOptions(options: unknown): ReviewOption[] {
  if (!options) return [];
  if (Array.isArray(options)) return options as ReviewOption[];
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? (parsed as ReviewOption[]) : [];
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

function isOptionCorrect(question: ReviewQuestion, option: ReviewOption): boolean {
  if (option.isCorrect !== undefined) return option.isCorrect;
  const correctIds = parseCorrectAnswer(question.correctAnswer);
  return correctIds.includes(option.id);
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function QuestionReview({
  q,
  answer,
  isCorrect,
  score,
  timeSpentSeconds,
}: {
  q: AttemptAnswer["question"];
  answer: unknown;
  isCorrect: boolean | null;
  score: number;
  timeSpentSeconds?: number | null;
}) {
  const options = parseOptions(q.options);
  const correctIds = parseCorrectAnswer(q.correctAnswer);

  const renderOption = (opt: ReviewOption, index: number) => {
    const isSelected =
      typeof answer === "string"
        ? answer === opt.id
        : Array.isArray(answer)
          ? answer.includes(opt.id)
          : false;
    const correct = isOptionCorrect(q, opt);

    let optionClass = "border-arc-slate-200 bg-white";
    let badge: React.ReactNode = null;

    if (isCorrect !== null) {
      if (correct) {
        optionClass = "border-green-500 bg-green-50";
        badge = <CheckCircle2 className="h-4 w-4 text-green-500" />;
      } else if (isSelected && !correct) {
        optionClass = "border-red-500 bg-red-50";
        badge = <XCircle className="h-4 w-4 text-red-500" />;
      }
    } else if (isSelected) {
      optionClass = "border-arc-orange-400 bg-arc-orange-50";
    }

    return (
      <div
        key={opt.id}
        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${optionClass}`}
      >
        <span className="text-xs font-medium text-arc-slate-400 w-5">
          {String.fromCharCode(65 + index)}.
        </span>
        <span className="flex-1 text-sm text-arc-navy-900">{opt.text}</span>
        {badge}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-arc-navy-900">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {q.type.replace(/_/g, " ")}
              </Badge>
              {q.difficulty && (
                <Badge
                  className={`text-xs ${
                    q.difficulty === "EASY"
                      ? "bg-green-100 text-green-700"
                      : q.difficulty === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {q.difficulty}
                </Badge>
              )}
            </div>
          </CardTitle>
          {isCorrect === true ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Correct</span>
            </div>
          ) : isCorrect === false ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Incorrect</span>
            </div>
          ) : null}
        </div>
        <p className="text-sm text-arc-navy-800 whitespace-pre-wrap leading-relaxed">{q.stem}</p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Answer rendering by type */}
        {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && (
          <div className="space-y-2">{options.map((opt, i) => renderOption(opt, i))}</div>
        )}

        {q.type === "MULTIPLE_SELECT" && (
          <div className="space-y-2">
            <p className="text-xs text-arc-slate-500 mb-2">Selected answers marked below</p>
            {options.map((opt, i) => renderOption(opt, i))}
          </div>
        )}

        {q.type === "ORDERING" && (
          <div className="space-y-2">
            {Array.isArray(answer) ? (
              <div className="space-y-2">
                {answer.map((ansId: string, idx: number) => {
                  const opt = options.find((o) => o.id === ansId);
                  if (!opt) return null;
                  const correct = isOptionCorrect(q, opt);
                  const expectedIdx = correctIds.indexOf(opt.id);
                  const correctPosition = expectedIdx >= 0;
                  const positionClass = correctPosition
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50";
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${positionClass}`}
                    >
                      <span className="text-xs font-medium text-arc-slate-400 w-5">{idx + 1}.</span>
                      <span className="flex-1 text-sm text-arc-navy-900">{opt.text}</span>
                      {correctPosition ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-arc-slate-500">No answer recorded</p>
            )}
          </div>
        )}

        {q.type === "MATCHING" && (
          <div className="space-y-2">
            {Array.isArray(answer) ? (
              <div className="space-y-2">
                {answer.map((ansId: string, idx: number) => {
                  const opt = options.find((o) => o.id === ansId);
                  if (!opt) return null;
                  const correct = isOptionCorrect(q, opt);
                  const positionClass = correct
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50";
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${positionClass}`}
                    >
                      <span className="text-xs font-medium text-arc-slate-400 w-5">{idx + 1}.</span>
                      <span className="flex-1 text-sm text-arc-navy-900">{opt.text}</span>
                      {correct ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-arc-slate-500">No answer recorded</p>
            )}
          </div>
        )}

        {(q.type === "FILL_IN_THE_BLANK" ||
          q.type === "IDENTIFICATION" ||
          q.type === "SHORT_ANSWER") && (
          <div>
            <div
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                isCorrect
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-red-500 bg-red-50 text-red-800"
              }`}
            >
              {typeof answer === "string" ? answer : String(answer ?? "")}
            </div>
            {isCorrect === false && q.correctAnswer != null && (
              <p className="mt-2 text-sm text-arc-navy-600">
                Correct answer: <strong>{String(q.correctAnswer)}</strong>
              </p>
            )}
          </div>
        )}

        {q.type === "NUMERIC" && (
          <div>
            <div
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                isCorrect
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-red-500 bg-red-50 text-red-800"
              }`}
            >
              {typeof answer === "number"
                ? answer
                : typeof answer === "string" && answer
                  ? answer
                  : ""}
            </div>
            {q.tolerance && q.tolerance > 0 && (
              <p className="mt-1 text-xs text-arc-slate-500">
                Accepts answers within ±{q.tolerance}
              </p>
            )}
            {isCorrect === false && q.correctAnswer !== undefined && (
              <p className="mt-2 text-sm text-arc-navy-600">
                Correct answer: <strong>{String(q.correctAnswer ?? "")}</strong>
              </p>
            )}
          </div>
        )}

        {q.type === "ESSAY" && (
          <div>
            <div className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm bg-arc-slate-50 min-h-[80px] whitespace-pre-wrap">
              {typeof answer === "string" ? answer : ""}
            </div>
            <p className="mt-1 text-xs text-arc-slate-500">
              This question will be reviewed by an instructor.
            </p>
          </div>
        )}

        {/* Explanation */}
        {q.explanation && (
          <div className="mt-4 p-3 rounded-lg bg-arc-navy-50 border border-arc-navy-100">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-arc-navy-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-arc-navy-800">{q.explanation}</p>
            </div>
          </div>
        )}

        {/* Points earned */}
        <div className="mt-3 flex items-center justify-between text-xs text-arc-slate-500">
          <span>
            Points earned: <strong className="text-arc-navy-900">{score}</strong>
            {timeSpentSeconds ? (
              <span className="ml-3">Time: {fmtTime(timeSpentSeconds)}</span>
            ) : null}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssessmentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = params.assessmentId as string;
  const attemptId = searchParams.get("attemptId") || "";

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<ReviewAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const data = (await assessmentsApi.getAttempt(attemptId)) as ReviewAttempt;
      setAttempt(data);
    } catch (err) {
      console.error("Failed to load attempt:", err);
      setError((err as Error)?.message || "Failed to load attempt.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading your review…</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-arc-slate-600 mb-4">{error || "Attempt not found."}</p>
          <Link href={`/dashboard/assessments`}>
            <Button variant="accent">Back to Assessments</Button>
          </Link>
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

  const goToQuestion = (idx: number) => {
    setCurrentQ(Math.max(0, Math.min(idx, total - 1)));
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleNext = () => {
    if (currentQ < total - 1) setCurrentQ(currentQ + 1);
  };

  const currentAnswer = answers[currentQ];

  return (
    <div className="min-h-screen bg-arc-slate-50">
      {/* Header */}
      <div className="shrink-0 border-b border-arc-slate-200 bg-white px-6 py-4">
        <div className="max-w-12xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/dashboard/assessments`}>
              <ArrowLeft className="h-5 w-5 text-arc-slate-400 hover:text-arc-navy-900" />
            </Link>
            <div className="min-w-0">
              <div className="font-semibold text-arc-navy-900 truncate">
                {attempt.assessment.name}
              </div>
              <div className="text-xs text-arc-slate-500">
                Review · {Math.round(pct)}% · {correctCount}/{total} correct
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={band.cls}>{band.label}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                window.open(
                  `/dashboard/assessments/${assessmentId}/report?attemptId=${attemptId}`,
                  "_blank"
                )
              }
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-12xl mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main: Question review */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-arc-slate-500">
                Question {currentQ + 1} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentQ === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentQ === total - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {currentAnswer ? (
              <QuestionReview
                q={currentAnswer.question}
                answer={currentAnswer.answer}
                isCorrect={currentAnswer.isCorrect}
                score={currentAnswer.score ?? 0}
                timeSpentSeconds={currentAnswer.timeSpentSeconds}
              />
            ) : null}
          </div>

          {/* Sidebar: Navigator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Question Navigator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {answers.map((a, idx) => {
                    const isActive = idx === currentQ;
                    const status =
                      a.isCorrect === true
                        ? "correct"
                        : a.isCorrect === false
                          ? "incorrect"
                          : "unanswered";

                    const statusColors = {
                      correct: "bg-green-500 text-white border-green-500",
                      incorrect: "bg-red-500 text-white border-red-500",
                      unanswered: "bg-arc-slate-300 text-arc-navy-800 border-arc-slate-300",
                    };
                    const colors = statusColors[status];

                    return (
                      <button
                        key={a.id}
                        onClick={() => goToQuestion(idx)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium border transition-all ${
                          isActive ? "ring-2 ring-arc-orange-400" : ""
                        } ${colors} ${isActive ? "ring-offset-2" : ""}`}
                      >
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20">
                          {idx + 1}
                        </span>
                        <span className="truncate">
                          {status === "correct"
                            ? "✓ Correct"
                            : status === "incorrect"
                              ? "✗ Incorrect"
                              : "○ Unanswered"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 text-xs text-arc-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span>Correct ({correctCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span>Incorrect ({incorrectCount})</span>
                  </div>
                  {unansweredCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-arc-slate-300" />
                      <span>Unanswered ({unansweredCount})</span>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-arc-slate-200 space-y-1">
                    {attempt.timeSpentSeconds ? (
                      <div>Time spent: {fmtTime(attempt.timeSpentSeconds)}</div>
                    ) : null}
                    {attempt.assessment.showExplanations && (
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 mt-0.25" />
                        <span>Explanations are shown for each question</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Retry button */}
            {attempt.assessment.allowRetake && (
              <Link href={`/dashboard/assessments/${assessmentId}`} className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Retake Assessment
                </Button>
              </Link>
            )}

            {/* Study plan link */}
            <Link
              href={`/dashboard/assessments/${assessmentId}/recommendations`}
              className="block mt-2"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Lightbulb className="h-4 w-4" />
                Get Study Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
