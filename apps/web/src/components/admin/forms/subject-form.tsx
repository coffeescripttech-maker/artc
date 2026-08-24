"use client";

import { useState } from "react";
import { Input, Button, Card, CardContent } from "@/components/ui";
import { Sparkles, X, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";

// Subject colors
const subjectColors = [
  { id: "blue", bg: "bg-blue-50", border: "border-blue-200", hex: "#3B82F6" },
  { id: "purple", bg: "bg-purple-50", border: "border-purple-200", hex: "#8B5CF6" },
  { id: "green", bg: "bg-green-50", border: "border-green-200", hex: "#22C55E" },
  { id: "orange", bg: "bg-orange-50", border: "border-orange-200", hex: "#F97316" },
  { id: "red", bg: "bg-red-50", border: "border-red-200", hex: "#EF4444" },
  { id: "pink", bg: "bg-pink-50", border: "border-pink-200", hex: "#EC4899" },
];

interface SubjectFormProps {
  onSubmit: (data: {
    name: string;
    slug: string;
    code: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

/**
 * SubjectForm - Standalone form for creating subjects.
 * Used inside modals and pages. Does NOT manage its own modal state.
 */
export function SubjectForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Subject",
  isLoading = false,
}: SubjectFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = localSubmitting || isLoading;

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
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
        code,
        description: description || undefined,
        color: selectedColor,
      });
      // Reset form on success
      setName("");
      setSlug("");
      setCode("");
      setDescription("");
      setSelectedColor("blue");
    } catch (err: any) {
      setError(err.message || "Failed to create subject");
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

      {/* Subject Name */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Subject Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Mathematics"
          required
          className="w-full"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Slug <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="e.g., mathematics"
          required
          pattern="^[a-z0-9-]+$"
          className="w-full"
        />
        <p className="text-xs text-arc-slate-500 mt-1">
          URL-friendly identifier (auto-generated from name)
        </p>
      </div>

      {/* Subject Code */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Subject Code <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g., MATH"
          required
          className="w-full"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this subject covers..."
          rows={3}
          className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
        />
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-arc-navy-900 mb-1.5">
          Color
        </label>
        <div className="flex gap-2">
          {subjectColors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setSelectedColor(color.id)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                selectedColor === color.id
                  ? "border-arc-navy-900 scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.id}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="accent"
          disabled={isSubmitting || !name.trim() || !code.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * SubjectFormModal - Full modal with TwoChoiceModal pattern.
 * For backwards compatibility with existing usage.
 */
export function SubjectFormModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    code: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null;

  if (!showForm) {
    // TwoChoiceModal would be shown here - simplified for now
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">
              Create New Subject
            </h2>
            <p className="text-arc-slate-600 mb-6">
              Define a brand-new subject for your curriculum.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="accent" onClick={() => setShowForm(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-arc-navy-900">
              Create New Subject
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SubjectForm
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel="Create Subject"
          />
        </div>
      </div>
    </div>
  );
}

export default SubjectForm;
