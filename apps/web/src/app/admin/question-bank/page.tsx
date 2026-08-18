"use client";

import { useState, useEffect } from "react";
import { WorkspaceHeader, QuestionForm } from "@/components/admin";
import { questionsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
  BookOpen,
  Award,
  Link as LinkIcon,
  RefreshCw,
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

const mockQuestions: Question[] = [
  { id: "1", type: "MULTIPLE_CHOICE", difficulty: "MEDIUM", stem: "What is the value of x in the equation 2x + 5 = 15?", status: "PUBLISHED", linkedTo: [{ type: "Subject", name: "Mathematics" }, { type: "Topic", name: "Linear Equations" }], usageCount: 3, createdAt: "Aug 10, 2026" },
  { id: "2", type: "MULTIPLE_CHOICE", difficulty: "EASY", stem: "Which of the following is a prime number?", status: "PUBLISHED", linkedTo: [{ type: "Subject", name: "Mathematics" }, { type: "Topic", name: "Number System" }], usageCount: 5, createdAt: "Aug 9, 2026" },
  { id: "3", type: "TRUE_FALSE", difficulty: "MEDIUM", stem: "The square root of 144 is 12.", status: "UNDER_REVIEW", linkedTo: [{ type: "Subject", name: "Mathematics" }, { type: "Exam", name: "UPCAT" }], usageCount: 2, createdAt: "Aug 8, 2026" },
  { id: "4", type: "MULTIPLE_CHOICE", difficulty: "HARD", stem: "Which of the following sentences contains a metaphor?", status: "DRAFT", linkedTo: [{ type: "Subject", name: "English" }], usageCount: 0, createdAt: "Aug 7, 2026" },
  { id: "5", type: "ESSAY", difficulty: "HARD", stem: "Explain the impact of the Spanish colonization on Philippine society.", status: "PUBLISHED", linkedTo: [{ type: "Subject", name: "Araling Panlipunan" }, { type: "Topic", name: "Philippine History" }], usageCount: 8, createdAt: "Aug 6, 2026" },
];

const typeConfig: Record<string, { label: string; color: string }> = {
  MULTIPLE_CHOICE: { label: "Multiple Choice", color: "bg-blue-100 text-blue-700" },
  TRUE_FALSE: { label: "True/False", color: "bg-green-100 text-green-700" },
  ESSAY: { label: "Essay", color: "bg-purple-100 text-purple-700" },
  FILL_IN_THE_BLANK: { label: "Fill in Blank", color: "bg-orange-100 text-orange-700" },
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

  // Fetch questions
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await questionsApi.list();
      if (Array.isArray(data)) {
        setQuestions(data as Question[]);
      } else {
        setQuestions(mockQuestions);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError("Failed to load questions. Using demo data.");
      setQuestions(mockQuestions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (data: {
    stem: string;
    type: string;
    difficulty: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    explanation?: string;
  }) => {
    try {
      const newQuestion = await questionsApi.create(
        {
          stem: data.stem,
          type: data.type,
          difficulty: data.difficulty,
          options: data.options,
          explanation: data.explanation,
        },
        "" // Token would come from auth context
      );
      setQuestions([newQuestion as Question, ...questions]);
      setShowQuestionForm(false);
    } catch (err) {
      // Fallback to local state for demo
      const newQuestion: Question = {
        id: Date.now().toString(),
        type: data.type,
        difficulty: data.difficulty as Question["difficulty"],
        stem: data.stem,
        status: "DRAFT",
        usageCount: 0,
        createdAt: new Date().toLocaleDateString(),
      };
      setQuestions([newQuestion, ...questions]);
      setShowQuestionForm(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.stem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || q.type === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  return (
    <>
      <WorkspaceHeader
        title="Question Bank"
        subtitle="Manage reusable questions across all subjects and exams"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Import
            </Button>
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
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <p className="text-yellow-700 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchQuestions}>
              <RefreshCw className="h-4 w-4 mr-2" />
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
            {/* Loading skeleton */}
            {isLoading && (
              <div className="divide-y divide-arc-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-arc-slate-200 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-arc-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-arc-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

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
                          <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                            <Edit className="h-4 w-4 text-arc-slate-500" />
                          </button>
                          <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                            <Copy className="h-4 w-4 text-arc-slate-500" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded">
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
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No questions found
                </h3>
                <p className="text-arc-slate-500 mb-4">
                  {searchQuery || selectedType !== "all" || selectedDifficulty !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first question to get started"}
                </p>
                <Button variant="accent" onClick={() => setShowQuestionForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
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
    </>
  );
}
