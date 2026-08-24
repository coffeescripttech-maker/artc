"use client";

import { useState, useEffect } from "react";
import { WorkspaceHeader, ConfirmModal } from "@/components/admin";
import { passagesApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { TableSkeleton, NoResultsEmpty, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  ExternalLink,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Passage {
  id: string;
  title: string;
  content: string;
  status: string;
  sourceUrl?: string | null;
  createdAt: string;
  _count?: { questions: number };
}

interface PassageFormData {
  title: string;
  content: string;
  sourceUrl: string;
  status: "DRAFT" | "PUBLISHED";
}

export default function PassagesPage() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [viewingPassage, setViewingPassage] = useState<Passage | null>(null);
  const [formData, setFormData] = useState<PassageFormData>({
    title: "",
    content: "",
    sourceUrl: "",
    status: "DRAFT",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Passage | null>(null);

  useEffect(() => {
    fetchPassages();
  }, []);

  const fetchPassages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passagesApi.list() as Passage[];
      setPassages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load passages");
      setPassages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingPassage) {
        await passagesApi.update(editingPassage.id, formData);
        toast.success("Passage updated successfully");
      } else {
        await passagesApi.create(formData);
        toast.success("Passage created successfully");
      }
      resetForm();
      await fetchPassages();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save passage");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await passagesApi.delete(deleteTarget.id);
      await fetchPassages();
      toast.success("Passage deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete passage");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await passagesApi.publish(id);
      await fetchPassages();
      toast.success("Passage published successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish passage");
    }
  };

  const openEdit = (passage: Passage) => {
    setEditingPassage(passage);
    setFormData({
      title: passage.title,
      content: passage.content,
      sourceUrl: passage.sourceUrl || "",
      status: passage.status as "DRAFT" | "PUBLISHED",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPassage(null);
    setFormData({ title: "", content: "", sourceUrl: "", status: "DRAFT" });
    setError(null);
  };

  const filteredPassages = passages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-green-100 text-green-700",
    DRAFT: "bg-yellow-100 text-yellow-700",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };

  return (
    <>
      <WorkspaceHeader
        title="Reading Passages"
        subtitle="Create and manage reading passages for comprehension questions"
        actions={
          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Passage
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPassages}>
              Retry
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{passages.length}</div>
                <div className="text-sm text-arc-slate-500">Total Passages</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {passages.filter((p) => p.status === "PUBLISHED").length}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {passages.reduce((sum, p) => sum + (p._count?.questions || 0), 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Linked Questions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              placeholder="Search passages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
        </div>

        {/* Passages List */}
        <Card>
          <CardContent className="p-0">
            {/* Loading skeleton */}
            {isLoading && <TableSkeleton />}

            {/* Passages */}
            {!isLoading && (
              <div className="divide-y divide-arc-slate-100">
                {filteredPassages.map((passage) => (
                  <div
                    key={passage.id}
                    className="p-4 hover:bg-arc-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Passage content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusColors[passage.status] || "bg-gray-100 text-gray-700"}>
                            {passage.status}
                          </Badge>
                          {passage._count && (
                            <Badge variant="outline">{passage._count.questions} questions</Badge>
                          )}
                        </div>

                        <p className="text-arc-navy-900 font-medium line-clamp-2 mb-2">
                          {passage.title}
                        </p>

                        <p className="text-sm text-arc-slate-500 line-clamp-1">
                          {passage.content.slice(0, 100)}...
                        </p>

                        {passage.sourceUrl && (
                          <a
                            href={passage.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-arc-blue-600 hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Source
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingPassage(passage)}
                          className="p-1.5 hover:bg-arc-slate-100 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-arc-slate-500" />
                        </button>
                        <button
                          onClick={() => openEdit(passage)}
                          className="p-1.5 hover:bg-arc-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-arc-slate-500" />
                        </button>
                        {passage.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handlePublish(passage.id)}
                            className="p-1.5 hover:bg-green-50 rounded"
                            title="Publish"
                          >
                            <Badge variant="success" className="text-xs cursor-pointer">
                              Publish
                            </Badge>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(passage)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPassages.length === 0 && (
              <div className="py-8">
                {searchQuery ? (
                  <NoResultsEmpty query={searchQuery} />
                ) : (
                  <NoDataEmpty
                    title="No Passages Yet"
                    description="Create your first reading passage to get started."
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200">
              <h2 className="text-lg font-bold text-arc-navy-900">
                {editingPassage ? "Edit Passage" : "New Passage"}
              </h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-arc-slate-100">
                <span className="text-xl text-arc-slate-500">&times;</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-arc-navy-900 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., The Water Cycle"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-arc-navy-900 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Paste or type the reading passage content..."
                    rows={10}
                    className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-arc-navy-900 mb-1">
                    Source URL (Optional)
                  </label>
                  <Input
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={saving}>
                  {saving ? "Saving..." : editingPassage ? "Update" : "Create"} Passage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-arc-navy-900">{viewingPassage.title}</h2>
                <Badge className={statusColors[viewingPassage.status] || "bg-gray-100 text-gray-700"}>
                  {viewingPassage.status}
                </Badge>
              </div>
              <button
                onClick={() => setViewingPassage(null)}
                className="p-2 rounded-lg hover:bg-arc-slate-100"
              >
                <span className="text-xl text-arc-slate-500">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <p className="whitespace-pre-wrap text-arc-slate-700 leading-relaxed">
                {viewingPassage.content}
              </p>
              {viewingPassage.sourceUrl && (
                <div className="mt-4 pt-4 border-t border-arc-slate-200">
                  <a
                    href={viewingPassage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-arc-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View original source
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Passage"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Passage"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
