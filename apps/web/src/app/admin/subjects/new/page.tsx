"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { subjectsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

const colorOptions = [
  { name: "blue", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-600", label: "Blue" },
  { name: "purple", bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-600", label: "Purple" },
  { name: "green", bg: "bg-green-100", border: "border-green-300", text: "text-green-600", label: "Green" },
  { name: "orange", bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-600", label: "Orange" },
  { name: "red", bg: "bg-red-100", border: "border-red-300", text: "text-red-600", label: "Red" },
  { name: "yellow", bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-600", label: "Yellow" },
];

function generateCode(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) {
    return name.substring(0, 3).toUpperCase();
  }
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function NewSubjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    code: "",
    description: "",
    color: "blue",
    icon: "📚",
  });

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    const code = generateCode(name);
    setFormData((prev) => ({ ...prev, name, slug, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await subjectsApi.create(formData);
      toast.success("Subject created successfully");
      router.push("/admin/subjects");
    } catch (err: any) {
      setError(err.message || "Failed to create subject. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Create New Subject"
        subtitle="Add a reusable subject that can be used across multiple programs"
        breadcrumbs={[
          { label: "Subjects", href: "/admin/subjects" },
          { label: "New Subject" },
        ]}
      />

      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/subjects"
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subjects
        </Link>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Mathematics, English, Science"
                  required
                  className="w-full"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Subject Code
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., MATH, ENG, SCI"
                  maxLength={5}
                  className="w-32"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  Short code for display (auto-generated from name)
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  placeholder="e.g., mathematics"
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the subject..."
                  rows={3}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: color.name }))}
                      className={`h-10 w-10 rounded-lg ${color.bg} flex items-center justify-center transition-all ${
                        formData.color === color.name
                          ? `ring-2 ring-offset-2 ring-arc-orange-500 ${color.border}`
                          : "hover:scale-110"
                      }`}
                      title={color.label}
                    >
                      <span className="text-lg">{formData.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Preview */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Icon (Emoji)
                </label>
                <Input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="📚"
                  maxLength={2}
                  className="w-20 text-center text-2xl"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-arc-slate-100">
                <Link href="/admin/subjects">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="accent" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Subject
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
