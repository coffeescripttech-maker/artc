"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceHeader, DraggableList, type DraggableItem, QuestionForm, TopicPicker, TopicPickerCompact } from "@/components/admin";
import { assessmentsApi, questionsApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  Send,
  Check,
  Settings,
  Zap,
  Clock,
  Target,
  RefreshCw,
  ArrowLeft,
  X,
  ChevronDown,
} from "lucide-react";

// Types
interface Assessment {
  id: string;
  name: string;
  slug?: string;
  type: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  description?: string;
  questionCount?: number;
  topicIds?: string[];
  timeLimitMinutes?: number;
  passingScore?: number;
  masteryThreshold?: number;
  randomizeQuestions?: boolean;
  randomizeChoices?: boolean;
  showExplanations?: boolean;
  allowRetake?: boolean;
  maxAttempts?: number;
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface Question {
  id: string;
  stem: string;
  type: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  score: number;
}

const mockAssessment: Assessment = {
  id: "1",
  name: "Grade 9 Algebra Quiz",
  slug: "grade-9-algebra-quiz",
  type: "QUIZ",
  status: "DRAFT",
  description: "Quiz covering basic algebraic expressions and linear equations",
  questionCount: 20,
  timeLimitMinutes: 30,
  passingScore: 70,
  randomizeQuestions: true,
  showExplanations: true,
  _count: { questions: 5, attempts: 0 },
};

const mockQuestions: Question[] = [
  { id: "1", stem: "What is the value of x in 2x + 5 = 15?", type: "MULTIPLE_CHOICE", difficulty: "EASY", score: 1 },
  { id: "2", stem: "Solve for y: 3y - 9 = 0", type: "MULTIPLE_CHOICE", difficulty: "EASY", score: 1 },
  { id: "3", stem: "Which of the following is an algebraic expression?", type: "MULTIPLE_CHOICE", difficulty: "MEDIUM", score: 1 },
  { id: "4", stem: "Simplify: 4(x + 2) - 3x", type: "MULTIPLE_CHOICE", difficulty: "MEDIUM", score: 1 },
  { id: "5", stem: "The square root of 144 is 12.", type: "TRUE_FALSE", difficulty: "EASY", score: 1 },
];

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

const difficultyBadgeVariant: Record<string, "success" | "warning" | "error"> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "error",
};

export default function AssessmentBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("QUIZ");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [masteryThreshold, setMasteryThreshold] = useState("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeChoices, setRandomizeChoices] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);
  const [allowRetake, setAllowRetake] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [autoGenQuestionCount, setAutoGenQuestionCount] = useState("10");
  const [autoGenDifficulty, setAutoGenDifficulty] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assessmentId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assessmentData, questionsData] = await Promise.all([
        assessmentsApi.getById(assessmentId).catch(() => null),
        questionsApi.getByAssessment(assessmentId).catch(() => null),
      ]);

      const a = ((assessmentData as Assessment) || mockAssessment) as Assessment;
      setAssessment(a);
      setName(a.name);
      setType(a.type || "QUIZ");
      setDescription(a.description || "");
      setTimeLimit(a.timeLimitMinutes != null ? String(a.timeLimitMinutes) : "");
      setPassingScore(a.passingScore != null ? String(a.passingScore) : "");
      setMasteryThreshold(a.masteryThreshold != null ? String(a.masteryThreshold) : "");
      setRandomizeQuestions(!!a.randomizeQuestions);
      setRandomizeChoices(!!a.randomizeChoices);
      setShowExplanations(a.showExplanations !== false);
      setAllowRetake(!!a.allowRetake);
      setMaxAttempts(a.maxAttempts != null ? String(a.maxAttempts) : "");
      setSelectedTopicIds(a.topicIds || []);

      if (questionsData && Array.isArray(questionsData)) {
        // API returns AssessmentQuestion objects with nested question - extract the question data
        const extracted = (questionsData as any[]).map((aq: any) => ({
          ...aq.question,
          score: aq.score,
          orderIndex: aq.orderIndex,
        }));
        setQuestions(extracted as Question[]);
      } else {
        setQuestions(mockQuestions);
      }
    } catch (err) {
      console.error("Failed to fetch assessment:", err);
      setError("Failed to load assessment. Using demo data.");
      setAssessment(mockAssessment);
      setName(mockAssessment.name);
      setQuestions(mockQuestions);
    } finally {
      setIsLoading(false);
    }
  };

  const questionItems: DraggableItem[] = questions.map((question) => ({
    id: question.id,
    title: question.stem,
    subtitle: `${question.type.replace("_", " ")} • ${question.score} point${question.score !== 1 ? "s" : ""}`,
    badge: question.difficulty,
    badgeVariant: (difficultyBadgeVariant[question.difficulty] || "default") as "success" | "warning" | "error" | "default",
    onClick: () => console.log("Edit question:", question.id),
    onEdit: () => console.log("Edit question:", question.id),
    onDelete: () => handleDeleteQuestion(question.id),
  }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const num = (s: string) => {
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : undefined;
      };
      await assessmentsApi.update(assessmentId, {
        name,
        type,
        description: description || undefined,
        timeLimitMinutes: num(timeLimit),
        passingScore: num(passingScore),
        masteryThreshold: num(masteryThreshold),
        randomizeQuestions,
        randomizeChoices,
        showExplanations,
        allowRetake,
        maxAttempts: num(maxAttempts),
        topicIds: selectedTopicIds,
        questionCount: selectedTopicIds.length > 0 ? parseInt(autoGenQuestionCount) || 10 : undefined,
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      await assessmentsApi.publish(assessmentId, "");
      router.push("/admin/assessments");
    } catch (err) {
      console.error("Failed to publish:", err);
      toast.error("Failed to publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoGenerate = () => {
    setShowAutoGenerate(true);
  };

  const handleConfirmAutoGenerate = async () => {
    if (selectedTopicIds.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    setIsGenerating(true);
    try {
      const difficultyLevels = autoGenDifficulty === "ALL" ? undefined : [autoGenDifficulty];

      const result = await assessmentsApi.autoGenerate(assessmentId, {
        topicIds: selectedTopicIds,
        questionCount: parseInt(autoGenQuestionCount) || 10,
        difficultyLevels,
      });

      // Refresh questions list
      const questionsData = await questionsApi.getByAssessment(assessmentId) as any[];
      if (questionsData && Array.isArray(questionsData)) {
        const extracted = questionsData.map((aq: any) => ({
          ...aq.question,
          score: aq.score,
          orderIndex: aq.orderIndex,
        }));
        setQuestions(extracted);
      }

      setShowAutoGenerate(false);
      toast.success(`Added ${Array.isArray(result) ? result.length : 0} questions to the assessment`);
    } catch (err) {
      console.error("Failed to auto-generate:", err);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = async (data: {
    stem: string;
    type: string;
    difficulty: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    correctAnswer?: unknown;
    explanation?: string;
    topicIds?: string[];
  }) => {
    try {
      // First create the question in the question bank
      const newQuestion = await questionsApi.create(
        { stem: data.stem, type: data.type, difficulty: data.difficulty, options: data.options, correctAnswer: data.correctAnswer, explanation: data.explanation, topicIds: data.topicIds }
      );

      // Then link it to this assessment
      const createdQ = newQuestion as Question;
      try {
        await assessmentsApi.addQuestion(assessmentId, { questionId: createdQ.id, score: 1 });
      } catch (linkErr) {
        console.error("Failed to link question to assessment:", linkErr);
      }

      setQuestions([...questions, { ...createdQ, score: 1 }]);
      setShowQuestionForm(false);
    } catch (err) {
      // Fallback to local state for demo
      const newQuestion: Question = {
        id: Date.now().toString(),
        stem: data.stem,
        type: data.type,
        difficulty: data.difficulty as Question["difficulty"],
        score: 1,
      };
      setQuestions([...questions, newQuestion]);
      setShowQuestionForm(false);
    }
  };

  const handleReorderQuestions = async (reorderedItems: DraggableItem[]) => {
    const reorderedQuestions = reorderedItems.map((item) => {
      const question = questions.find((q) => q.id === item.id);
      return question || null;
    }).filter(Boolean) as Question[];

    setQuestions(reorderedQuestions);
    setIsSaving(true);
    try {
      await assessmentsApi.reorderQuestions(assessmentId, reorderedItems.map((i) => i.id));
    } catch (err) {
      console.error("Failed to reorder:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to remove this question?")) return;
    try {
      await assessmentsApi.removeQuestion(assessmentId, questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      setQuestions(questions.filter((q) => q.id !== questionId));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Assessment not found</h2>
          <p className="text-arc-slate-500 mb-4">The assessment you're looking for doesn't exist.</p>
          <Button variant="accent" onClick={() => router.push("/admin/assessments")}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader
        title="Assessment Builder"
        subtitle={assessment.description}
        breadcrumbs={[
          { label: "Assessments", href: "/admin/assessments" },
          { label: assessment.name },
        ]}
        badge={assessment.status}
        badgeVariant={assessment.status === "PUBLISHED" ? "success" : assessment.status === "DRAFT" ? "draft" : "default"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/admin/assessments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="accent" size="sm" onClick={handlePublish} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Builder Panel */}
          <div className="flex-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-arc-slate-500" />
                  <h2 className="text-lg font-semibold text-arc-navy-900">Assessment Settings</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Assessment Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg">
                      <option value="QUIZ">Quiz</option>
                      <option value="PRACTICE">Practice</option>
                      <option value="DIAGNOSTIC">Diagnostic</option>
                      <option value="MOCK_EXAM">Mock Exam</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="CET_SIMULATION">CET Simulation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Time Limit (minutes)</label>
                    <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="No limit" className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Passing Score (%)</label>
                    <input type="number" min="0" max="100" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Mastery Threshold (%)</label>
                    <input type="number" min="0" max="100" value={masteryThreshold} onChange={(e) => setMasteryThreshold(e.target.value)} placeholder="e.g., 95" className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500" />
                    <p className="text-xs text-arc-slate-500 mt-1">Score required to master &amp; unlock the next level.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-1">Max Attempts</label>
                    <input type="number" min="1" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-arc-navy-900">Questions</h2>
                    <Badge variant="secondary">{questions.length} questions</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAutoGenerate}>
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-Generate
                    </Button>
                    <Button variant="accent" size="sm" onClick={() => setShowQuestionForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>

                <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3 mb-4">
                  <p className="text-sm text-arc-slate-600 flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    Drag questions to reorder them.
                  </p>
                </div>

                <DraggableList
                  items={questionItems}
                  onReorder={handleReorderQuestions}
                  renderItem={(item, dragHandleProps) => {
                    const question = questions.find((q) => q.id === item.id);
                    if (!question) return null;

                    return (
                      <div className="flex items-center gap-3 p-4 bg-arc-slate-50 rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors cursor-pointer group">
                        <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-arc-slate-400 hover:text-arc-slate-600" onClick={(e) => e.stopPropagation()}>
                          <GripVertical className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium text-arc-slate-500 w-6">{questions.findIndex((q) => q.id === question.id) + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-arc-navy-900 font-medium truncate">{question.stem}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-blue-100 text-blue-700 text-xs">{question.type.replace("_", " ")}</Badge>
                            <Badge className={`${difficultyColors[question.difficulty]} text-xs`}>{question.difficulty}</Badge>
                            <span className="text-xs text-arc-slate-500">{question.score} point{question.score !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <button className="p-1.5 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(question.id); }}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    );
                  }}
                />

                {questions.length === 0 && (
                  <div className="text-center py-12 bg-arc-slate-50 rounded-lg border-2 border-dashed border-arc-slate-200">
                    <Zap className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No questions yet</h3>
                    <p className="text-arc-slate-500 mb-4">Add questions manually or auto-generate</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" onClick={handleAutoGenerate}><Zap className="h-4 w-4 mr-2" />Auto-Generate</Button>
                      <Button variant="accent" onClick={() => setShowQuestionForm(true)}><Plus className="h-4 w-4 mr-2" />Add Question</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="w-80 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-arc-navy-900 mb-4">Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="h-4 w-4 rounded border-arc-slate-300 text-arc-orange-500 focus:ring-arc-orange-500" />
                    <div>
                      <span className="text-sm font-medium text-arc-navy-900">Randomize Questions</span>
                      <p className="text-xs text-arc-slate-500">Shuffle question order</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={randomizeChoices} onChange={(e) => setRandomizeChoices(e.target.checked)} className="h-4 w-4 rounded border-arc-slate-300 text-arc-orange-500 focus:ring-arc-orange-500" />
                    <div>
                      <span className="text-sm font-medium text-arc-navy-900">Randomize Choices</span>
                      <p className="text-xs text-arc-slate-500">Shuffle answer options</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showExplanations} onChange={(e) => setShowExplanations(e.target.checked)} className="h-4 w-4 rounded border-arc-slate-300 text-arc-orange-500 focus:ring-arc-orange-500" />
                    <div>
                      <span className="text-sm font-medium text-arc-navy-900">Show Explanations</span>
                      <p className="text-xs text-arc-slate-500">After submission</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="h-4 w-4 rounded border-arc-slate-300 text-arc-orange-500 focus:ring-arc-orange-500" />
                    <div>
                      <span className="text-sm font-medium text-arc-navy-900">Allow Retake</span>
                      <p className="text-xs text-arc-slate-500">Let learners try again</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-arc-navy-900 mb-4">Question Pool</h3>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Topics for Question Bank
                </label>
                <p className="text-xs text-arc-slate-500 mb-3">
                  Select topics to auto-generate questions from the library. When topics are set, the assessment pulls a random sample — no need to add questions manually.
                </p>
                <TopicPickerCompact
                  selectedTopicIds={selectedTopicIds}
                  onChange={setSelectedTopicIds}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-arc-navy-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-arc-slate-600"><Target className="h-4 w-4" /><span className="text-sm">Questions</span></div>
                    <span className="font-semibold text-arc-navy-900">{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-arc-slate-600"><Clock className="h-4 w-4" /><span className="text-sm">Time Limit</span></div>
                    <span className="font-semibold text-arc-navy-900">{timeLimit ? `${timeLimit} min` : "No limit"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-arc-slate-600"><Check className="h-4 w-4" /><span className="text-sm">Mastery</span></div>
                    <span className="font-semibold text-arc-navy-900">{masteryThreshold || passingScore || 95}%</span>
                  </div>
                  <div className="pt-3 border-t border-arc-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arc-slate-600">Total Points</span>
                      <span className="font-bold text-arc-navy-900">{questions.length} pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={handleAutoGenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Generate Questions
            </Button>
          </div>
        </div>
      </div>

      <QuestionForm
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        onSubmit={handleAddQuestion}
      />

      {/* Auto-Generate Modal */}
      {showAutoGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
              <div>
                <h2 className="text-lg font-bold text-arc-navy-900">Auto-Generate Questions</h2>
                <p className="text-sm text-arc-slate-500">Select topics and generate questions automatically</p>
              </div>
              <button onClick={() => setShowAutoGenerate(false)} className="p-2 rounded-lg hover:bg-arc-slate-100">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Topic Selection */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Select Topics
                </label>
                <TopicPicker
                  selectedTopicIds={selectedTopicIds}
                  onChange={setSelectedTopicIds}
                />
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Number of Questions
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={autoGenQuestionCount}
                  onChange={(e) => setAutoGenQuestionCount(e.target.value)}
                  placeholder="Enter number of questions"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  Maximum questions that can be generated from selected topics
                </p>
              </div>

              {/* Difficulty Distribution */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setAutoGenDifficulty(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        autoGenDifficulty === level
                          ? level === "ALL"
                            ? "bg-arc-navy-900 text-white"
                            : level === "EASY"
                            ? "bg-green-500 text-white"
                            : level === "MEDIUM"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-arc-slate-100 text-arc-slate-600 hover:bg-arc-slate-200"
                      }`}
                    >
                      {level === "ALL" ? "All Levels" : level.charAt(0) + level.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>How it works:</strong> The system will pull questions from the question bank
                  that are linked to your selected topics. Questions will be randomly selected and
                  shuffled. Each attempt will draw a fresh sample.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50">
              <Button variant="outline" onClick={() => setShowAutoGenerate(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleConfirmAutoGenerate}
                disabled={isGenerating || selectedTopicIds.length === 0}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
