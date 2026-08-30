"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assessmentsApi } from "@/lib/api/client";
import { Button, Badge } from "@/components/ui";
import { masteryBand } from "@/lib/mastery";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  AlertCircle,
  RotateCcw,
  SkipForward,
  Play,
} from "lucide-react";

interface PlayerOption {
  id: string;
  text: string;
}
interface PlayerQuestion {
  id: string;
  type: string;
  difficulty?: string;
  stem: string;
  hint?: string | null;
  options: PlayerOption[];
  passageId?: string;
}
interface PlayerPassage {
  id: string;
  title: string;
  content: string;
}
interface PlayerAssessment {
  id: string;
  name: string;
  type: string;
  timeLimitMinutes?: number | null;
  showExplanations?: boolean;
  passingScore?: number | null;
  masteryThreshold?: number | null;
  allowRetake?: boolean;
}
interface StartResponse {
  attempt: { id: string; maxScore: number; startedAt?: string };
  assessment: PlayerAssessment;
  questions: PlayerQuestion[];
  passages?: PlayerPassage[];
  // CS#22.8 — answers already saved for a resumed IN_PROGRESS attempt.
  savedAnswers?: { questionId: string; answer: unknown; timeSpentSeconds?: number }[];
}
interface SubmitResult {
  score?: number;
  maxScore: number;
  percentage?: number;
  answers: {
    questionId: string;
    isCorrect: boolean | null;
    question: { id: string; stem: string; explanation?: string | null };
  }[];
}
interface RecommendationsResult {
  assessmentId: string;
  isMastered: boolean;
  bestScore: number;
  gate: number;
  canRetry: boolean;
  attemptsUsed: number;
  maxAttempts: number | null;
  weakTopics: { id: string; name: string; subjectName?: string }[];
  suggestions: string[];
  hasLowExposure: boolean;
  message: string;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function AssessmentPlayerPage() {
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StartResponse | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Record<string, number>>({});
  // CS#21: pre-start "Before You Begin" gate. The attempt is NOT auto-started.
  const [started, setStarted] = useState(false);
  const [instr, setInstr] = useState<{
    name: string;
    timeLimitMinutes?: number | null;
    questionCount: number;
    randomize: boolean;
  } | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);
  // CS#22.8 — autosave/state hydration:
  const [resumeAttemptId, setResumeAttemptId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [forceSaveToken, setForceSaveToken] = useState(0);
  const lastSavedJson = useRef<string | null>(null);

  // Start (or resume) an attempt — a retry draws a fresh variant, while an
  // existing IN_PROGRESS attempt (from startAttempt's resume branch) restores
  // the previously autosaved answers.
  const beginAttempt = async () => {
    setLoading(true);
    setError(null);
    submittedRef.current = false;
    setResult(null);
    setAnswers({});
    setFlagged(new Set());
    setReviewed(new Set());
    setCurrent(0);
    setTimeLeft(null);
    setShowConfirm(false);
    lastSavedJson.current = null;
    try {
      const res = (await assessmentsApi.start(assessmentId)) as StartResponse;
      setData(res);
      if (res.assessment.timeLimitMinutes && res.assessment.timeLimitMinutes > 0) {
        // Resume the in-flight clock when an attempt was already started.
        const startedAt = res.attempt.startedAt ? new Date(res.attempt.startedAt).getTime() : Date.now();
        const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        setTimeLeft(Math.max(0, res.assessment.timeLimitMinutes * 60 - elapsed));
      }
      // CS#22.8 — hydrate answers saved by the autosave endpoint (refresh-safe).
      if (res.savedAnswers && res.savedAnswers.length > 0) {
        const restored: Record<string, unknown> = {};
        for (const sa of res.savedAnswers) restored[sa.questionId] = sa.answer;
        setAnswers(restored);
        lastSavedJson.current = JSON.stringify(
          res.savedAnswers.map((sa) => ({
            questionId: sa.questionId,
            answer: sa.answer,
            timeSpentSeconds: sa.timeSpentSeconds,
          }))
        );
        setSaveStatus("saved");
      } else {
        lastSavedJson.current = "[]";
        setSaveStatus("idle");
      }
    } catch (err) {
      console.error("Failed to start assessment:", err);
      setError(
        (err as Error)?.message ||
          "This assessment could not be started. It may be locked, unpublished, or you've reached the attempt limit."
      );
    } finally {
      setLoading(false);
    }
  };

  // Populate the "Before You Begin" instructions WITHOUT starting an attempt,
  // and detect an existing IN_PROGRESS attempt so the gate offers "Continue".
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [meta, mine] = await Promise.all([
          assessmentsApi.getById(assessmentId) as Promise<{
            name: string;
            timeLimitMinutes?: number | null;
            randomizeQuestions?: boolean;
            questions?: unknown[];
          }>,
          assessmentsApi.myAttempts().catch(() => []),
        ]);
        if (!active) return;
        setInstr({
          name: meta.name,
          timeLimitMinutes: meta.timeLimitMinutes,
          questionCount: meta.questions?.length ?? 0,
          randomize: !!meta.randomizeQuestions,
        });
        // CS#22.8 — an active attempt means the gate should offer resume.
        const activeAttempt = (Array.isArray(mine) ? mine : []).find(
          (a) =>
            a.assessmentId === assessmentId &&
            a.status === "IN_PROGRESS"
        );
        if (activeAttempt) {
          setResumeAttemptId(activeAttempt.id);
        }
      } catch {
        // Metadata is optional — the instructions still render with defaults.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const handleStart = async () => {
    setStarted(true);
    await beginAttempt();
  };

  const doSubmit = async () => {
    if (submittedRef.current || !data) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const now = Date.now();
      const payload = Object.entries(answersRef.current).map(([questionId, answer]) => {
        const startTime = questionStartTime[questionId];
        const timeSpentSeconds = startTime ? Math.round((now - startTime) / 1000) : undefined;
        return { questionId, answer, timeSpentSeconds };
      });
      const res = (await assessmentsApi.submit(data.attempt.id, payload)) as SubmitResult;
      setResult(res);
      // Fetch retry recommendations after submit
      try {
        const recs = (await assessmentsApi.recommendations(assessmentId)) as RecommendationsResult;
        setRecommendations(recs);
      } catch (e) {
        console.error("Failed to load recommendations:", e);
      }
    } catch (err) {
      console.error("Failed to submit:", err);
      submittedRef.current = false;
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown + auto-submit
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      void doSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]);

  // CS#22.8 — incremental autosave with an 800ms debounce (refresh-safe). The
  // final submit remains authoritative; autosave only persists progress.
  useEffect(() => {
    if (!data || !started || result) return;
    const payload = Object.entries(answers).map(([questionId, answer]) => {
      const startTime = questionStartTime[questionId];
      const timeSpentSeconds = startTime
        ? Math.round((Date.now() - startTime) / 1000)
        : undefined;
      return { questionId, answer, timeSpentSeconds };
    });
    const json = JSON.stringify(payload);
    if (json === lastSavedJson.current) return;

    const t = setTimeout(() => {
      setSaveStatus("saving");
      assessmentsApi
        .saveAnswers(data.attempt.id, payload)
        .then(() => {
          lastSavedJson.current = json;
          setSaveStatus("saved");
        })
        .catch((err) => {
          console.error("Autosave failed:", err);
          setSaveStatus("error");
        });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, data, started, result, questionStartTime, forceSaveToken]);

  // Record when each question is first shown so submit can store per-question
  // time spent (previously this map was never written).
  useEffect(() => {
    if (!started || !data || result) return;
    const qid = data.questions[current]?.id;
    if (!qid) return;
    setQuestionStartTime((prev) =>
      prev[qid] ? prev : { ...prev, [qid]: Date.now() }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, started, data, result]);

  // ---- CS#21: "Before You Begin" instructions gate (real rules only) ----
  if (!started) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-arc-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-arc-navy-900 text-white px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-arc-orange-300">
                Before You Begin
              </div>
              <h1 className="text-xl font-bold mt-1">{instr?.name || "Assessment"}</h1>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-arc-slate-50 px-4 py-3">
                  <div className="text-xs text-arc-slate-500">Questions</div>
                  <div className="text-2xl font-bold text-arc-navy-900 leading-none mt-1">
                    {instr ? instr.questionCount || "0" : "…"}
                  </div>
                </div>
                <div className="rounded-xl bg-arc-slate-50 px-4 py-3">
                  <div className="text-xs text-arc-slate-500">Time limit</div>
                  <div className="text-2xl font-bold text-arc-navy-900 leading-none mt-1">
                    {instr?.timeLimitMinutes
                      ? `${instr.timeLimitMinutes} min`
                      : instr
                        ? "Untimed"
                        : "…"}
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5">
                {instr?.randomize ? (
                  <li className="flex items-start gap-2 text-sm text-arc-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-arc-green-500 mt-0.5 flex-shrink-0" />
                    Your question order is randomized for this attempt.
                  </li>
                ) : null}
                <li className="flex items-start gap-2 text-sm text-arc-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-arc-green-500 mt-0.5 flex-shrink-0" />
                  Your attempt is preserved if you refresh or resume.
                </li>
                <li className="flex items-start gap-2 text-sm text-arc-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-arc-green-500 mt-0.5 flex-shrink-0" />
                  Submit the examination when you are finished.
                </li>
              </ul>

              {resumeAttemptId ? (
                <div className="mt-4 rounded-lg bg-arc-slate-100 border border-arc-slate-200 px-4 py-3 flex items-start gap-2 text-sm text-arc-navy-800">
                  <RefreshCw className="h-4 w-4 text-arc-orange-600 mt-0.5 flex-shrink-0" />
                  <span>
                    You have an attempt in progress. Continue to restore your
                    saved answers and resume where you left off.
                  </span>
                </div>
              ) : null}

              <Button className="w-full mt-4" size="lg" onClick={handleStart}>
                <Play className="h-4 w-4 mr-2" />
                {resumeAttemptId ? "Continue Attempt" : "Start Examination"}
              </Button>
              <Link href="/dashboard/assessments" className="block text-center mt-3">
                <Button variant="ghost" className="text-arc-slate-500">
                  Cancel and return
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Preparing your assessment…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-arc-slate-600 mb-4">{error || "Assessment unavailable."}</p>
          <Link href="/dashboard">
            <Button variant="accent">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---- Results view ----
  if (result) {
    const pct = Math.round(result.percentage ?? 0);
    const gate = data.assessment.masteryThreshold ?? data.assessment.passingScore ?? 75;
    const band = masteryBand(pct, gate);
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-arc-slate-200 p-8 text-center">
            <div className="text-5xl font-bold text-arc-navy-900">{pct}%</div>
            <Badge className={`mt-3 ${band.cls}`}>{band.label}</Badge>
            <p className="text-arc-slate-500 mt-3">
              {result.score ?? 0} of {result.maxScore} correct · Mastery at {gate}%
            </p>
          </div>

          {/* Retry recommendations */}
          {recommendations && (
            <div className="mt-6 rounded-xl border border-arc-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-arc-slate-500 uppercase tracking-wide mb-3">
                Suggestions
              </h3>
              {recommendations.message ? (
                <p className="text-sm text-arc-navy-900 mb-3">{recommendations.message}</p>
              ) : null}

              {recommendations.weakTopics && recommendations.weakTopics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-arc-slate-500 mb-2">Weak topics</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.weakTopics.map((t) => (
                      <span
                        key={t.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-arc-slate-100 text-arc-slate-700"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.suggestions && recommendations.suggestions.length > 0 && (
                <ul className="text-sm text-arc-slate-600 space-y-1 list-disc list-inside">
                  {recommendations.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}

              {recommendations.attemptsUsed > 0 && recommendations.maxAttempts && (
                <p className="text-xs text-arc-slate-500 mt-2">
                  Attempts used: {recommendations.attemptsUsed} / {recommendations.maxAttempts}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-arc-slate-500 uppercase tracking-wide">Review</h3>
            {result.answers.map((a, i) => (
              <div key={a.questionId} className="rounded-lg border border-arc-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {a.isCorrect === true ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : a.isCorrect === false ? (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-arc-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-arc-navy-900">
                      {i + 1}. {a.question.stem}
                    </div>
                    {data.assessment.showExplanations && a.question.explanation && (
                      <p className="text-sm text-arc-slate-500 mt-1">{a.question.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            {recommendations?.canRetry && pct < gate ? (
              <Button variant="accent" onClick={beginAttempt}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try a new variant
              </Button>
            ) : pct < gate && data.assessment.allowRetake ? (
              <Button variant="accent" onClick={beginAttempt}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try a new variant
              </Button>
            ) : null}
            <Link href={`/dashboard/assessments/${data.assessment.id}/review?attemptId=${data.attempt.id}`}>
              <Button variant={pct < gate && data.assessment.allowRetake ? "outline" : "accent"}>
                Review Answers
              </Button>
            </Link>
            <Link href="/dashboard/assessments">
              <Button variant="outline">Back to List</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Taking view ----
  const q = data.questions[current];
  const total = data.questions.length;
  const answeredCount = data.questions.filter((qq) => {
    const v = answers[qq.id];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  }).length;

  const setAnswer = (value: unknown) => setAnswers((prev) => ({ ...prev, [q.id]: value }));
  const toggleFlag = () =>
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });

  const isAnswered = (qid: string) => {
    const v = answers[qid];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  };

  const nextUnanswered = () => {
    const idx = data.questions.findIndex((qq) => !isAnswered(qq.id));
    return idx >= 0 ? idx : null;
  };

  const handleNavNext = () => {
    if (current < total - 1) {
      setCurrent(current + 1);
    }
  };
  const handleNavPrev = () => {
    if (current > 0) setCurrent(current - 1);
  };
  const goToAction = (idx: number) => setCurrent(idx);

  const handleSaveAndNext = () => {
    const idx = nextUnanswered();
    if (idx !== null && idx !== current) {
      setCurrent(idx);
    } else {
      handleNavNext();
    }
  };

  const handleSubmit = () => {
    if (answeredCount < total) {
      setShowConfirm(true);
    } else {
      void doSubmit();
    }
  };

  const unansweredCount = total - answeredCount;

  // Compact adaptive palette: fewer columns for small exams, more for large
  // ones, so the navigator stays short instead of a long single-column scroll.
  const navCols =
    total <= 8 ? "grid-cols-4" : total <= 16 ? "grid-cols-5" : total <= 30 ? "grid-cols-6" : "grid-cols-7";
  const navFont = total <= 16 ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="shrink-0 border-b border-arc-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="text-arc-slate-400 hover:text-arc-navy-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="font-semibold text-arc-navy-900 truncate">{data.assessment.name}</div>
              <div className="text-xs text-arc-slate-500">
                {answeredCount}/{total} answered
                {unansweredCount > 0 && <span className="text-red-500"> · {unansweredCount} unanswered</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {timeLeft !== null && (
              <span
                className={`flex items-center gap-1.5 font-mono text-sm px-2.5 py-1 rounded-lg ${
                  timeLeft <= 60 ? "bg-red-50 text-red-600" : "bg-arc-slate-100 text-arc-navy-900"
                }`}
              >
                <Clock className="h-4 w-4" />
                {fmtTime(timeLeft)}
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-xs text-arc-slate-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-xs text-arc-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <button
                type="button"
                onClick={() => setForceSaveToken((k) => k + 1)}
                className="flex items-center gap-1.5 text-xs text-arc-red-500 hover:underline"
              >
                <AlertCircle className="h-3 w-3" />
                Not saved - Retry
              </button>
            )}
            {flagged.size > 0 && (
              <span className="flex items-center gap-1 text-xs text-arc-orange-600 bg-arc-orange-50 px-2 py-0.5 rounded-lg">
                <Flag className="h-3 w-3" />
                {flagged.size} flagged
              </span>
            )}
            <Button variant="accent" size="sm" onClick={handleSubmit} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-arc-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-arc-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Navigator sidebar */}
        <aside className="w-64 shrink-0 border-r border-arc-slate-200 bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 pt-4 pb-3 border-b border-arc-slate-100">
            <p className="text-xs font-semibold text-arc-slate-500 uppercase tracking-wide">
              Question Navigator
            </p>
            <p className="text-xs text-arc-slate-500 mt-0.5">
              {answeredCount} of {total} answered
            </p>
          </div>

          <div className="px-4 py-3">
            <div className={`grid ${navCols} gap-1.5`}>
              {data.questions.map((qq, i) => {
                const active = i === current;
                const done = isAnswered(qq.id);
                const flag = flagged.has(qq.id);
                const rev = reviewed.has(qq.id);
                const stateLabel = done ? "Answered" : flag ? "Flagged" : rev ? "Reviewed" : "Unanswered";
                const hoverCls = !done && !active ? "hover:bg-arc-slate-50" : "";

                let bg = "bg-white text-arc-slate-400 border-arc-slate-200";
                if (done) {
                  bg = "bg-arc-navy-900 text-white border-arc-navy-900";
                }
                if (flag) {
                  bg = "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-600";
                }
                if (active) {
                  bg = "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-600";
                }

                return (
                  <button
                    key={qq.id}
                    onClick={() => goToAction(i)}
                    title={`Question ${i + 1} — ${stateLabel}`}
                    aria-label={`Question ${i + 1} — ${stateLabel}`}
                    aria-current={active ? "true" : undefined}
                    className={`relative aspect-square w-full rounded-lg ${navFont} font-semibold border transition-all flex items-center justify-center ${bg} ${
                      active ? "ring-2 ring-arc-orange-400" : hoverCls
                    }`}
                  >
                    {flag && <Flag className="h-2.5 w-2.5 absolute top-0.5 right-0.5 fill-arc-orange-500 text-arc-orange-500" />}
                    {rev && <span className="h-1.5 w-1.5 absolute bottom-0.5 right-0.5 rounded-full bg-green-500" />}
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend with live counts */}
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-arc-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-arc-slate-300" />
                Unanswered
                <span className="ml-auto font-semibold text-arc-slate-800">{unansweredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-arc-navy-900" />
                Answered
                <span className="ml-auto font-semibold text-arc-slate-800">{answeredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-arc-orange-500" />
                Flagged
                <span className="ml-auto font-semibold text-arc-slate-800">{flagged.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Reviewed
                <span className="ml-auto font-semibold text-arc-slate-800">{reviewed.size}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Question panel */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 bg-arc-slate-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-arc-slate-500">
                Question {current + 1} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg border ${
                    flagged.has(q.id)
                      ? "border-arc-orange-300 bg-arc-orange-50 text-arc-orange-600"
                      : "border-arc-slate-200 text-arc-slate-500 hover:text-arc-navy-900"
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  {flagged.has(q.id) ? "Flagged" : "Flag"}
                </button>
                <button
                  onClick={() => {
                    const next = new Set(reviewed);
                    if (next.has(q.id)) next.delete(q.id);
                    else next.add(q.id);
                    setReviewed(next);
                  }}
                  className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg border ${
                    reviewed.has(q.id)
                      ? "border-green-300 bg-green-50 text-green-600"
                      : "border-arc-slate-200 text-arc-slate-500 hover:text-arc-navy-900"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {reviewed.has(q.id) ? "Reviewed" : "Mark reviewed"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-arc-slate-200 p-6">
              {/* Passage content (if linked) */}
              {q.passageId && data.passages && (
                (() => {
                  const passage = data.passages.find((p) => p.id === q.passageId);
                  return passage ? (
                    <div className="mb-4 p-4 bg-arc-slate-50 rounded-lg border border-arc-slate-200">
                      <p className="text-xs font-semibold text-arc-slate-500 uppercase tracking-wide mb-2">
                        Read the passage below:
                      </p>
                      <h4 className="font-semibold text-arc-navy-900 mb-2">{passage.title}</h4>
                      <p className="text-sm text-arc-slate-700 whitespace-pre-wrap leading-relaxed">
                        {passage.content}
                      </p>
                    </div>
                  ) : null;
                })()
              )}

              <p className="text-lg font-medium text-arc-navy-900 whitespace-pre-wrap">{q.stem}</p>

              <div className="mt-5">
                <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} />
              </div>
            </div>

            {/* Navigation controls */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavPrev}
                disabled={current === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex gap-2">
                {unansweredCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleSaveAndNext}>
                    <SkipForward className="h-4 w-4 mr-1" />
                    Save & Next Unanswered
                  </Button>
                )}
                {current < total - 1 ? (
                  <Button variant="outline" size="sm" onClick={handleNavNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="accent" size="sm" onClick={handleSubmit} disabled={submitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting…" : "Submit All"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirm submit with unanswered questions */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-arc-navy-900 mb-2">Unanswered Questions</h3>
            <p className="text-sm text-arc-slate-600 mb-4">
              You have {unansweredCount} unanswered {unansweredCount === 1 ? "question" : "questions"}.
              They will be marked as incorrect. Are you sure you want to submit?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                Go Back
              </Button>
              <Button variant="accent" size="sm" onClick={() => { setShowConfirm(false); void doSubmit(); }}>
                Submit Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: PlayerQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  // FILL_IN_THE_BLANK
  if (q.type === "FILL_IN_THE_BLANK") {
    return (
      <input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
      />
    );
  }

  // NUMERIC
  if (q.type === "NUMERIC") {
    return (
      <div className="space-y-2">
        <input
          type="number"
          step="any"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          placeholder="Enter a number…"
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        />
        <p className="text-xs text-arc-slate-500">
          Accepts decimals. Use tolerance for approximate answers.
        </p>
      </div>
    );
  }

  // ORDERING - arrange items in sequence
  if (q.type === "ORDERING") {
    const currentOrder = Array.isArray(value) ? (value as string[]) : q.options.map((o) => o.id);
    const items = q.options.length > 0 ? q.options : [];

    const moveUp = (index: number) => {
      if (index === 0) return;
      const newOrder = [...currentOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onChange(newOrder);
    };

    const moveDown = (index: number) => {
      if (index === currentOrder.length - 1) return;
      const newOrder = [...currentOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onChange(newOrder);
    };

    if (items.length === 0) {
      return (
        <div className="text-sm text-arc-slate-500 italic">
          No items to arrange for this question.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-arc-slate-600 mb-3">
          Click arrows to arrange items in the correct order:
        </p>
        <div className="space-y-2">
          {currentOrder.map((id, index) => {
            const item = items.find((o) => o.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-arc-slate-100 flex items-center justify-center text-xs font-semibold text-arc-slate-600 shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 px-3 py-2 bg-arc-slate-50 border border-arc-slate-200 rounded-lg text-sm text-arc-navy-900">
                  {item.text}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="h-5 w-5 rounded text-arc-slate-400 hover:text-arc-slate-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === currentOrder.length - 1}
                    className="h-5 w-5 rounded text-arc-slate-400 hover:text-arc-slate-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MULTIPLE_SELECT
  if (q.type === "MULTIPLE_SELECT") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (id: string) =>
      onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    return (
      <div className="space-y-2">
        <p className="text-xs text-arc-slate-500 mb-2">Select all that apply</p>
        {q.options.map((o) => {
          const on = arr.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`w-full flex items-center gap-3 text-left rounded-lg border px-4 py-3 transition-colors ${
                on ? "border-arc-orange-400 bg-arc-orange-50" : "border-arc-slate-200 hover:border-arc-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 ${
                  on ? "border-arc-orange-500 bg-arc-orange-500 text-white" : "border-arc-slate-300"
                }`}
              >
                {on && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
              <span className="text-arc-navy-900">{o.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // MATCHING (similar to single select for now)
  if (q.type === "MATCHING") {
    return (
      <div className="space-y-2">
        {q.options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`w-full flex items-center gap-3 text-left rounded-lg border px-4 py-3 transition-colors ${
                on ? "border-arc-orange-400 bg-arc-orange-50" : "border-arc-slate-200 hover:border-arc-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 ${
                  on ? "border-arc-orange-500" : "border-arc-slate-300"
                }`}
              >
                {on && <span className="h-2.5 w-2.5 rounded-full bg-arc-orange-500" />}
              </span>
              <span className="text-arc-navy-900">{o.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ESSAY
  if (q.type === "ESSAY") {
    return (
      <div className="space-y-2">
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your response…"
          rows={6}
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
        />
        <p className="text-xs text-arc-slate-500">
          This question will be reviewed by an instructor.
        </p>
      </div>
    );
  }

  // MULTIPLE_CHOICE / TRUE_FALSE (single select)
  return (
    <div className="space-y-2">
      {q.options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`w-full flex items-center gap-3 text-left rounded-lg border px-4 py-3 transition-colors ${
              on ? "border-arc-orange-400 bg-arc-orange-50" : "border-arc-slate-200 hover:border-arc-slate-300"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                on ? "border-arc-orange-500" : "border-arc-slate-300"
              }`}
            >
              {on && <span className="h-2.5 w-2.5 rounded-full bg-arc-orange-500" />}
            </span>
            <span className="text-arc-navy-900">{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}
