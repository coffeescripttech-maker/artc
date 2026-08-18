"use client";

import { useState } from "react";
import { CreateEntityModal } from "@/components/admin";
import { HelpCircle, Check, Plus, Trash2 } from "lucide-react";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    stem: string;
    type: string;
    difficulty: string;
    options: Option[];
    explanation?: string;
  }) => Promise<void>;
}

const questionTypes = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
];

const difficulties = [
  { value: "EASY", label: "Easy", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HARD", label: "Hard", color: "text-red-600" },
];

export function QuestionForm({ isOpen, onClose, onSubmit }: QuestionFormProps) {
  const [stem, setStem] = useState("");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
    { id: "3", text: "", isCorrect: false },
    { id: "4", text: "", isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!stem.trim()) {
      setError("Question stem is required");
      return;
    }

    if (type === "MULTIPLE_CHOICE") {
      const filledOptions = options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        setError("At least 2 options are required");
        return;
      }
      if (!options.some((o) => o.isCorrect && o.text.trim())) {
        setError("Please select the correct answer");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        stem,
        type,
        difficulty,
        options: options.filter((o) => o.text.trim()),
        explanation: explanation || undefined,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStem("");
    setType("MULTIPLE_CHOICE");
    setDifficulty("MEDIUM");
    setExplanation("");
    setOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-arc-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-arc-navy-900">Add Question</h2>
              <p className="text-sm text-arc-slate-500">Create a new question for the bank</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-arc-slate-100"
          >
            <span className="text-arc-slate-500 text-xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Question Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-arc-navy-900">
                Question Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {questionTypes.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setType(qt.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      type === qt.value
                        ? "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300 text-arc-slate-600"
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-arc-navy-900">
                Difficulty <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      difficulty === d.value
                        ? `border-arc-orange-400 bg-arc-orange-50 ${d.color}`
                        : "border-arc-slate-200 hover:border-arc-slate-300 text-arc-slate-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Stem */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-arc-navy-900">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="Type your question here..."
                rows={3}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
              />
            </div>

            {/* Options (for Multiple Choice) */}
            {type === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-arc-navy-900">
                    Answer Options <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetCorrect(option.id)}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
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
                          type="button"
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
              </div>
            )}

            {/* True/False specific */}
            {type === "TRUE_FALSE" && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOptions([{ id: "1", text: "True", isCorrect: true }, { id: "2", text: "False", isCorrect: false }])}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      options[0]?.isCorrect
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    True
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions([{ id: "1", text: "True", isCorrect: false }, { id: "2", text: "False", isCorrect: true }])}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      options[1]?.isCorrect
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300"
                    }`}
                  >
                    False
                  </button>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-arc-navy-900">
                Explanation (Optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this is the correct answer..."
                rows={2}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
              />
              <p className="text-xs text-arc-slate-500">
                Students will see this after answering
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-arc-slate-600 hover:text-arc-navy-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-arc-orange-500 text-white rounded-lg text-sm font-medium hover:bg-arc-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionForm;
