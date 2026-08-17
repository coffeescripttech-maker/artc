"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { EDUCATIONAL_STAGES, GRADE_LEVELS } from "@aratc/shared";
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
} from "@aratc/ui";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Program</h1>
        <Link
          href="/admin/programs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to programs
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 7 Mathematics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="e.g., grade-7-mathematics"
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the program..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Educational Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger id="stage">
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
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select value={gradeLevel || "none"} onValueChange={setGradeLevel}>
                  <SelectTrigger id="gradeLevel">
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
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/programs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Program"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Toaster />
    </div>
  );
}
