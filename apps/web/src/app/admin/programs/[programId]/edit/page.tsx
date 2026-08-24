"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { PageLoader, ErrorEmpty } from "@/components/branding";
import { EDUCATIONAL_STAGES } from "@aratc/shared";
import { programsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import { Button, Input, Card, CardContent, Badge } from "@/components/ui";
import {
  ArrowLeft,
  Save,
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

function titleCaseKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    stage: "",
    imageUrl: "",
  });

  // Track dirty state for unsaved-changes warning
  const isDirty = program
    ? formData.name !== program.name ||
      formData.slug !== program.slug ||
      formData.description !== (program.description || "") ||
      formData.stage !== (program.programType || "") ||
      formData.imageUrl !== (program.imageUrl || "")
    : false;

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const fetchProgram = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setNotFound(false);
    try {
      const found = (await programsApi.getById(programId)) as Program;
      setProgram(found);
      setFormData({
        name: found.name,
        slug: found.slug,
        description: found.description || "",
        stage: found.programType || "",
        imageUrl: found.imageUrl || "",
      });
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugEdited(true);
    setFormData((prev) => ({ ...prev, slug: slug.toLowerCase() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await programsApi.update(programId, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        stage: (formData.stage as keyof typeof EDUCATIONAL_STAGES) || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
      toast.success("Program updated successfully");
      router.push(`/admin/programs/${programId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update program");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await programsApi.delete(programId);
    toast.success("Program deleted");
    router.push("/admin/programs");
  };

  if (isLoading) {
    return <PageLoader text="Loading program..." />;
  }

  if (loadError) {
    return <ErrorEmpty onRetry={fetchProgram} />;
  }

  if (notFound || !program) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Program not found</h2>
        <p className="text-arc-slate-500 mb-4">
          The program you are looking for does not exist or has been removed.
        </p>
        <Link href="/admin/programs">
          <Button variant="accent">Back to Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader
        title="Edit Program"
        subtitle={`Editing: ${program.name}`}
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: program.name, href: `/admin/programs/${programId}` },
          { label: "Edit" },
        ]}
        badge={program.status}
        badgeVariant={
          program.status === "PUBLISHED"
            ? "published"
            : program.status === "ARCHIVED"
            ? "archived"
            : "draft"
        }
        actions={
          <Link href={`/admin/programs/${programId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
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
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g., arc-4-year-college-readiness"
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full"
                />
                <p className="text-xs text-arc-slate-500 mt-1">
                  URL-friendly identifier. Auto-generated from name unless edited manually.
                </p>
              </div>

              {/* Educational Stage (dropdown) */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Educational Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                >
                  <option value="">Select a stage...</option>
                  {Object.keys(EDUCATIONAL_STAGES).map((key) => (
                    <option key={key} value={key}>
                      {titleCaseKey(key)}
                    </option>
                  ))}
                </select>
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
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Program
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
                        <span className="h-4 w-4 mr-2 inline-block border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Program"
        description={
          <>
            Are you sure you want to delete <strong>{program.name}</strong>? This will permanently
            remove the program and all associated curriculums, assessments, and enrollments. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete Program"
        busyLabel="Deleting..."
        variant="danger"
      />
    </>
  );
}
