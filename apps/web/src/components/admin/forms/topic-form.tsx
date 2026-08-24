"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";

interface TopicFormProps {
  onSubmit: (data: { name: string; slug: string; description: string; moduleId?: string; subjectId?: string }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  moduleId?: string;
  subjectId?: string;
}

/**
 * TopicForm - Form for creating topics.
 * Used inside modals. Does NOT manage its own modal state.
 */
export function TopicForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Topic",
  isLoading = false,
  moduleId: propModuleId,
  subjectId: propSubjectId,
}: TopicFormProps) {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = localSubmitting || isLoading;

  // Get IDs from props or URL params
  const moduleId = propModuleId || searchParams.get("moduleId") || undefined;
  const subjectId = propSubjectId || searchParams.get("subjectId") || undefined;

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name,
        slug,
        description,
        moduleId,
        subjectId,
      });
      // Reset form on success
      setName("");
      setSlug("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create topic");
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

      {/* Topic Name */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Topic Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Linear Equations"
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
          placeholder="e.g., linear-equations"
          required
          pattern="^[a-z0-9-]+$"
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
        />
        <p className="text-xs text-arc-slate-500 mt-1">
          URL-friendly identifier (auto-generated from name)
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this topic covers..."
          rows={3}
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
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
          disabled={isSubmitting || !name.trim()}
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

export default TopicForm;
