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
  attempt: { id: string; maxScore: number };
  assessment: PlayerAssessment;
  questions: PlayerQuestion[];
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  // Start (or restart) an attempt — a retry draws a fresh variant.
  const beginAttempt = async () => {
    setLoading(true);
    setError(null);
    submittedRef.current = false;
    setResult(null);
    setAnswers({});
    setFlagged(new Set());
    setCurrent(0);
    setTimeLeft(null);
    try {
      const res = (await assessmentsApi.start(assessmentId)) as StartResponse;
      setData(res);
      if (res.assessment.timeLimitMinutes && res.assessment.timeLimitMinutes > 0) {
        setTimeLeft(res.assessment.timeLimitMinutes * 60);
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

  useEffect(() => {
    void beginAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const doSubmit = async () => {
    if (submittedRef.current || !data) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = Object.entries(answersRef.current).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const res = (await assessmentsApi.submit(data.attempt.id, payload)) as SubmitResult;
      setResult(res);
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
            {pct < gate && data.assessment.allowRetake && (
              <Button variant="accent" onClick={beginAttempt}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try a new variant
              </Button>
            )}
            <Link href="/dashboard/assessments">
              <Button variant={pct < gate && data.assessment.allowRetake ? "outline" : "accent"}>Done</Button>
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

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Top bar */}
      <div className="shrink-0 border-b border-arc-slate-200 bg-white px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-arc-slate-400 hover:text-arc-navy-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="font-semibold text-arc-navy-900 truncate">{data.assessment.name}</div>
            <div className="text-xs text-arc-slate-500">
              {answeredCount}/{total} answered
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="accent" size="sm" onClick={doSubmit} disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Navigator */}
        <aside className="w-52 shrink-0 border-r border-arc-slate-200 bg-white p-4 overflow-y-auto">
          <div className="grid grid-cols-5 gap-2">
            {data.questions.map((qq, i) => {
              const active = i === current;
              const done = isAnswered(qq.id);
              const flag = flagged.has(qq.id);
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={`relative h-9 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-600"
                      : done
                        ? "border-arc-slate-200 bg-arc-navy-900 text-white"
                        : "border-arc-slate-200 bg-white text-arc-slate-500 hover:border-arc-slate-300"
                  }`}
                >
                  {i + 1}
                  {flag && <Flag className="h-2.5 w-2.5 text-arc-orange-500 absolute top-0.5 right-0.5 fill-arc-orange-500" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Question */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 bg-arc-slate-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-arc-slate-500">
                Question {current + 1} of {total}
              </span>
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
            </div>

            <div className="bg-white rounded-2xl border border-arc-slate-200 p-6">
              <p className="text-lg font-medium text-arc-navy-900 whitespace-pre-wrap">{q.stem}</p>

              <div className="mt-5">
                <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} />
              </div>
            </div>

            {/* Prev / Next */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {current < total - 1 ? (
                <Button variant="outline" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button variant="accent" onClick={doSubmit} disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting…" : "Submit"}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
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

  if (q.type === "MULTIPLE_SELECT") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (id: string) =>
      onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    return (
      <div className="space-y-2">
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
