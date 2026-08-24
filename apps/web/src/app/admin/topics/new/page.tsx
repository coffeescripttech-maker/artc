"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/admin";
import { topicsApi, modulesApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function NewTopicPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    moduleId: "",
    name: "",
    slug: "",
    description: "",
  });

  // Fetch modules for dropdown
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const data = await modulesApi.list() as Module[];
      setModules(data);
    } catch {
    } finally {
      setIsLoadingModules(false);
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
      await topicsApi.create(formData);
      toast.success("Topic created successfully");
      router.push("/admin/topics");
    } catch (err: any) {
      setError(err.message || "Failed to create topic. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <WorkspaceHeader
        title="Create New Topic"
        subtitle="Add a topic to organize lessons within a module"
        breadcrumbs={[
          { label: "Topics", href: "/admin/topics" },
          { label: "New Topic" },
        ]}
      />

      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/topics"
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
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

              {/* Module */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Module <span className="text-red-500">*</span>
                </label>
                {isLoadingModules ? (
                  <div className="flex items-center gap-2 text-arc-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading modules...
                  </div>
                ) : modules.length === 0 ? (
                  <p className="text-arc-slate-500">
                    No modules found.{" "}
                    <Link href="/admin/modules/new" className="text-arc-orange-500 hover:underline">
                      Create a module first
                    </Link>
                  </p>
                ) : (
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, moduleId: e.target.value }))}
                    required
                    className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 bg-white"
                  >
                    <option value="">Select a module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.subject?.name} › {module.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Introduction to Linear Equations, Photosynthesis"
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
                  placeholder="e.g., introduction-to-linear-equations"
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
                  placeholder="Brief description of the topic..."
                  rows={3}
                  className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-arc-slate-100">
                <Link href="/admin/topics">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSubmitting || !formData.moduleId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Topic
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
