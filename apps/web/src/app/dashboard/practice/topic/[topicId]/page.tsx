"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { QuestionRenderer } from "@/components/lesson/question-renderer";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Skeleton } from "@/components/ui";
import { questionsApi, topicsApi, progressionApi } from "@/lib/api/client";
import {
  Target,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface QuestionData {
  id: string;
  stem: string;
  type: string;
  difficulty: string;
  options?: any;
  correctAnswer?: any;
  tolerance?: number;
  points?: number;
  explanation?: string | null;
}

interface TopicInfo {
  id: string;
  name: string;
  description?: string | null;
  subject?: { id: string; name: string };
  module?: { id: string; name: string; subject?: { id: string; name: string } };
}

export default function TopicPracticePage() {
  const params = useParams();
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track per-question results
  const [results, setResults] = useState<Record<string, { correct: boolean }>>({});

  const loadTopicAndQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch topic info
      const topicData = (await topicsApi.getById(topicId)) as TopicInfo;
      setTopic(topicData);

      // Fetch questions tagged to this topic
      const questionsData = (await questionsApi.getByTopic(topicId)) as QuestionData[];
      setQuestions(questionsData ?? []);
    } catch (err) {
      console.error("Failed to load topic/questions:", err);
      setError("Failed to load practice questions");
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadTopicAndQuestions();
  }, [loadTopicAndQuestions]);

  const handleQuestionComplete = (correct: boolean, _earnedPoints: number) => {
    setResults((prev) => ({
      ...prev,
      [questions[currentIdx]?.id]: { correct },
    }));
  };

  // Check if all questions are answered
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => results[q.id] !== undefined);

  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r.correct).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const handleRestart = () => {
    setCurrentIdx(0);
    setResults({});
  };

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Topic Practice"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Practice", href: "/dashboard/practice" },
            { label: "Weak Topics", href: "/dashboard/practice/weak-topics" },
            { label: "..." },
          ]}
        />
        <div className="p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader
          title="Topic Practice"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Practice", href: "/dashboard/practice" },
            { label: "Weak Topics", href: "/dashboard/practice/weak-topics" },
            { label: "..." },
          ]}
        />
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!topic) {
    return (
      <>
        <DashboardHeader
          title="Topic Practice"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Practice", href: "/dashboard/practice/weak-topics" },
          ]}
        />
        <div className="p-6">
          <div className="max-w-3xl mx-auto text-center py-12">
            <Target className="h-10 w-10 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              Topic not found
            </h3>
            <p className="text-arc-slate-500 mb-4">
              The requested topic could not be found.
            </p>
            <Link href="/dashboard/practice/weak-topics">
              <Button variant="outline" size="sm">
                Back to Weak Topics
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const subjectName = topic.subject?.name || topic.module?.subject?.name || "Unknown";

  // All questions answered — show summary
  if (allAnswered) {
    return (
      <>
        <DashboardHeader
          title={topic.name}
          subtitle={subjectName}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Practice", href: "/dashboard/practice" },
            { label: "Weak Topics", href: "/dashboard/practice/weak-topics" },
            { label: topic.name },
          ]}
        />
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <Card className="border border-arc-slate-200">
              <CardHeader>
                <CardTitle>Practice Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Summary */}
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-arc-navy-900 mb-2">
                    {correctCount}/{questions.length}
                  </div>
                  <p className="text-lg text-arc-slate-600 mb-6">
                    You answered {correctCount} out of {questions.length} questions correctly
                  </p>

                  <div className="max-w-md mx-auto space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-arc-slate-600">Accuracy</span>
                      <span className="font-medium text-arc-navy-900">
                        {accuracy}%
                      </span>
                    </div>
                    <Progress
                      value={accuracy}
                      size="lg"
                      variant={accuracy >= 70 ? "mastery" : accuracy >= 50 ? "warning" : "alert"}
                    />
                  </div>

                  <Badge
                    className={`text-sm ${
                      accuracy >= 80
                        ? "bg-green-100 text-green-700"
                        : accuracy >= 60
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {accuracy >= 80 ? "Excellent!" : accuracy >= 60 ? "Good effort" : "Needs more practice"}
                  </Badge>
                </div>

                {/* Review incorrect questions */}
                {correctCount < questions.length && (
                  <div>
                    <h4 className="font-medium text-arc-navy-900 mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Review Incorrect Answers
                    </h4>
                    <div className="space-y-4">
                      {questions
                        .filter((q) => results[q.id]?.correct === false)
                        .map((q) => (
                          <div
                            key={q.id}
                            className="p-3 rounded-lg border border-arc-slate-200 bg-white"
                          >
                            <p className="text-sm font-medium text-arc-navy-900 mb-2">
                              {q.stem}
                            </p>
                            {q.explanation && (
                              <p className="text-xs text-arc-slate-600">{q.explanation}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-4 border-t border-arc-slate-200">
                  <Link href="/dashboard/practice/weak-topics">
                    <Button variant="outline" size="sm">
                      Back to Weak Topics
                    </Button>
                  </Link>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleRestart}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Practice in progress
  const currentQuestion = questions[currentIdx];
  const subjectId = topic.subject?.id;

  return (
    <>
      <DashboardHeader
        title={topic.name}
        subtitle={subjectName}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Practice", href: "/dashboard/practice" },
          { label: "Weak Topics", href: "/dashboard/practice/weak-topics" },
          { label: topic.name },
        ]}
      />

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Progress tracker */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-arc-slate-600">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-arc-slate-600">
                {answeredCount} answered
              </span>
            </div>
            <Progress
              value={(answeredCount / questions.length) * 100}
              className="h-2"
            />
          </div>

          {currentQuestion ? (
            <QuestionRenderer
              key={currentQuestion.id}
              questionId={currentQuestion.id}
              // In free practice mode we don't persist to a lesson -
              // the QuestionRenderer gracefully handles lessonId being undefined
              onComplete={handleQuestionComplete}
            />
          ) : (
            <div className="text-center py-12 text-arc-slate-500">
              No questions found for this topic.
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              Previous
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setCurrentIdx(questions.length - 1)}
              >
                See Results
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
