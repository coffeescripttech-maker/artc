"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
}

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  icon?: React.ReactNode;
}

export function CreateEntityModal({
  isOpen,
  onClose,
  title,
  entityName,
  fields,
  onSubmit,
  icon,
}: CreateEntityModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${entityName}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-arc-navy-900">{title}</h2>
              <p className="text-sm text-arc-slate-500">Create a new {entityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-arc-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-arc-navy-900"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    required={field.required}
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 focus:border-transparent resize-none"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-arc-orange-500 focus:border-transparent"
                  >
                    <option value="">Select {field.label}...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting}
            >
              {isSubmitting ? `Creating ${entityName}...` : `Create ${entityName}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEntityModal;
