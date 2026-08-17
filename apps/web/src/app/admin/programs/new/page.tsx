"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { EDUCATIONAL_STAGES, GRADE_LEVELS } from "@aratc/shared";
import { DashboardHeader } from "@/components/dashboard";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Toaster,
} from "@/components/ui";
import { ArrowLeft, Layers } from "lucide-react";

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<string>("BASIC_EDUCATION");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [status, setStatus] = useState<string>("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/api/programs", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description,
          stage,
          gradeLevel: gradeLevel || undefined,
          status,
        }),
      });
      router.push("/admin/programs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create program");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DashboardHeader title="Create Program" subtitle="Add a new educational program to the platform" />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-2 text-sm text-arc-slate-500 hover:text-arc-navy-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to programs
          </Link>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="shadow-arc-md">
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
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                    }
                    placeholder="e.g., grade-7-mathematics"
                    className="border-arc-slate-200 focus:border-arc-navy-500"
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-arc-slate-500">
                    Lowercase letters, numbers, and hyphens only.
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
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger id="stage" className="border-arc-slate-200 focus:ring-arc-navy-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(EDUCATIONAL_STAGES).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel" className="text-sm font-semibold text-arc-navy-900">Grade Level</Label>
                    <Select value={gradeLevel || "none"} onValueChange={setGradeLevel}>
                      <SelectTrigger id="gradeLevel" className="border-arc-slate-200 focus:ring-arc-navy-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Object.keys(GRADE_LEVELS).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-arc-navy-900">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="border-arc-slate-200 focus:ring-arc-navy-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-arc-slate-100 bg-arc-slate-50">
                <Button variant="outline" asChild className="border-arc-slate-200">
                  <Link href="/admin/programs">Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading} variant="accent" className="shadow-lg shadow-arc-orange-500/20">
                  {loading ? "Creating..." : "Create Program"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
      <Toaster />
    </>
  );
}
