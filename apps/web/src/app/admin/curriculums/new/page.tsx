"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { curriculumApi, programsApi } from "@/lib/api/client";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
}

const educationalStages = [
  { value: "BASIC_EDUCATION", label: "Basic Education" },
  { value: "ENTRANCE_EXAM", label: "Entrance Exam" },
  { value: "COLLEGE", label: "College" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "BOARD_EXAM", label: "Board Exam" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "CONTINUING_EDUCATION", label: "Continuing Education" },
];

const gradeLevels = [
  { value: "GRADE_1", label: "Grade 1" },
  { value: "GRADE_2", label: "Grade 2" },
  { value: "GRADE_3", label: "Grade 3" },
  { value: "GRADE_4", label: "Grade 4" },
  { value: "GRADE_5", label: "Grade 5" },
  { value: "GRADE_6", label: "Grade 6" },
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
  { value: "FIRST_YEAR", label: "First Year College" },
  { value: "SECOND_YEAR", label: "Second Year College" },
  { value: "THIRD_YEAR", label: "Third Year College" },
  { value: "FOURTH_YEAR", label: "Fourth Year College" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function NewCurriculumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get programId from URL if present
  const urlProgramId = searchParams.get("programId");

  const [formData, setFormData] = useState({
    programId: urlProgramId || "",
    name: "",
    slug: "",
    description: "",
    stage: "BASIC_EDUCATION",
    gradeLevel: "",
  });

  // Fetch programs for dropdown
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const data = await programsApi.list() as Program[];
      setPrograms(data);
      // If URL has programId, pre-select it
      if (urlProgramId && data.length > 0) {
        const found = data.find((p) => p.id === urlProgramId);
        if (found) {
          setFormData((prev) => ({ ...prev, programId: found.id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Token is automatically retrieved from localStorage by apiFetch
      const payload = {
        programId: formData.programId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        stage: formData.stage,
        gradeLevel: formData.gradeLevel || undefined,
      };
      await curriculumApi.create(payload);
      // Redirect to the program page with curriculum tab selected
      if (formData.programId) {
        router.push(`/admin/programs/${formData.programId}?tab=curriculum`);
      } else {
        router.push("/admin/curriculums");
      }
    } catch (err: any) {
      console.error("Failed to create curriculum:", err);
      setError(err.message || "Failed to create curriculum. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProgram = programs.find((p) => p.id === formData.programId);
  const breadcrumbs = selectedProgram
    ? [
        { label: "Programs", href: "/admin/programs" },
        { label: selectedProgram.name, href: `/admin/programs/${selectedProgram.id}?tab=curriculum` },
        { label: "New Curriculum" },
      ]
    : [
        { label: "Curriculums", href: "/admin/curriculums" },
        { label: "New Curriculum" },
      ];

  return (
    <>
      <WorkspaceHeader
        title="Create New Curriculum"
        subtitle="Add a curriculum to define learning paths within a program"
        breadcrumbs={breadcrumbs}
      />

      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/curriculums"
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Curriculums
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

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                {isLoadingPrograms ? (
                  <div className="flex items-center gap-2 text-arc-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading programs...
                  </div>
                ) : programs.length === 0 ? (
                  <p className="text-arc-slate-500">
                    No programs found.{" "}
                    <Link href="/admin/programs/new" className="text-arc-orange-500 hover:underline">
                      Create a program first
                    </Link>
                  </p>
                ) : (
                  <select
                    value={formData.programId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, programId: e.target.value }))}
                    required
                    className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Curriculum Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Grade 9 Foundation, CET Intensive"
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
                  placeholder="e.g., grade-9-foundation"
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
                  placeholder="Brief description of the curriculum..."
                  rows={3}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Educational Stage <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value }))}
                  required
                  className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                >
                  {educationalStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Grade Level
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gradeLevel: e.target.value }))}
                  className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                >
                  <option value="">Select grade level (optional)</option>
                  {gradeLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-arc-slate-100">
                <Link href="/admin/curriculums">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting || !formData.programId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Curriculum
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
