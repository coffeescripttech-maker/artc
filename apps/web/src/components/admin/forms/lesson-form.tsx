"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Video, BookOpen, Edit, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";

interface LessonFormProps {
  onSubmit: (data: {
    title: string;
    slug: string;
    description: string;
    type: string;
    topicId?: string;
    moduleId?: string;
    subjectId?: string;
    durationMinutes?: number;
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  topicId?: string;
  moduleId?: string;
  subjectId?: string;
}

const lessonTypes = [
  { value: "VIDEO", label: "Video", icon: Video, description: "Video-based lesson" },
  { value: "ARTICLE", label: "Article", icon: FileText, description: "Text-based lesson" },
  { value: "MIXED", label: "Mixed", icon: BookOpen, description: "Video + text combined" },
  { value: "PRACTICE", label: "Practice", icon: Edit, description: "Practice exercises" },
];

/**
 * LessonForm - Standalone form for creating lessons.
 * Used inside modals and pages. Does NOT manage its own modal state.
 */
export function LessonForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Lesson",
  isLoading = false,
  topicId: propTopicId,
  moduleId: propModuleId,
  subjectId: propSubjectId,
}: LessonFormProps) {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("VIDEO");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = localSubmitting || isLoading;

  // Get IDs from props or URL params
  const topicId = propTopicId || searchParams.get("topicId") || undefined;
  const moduleId = propModuleId || searchParams.get("moduleId") || undefined;
  const subjectId = propSubjectId || searchParams.get("subjectId") || undefined;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title,
        slug,
        description,
        type: selectedType,
        topicId,
        moduleId,
        subjectId,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      });
      // Reset form on success
      setTitle("");
      setSlug("");
      setDescription("");
      setSelectedType("VIDEO");
      setDurationMinutes("");
    } catch (err: any) {
      setError(err.message || "Failed to create lesson");
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Lesson Title */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Lesson Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Introduction to Linear Equations"
          required
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="e.g., introduction-to-linear-equations"
          required
          pattern="^[a-z0-9-]+$"
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        />
        <p className="text-xs text-arc-slate-500 mt-1">
          URL-friendly identifier (auto-generated from title)
        </p>
      </div>

      {/* Lesson Type */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-2">
          Lesson Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {lessonTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-arc-orange-400 bg-arc-orange-50"
                    : "border-arc-slate-200 hover:border-arc-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-arc-orange-200" : "bg-arc-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-arc-orange-600" : "text-arc-slate-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isSelected ? "text-arc-orange-700" : "text-arc-navy-900"
                      }`}
                    >
                      {type.label}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this lesson..."
          rows={2}
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="e.g., 15"
          min="1"
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-arc-slate-600 hover:text-arc-navy-900 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-arc-orange-500 hover:bg-arc-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Separate component for lesson type selection
interface LessonTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

export function LessonTypeSelector({ value, onChange }: LessonTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-arc-navy-900">
        Lesson Type <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {lessonTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-arc-orange-400 bg-arc-orange-50"
                  : "border-arc-slate-200 hover:border-arc-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-arc-orange-200" : "bg-arc-slate-100"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isSelected ? "text-arc-orange-600" : "text-arc-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <div
                    className={`font-medium ${
                      isSelected ? "text-arc-orange-700" : "text-arc-navy-900"
                    }`}
                  >
                    {type.label}
                  </div>
                  <div className="text-xs text-arc-slate-500">{type.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LessonForm;
