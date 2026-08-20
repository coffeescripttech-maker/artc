"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { questionsApi, subjectsApi, topicsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Save,
  Send,
  Trash2,
  Plus,
  Check,
  ArrowLeft,
  Link as LinkIcon,
  GripVertical,
  HelpCircle,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Types
interface Option {
  id: string;
  text: string;
  matchText?: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  stem: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK" | "MULTIPLE_SELECT" | "MATCHING" | "NUMERIC" | "ORDERING";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  options?: Option[];
  explanation?: string;
  correctAnswer?: string;
  tolerance?: number;
  links?: {
    id: string;
    type: "SUBJECT" | "TOPIC" | "MODULE";
    entityId: string;
    entityName: string;
  }[];
  _count?: {
    assessments: number;
    examUsage: number;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  _count?: { topics: number };
}

interface Topic {
  id: string;
  name: string;
  subjectId: string;
  subjectName?: string;
}

// Mock data
const mockQuestion: Question = {
  id: "1",
  stem: "What is the value of x in the equation 2x + 5 = 15?",
  type: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  status: "PUBLISHED",
  options: [
    { id: "1", text: "x = 5", isCorrect: false },
    { id: "2", text: "x = 10", isCorrect: false },
    { id: "3", text: "x = 7", isCorrect: true },
    { id: "4", text: "x = 3", isCorrect: false },
  ],
  explanation: "To solve 2x + 5 = 15, subtract 5 from both sides: 2x = 10. Then divide by 2: x = 5.",
  links: [
    { id: "1", type: "SUBJECT", entityId: "1", entityName: "Mathematics" },
    { id: "2", type: "TOPIC", entityId: "2", entityName: "Linear Equations" },
  ],
  _count: {
    assessments: 3,
    examUsage: 45,
  },
};

const mockSubjects: Subject[] = [
  { id: "1", name: "Mathematics", code: "MATH", _count: { topics: 12 } },
  { id: "2", name: "English", code: "ENG", _count: { topics: 15 } },
  { id: "3", name: "Science", code: "SCI", _count: { topics: 18 } },
];

const mockTopics: Topic[] = [
  { id: "1", name: "Number System", subjectId: "1", subjectName: "Mathematics" },
  { id: "2", name: "Linear Equations", subjectId: "1", subjectName: "Mathematics" },
  { id: "3", name: "Geometry", subjectId: "1", subjectName: "Mathematics" },
  { id: "4", name: "Grammar", subjectId: "2", subjectName: "English" },
  { id: "5", name: "Chemistry", subjectId: "3", subjectName: "Science" },
];

const questionTypes = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice", description: "Select one correct answer" },
  { value: "MULTIPLE_SELECT", label: "Multiple Select", description: "Select all correct answers" },
  { value: "TRUE_FALSE", label: "True/False", description: "Mark as true or false" },
  { value: "FILL_IN_THE_BLANK", label: "Fill in the Blank", description: "Complete the sentence" },
  { value: "MATCHING", label: "Matching", description: "Match items from two columns" },
  { value: "ORDERING", label: "Ordering", description: "Arrange items in correct order" },
  { value: "NUMERIC", label: "Numeric", description: "Enter a numeric answer" },
  { value: "SHORT_ANSWER", label: "Short Answer", description: "Brief text response" },
  { value: "ESSAY", label: "Essay", description: "Extended written response" },
];

const difficulties = [
  { value: "EASY", label: "Easy", color: "bg-green-100 text-green-700", border: "border-green-300" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-300" },
  { value: "HARD", label: "Hard", color: "bg-red-100 text-red-700", border: "border-red-300" },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "bg-yellow-100 text-yellow-700", label: "Draft" },
  UNDER_REVIEW: { color: "bg-blue-100 text-blue-700", label: "Under Review" },
  PUBLISHED: { color: "bg-green-100 text-green-700", label: "Published" },
  ARCHIVED: { color: "bg-gray-100 text-gray-600", label: "Archived" },
};

type SaveStatus = "saved" | "unsaved" | "saving";

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.questionId as string;

  // Form state
  const [question, setQuestion] = useState<Question | null>(null);
  const [stem, setStem] = useState("");
  const [type, setType] = useState<Question["type"]>("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [links, setLinks] = useState<Question["links"]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [tolerance, setTolerance] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link modal state
  const [linkType, setLinkType] = useState<"SUBJECT" | "TOPIC">("SUBJECT");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);

  // Fetch question
  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  // Track unsaved changes
  useEffect(() => {
    if (question) {
      const hasChanges =
        stem !== question.stem ||
        type !== question.type ||
        difficulty !== question.difficulty ||
        explanation !== (question.explanation || "") ||
         JSON.stringify(options) !== JSON.stringify(question.options || []) ||
         correctAnswer !== (question.correctAnswer || "") ||
         tolerance !== (question.tolerance !== undefined ? String(question.tolerance) : "");

       setSaveStatus(hasChanges ? "unsaved" : "saved");
     }
   }, [stem, type, difficulty, explanation, options, correctAnswer, tolerance, question]);

  // Filter topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      setFilteredTopics(mockTopics.filter((t) => t.subjectId === selectedSubject));
    }
  }, [selectedSubject]);

  const fetchQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await questionsApi.getById(questionId).catch(() => null);
      if (data) {
        const q = data as Question;
        setQuestion(q);
        setStem(q.stem);
        setType(q.type);
        setDifficulty(q.difficulty);
        setExplanation(q.explanation || "");
        setOptions(q.options || []);
        setLinks(q.links || []);
        setCorrectAnswer(q.correctAnswer || "");
        setTolerance(q.tolerance !== undefined ? String(q.tolerance) : "");
      } else {
        // Use mock data for demo
        setQuestion(mockQuestion);
        setStem(mockQuestion.stem);
        setType(mockQuestion.type);
        setDifficulty(mockQuestion.difficulty);
        setExplanation(mockQuestion.explanation || "");
        setOptions(mockQuestion.options || []);
        setLinks(mockQuestion.links || []);
        setCorrectAnswer("");
        setTolerance("");
      }
    } catch (err) {
      console.error("Failed to fetch question:", err);
      setError("Failed to load question. Using demo data.");
      setQuestion(mockQuestion);
      setStem(mockQuestion.stem);
      setType(mockQuestion.type);
      setDifficulty(mockQuestion.difficulty);
      setExplanation(mockQuestion.explanation || "");
      setOptions(mockQuestion.options || []);
      setLinks(mockQuestion.links || []);
      setCorrectAnswer("");
      setTolerance("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await questionsApi.update(
        questionId,
        { stem, type, difficulty, explanation, options, correctAnswer: type === "NUMERIC" || type === "SHORT_ANSWER" || type === "FILL_IN_THE_BLANK" ? correctAnswer : undefined, tolerance: type === "NUMERIC" ? (tolerance ? Number(tolerance) : undefined) : undefined },
        "" // Token would come from auth
      );
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save question:", err);
      setSaveStatus("unsaved");
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      await questionsApi.publish(questionId, "");
      router.push("/admin/question-bank");
    } catch (err) {
      console.error("Failed to publish question:", err);
      alert("Failed to publish question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option handlers
  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: Date.now().toString(), text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleSetCorrect = (id: string) => {
    setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const handleToggleCorrect = (id: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)));
  };

  const handleMatchOptionChange = (id: string, matchText: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, matchText } : o)));
  };

  // Link handlers
  const handleAddLink = (entity: { type: "SUBJECT" | "TOPIC"; entityId: string; entityName: string }) => {
    // Check if already linked
    const exists = links?.some((l) => l.entityId === entity.entityId && l.type === entity.type);
    if (exists) return;

    setLinks([...(links || []), { id: Date.now().toString(), ...entity }]);
    setShowLinkModal(false);
    setSelectedSubject("");
    setFilteredTopics([]);
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(links?.filter((l) => l.id !== linkId) || []);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Question not found</h2>
          <p className="text-arc-slate-500 mb-4">The question you're looking for doesn't exist.</p>
          <Link href="/admin/question-bank">
            <Button variant="accent">Back to Question Bank</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader
        title="Question Editor"
        breadcrumbs={[
          { label: "Question Bank", href: "/admin/question-bank" },
          { label: "Edit Question" },
        ]}
        badge={question.status}
        badgeVariant={question.status === "PUBLISHED" ? "success" : question.status === "DRAFT" ? "draft" : "default"}
        stats={[
          { label: "Used in", value: question._count?.assessments || 0 },
          { label: "Times", value: question._count?.examUsage || 0 },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveStatus === "saved" || saveStatus === "saving"}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === "saving" ? "Saving..." : "Save"}
            </Button>
            <Button variant="accent" size="sm" onClick={handlePublish} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        }
      />

      {/* Save status indicator */}
      {saveStatus === "unsaved" && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm text-yellow-700">You have unsaved changes</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      <div className="flex gap-6 p-6">
        {/* Main Editor */}
        <div className="flex-1 space-y-6 max-w-3xl">
          {/* Question Type & Difficulty */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-arc-navy-900">Question Settings</h3>

              {/* Question Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Question Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {questionTypes.map((qt) => (
                    <button
                      key={qt.value}
                      onClick={() => setType(qt.value as Question["type"])}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        type === qt.value
                          ? "border-arc-orange-400 bg-arc-orange-50"
                          : "border-arc-slate-200 hover:border-arc-slate-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-arc-navy-900">{qt.label}</div>
                      <div className="text-xs text-arc-slate-500">{qt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Difficulty
                </label>
                <div className="flex gap-3">
                  {difficulties.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value as Question["difficulty"])}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                        difficulty === d.value
                          ? `${d.color} ${d.border}`
                          : "border-arc-slate-200 hover:border-arc-slate-300"
                      }`}
                    >
                      <div className="text-sm font-medium">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Stem */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-arc-navy-900">Question</h3>
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="Type your question here..."
                rows={4}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
              />
            </CardContent>
          </Card>

          {/* Answer Options (for Multiple Choice) */}
          {type === "MULTIPLE_CHOICE" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-arc-navy-900">Answer Options</h3>
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <button
                        onClick={() => handleSetCorrect(option.id)}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          option.isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-arc-slate-300 hover:border-arc-slate-400"
                        }`}
                      >
                        {option.isCorrect && <Check className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-arc-slate-500">
                  Click the circle to mark the correct answer
                </p>
              </CardContent>
            </Card>
          )}

          {/* True/False specific */}
          {type === "TRUE_FALSE" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-arc-navy-900">Correct Answer</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOptions([
                      { id: "1", text: "True", isCorrect: true },
                      { id: "2", text: "False", isCorrect: false },
                    ])}
                    className={`flex-1 p-4 rounded-lg border-2 text-center font-medium transition-all ${
                      options[0]?.isCorrect
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setOptions([
                      { id: "1", text: "True", isCorrect: false },
                      { id: "2", text: "False", isCorrect: true },
                    ])}
                    className={`flex-1 p-4 rounded-lg border-2 text-center font-medium transition-all ${
                      options[1]?.isCorrect
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    False
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fill in the Blank correct answer */}
          {type === "FILL_IN_THE_BLANK" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-arc-navy-900">Correct Answer</h3>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter the exact answer..."
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                />
                <p className="text-xs text-arc-slate-500">
                  Students must enter this exact answer (case-insensitive)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Short Answer correct answer */}
          {type === "SHORT_ANSWER" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-arc-navy-900">Expected Answer</h3>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter the expected answer (used for auto-grading)..."
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                />
                <p className="text-xs text-arc-slate-500">
                  This answer will be used for auto-grading
                </p>
              </CardContent>
            </Card>
          )}

          {/* Numeric correct answer */}
          {type === "NUMERIC" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-arc-navy-900">Correct Answer</h3>
                <input
                  type="number"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter the correct number..."
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-arc-navy-900">
                    Tolerance (optional)
                  </label>
                  <input
                    type="number"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    placeholder="e.g. 0.01"
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                  />
                  <p className="text-xs text-arc-slate-500">
                    Accept answers within ± this value
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multiple Select options */}
          {type === "MULTIPLE_SELECT" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-arc-navy-900">Answer Options</h3>
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCorrect(option.id)}
                        className={`h-8 w-8 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          option.isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-arc-slate-300 hover:border-arc-slate-400"
                        }`}
                      >
                        {option.isCorrect && <Check className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-arc-slate-500">
                  Click the checkbox to mark multiple correct answers
                </p>
              </CardContent>
            </Card>
          )}

          {/* Matching options */}
          {type === "MATCHING" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-arc-navy-900">Match Pairs</h3>
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Pair
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-arc-slate-500 w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder="Left column..."
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      <span className="text-arc-slate-400">→</span>
                       <input
                        type="text"
                        value={option.matchText || ""}
                        onChange={(e) => handleMatchOptionChange(option.id, e.target.value)}
                        placeholder="Right column..."
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-arc-slate-500">
                  Enter pairs: left prompt and its correct match
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ordering options */}
          {type === "ORDERING" && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-arc-navy-900">Items to Order</h3>
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-arc-slate-400 cursor-grab" />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={`Item ${index + 1}...`}
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-arc-slate-500">
                  Arrange options in the correct order top to bottom
                </p>
              </CardContent>
            </Card>
          )}

          {/* Explanation */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-arc-navy-900">Explanation</h3>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this is the correct answer (optional)..."
                rows={3}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
              />
              <p className="text-xs text-arc-slate-500">
                Students will see this after answering
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Links */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-arc-navy-900">Linked To</h3>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="text-sm text-arc-orange-600 hover:text-arc-orange-700"
                >
                  Add Link
                </button>
              </div>

              {links && links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-2 bg-arc-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-arc-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-arc-navy-900">{link.entityName}</div>
                          <div className="text-xs text-arc-slate-500">{link.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-arc-slate-500">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2 text-arc-slate-300" />
                  <p className="text-sm">No links yet</p>
                  <p className="text-xs">Link to subjects or topics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-arc-navy-900 mb-4">Usage Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-arc-slate-600">Assessments</span>
                  <span className="font-semibold text-arc-navy-900">{question._count?.assessments || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-arc-slate-600">Exam Attempts</span>
                  <span className="font-semibold text-arc-navy-900">{question._count?.examUsage || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="accent"
              className="w-full"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Publishing..." : "Publish Question"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSave}
              disabled={saveStatus === "saved" || saveStatus === "saving"}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === "saving" ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
              <h2 className="text-lg font-bold text-arc-navy-900">Add Link</h2>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedSubject("");
                  setFilteredTopics([]);
                }}
                className="p-2 rounded-lg hover:bg-arc-slate-100"
              >
                <span className="text-xl text-arc-slate-500">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Link Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Link Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setLinkType("SUBJECT");
                      setSelectedSubject("");
                      setFilteredTopics([]);
                    }}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      linkType === "SUBJECT"
                        ? "border-arc-orange-400 bg-arc-orange-50"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    <BookOpen className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Subject</div>
                  </button>
                  <button
                    onClick={() => setLinkType("TOPIC")}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      linkType === "TOPIC"
                        ? "border-arc-orange-400 bg-arc-orange-50"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    <HelpCircle className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Topic</div>
                  </button>
                </div>
              </div>

              {/* Select Subject */}
              {linkType === "TOPIC" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-arc-navy-900">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                  >
                    <option value="">Select subject...</option>
                    {mockSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Entity */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Select {linkType === "SUBJECT" ? "Subject" : "Topic"}
                </label>
                <div className="max-h-48 overflow-y-auto border border-arc-slate-200 rounded-lg">
                  {linkType === "SUBJECT" ? (
                    mockSubjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleAddLink({ type: "SUBJECT", entityId: subject.id, entityName: subject.name })}
                        className="w-full p-3 text-left hover:bg-arc-slate-50 border-b border-arc-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-arc-navy-900">{subject.name}</div>
                        <div className="text-xs text-arc-slate-500">{subject.code} • {subject._count?.topics} topics</div>
                      </button>
                    ))
                  ) : selectedSubject ? (
                    filteredTopics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleAddLink({ type: "TOPIC", entityId: topic.id, entityName: topic.name })}
                        className="w-full p-3 text-left hover:bg-arc-slate-50 border-b border-arc-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-arc-navy-900">{topic.name}</div>
                        <div className="text-xs text-arc-slate-500">{topic.subjectName}</div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-arc-slate-500 text-sm">
                      Select a subject first
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
