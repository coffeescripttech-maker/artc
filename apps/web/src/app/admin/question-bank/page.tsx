"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorkspaceHeader, QuestionForm, ConfirmModal } from "@/components/admin";
import { questionsApi } from "@/lib/api/client";
import { TableSkeleton, NoResultsEmpty, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  BookOpen,
  Award,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";

// Types
interface Question {
  id: string;
  type: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stem: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  linkedTo?: { type: string; name: string }[];
  usageCount?: number;
  createdAt?: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  MULTIPLE_CHOICE: { label: "Multiple Choice", color: "bg-blue-100 text-blue-700" },
  TRUE_FALSE: { label: "True/False", color: "bg-green-100 text-green-700" },
  MULTIPLE_SELECT: { label: "Multiple Select", color: "bg-cyan-100 text-cyan-700" },
  FILL_IN_THE_BLANK: { label: "Fill in Blank", color: "bg-orange-100 text-orange-700" },
  MATCHING: { label: "Matching", color: "bg-pink-100 text-pink-700" },
  ORDERING: { label: "Ordering", color: "bg-indigo-100 text-indigo-700" },
  NUMERIC: { label: "Numeric", color: "bg-teal-100 text-teal-700" },
  ESSAY: { label: "Essay", color: "bg-purple-100 text-purple-700" },
};

const difficultyConfig: Record<string, { color: string }> = {
  EASY: { color: "bg-green-100 text-green-700" },
  MEDIUM: { color: "bg-yellow-100 text-yellow-700" },
  HARD: { color: "bg-red-100 text-red-700" },
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // Fetch questions
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await questionsApi.list();
      setQuestions(Array.isArray(data) ? (data as Question[]) : []);
    } catch (err) {
      setError("Failed to load questions.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (data: {
    stem: string;
    type: string;
    difficulty: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    correctAnswer?: unknown;
    explanation?: string;
    topicIds?: string[];
  }) => {
    try {
      const newQuestion = await questionsApi.create(
        {
          stem: data.stem,
          type: data.type,
          difficulty: data.difficulty,
          options: data.options,
          explanation: data.explanation,
          correctAnswer: data.correctAnswer,
          topicIds: data.topicIds,
        }
      );
      setQuestions([newQuestion as Question, ...questions]);
      setShowQuestionForm(false);
      toast.success("Question created successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create question. Please try again.");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.stem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || q.type === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await questionsApi.delete(deleteTarget.id);
      setQuestions(questions.filter((q) => q.id !== deleteTarget.id));
      toast.success("Question deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete question. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Question Bank"
        subtitle="Manage reusable questions across all subjects and exams"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/question-bank/import">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            <Button variant="accent" size="sm" onClick={() => setShowQuestionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Question
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchQuestions}>
              Retry
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{questions.length}</div>
                <div className="text-sm text-arc-slate-500">Total Questions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {questions.filter((q) => q.status === "PUBLISHED").length}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {questions.reduce((sum, q) => sum + (q.linkedTo?.length || 0), 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Total Links</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {questions.reduce((sum, q) => sum + (q.usageCount || 0), 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Times Used</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
          >
            <option value="all">All Types</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="MULTIPLE_SELECT">Multiple Select</option>
            <option value="FILL_IN_THE_BLANK">Fill in Blank</option>
            <option value="MATCHING">Matching</option>
            <option value="ORDERING">Ordering</option>
            <option value="NUMERIC">Numeric</option>
            <option value="ESSAY">Essay</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
          >
            <option value="all">All Difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Question List */}
        <Card>
          <CardContent className="p-0">
            {isLoading && <TableSkeleton />}

            {/* Questions */}
            {!isLoading && (
              <div className="divide-y divide-arc-slate-100">
                {filteredQuestions.map((question) => {
                  const type = typeConfig[question.type] || typeConfig.MULTIPLE_CHOICE;
                  const difficulty = difficultyConfig[question.difficulty];

                  return (
                    <div
                      key={question.id}
                      className="p-4 hover:bg-arc-slate-50 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Question content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={type.color}>{type.label}</Badge>
                            <Badge className={difficulty?.color}>{question.difficulty}</Badge>
                            <Badge className={statusColors[question.status] || "bg-gray-100 text-gray-700"}>{question.status}</Badge>
                          </div>

                          <p className="text-arc-navy-900 font-medium line-clamp-2 mb-2">
                            {question.stem}
                          </p>

                          {/* Linked to */}
                          {question.linkedTo && question.linkedTo.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-arc-slate-500">
                              <LinkIcon className="h-3 w-3" />
                              {question.linkedTo.map((link, index) => (
                                <span key={index}>
                                  {link.type}: {link.name}
                                  {index < question.linkedTo!.length - 1 && " • "}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="text-right text-sm text-arc-slate-500">
                          <div>Used {question.usageCount || 0} times</div>
                          {question.createdAt && (
                            <div className="text-xs">{question.createdAt}</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/question-bank/${question.id}`}>
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <Edit className="h-4 w-4 text-arc-slate-500" />
                            </button>
                          </Link>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded"
                            onClick={() => setDeleteTarget(question)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredQuestions.length === 0 && (
              <div className="py-8">
                {searchQuery || selectedType !== "all" || selectedDifficulty !== "all" ? (
                  <NoResultsEmpty query={searchQuery || "your filter"} />
                ) : (
                  <NoDataEmpty
                    title="No Questions Yet"
                    description="Create your first question to get started."
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Question Modal */}
      <QuestionForm
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        onSubmit={handleCreateQuestion}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Question"
        description={`Are you sure you want to delete this question? It will be removed from all assessments and exams that use it.`}
        confirmLabel="Delete Question"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
