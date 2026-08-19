"use client";

import { useState, useEffect } from "react";
import { Button, Badge, Input } from "@/components/ui";
import { questionsApi, topicsApi } from "@/lib/api/client";
import {
  Search,
  X,
  CheckCircle,
  HelpCircle,
  Check,
  Loader2,
  Filter,
} from "lucide-react";

interface Question {
  id: string;
  stem: string;  // The question text
  type: string;
  difficulty: string;
  options?: { id: string; text: string }[];  // For display in preview
  bankLinks?: { topic?: { id: string; name: string }; subject?: { id: string; name: string } }[];
  _count?: { assessments: number };
}

interface Topic {
  id: string;
  name: string;
  module?: { name: string };
}

interface QuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (questionId: string, questionText: string) => void;
  excludeQuestionIds?: string[];
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_OR_FALSE: "True or False",
  FILL_IN_THE_BLANK: "Fill in the Blank",
  IDENTIFICATION: "Identification",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  ORDERING: "Ordering",
  NUMERIC: "Numeric",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

export function QuestionPickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeQuestionIds = [],
}: QuestionPickerModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch questions and topics
  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [questionsData, topicsData] = await Promise.all([
        questionsApi.list().catch(() => []), // Get all questions (no status filter)
        topicsApi.listAll().catch(() => []),
      ]);
      setQuestions((questionsData as Question[]) || []);
      setTopics((topicsData as Topic[]) || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setQuestions([]);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    // Exclude already selected questions
    if (excludeQuestionIds.includes(q.id)) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = q.stem?.toLowerCase().includes(query);
      const matchesType = q.type?.toLowerCase().includes(query);
      if (!matchesText && !matchesType) return false;
    }

    // Type filter
    if (typeFilter !== "all" && q.type !== typeFilter) return false;

    // Topic filter
    if (topicFilter !== "all") {
      const hasTopic = Array.isArray(q.bankLinks) && q.bankLinks.some((link) => link.topic?.id === topicFilter);
      if (!hasTopic) return false;
    }

    return true;
  });

  const handleSelect = async () => {
    if (!selectedQuestion) return;
    setSaving(true);
    try {
      onSelect(selectedQuestion.id, selectedQuestion.stem || `Question #${selectedQuestion.id}`);
      onClose();
      setSelectedQuestion(null);
      setSearchQuery("");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedQuestion(null);
    setSearchQuery("");
    setTypeFilter("all");
    setTopicFilter("all");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-arc-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-arc-navy-900">Select Question</h2>
            <p className="text-sm text-arc-slate-500 mt-1">
              Choose a question from the question bank to embed in this lesson
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-arc-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-arc-slate-200 bg-arc-slate-50 flex flex-wrap items-center gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
          >
            <option value="all">All Types</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
          >
            <option value="all">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-arc-slate-500">
            <Filter className="h-4 w-4" />
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Question List */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: List */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-arc-slate-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No questions found
                </h3>
                <p className="text-arc-slate-500">
                  {searchQuery || typeFilter !== "all" || topicFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create questions in the Question Bank first"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => setSelectedQuestion(question)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedQuestion?.id === question.id
                        ? "border-arc-orange-500 bg-arc-orange-50"
                        : "border-arc-slate-200 bg-white hover:border-arc-slate-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-arc-navy-900 line-clamp-1">
                      {question.stem || `Question #${question.id.slice(0, 8)}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {QUESTION_TYPE_LABELS[question.type] || question.type}
                      </Badge>
                      {question.difficulty && (
                        <Badge className={`text-xs ${DIFFICULTY_COLORS[question.difficulty] || ""}`}>
                          {question.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="w-80 overflow-y-auto p-4 bg-arc-slate-50">
            {selectedQuestion ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-arc-slate-400 mb-2">Question Preview</h4>
                  <div className="p-4 rounded-lg bg-white border border-arc-slate-200">
                    <p className="text-sm font-medium text-arc-navy-900">{selectedQuestion.stem}</p>

                    {/* Show options for multiple choice */}
                    {Array.isArray(selectedQuestion.options) && selectedQuestion.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedQuestion.options.map((opt: any, idx: number) => (
                          <div key={opt.id || idx} className="flex items-center gap-2 p-2 rounded border border-arc-slate-100 bg-arc-slate-50">
                            <span className="text-xs font-medium text-arc-slate-400">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="text-sm text-arc-slate-700">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {QUESTION_TYPE_LABELS[selectedQuestion.type] || selectedQuestion.type}
                    </Badge>
                    {selectedQuestion.difficulty && (
                      <Badge className={DIFFICULTY_COLORS[selectedQuestion.difficulty] || ""}>
                        {selectedQuestion.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                {Array.isArray(selectedQuestion.bankLinks) && selectedQuestion.bankLinks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-arc-slate-400 mb-2">Linked to</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedQuestion.bankLinks.map((link: any, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {link.topic?.name || link.subject?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <HelpCircle className="h-10 w-10 text-arc-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-arc-slate-500">Select a question to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-arc-slate-200 flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleSelect}
            disabled={!selectedQuestion || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Select Question
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default QuestionPickerModal;
