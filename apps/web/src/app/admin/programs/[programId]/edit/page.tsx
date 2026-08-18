"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { programsApi } from "@/lib/api/client";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  programType?: string;
  imageUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    programType: "",
    imageUrl: "",
  });

  // Fetch program data
  useEffect(() => {
    fetchProgram();
  }, [programId]);

  const fetchProgram = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const programs = await programsApi.list() as Program[];
      const found = programs.find((p) => p.id === programId);
      if (found) {
        setProgram(found);
        setFormData({
          name: found.name,
          slug: found.slug,
          description: found.description || "",
          programType: found.programType || "",
          imageUrl: found.imageUrl || "",
        });
      } else {
        setError("Program not found");
      }
    } catch (err) {
      console.error("Failed to fetch program:", err);
      setError("Failed to load program");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await programsApi.update(programId, {
        name: formData.name,
        description: formData.description || undefined,
        programType: formData.programType || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
      router.push(`/admin/programs/${programId}`);
    } catch (err: any) {
      console.error("Failed to update program:", err);
      setError(err.message || "Failed to update program");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await programsApi.delete(programId);
      router.push("/admin/programs");
    } catch (err: any) {
      console.error("Failed to delete program:", err);
      setError(err.message || "Failed to delete program");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Program not found</h2>
          <p className="text-arc-slate-500 mb-4">The program you are looking for does not exist.</p>
          <Link href="/admin/programs">
            <Button variant="accent">Back to Programs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Edit Program"
        subtitle={`Editing: ${program.name}`}
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: program.name, href: `/admin/programs/${programId}` },
          { label: "Edit" },
        ]}
      />

      <div className="p-6 max-w-2xl">
        <Link
          href={`/admin/programs/${programId}`}
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Program
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

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-arc-slate-500">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  program.status === "PUBLISHED"
                    ? "bg-green-100 text-green-700"
                    : program.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {program.status}
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., ARC 4-Year College Readiness"
                  required
                  className="w-full"
                />
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
                  placeholder="e.g., arc-4-year-college-readiness"
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>

              {/* Program Type */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Program Type
                </label>
                <Input
                  type="text"
                  value={formData.programType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, programType: e.target.value }))}
                  placeholder="e.g., 4-Year Program, CET Intensive, etc."
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the program..."
                  rows={4}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Program
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <Link href={`/admin/programs/${programId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" variant="accent" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
