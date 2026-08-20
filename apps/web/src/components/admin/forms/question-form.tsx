"use client";

import { useState, useEffect } from "react";
import { CreateEntityModal, TopicPickerCompact } from "@/components/admin";
import { HelpCircle, Check, Plus, Trash2, GripVertical, BookOpen } from "lucide-react";
import { QUESTION_TYPES, QUESTION_TYPE_META } from "@aratc/shared";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Passage {
  id: string;
  title: string;
}

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    stem: string;
    type: string;
    difficulty: string;
    options: Option[];
    correctAnswer?: unknown;
    explanation?: string;
    passageId?: string;
    topicIds?: string[];
  }) => Promise<void>;
  passages?: Passage[];
  onCreatePassage?: (title: string, content: string) => Promise<{ id: string; title: string }>;
}

const questionTypes = [
  { value: QUESTION_TYPES.MULTIPLE_CHOICE, label: "Multiple Choice", description: "Select one answer" },
  { value: QUESTION_TYPES.TRUE_FALSE, label: "True/False", description: "Select true or false" },
  { value: QUESTION_TYPES.MULTIPLE_SELECT, label: "Multiple Select", description: "Select all that apply" },
  { value: QUESTION_TYPES.FILL_IN_THE_BLANK, label: "Fill in the Blank", description: "Type the answer" },
  { value: QUESTION_TYPES.MATCHING, label: "Matching", description: "Match items correctly" },
  { value: QUESTION_TYPES.ORDERING, label: "Ordering", description: "Arrange in sequence" },
  { value: QUESTION_TYPES.NUMERIC, label: "Numeric", description: "Enter a number" },
  { value: QUESTION_TYPES.ESSAY, label: "Essay", description: "Write a response" },
];

const difficulties = [
  { value: "EASY", label: "Easy", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HARD", label: "Hard", color: "text-red-600" },
];

export function QuestionForm({ isOpen, onClose, onSubmit, passages = [], onCreatePassage }: QuestionFormProps) {
  const [stem, setStem] = useState("");
  const [type, setType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [passageId, setPassageId] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [options, setOptions] = useState<Option[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
    { id: "3", text: "", isCorrect: false },
    { id: "4", text: "", isCorrect: false },
  ]);
  // For NUMERIC type
  const [numericAnswer, setNumericAnswer] = useState("");
  const [numericTolerance, setNumericTolerance] = useState("0");
  // For FILL_IN_THE_BLANK type
  const [fillInTheBlankAnswer, setFillInTheBlankAnswer] = useState("");
  // For ORDERING type - items to arrange
  const [orderingItems, setOrderingItems] = useState<string[]>(["", "", "", ""]);
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

  const handleSetCorrectMultiple = (id: string) => {
    setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id ? !o.isCorrect : o.isCorrect })));
  };

  // ORDERING: reorder items
  const handleOrderingChange = (index: number, value: string) => {
    const newItems = [...orderingItems];
    newItems[index] = value;
    setOrderingItems(newItems);
  };

  const handleAddOrderingItem = () => {
    setOrderingItems([...orderingItems, ""]);
  };

  const handleRemoveOrderingItem = (index: number) => {
    if (orderingItems.length <= 2) return;
    setOrderingItems(orderingItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!stem.trim()) {
      setError("Question stem is required");
      return;
    }

    let correctAnswer: unknown = undefined;
    const validOptions = options.filter((o) => o.text.trim());

    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        if (validOptions.length < 2) {
          setError("At least 2 options are required");
          return;
        }
        if (!options.some((o) => o.isCorrect && o.text.trim())) {
          setError("Please select the correct answer");
          return;
        }
        correctAnswer = options.find((o) => o.isCorrect)?.id;
        break;

      case QUESTION_TYPES.TRUE_FALSE:
        if (!options.some((o) => o.isCorrect)) {
          setError("Please select True or False");
          return;
        }
        correctAnswer = options.find((o) => o.isCorrect)?.text;
        break;

      case QUESTION_TYPES.MULTIPLE_SELECT:
        if (validOptions.length < 2) {
          setError("At least 2 options are required");
          return;
        }
        if (!options.some((o) => o.isCorrect)) {
          setError("Please select at least one correct answer");
          return;
        }
        correctAnswer = options.filter((o) => o.isCorrect).map((o) => o.id);
        break;

      case QUESTION_TYPES.MATCHING:
        if (validOptions.length < 2) {
          setError("At least 2 options are required for matching");
          return;
        }
        correctAnswer = options.map((o) => o.id);
        break;

      case QUESTION_TYPES.ORDERING:
        const filledItems = orderingItems.filter((i) => i.trim());
        if (filledItems.length < 2) {
          setError("At least 2 items are required for ordering");
          return;
        }
        // Store as shuffled array - the correct order is the order entered
        correctAnswer = filledItems;
        break;

      case QUESTION_TYPES.NUMERIC:
        const num = parseFloat(numericAnswer);
        if (isNaN(num)) {
          setError("Please enter a valid number");
          return;
        }
        const tol = parseFloat(numericTolerance) || 0;
        correctAnswer = tol > 0 ? { value: num, tolerance: tol } : num;
        break;

      case QUESTION_TYPES.FILL_IN_THE_BLANK:
        if (!fillInTheBlankAnswer.trim()) {
          setError("Please provide the correct answer for the blank");
          return;
        }
        correctAnswer = fillInTheBlankAnswer.trim();
        break;

      case QUESTION_TYPES.ESSAY:
        // No auto-grading for essays
        break;
    }

    // Validate correctAnswer is provided for gradable types
    const requiresAnswer = type !== QUESTION_TYPES.ESSAY;
    if (requiresAnswer && (correctAnswer === undefined || correctAnswer === null)) {
      setError("Please provide the correct answer for this question type");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        stem,
        type,
        difficulty,
        options: type === QUESTION_TYPES.ORDERING
          ? orderingItems.filter((i) => i.trim()).map((text, i) => ({ id: String(i + 1), text, isCorrect: true }))
          : validOptions,
        correctAnswer,
        explanation: explanation || undefined,
        passageId: passageId || undefined,
        topicIds,
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
    setType(QUESTION_TYPES.MULTIPLE_CHOICE);
    setDifficulty("MEDIUM");
    setExplanation("");
    setPassageId("");
    setTopicIds([]);
    setOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false },
    ]);
    setNumericAnswer("");
    setNumericTolerance("0");
    setFillInTheBlankAnswer("");
    setOrderingItems(["", "", "", ""]);
  };

  // Reset options when type changes
  useEffect(() => {
    if (type === QUESTION_TYPES.TRUE_FALSE) {
      setOptions([
        { id: "1", text: "True", isCorrect: true },
        { id: "2", text: "False", isCorrect: false },
      ]);
    } else if (type === QUESTION_TYPES.ORDERING) {
      setOptions([]);
    } else if (type === QUESTION_TYPES.NUMERIC) {
      setOptions([]);
    } else if (type === QUESTION_TYPES.ESSAY) {
      setOptions([]);
    } else {
      setOptions([
        { id: "1", text: "", isCorrect: true },
        { id: "2", text: "", isCorrect: false },
        { id: "3", text: "", isCorrect: false },
        { id: "4", text: "", isCorrect: false },
      ]);
    }
  }, [type]);

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {questionTypes.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setType(qt.value as any)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                      type === qt.value
                        ? "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-700"
                        : "border-arc-slate-200 hover:border-arc-slate-300 text-arc-slate-600"
                    }`}
                  >
                    <div>{qt.label}</div>
                    <div className="text-[10px] opacity-70">{qt.description}</div>
                  </button>
                ))}
              </div>
              {!QUESTION_TYPE_META[type as keyof typeof QUESTION_TYPE_META]?.autoGradable && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ This question type requires manual grading
                </p>
              )}
            </div>

            {/* Passage Selector */}
            {passages.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Link to Passage (Optional)
                </label>
                <select
                  value={passageId}
                  onChange={(e) => setPassageId(e.target.value)}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                >
                  <option value="">No passage (standalone question)</option>
                  {passages.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Topic Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-arc-navy-900">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Link to Topics (Optional)
              </label>
              <p className="text-xs text-arc-slate-500 mb-2">
                Link this question to curriculum topics for auto-generation
              </p>
              <TopicPickerCompact
                selectedTopicIds={topicIds}
                onChange={setTopicIds}
              />
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
                placeholder={
                  type === QUESTION_TYPES.FILL_IN_THE_BLANK
                    ? "Type your question with _____ for the blank..."
                    : "Type your question here..."
                }
                rows={3}
                className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
               />
            </div>

            {/* Fill in the Blank answer input */}
            {type === QUESTION_TYPES.FILL_IN_THE_BLANK && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fillInTheBlankAnswer}
                  onChange={(e) => setFillInTheBlankAnswer(e.target.value)}
                  placeholder="Type the correct answer..."
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                />
                <p className="text-xs text-arc-slate-500">
                  Enter the exact answer students should provide.
                </p>
              </div>
            )}
            {(type === QUESTION_TYPES.MULTIPLE_CHOICE || type === QUESTION_TYPES.MULTIPLE_SELECT || type === QUESTION_TYPES.MATCHING) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-arc-navy-900">
                    Answer Options <span className="text-red-500">*</span>
                    {type === QUESTION_TYPES.MULTIPLE_SELECT && (
                      <span className="text-xs text-arc-slate-500 ml-2">(select all correct)</span>
                    )}
                    {type === QUESTION_TYPES.MATCHING && (
                      <span className="text-xs text-arc-slate-500 ml-2">(drag to reorder)</span>
                    )}
                  </label>
                  {type !== QUESTION_TYPES.MATCHING && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      {type === QUESTION_TYPES.MATCHING && (
                        <GripVertical className="h-5 w-5 text-arc-slate-400 cursor-grab" />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          type === QUESTION_TYPES.MULTIPLE_SELECT
                            ? handleSetCorrectMultiple(option.id)
                            : handleSetCorrect(option.id)
                        }
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
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
                      {options.length > 2 && type !== QUESTION_TYPES.MATCHING && (
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
                  {type === QUESTION_TYPES.MULTIPLE_SELECT
                    ? "Click to toggle correct answers"
                    : "Click the circle to mark the correct answer"}
                </p>
              </div>
            )}

            {/* True/False specific */}
            {type === QUESTION_TYPES.TRUE_FALSE && (
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

            {/* Ordering specific */}
            {type === QUESTION_TYPES.ORDERING && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-arc-navy-900">
                    Items to Arrange <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOrderingItem}
                    className="text-sm text-arc-orange-600 hover:text-arc-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                <p className="text-xs text-arc-slate-500">
                  Enter items in the <strong>correct order</strong>. Students will need to arrange them correctly.
                </p>
                <div className="space-y-2">
                  {orderingItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-arc-slate-100 flex items-center justify-center text-sm font-medium text-arc-slate-600 shrink-0">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleOrderingChange(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                      />
                      {orderingItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderingItem(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numeric specific */}
            {type === QUESTION_TYPES.NUMERIC && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-arc-navy-900">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="any"
                      value={numericAnswer}
                      onChange={(e) => setNumericAnswer(e.target.value)}
                      placeholder="e.g., 42"
                      className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                    />
                    <p className="text-xs text-arc-slate-500 mt-1">The correct numerical value</p>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={numericTolerance}
                      onChange={(e) => setNumericTolerance(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
                    />
                    <p className="text-xs text-arc-slate-500 mt-1">± tolerance (optional)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Essay specific */}
            {type === QUESTION_TYPES.ESSAY && (
              <div className="p-4 bg-arc-slate-50 rounded-lg border border-arc-slate-200">
                <p className="text-sm text-arc-slate-600">
                  <strong>Note:</strong> Essay questions require manual grading. Students will see a text area to write their response.
                </p>
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
