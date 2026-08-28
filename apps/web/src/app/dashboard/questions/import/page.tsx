"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Input, Label, Badge } from "@/components/ui";
import { cn } from "@aratc/ui";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Search,
  Eye,
  Pencil,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Save,
  KeyRound,
  Info,
  FileUp,
  Copy,
  Columns2,
  Image as ImageIcon,
  Download,
  BarChart3,
  Layers,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  questionsApi,
  programsApi,
  subjectsApi,
  type ImportPreviewResult,
  type ExtractedQuestionPreview,
} from "@/lib/api/client";
import { ImportSteps } from "./import-steps";
import { FormattedQuestionnaire } from "./formatted-text";

// ============================================================
// Types
// ============================================================

type Stage = "upload" | "review" | "preview";
type QuestionStatus = "accepted" | "edited" | "rejected";
/** Extraction workflow: "smart" = vision (best quality, costs more),
 *  "budget" = structured text-only AI call (much cheaper),
 *  "mineru" = MinerU local high-fidelity parse (OCR/tables/formulas) +
 *  text-only AI call. */
type ImportMode = "smart" | "budget" | "mineru";

const IMPORT_MODE_STORAGE_KEY = "questionImportMode";
const LAST_PROGRAM_STORAGE_KEY = "lastImportProgram";

type ConfidenceBucket = "0-25" | "25-50" | "50-75" | "75-100";

interface Program {
  id: string;
  name: string;
  slug: string;
}

interface Subject {
  id: string;
  name: string;
}

interface EditableQuestion {
  id: string;
  status: QuestionStatus;
  stem: string;
  type: ExtractedQuestionPreview["type"];
  choices: { label: string; text: string }[];
  correctAnswer: string | null;
  correctAnswerText?: string | null;
  explanation: string;
  questionNumber: number;
  pageNumber?: number | null;
  confidence?: number;
  extractionNote?: string | null;
  hasImage?: boolean;
  /** Budget mode: AI's confidence (0-1) that the image belongs to this
   *  question. Admin-review/debug signal only. */
  imageMappingConfidence?: number | null;
  /** Budget mode: why the AI associated the image with this question.
   *  Admin-review/debug signal only. */
  imageMappingReason?: string | null;
  mediaUrl?: string | null;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  multiple_select: "Multiple Select",
  true_false: "True/False",
  identification: "Identification",
  fill_in_the_blank: "Fill in the Blank",
  matching_type: "Matching Type",
  essay: "Essay",
};

/** Question types that use the choices editor */
const CHOICE_TYPES = ["multiple_choice", "multiple_select"];

export default function ImportQuestionsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow state
  const [stage, setStage] = useState<Stage>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [summary, setSummary] = useState<ImportPreviewResult["documentSummary"] | null>(null);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);

  // Form state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectId, setSubjectId] = useState("");

  // Persisted import settings — survive page reloads so the admin doesn't
  // re-pick the same workflow / program every time.
  const [importMode, setImportMode] = useState<ImportMode>("smart");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceBucket | null>(null);
  // lastProgram is the program selected on the upload stage; we persist it so a
  // returning admin lands on their last-used program when they reload.
  const [lastProgram, setLastProgram] = useState<string | null>(null);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(IMPORT_MODE_STORAGE_KEY);
    if (savedMode === "budget" || savedMode === "smart" || savedMode === "mineru")
      setImportMode(savedMode);
    const savedProgram = window.localStorage.getItem(LAST_PROGRAM_STORAGE_KEY);
    if (savedProgram) setLastProgram(savedProgram);
    const savedConf = window.localStorage.getItem("questionImportConfidenceBucket");
    if (
      savedConf === "0-25" ||
      savedConf === "25-50" ||
      savedConf === "50-75" ||
      savedConf === "75-100"
    )
      setConfidenceFilter(savedConf);
  }, []);
  const changeImportMode = (mode: ImportMode) => {
    setImportMode(mode);
    window.localStorage.setItem(IMPORT_MODE_STORAGE_KEY, mode);
  };

  // UI state
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [textMode, setTextMode] = useState<"formatted" | "raw">("formatted");
  const [questionFilter, setQuestionFilter] = useState<"all" | "missing" | "low" | "image">("all");
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Load dropdown data
  useEffect(() => {
    programsApi
      .list()
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));
    subjectsApi
      .list()
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  // Preselect a subject matching the typed subject name
  useEffect(() => {
    if (!subjectName || subjects.length === 0) return;
    const match = subjects.find((s) => s.name.toLowerCase().includes(subjectName.toLowerCase()));
    if (match) setSubjectId(match.id);
  }, [subjectName, subjects]);

  // Restore the last-used program once the program list has loaded (only if the
  // admin hasn't already picked one in this session).
  useEffect(() => {
    if (!selectedProgram && lastProgram) {
      const valid = programs.some((p) => p.id === lastProgram);
      if (valid) setSelectedProgram(lastProgram);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, lastProgram]);

  // Persist the program choice so a returning admin lands on the same program.
  useEffect(() => {
    if (selectedProgram) window.localStorage.setItem(LAST_PROGRAM_STORAGE_KEY, selectedProgram);
  }, [selectedProgram]);

  const programName = useMemo(
    () => programs.find((p) => p.id === selectedProgram)?.name || "",
    [programs, selectedProgram]
  );

  // Create a browser-native object URL for the selected PDF so it can be
  // rendered side-by-side in the review stage.
  useEffect(() => {
    if (!selectedFile) {
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(pdfText);
      toast.success("Text copied to clipboard");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const accepted = questions.filter((q) => q.status !== "rejected");
  const rejectedCount = questions.length - accepted.length;
  const missingCount = questions.filter((q) => !q.correctAnswer).length;
  const lowCount = questions.filter(
    (q) => typeof q.confidence === "number" && q.confidence < 0.5
  ).length;
  const imageCount = questions.filter((q) => q.hasImage).length;

  // Confidence buckets for the triage histogram. Each bucket counts extracted
  // questions (regardless of accept/reject) so admins can spot weak spots fast.
  const confidenceBuckets: { label: ConfidenceBucket; count: number }[] = [
    { label: "0-25", count: 0 },
    { label: "25-50", count: 0 },
    { label: "50-75", count: 0 },
    { label: "75-100", count: 0 },
  ];
  for (const q of questions) {
    const c = typeof q.confidence === "number" ? q.confidence : 1;
    const b = confidenceBuckets.find((b) =>
      c <= 0.25
        ? b.label === "0-25"
        : c <= 0.5
          ? b.label === "25-50"
          : c <= 0.75
            ? b.label === "50-75"
            : b.label === "75-100"
    );
    if (b) b.count++;
  }

  const visibleQuestions = useMemo(() => {
    let list = questions;
    if (questionFilter === "missing") list = list.filter((q) => !q.correctAnswer);
    else if (questionFilter === "low")
      list = list.filter((q) => typeof q.confidence === "number" && q.confidence < 0.5);
    else if (questionFilter === "image") list = list.filter((q) => q.hasImage);
    if (confidenceFilter) {
      list = list.filter((q) => {
        const c = typeof q.confidence === "number" ? q.confidence : 1;
        if (confidenceFilter === "0-25") return c <= 0.25;
        if (confidenceFilter === "25-50") return c > 0.25 && c <= 0.5;
        if (confidenceFilter === "50-75") return c > 0.5 && c <= 0.75;
        return c > 0.75;
      });
    }
    return list;
  }, [questions, questionFilter, confidenceFilter]);

  // ============================================================
  // Step 1 — extract text from the uploaded PDF
  // ============================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file only.");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }
    if (!selectedProgram) {
      setError("Please select a program.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const data = await questionsApi.extractPdfText(
        selectedFile,
        programName,
        subjectName || undefined
      );
      setPdfText(data.pdfText);
      setStage("review");
      toast.success("Text extracted — review it on the right");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  };

  // ============================================================
  // Step 2 — send the (edited) text to Gemini
  // ============================================================

  const handleProcessWithAI = async () => {
    if (!pdfText.trim()) {
      toast.error("No text content to process");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await questionsApi.previewExtraction({
        pdfText,
        programName,
        subjectName: subjectName || null,
        file: selectedFile,
        mode: importMode,
      });

      setSummary(result.documentSummary || null);
      setQuestions(
        (result.questions || []).map((q, idx) => ({
          id: `q-${idx}`,
          status: "accepted" as const,
          stem: q.question || "",
          type: q.type,
          choices: q.choices || [],
          correctAnswer: q.correctAnswer ?? null,
          correctAnswerText: q.correctAnswerText ?? null,
          explanation: q.explanation || "",
          questionNumber: q.questionNumber || idx + 1,
          pageNumber: q.pageNumber,
          confidence: q.confidence,
          extractionNote: q.extractionNote || null,
          hasImage: q.hasImage ?? false,
          imageMappingConfidence: q.imageMappingConfidence ?? null,
          imageMappingReason: q.imageMappingReason ?? null,
          mediaUrl: q.mediaUrl ?? null,
        }))
      );
      setActiveEditId(null);
      setStage("preview");
      setQuestionFilter("all");
      setConfidenceFilter(null);

      toast.success(
        result.questions?.length
          ? `${result.questions.length} questions extracted — review them on the right`
          : "AI found no questions in this text. Try editing the text or using a different PDF."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // Step 3 — import accepted questions
  // ============================================================

  const handleImport = async () => {
    if (accepted.length === 0) {
      toast.error("No questions to import. Accept at least one question.");
      return;
    }
    if (!selectedProgram) {
      toast.error("Please select a program.");
      return;
    }

    const payload = accepted.map((q) => ({
      questionNumber: q.questionNumber,
      type: q.type,
      question: q.stem,
      choices:
        q.choices.length > 0 ? q.choices.map((c) => ({ label: c.label, text: c.text })) : undefined,
      correctAnswer: q.correctAnswer ?? null,
      correctAnswerText: null,
      explanation: q.explanation || null,
      hasImage: q.hasImage ?? false,
      mediaUrl: q.mediaUrl ?? null,
      confidence: q.confidence ?? 1,
      extractionNote: q.extractionNote ?? null,
    }));

    setIsImporting(true);

    try {
      const result = await questionsApi.importBulk({
        questions: payload,
        programId: selectedProgram,
        subjectId: subjectId || null,
        topicId: null,
      });

      toast.success(
        result.created > 0
          ? `Imported ${result.created} question${result.created !== 1 ? "s" : ""} as drafts`
          : "No questions were imported"
      );
      router.push("/dashboard/questions");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed. Please try again.";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  // ============================================================
  // Question editing helpers
  // ============================================================

  const updateQuestion = (id: string, field: keyof EditableQuestion, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value, status: "edited" } : q))
    );
  };

  const toggleAccept = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: q.status === "rejected" ? "accepted" : "rejected" } : q
      )
    );
  };

  const isCorrectChoice = (q: EditableQuestion, label: string) => {
    if (!q.correctAnswer) return false;
    if (q.type === "multiple_select") {
      return q.correctAnswer
        .split(",")
        .map((s) => s.trim())
        .includes(label);
    }
    return q.correctAnswer === label;
  };

  const setCorrectChoice = (q: EditableQuestion, index: number) => {
    const label = q.choices[index]?.label;
    if (!label) return;

    if (q.type === "multiple_select") {
      const labels = (q.correctAnswer || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = labels.includes(label) ? labels.filter((l) => l !== label) : [...labels, label];
      updateQuestion(q.id, "correctAnswer", next.length ? next.join(",") : null);
    } else {
      updateQuestion(q.id, "correctAnswer", label);
    }
  };

  const saveEdit = (id: string) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;

    if (!q.stem.trim()) {
      toast.error("Question stem cannot be empty");
      return;
    }
    if (CHOICE_TYPES.includes(q.type) && q.choices.some((c) => !c.text.trim())) {
      toast.error("All choices must have text");
      return;
    }
    if (CHOICE_TYPES.includes(q.type) && q.choices.length < 2) {
      toast.error("At least 2 choices are required");
      return;
    }

    updateQuestion(id, "status", "accepted");
    setActiveEditId(null);
    toast.success("Question updated");
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (activeEditId === id) setActiveEditId(null);
  };

  const acceptAll = () => {
    setQuestions((prev) => prev.map((q) => ({ ...q, status: "accepted" as const })));
    toast.success("All questions accepted");
  };

  const exportJson = () => {
    const exportData = {
      documentSummary: {
        ...summary,
        totalQuestions: accepted.length,
      },
      questions: accepted.map((q) => ({
        questionNumber: q.questionNumber,
        pageNumber: q.pageNumber,
        type: q.type,
        question: q.stem,
        choices: q.choices.length > 0 ? q.choices : undefined,
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.correctAnswerText,
        explanation: q.explanation || null,
        hasImage: q.hasImage ?? false,
        mediaUrl: q.mediaUrl ?? null,
        confidence: q.confidence ?? 1,
        extractionNote: q.extractionNote,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Questions exported as JSON");
  };

  const resetAll = () => {
    setStage("upload");
    setSelectedFile(null);
    setPdfText("");
    setSummary(null);
    setQuestions([]);
    setActiveEditId(null);
    setSearchTerm("");
    setTextMode("formatted");
    setQuestionFilter("all");
    setConfidenceFilter(null);
    setShowPdf(false);
    setError(null);
    setSubjectId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Copies just this question's stem to the clipboard — handy for pasting a
  // single item into another assessment or sharing with colleagues.
  const handleCopyStem = async (q: EditableQuestion) => {
    const text = `Q${q.questionNumber ?? ""}. ${q.stem}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Question copied to clipboard");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access");
    }
  };

  // Text stats for the review panel
  const lineCount = pdfText ? pdfText.split("\n").length : 0;
  const wordCount = pdfText ? pdfText.trim().split(/\s+/).filter(Boolean).length : 0;
  const filteredLines = searchTerm
    ? pdfText.split("\n").filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stepNumber: 1 | 2 | 3 = stage === "upload" ? 1 : stage === "review" ? 2 : 3;

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      <DashboardHeader
        title="Import Questions from PDF"
        subtitle="Upload a PDF, review its text, then let AI extract the questions"
        actions={<ImportSteps current={stepNumber} />}
      />

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-105px)]">
        {/* ================= LEFT PANEL — form / controls ================= */}
        <aside className="lg:w-[400px] xl:w-[440px] shrink-0 border-b lg:border-b-0 lg:border-r border-arc-slate-200 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Program + subject */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <select
                  id="program"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                >
                  <option value="">Select a program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Science, English"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
                <p className="text-xs text-arc-slate-400">Helps the AI classify questions.</p>
              </div>
            </div>

            <div className="h-px bg-arc-slate-100" />

            {/* Extraction workflow setting */}
            <div className="space-y-2">
              <Label>Extraction Workflow</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => changeImportMode("smart")}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    importMode === "smart"
                      ? "border-arc-navy-500 bg-arc-navy-50/60"
                      : "border-arc-slate-200 hover:border-arc-navy-300 bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-arc-navy-900">
                    <Sparkles className="h-3.5 w-3.5 text-arc-orange-500" />
                    Smart
                  </span>
                  <span className="mt-1 block text-xs text-arc-slate-500 leading-snug">
                    Vision AI reads the PDF — best for diagrams & scans. Higher cost.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => changeImportMode("budget")}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    importMode === "budget"
                      ? "border-arc-navy-500 bg-arc-navy-50/60"
                      : "border-arc-slate-200 hover:border-arc-navy-300 bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-arc-navy-900">
                    <FileText className="h-3.5 w-3.5 text-arc-navy-600" />
                    Budget
                  </span>
                  <span className="mt-1 block text-xs text-arc-slate-500 leading-snug">
                    Text-only AI call — much cheaper. Scanned pages are skipped.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => changeImportMode("mineru")}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    importMode === "mineru"
                      ? "border-arc-navy-500 bg-arc-navy-50/60"
                      : "border-arc-slate-200 hover:border-arc-navy-300 bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-arc-navy-900">
                    <Layers className="h-3.5 w-3.5 text-arc-navy-600" />
                    MinerU
                  </span>
                  <span className="mt-1 block text-xs text-arc-slate-500 leading-snug">
                    High-fidelity local parse — OCR, tables & formulas preserved.
                  </span>
                </button>
              </div>
              <p className="text-xs text-arc-slate-400">
                {importMode === "budget"
                  ? "Budget mode parses the PDF locally and sends only structured text to the AI. Images are matched by the backend — scanned pages can't be read."
                  : importMode === "mineru"
                    ? "MinerU mode parses the PDF with a layout-aware engine (OCR, tables, formulas, figures) and sends clean structured text to the AI. Requires MinerU to be enabled on the server."
                    : "Smart mode attaches the original PDF to the AI so it can see diagrams, graphs, tables, and scanned pages."}
              </p>
            </div>

            <div className="h-px bg-arc-slate-100" />

            {/* Stage-specific controls */}
            {stage === "upload" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>PDF File *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      selectedFile
                        ? "border-arc-orange-400 bg-arc-orange-50/50"
                        : "border-arc-slate-200 hover:border-arc-navy-300"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-arc-orange-500 shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-sm font-medium text-arc-navy-900 block truncate">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-arc-slate-500">
                            {formatFileSize(selectedFile.size)} — click to change
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-arc-slate-400" />
                        <p className="mt-2 text-sm text-arc-navy-600">Click to select a PDF file</p>
                        <p className="text-xs text-arc-slate-400 mt-1">
                          Text-based PDFs only (max 50MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleExtract}
                  disabled={!selectedFile || !selectedProgram || isExtracting}
                  className="w-full"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting text...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4 mr-2" />
                      Extract Text
                    </>
                  )}
                </Button>
              </div>
            )}

            {stage === "review" && (
              <div className="space-y-4">
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-arc-slate-50 rounded-lg border border-arc-slate-100">
                    <FileText className="h-5 w-5 text-arc-navy-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-arc-navy-900 block truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-arc-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-arc-slate-500 leading-relaxed">
                  Review the document on the right — it&apos;s shown as a formatted questionnaire,
                  with a raw-text toggle if you need to fix anything the PDF reader got wrong.
                </p>

                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleProcessWithAI}
                  disabled={!pdfText.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={resetAll} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start over
                </Button>
              </div>
            )}

            {stage === "preview" && (
              <div className="space-y-4">
                {summary && (
                  <Card className="mb-4">
                    <CardContent className="p-4 space-y-3">
                      {summary.title ? (
                        <p className="font-semibold text-arc-navy-900">{summary.title}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{summary.totalQuestions} extracted</Badge>
                        <Badge variant={accepted.length > 0 ? "success" : "alert"}>
                          {accepted.length} accepted
                        </Badge>
                        {rejectedCount > 0 && (
                          <Badge variant="alert">{rejectedCount} rejected</Badge>
                        )}
                        {summary.hasAnswerKey ? (
                          <Badge variant="success">
                            <KeyRound className="h-3 w-3 mr-1" />
                            Answer key found
                          </Badge>
                        ) : (
                          <Badge variant="warning">No answer key</Badge>
                        )}
                      </div>

                      {summary.questionTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.questionTypes.map((t) => (
                            <Badge key={t} variant="outline">
                              {QUESTION_TYPE_LABELS[t] || t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {summary.processingWarnings.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800">
                            {summary.processingWarnings.join(" · ")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="link-subject">Link to subject (optional)</Label>
                  <select
                    id="link-subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                  >
                    <option value="">No subject link</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={accepted.length === 0 || isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Import {accepted.length} Question{accepted.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>

                <p className="text-xs text-arc-slate-400 text-center">
                  Questions are saved as drafts — publish them from the question bank.
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStage("review")} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to text
                  </Button>
                  <Button variant="outline" onClick={resetAll} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start over
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ================= RIGHT PANEL — preview ================= */}
        <main className="flex-1 min-w-0 bg-arc-slate-50/50 overflow-y-auto">
          {stage === "upload" && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-arc-orange-100 mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-arc-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-arc-navy-900 mb-1">
                  Your extracted text will appear here
                </h2>
                <p className="text-sm text-arc-slate-500 mb-6">
                  Select a program and upload a PDF on the left to get started.
                </p>
                <div className="text-left bg-white border border-arc-slate-200 rounded-xl p-4 space-y-3">
                  {[
                    "Upload a text-based PDF containing questions",
                    "Review and edit the extracted text before AI processing",
                    "Accept, edit, or reject each extracted question",
                    "Import accepted questions into your question bank",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-arc-orange-100 text-arc-orange-600 text-xs font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-arc-navy-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="p-6 flex flex-col h-full">
              {/* Toolbar: format toggle + copy + compare + search + stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-wrap">
                {/* Formatted / Raw toggle */}
                <div className="inline-flex items-center rounded-lg border border-arc-slate-200 bg-white p-0.5 w-fit">
                  <button
                    type="button"
                    onClick={() => setTextMode("formatted")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      textMode === "formatted"
                        ? "bg-arc-navy-900 text-white"
                        : "text-arc-slate-500 hover:text-arc-navy-700"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Formatted
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextMode("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      textMode === "raw"
                        ? "bg-arc-navy-900 text-white"
                        : "text-arc-slate-500 hover:text-arc-navy-700"
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Raw (editable)
                  </button>
                </div>

                {/* Copy all + Compare with PDF */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-arc-slate-200 bg-white text-arc-slate-600 hover:bg-arc-slate-50 hover:text-arc-navy-800 transition-colors"
                    title="Copy the full extracted text to your clipboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy All
                  </button>
                  {pdfUrl && (
                    <button
                      type="button"
                      onClick={() => setShowPdf(!showPdf)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                        showPdf
                          ? "border-arc-navy-900 bg-arc-navy-900 text-white"
                          : "border-arc-slate-200 bg-white text-arc-slate-600 hover:bg-arc-slate-50 hover:text-arc-navy-800"
                      }`}
                      title="Show the original PDF next to the extracted text"
                    >
                      <Columns2 className="h-3.5 w-3.5" />
                      {showPdf ? "Hide PDF" : "Compare PDF"}
                    </button>
                  )}
                </div>

                <div className="relative flex-1 max-w-sm min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <Input
                    placeholder="Search within the text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>

                <span className="text-xs text-arc-slate-400 whitespace-nowrap">
                  {lineCount} lines · {wordCount} words
                </span>
              </div>

              {/* Content area — optionally split with the original PDF */}
              <div
                className={`flex-1 min-h-[300px] gap-4 ${
                  showPdf && pdfUrl ? "flex flex-col xl:flex-row" : ""
                }`}
              >
                {/* Text pane */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {searchTerm ? (
                    <div className="flex-1 px-4 py-3 bg-white border border-arc-slate-200 rounded-lg overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                      {filteredLines && filteredLines.length > 0 ? (
                        filteredLines.map((line, i) => (
                          <div key={i} className="py-0.5">
                            {line || " "}
                          </div>
                        ))
                      ) : (
                        <span className="text-arc-slate-400">
                          No lines match &quot;{searchTerm}&quot;
                        </span>
                      )}
                    </div>
                  ) : textMode === "formatted" ? (
                    <div className="flex-1 overflow-y-auto pr-1">
                      <FormattedQuestionnaire rawText={pdfText} />
                    </div>
                  ) : (
                    <textarea
                      value={pdfText}
                      onChange={(e) => setPdfText(e.target.value)}
                      className="flex-1 w-full px-4 py-3 bg-white border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 font-mono text-sm resize-none"
                      placeholder="Extracted PDF text..."
                    />
                  )}
                </div>

                {/* PDF pane — original document for comparison */}
                {showPdf && pdfUrl && (
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-arc-slate-400">
                        Original PDF
                      </span>
                      <span className="text-xs text-arc-slate-400 truncate max-w-[200px]">
                        {selectedFile?.name}
                      </span>
                    </div>
                    <iframe
                      src={pdfUrl}
                      title="Original PDF"
                      className="flex-1 min-h-[400px] w-full bg-white border border-arc-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Hint under the formatted view */}
              {textMode === "formatted" && !searchTerm && (
                <p className="text-xs text-arc-slate-400 mt-3 text-center">
                  This is a preview of how the AI will read your document. Spotted a mistake? Switch
                  to <strong>Raw (editable)</strong> to fix the text before processing.
                </p>
              )}
            </div>
          )}

          {stage === "preview" && (
            <div className="p-6 space-y-4">
              {/* Filter toolbar */}
              {questions.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-lg border border-arc-slate-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionFilter("all");
                          setConfidenceFilter(null);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          questionFilter === "all" && !confidenceFilter
                            ? "bg-arc-navy-900 text-white"
                            : "text-arc-slate-600 hover:text-arc-navy-900"
                        )}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionFilter("missing");
                          setConfidenceFilter(null);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          questionFilter === "missing"
                            ? "bg-amber-500 text-white"
                            : "text-arc-slate-600 hover:text-arc-navy-900"
                        )}
                      >
                        No answer ({missingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionFilter("low");
                          setConfidenceFilter(null);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          questionFilter === "low"
                            ? "bg-amber-500 text-white"
                            : "text-arc-slate-600 hover:text-arc-navy-900"
                        )}
                      >
                        Low confidence ({lowCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionFilter("image");
                          setConfidenceFilter(null);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                          questionFilter === "image"
                            ? "bg-arc-navy-900 text-white"
                            : "text-arc-slate-600 hover:text-arc-navy-900"
                        )}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Images ({imageCount})
                      </button>
                    </div>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={acceptAll}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Accept all
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportJson}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export JSON
                    </Button>
                  </div>

                  {/* Confidence triage histogram — click a bucket to filter */}
                  {questions.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-arc-slate-400 mr-1">
                        Confidence
                      </span>
                      {confidenceBuckets.map((bucket) => {
                        const active = confidenceFilter === bucket.label;
                        const pct =
                          questions.length > 0
                            ? Math.round((bucket.count / questions.length) * 100)
                            : 0;
                        return (
                          <button
                            key={bucket.label}
                            type="button"
                            onClick={() => {
                              setQuestionFilter("all");
                              setConfidenceFilter(active ? null : bucket.label);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                              active
                                ? "bg-arc-navy-900 border-arc-navy-900 text-white"
                                : "border-arc-slate-200 bg-white text-arc-slate-600 hover:border-arc-navy-400 hover:text-arc-navy-800"
                            )}
                            title={`${bucket.count} question${bucket.count === 1 ? "" : "s"} in this range`}
                          >
                            <span className="w-9 text-left">{bucket.label}</span>
                            <span
                              className={cn(
                                "h-2 rounded-sm",
                                active ? "bg-white/80" : "bg-arc-orange-400/70"
                              )}
                              style={{ width: Math.max(4, pct * 0.6) }}
                            />
                            <span className="text-arc-slate-400">{bucket.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {questions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-arc-slate-300 mb-4" />
                    <p className="text-arc-slate-500 mb-4">
                      No questions were found in this document
                    </p>
                    <Button variant="outline" onClick={() => setStage("review")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Edit the text and try again
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                visibleQuestions.map((q) => (
                  <Card key={q.id} className={q.status === "rejected" ? "opacity-60" : undefined}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={q.status === "rejected" ? "alert" : "success"}>
                              {q.status === "rejected" ? "Rejected" : "Accepted"}
                            </Badge>
                            <Badge variant="secondary">
                              {QUESTION_TYPE_LABELS[q.type] || q.type}
                            </Badge>
                            <span className="text-xs text-arc-slate-400">#{q.questionNumber}</span>
                            {q.hasImage && (
                              <Badge
                                variant={
                                  typeof q.imageMappingConfidence === "number" &&
                                  q.imageMappingConfidence < 0.5
                                    ? "alert"
                                    : typeof q.imageMappingConfidence === "number" &&
                                        q.imageMappingConfidence < 0.7
                                      ? "warning"
                                      : "secondary"
                                }
                                title={
                                  q.imageMappingReason ||
                                  "Image association confidence (admin/debug signal)"
                                }
                              >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Image
                                {typeof q.imageMappingConfidence === "number"
                                  ? ` · ${Math.round(q.imageMappingConfidence * 100)}%`
                                  : ""}
                              </Badge>
                            )}
                            {typeof q.confidence === "number" ? (
                              <Badge
                                variant={
                                  q.confidence >= 0.7
                                    ? "success"
                                    : q.confidence >= 0.4
                                      ? "warning"
                                      : "alert"
                                }
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                {Math.round(q.confidence * 100)}%
                              </Badge>
                            ) : null}
                            {q.extractionNote && (
                              <Badge variant="warning">{q.extractionNote}</Badge>
                            )}
                          </div>

                          {activeEditId === q.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-arc-navy-700 mb-1">
                                  Question Stem
                                </label>
                                <textarea
                                  value={q.stem}
                                  onChange={(e) => updateQuestion(q.id, "stem", e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-y"
                                />
                              </div>

                              {/* Quick visual check while editing — confirm the
                                  figure the AI attached is really the right one. */}
                              {q.hasImage && q.mediaUrl ? (
                                <div className="rounded-lg border border-arc-slate-200 overflow-hidden bg-arc-slate-50">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-arc-slate-100 border-b border-arc-slate-200">
                                    <ImageIcon className="h-3.5 w-3.5 text-arc-slate-500" />
                                    <span className="text-xs font-medium text-arc-slate-600">
                                      Attached image — Page {q.pageNumber ?? "?"}
                                    </span>
                                  </div>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={q.mediaUrl}
                                    alt={`Page ${q.pageNumber ?? ""} from original PDF`}
                                    className="w-full h-auto max-h-52 object-contain"
                                  />
                                </div>
                              ) : q.hasImage ? (
                                <div className="flex items-center gap-2 p-2 rounded border border-amber-200 bg-amber-50 text-xs text-amber-700">
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                  This question references an image but no image was extracted.
                                </div>
                              ) : null}

                              {CHOICE_TYPES.includes(q.type) && (
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-arc-navy-700">
                                    Choices — tick the correct one
                                    {q.type === "multiple_select" ? "s" : ""}
                                  </label>
                                  {q.choices.map((choice, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <input
                                        type={q.type === "multiple_choice" ? "radio" : "checkbox"}
                                        name={`correct-${q.id}`}
                                        checked={isCorrectChoice(q, choice.label)}
                                        onChange={() => setCorrectChoice(q, idx)}
                                        className="h-4 w-4 text-arc-orange-500"
                                      />
                                      <Input
                                        value={choice.label}
                                        onChange={(e) => {
                                          const newChoices = [...q.choices];
                                          newChoices[idx] = {
                                            ...newChoices[idx],
                                            label: e.target.value,
                                          };
                                          updateQuestion(q.id, "choices", newChoices);
                                        }}
                                        placeholder="Label"
                                        className="w-16"
                                      />
                                      <Input
                                        value={choice.text}
                                        onChange={(e) => {
                                          const newChoices = [...q.choices];
                                          newChoices[idx] = {
                                            ...newChoices[idx],
                                            text: e.target.value,
                                          };
                                          updateQuestion(q.id, "choices", newChoices);
                                        }}
                                        placeholder="Choice text"
                                        className="flex-1"
                                      />
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuestion(q.id, "choices", [
                                        ...q.choices,
                                        {
                                          label: String.fromCharCode(65 + q.choices.length),
                                          text: "",
                                        },
                                      ])
                                    }
                                    className="text-sm text-arc-navy-600 hover:text-arc-navy-900"
                                  >
                                    + Add choice
                                  </button>
                                </div>
                              )}

                              {!CHOICE_TYPES.includes(q.type) && (
                                <div>
                                  <label className="block text-sm font-medium text-arc-navy-700 mb-1">
                                    Correct Answer
                                  </label>
                                  <Input
                                    value={q.correctAnswer || ""}
                                    onChange={(e) =>
                                      updateQuestion(q.id, "correctAnswer", e.target.value || null)
                                    }
                                    placeholder={
                                      q.type === "true_false"
                                        ? "true or false"
                                        : "The expected answer"
                                    }
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-arc-navy-700 mb-1">
                                  Explanation (optional)
                                </label>
                                <textarea
                                  value={q.explanation}
                                  onChange={(e) =>
                                    updateQuestion(q.id, "explanation", e.target.value)
                                  }
                                  rows={2}
                                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-y"
                                  placeholder="Why is this the correct answer?"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEdit(q.id)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActiveEditId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-arc-navy-900 leading-relaxed whitespace-pre-wrap flex-1">
                                  {q.stem}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCopyStem(q)}
                                  title="Copy this question to clipboard"
                                  className="shrink-0 p-1.5 rounded-md text-arc-slate-400 hover:text-arc-navy-800 hover:bg-arc-slate-100 transition-colors"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {q.mediaUrl && (
                                <div className="mt-3 rounded-lg border border-arc-slate-200 overflow-hidden bg-arc-slate-50">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-arc-slate-100 border-b border-arc-slate-200">
                                    <ImageIcon className="h-3.5 w-3.5 text-arc-slate-500" />
                                    <span className="text-xs font-medium text-arc-slate-600">
                                      Page {q.pageNumber ?? "?"} — rendered from original PDF
                                    </span>
                                  </div>
                                  {q.imageMappingReason && (
                                    <p className="px-3 py-1.5 text-xs text-arc-slate-500 border-b border-arc-slate-200 bg-white">
                                      <strong>Why this image:</strong> {q.imageMappingReason}
                                    </p>
                                  )}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={q.mediaUrl}
                                    alt={`Page ${q.pageNumber ?? ""} from original PDF`}
                                    className="w-full h-auto max-h-80 object-contain"
                                  />
                                </div>
                              )}

                              {q.choices && q.choices.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {q.choices.map((choice, idx) => {
                                    const isCorrect = isCorrectChoice(q, choice.label);
                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-2 rounded border ${
                                          isCorrect
                                            ? "bg-green-50 border-green-200"
                                            : "bg-arc-slate-50 border-arc-slate-100"
                                        }`}
                                      >
                                        <span className="text-xs font-medium text-arc-navy-600 w-6">
                                          {choice.label}
                                        </span>
                                        <span className="text-sm text-arc-navy-800 flex-1">
                                          {choice.text}
                                        </span>
                                        {isCorrect && (
                                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {!q.choices?.length && q.correctAnswer && (
                                <p className="text-sm text-arc-navy-600 mt-2">
                                  <strong>Answer:</strong> {q.correctAnswer}
                                </p>
                              )}

                              {!q.correctAnswer && (
                                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                  No answer detected — edit this question to set one
                                </div>
                              )}

                              {q.explanation && (
                                <p className="text-sm text-arc-navy-600 mt-2">
                                  <strong>Explanation:</strong> {q.explanation}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4 shrink-0">
                          <button
                            onClick={() => toggleAccept(q.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              q.status === "rejected"
                                ? "bg-arc-slate-100 text-arc-navy-600 hover:bg-green-100 hover:text-green-600"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                            title={q.status === "rejected" ? "Accept question" : "Reject question"}
                          >
                            {q.status === "rejected" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setActiveEditId(q.id)}
                            className="p-2 rounded-lg bg-arc-slate-100 text-arc-slate-600 hover:bg-arc-navy-100 hover:text-arc-navy-700 transition-colors"
                            title="Edit question"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Remove question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
