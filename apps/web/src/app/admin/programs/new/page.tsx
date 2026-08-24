"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EDUCATIONAL_STAGES, GRADE_LEVELS } from "@aratc/shared";
import { WorkspaceHeader } from "@/components/admin";
import { ButtonLoader } from "@/components/branding";
import { programsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { ArrowLeft, Layers } from "lucide-react";

function titleCaseKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<string>("BASIC_EDUCATION");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(value.toLowerCase().replace(/\s+/g, "-"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await programsApi.create({
        name,
        slug,
        description,
        stage,
        gradeLevel: gradeLevel || undefined,
      });
      toast.success("Program created successfully");
      router.push("/admin/programs");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create program";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <WorkspaceHeader
        title="Create Program"
        subtitle="Add a new educational program to the platform"
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: "New Program" },
        ]}
        actions={
          <Link href="/admin/programs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="shadow-md">
              <CardHeader className="border-b border-arc-slate-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-arc-orange-600" />
                  </div>
                  Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-arc-navy-900">Program Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Grade 7 Mathematics"
                    className="border-arc-slate-200 focus:border-arc-navy-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-semibold text-arc-navy-900">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., grade-7-mathematics"
                    className="border-arc-slate-200 focus:border-arc-navy-500"
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-arc-slate-500">
                    Lowercase letters, numbers, and hyphens only. Auto-generated from name unless edited.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-arc-navy-900">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the program..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stage" className="text-sm font-semibold text-arc-navy-900">Educational Stage</Label>
                    <select
                      id="stage"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                    >
                      {Object.keys(EDUCATIONAL_STAGES).map((key) => (
                        <option key={key} value={key}>
                          {titleCaseKey(key)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel" className="text-sm font-semibold text-arc-navy-900">Grade Level</Label>
                    <select
                      id="gradeLevel"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                    >
                      <option value="">None</option>
                      {Object.keys(GRADE_LEVELS).map((key) => (
                        <option key={key} value={key}>
                          {titleCaseKey(key)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-arc-slate-50 border border-arc-slate-200 p-3">
                  <p className="text-xs text-arc-slate-600">
                    New programs are created as <strong>Draft</strong> and can be published after setup.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-arc-slate-100 bg-arc-slate-50">
                <Button variant="outline" asChild className="border-arc-slate-200">
                  <Link href="/admin/programs">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="accent"
                  className="shadow-lg shadow-arc-orange-500/20"
                >
                  {loading ? (
                    <>
                      <ButtonLoader className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Program"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
}
