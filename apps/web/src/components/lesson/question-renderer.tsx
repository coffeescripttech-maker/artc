"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "@/components/ui";
import { questionsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import {
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Loader2,
  RotateCcw,
  GripVertical,
} from "lucide-react";

interface QuestionData {
  id: string;
  stem: string;  // The question text
  type: string;
  difficulty: string;
  options?: { id: string; text: string }[];
  correctAnswer?: any;
  tolerance?: number; // For NUMERIC type
  points?: number;
}

interface QuestionRendererProps {
  questionId: string;
  points?: number;
  onComplete?: (correct: boolean, earnedPoints: number) => void;
}

export function QuestionRenderer({
  questionId,
  points = 1,
  onComplete,
}: QuestionRendererProps) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's answer
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [orderingAnswer, setOrderingAnswer] = useState<string[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    setIsLoading(true);
    setError(null);
    console.log("QuestionRenderer fetching:", questionId);
    try {
      const data = await questionsApi.getById(questionId) as QuestionData;
      console.log("QuestionRenderer loaded:", data);
      setQuestion(data);
      // Initialize ordering answer with shuffled options
      if (data.type === "ORDERING" && data.options) {
        const shuffled = [...data.options].sort(() => Math.random() - 0.5);
        setOrderingAnswer(shuffled.map((o) => o.id));
      }
    } catch (err) {
      console.error("Failed to fetch question:", err);
      setError("Failed to load question");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = (): boolean => {
    if (!question) return false;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_OR_FALSE":
        return selectedOption === question.correctAnswer;

      case "FILL_IN_THE_BLANK":
      case "IDENTIFICATION":
      case "SHORT_ANSWER":
        return textAnswer.trim().toLowerCase() === (question.correctAnswer as string)?.toLowerCase();

      case "NUMERIC":
        const num = parseFloat(textAnswer);
        const correct = parseFloat(question.correctAnswer as string);
        const tolerance = question.tolerance || 0;
        return Math.abs(num - correct) <= tolerance;

      case "ORDERING":
        return (
          JSON.stringify(orderingAnswer) ===
          JSON.stringify([...question.options!].sort((a, b) => a.id.localeCompare(b.id)).map((o) => o.id))
        );

      case "ESSAY":
        return true; // Essays are manually graded

      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    if (isSubmitted) return;

    const correct = checkAnswer();
    setIsCorrect(correct);
    setIsSubmitted(true);
    setIsSubmitting(true);

    try {
      // TODO: Call API to save response
      // await lessonsApi.respondToQuestion(questionId, { answer: getAnswer() });

      if (onComplete) {
        onComplete(correct, correct ? points : 0);
      }
    } catch (err) {
      console.error("Failed to save response:", err);
      toast.error("Failed to save your answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setTextAnswer("");
    setIsSubmitted(false);
    setIsCorrect(null);
    // Re-shuffle ordering options
    if (question?.type === "ORDERING" && question.options) {
      const shuffled = [...question.options].sort(() => Math.random() - 0.5);
      setOrderingAnswer(shuffled.map((o) => o.id));
    }
  };

  const moveOrderingItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= orderingAnswer.length) return;
    const newOrder = [...orderingAnswer];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrderingAnswer(newOrder);
  };

  const getAnswer = () => {
    switch (question?.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_OR_FALSE":
        return selectedOption;
      case "ORDERING":
        return orderingAnswer;
      default:
        return textAnswer;
    }
  };

  const renderOption = (option: { id: string; text: string }, index: number) => {
    const isSelected = selectedOption === option.id;
    const isCorrectOption = question?.correctAnswer === option.id;
    const showResult = isSubmitted;

    let optionClass = "border-arc-slate-200 bg-white hover:bg-arc-slate-50";
    if (showResult) {
      if (isCorrectOption) {
        optionClass = "border-green-500 bg-green-50";
      } else if (isSelected && !isCorrectOption) {
        optionClass = "border-red-500 bg-red-50";
      }
    } else if (isSelected) {
      optionClass = "border-arc-orange-500 bg-arc-orange-50";
    }

    return (
      <button
        key={option.id}
        onClick={() => !isSubmitted && setSelectedOption(option.id)}
        disabled={isSubmitted}
        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${optionClass} ${
          !isSubmitted ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-arc-slate-400 w-5">
            {String.fromCharCode(65 + index)}.
          </span>
          <span className="flex-1 text-sm text-arc-navy-900">{option.text}</span>
          {showResult && isCorrectOption && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {showResult && isSelected && !isCorrectOption && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </button>
    );
  };

  const renderOrderingItem = (optionId: string, index: number) => {
    const option = question?.options?.find((o) => o.id === optionId);
    if (!option) return null;

    const isCorrectPosition = orderingAnswer.indexOf(optionId) === index;
    const showResult = isSubmitted;

    let itemClass = "bg-white border-arc-slate-200";
    if (showResult) {
      itemClass = isCorrectPosition ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50";
    }

    return (
      <div
        key={optionId}
        className={`flex items-center gap-2 p-3 rounded-lg border-2 ${itemClass}`}
      >
        <GripVertical className="h-4 w-4 text-arc-slate-300" />
        <span className="text-xs font-medium text-arc-slate-400 w-5">{index + 1}.</span>
        <span className="flex-1 text-sm text-arc-navy-900">{option.text}</span>
        {!isSubmitted && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => moveOrderingItem(index, -1)}
              disabled={index === 0}
              className="p-1 rounded hover:bg-arc-slate-100 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4 text-arc-slate-500" />
            </button>
            <button
              onClick={() => moveOrderingItem(index, 1)}
              disabled={index === orderingAnswer.length - 1}
              className="p-1 rounded hover:bg-arc-slate-100 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4 text-arc-slate-500" />
            </button>
          </div>
        )}
        {showResult && (
          isCorrectPosition ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-arc-orange-500" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
        {error || "Question not found"}
      </div>
    );
  }

  const canSubmit = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_OR_FALSE":
        return selectedOption !== null;
      case "ORDERING":
        return orderingAnswer.length === question.options?.length;
      default:
        return textAnswer.trim().length > 0;
    }
  };

  return (
    <div className="rounded-xl border border-arc-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-arc-slate-50 border-b border-arc-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {question.type.replace(/_/g, " ")}
          </Badge>
          {question.difficulty && (
            <Badge
              className={`text-xs ${
                question.difficulty === "EASY"
                  ? "bg-green-100 text-green-700"
                  : question.difficulty === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {question.difficulty}
            </Badge>
          )}
        </div>
        <span className="text-xs text-arc-slate-500">{points} point{points !== 1 ? "s" : ""}</span>
      </div>

      {/* Question Text */}
      <div className="p-4">
        <p className="text-sm font-medium text-arc-navy-900 mb-4">{question.stem}</p>

        {/* Answer Options */}
        <div className="space-y-2">
          {(question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_OR_FALSE") &&
            question.options?.map((option, index) => renderOption(option, index))}

          {question.type === "ORDERING" && (
            <div className="space-y-2">
              <p className="text-xs text-arc-slate-500 mb-2">Arrange in correct order:</p>
              {orderingAnswer.map((optionId, index) => renderOrderingItem(optionId, index))}
            </div>
          )}

          {(question.type === "FILL_IN_THE_BLANK" ||
            question.type === "IDENTIFICATION" ||
            question.type === "SHORT_ANSWER") && (
            <div>
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isSubmitted}
                placeholder="Type your answer..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 disabled:bg-arc-slate-50 disabled:text-arc-slate-500 ${
                  isSubmitted
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-arc-slate-200"
                }`}
              />
              {isSubmitted && !isCorrect && (
                <p className="mt-2 text-sm text-green-600">
                  Correct answer: <strong>{question.correctAnswer}</strong>
                </p>
              )}
            </div>
          )}

          {question.type === "NUMERIC" && (
            <div>
              <input
                type="number"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isSubmitted}
                placeholder="Enter a number..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 disabled:bg-arc-slate-50 disabled:text-arc-slate-500 ${
                  isSubmitted
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-arc-slate-200"
                }`}
              />
              {question.tolerance && question.tolerance > 0 && (
                <p className="mt-1 text-xs text-arc-slate-500">
                  Accepts answers within ±{question.tolerance}
                </p>
              )}
              {isSubmitted && !isCorrect && (
                <p className="mt-2 text-sm text-green-600">
                  Correct answer: <strong>{question.correctAnswer}</strong>
                </p>
              )}
            </div>
          )}

          {question.type === "ESSAY" && (
            <div>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isSubmitted}
                placeholder="Write your answer..."
                rows={6}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none disabled:bg-arc-slate-50 disabled:text-arc-slate-500"
              />
              <p className="mt-1 text-xs text-arc-slate-500">
                Your answer will be reviewed by an instructor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Result Banner */}
      {isSubmitted && (
        <div
          className={`px-4 py-3 flex items-center gap-3 ${
            isCorrect ? "bg-green-50 border-t border-green-200" : "bg-red-50 border-t border-red-200"
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Correct! +{points} point{points !== 1 ? "s" : ""}</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">Incorrect</span>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-arc-slate-200 flex items-center justify-end gap-2">
        {isSubmitted ? (
          question.type !== "ESSAY" && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )
        ) : (
          <Button
            variant="accent"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default QuestionRenderer;
