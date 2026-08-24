"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, DraggableList, type DraggableItem, ModuleForm, ConfirmModal } from "@/components/admin";
import { subjectsApi, modulesApi } from "@/lib/api/client";
import { PageLoader, NoDataEmpty, ErrorEmpty } from "@/components/branding";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { toast } from "@/lib/toast";
import {
  Plus,
  BookOpen,
  FileText,
  Trash2,
  Layers,
  ArrowRight,
  GripVertical,
  Send,
  AlertCircle,
} from "lucide-react";

// Types
interface Subject {
  id: string;
  name: string;
  slug: string;
  code?: string;
  icon?: string;
  color?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  description?: string;
  _count?: {
    modules: number;
    lessons: number;
    questions: number;
    assessments: number;
  };
}

interface Module {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: { topics: number; lessons: number };
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);

  // Fetch subject and modules
  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjectData, modulesData] = await Promise.all([
        subjectsApi.getById(subjectId),
        modulesApi.list(subjectId),
      ]);

      setSubject(subjectData as Subject);
      setModules(Array.isArray(modulesData) ? (modulesData as Module[]) : []);
    } catch (err) {
      setError("Failed to load subject data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async (data: {
    name: string;
    description: string;
    subjectId?: string;
  }) => {
    try {
      const newModule = await modulesApi.create({
        name: data.name,
        subjectId: data.subjectId || subjectId,
        description: data.description,
      });
      setModules([...modules, newModule as Module]);
      setShowModuleForm(false);
      toast.success("Module created successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create module. Please try again.");
    }
  };

  const handleDeleteModule = (module: Module) => {
    setDeleteTarget(module);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await modulesApi.delete(deleteTarget.id);
      setModules(modules.filter((m) => m.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.name}" successfully`);
    } catch (err: any) {
      const msg = err?.message || "Failed to delete module. Please try again.";
      toast.error(msg);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Convert modules to DraggableItem format
  const moduleItems: DraggableItem[] = modules.map((module) => ({
    id: module.id,
    title: module.name,
    subtitle: `${module._count?.topics || 0} Topics • ${module._count?.lessons || 0} Lessons`,
    badge: module.status,
    badgeVariant: (module.status === "PUBLISHED" ? "success" : module.status === "DRAFT" ? "warning" : "default") as "success" | "warning" | "default",
    onClick: () => router.push(`/admin/modules/${module.id}`),
    onEdit: () => router.push(`/admin/modules/${module.id}`),
    onDelete: () => handleDeleteModule(module),
  }));

  const handleReorderModules = async (reorderedItems: DraggableItem[]) => {
    // Update local state with new order
    const reorderedModules = reorderedItems.map((item, index) => {
      const module = modules.find((m) => m.id === item.id);
      return module ? { ...module, orderIndex: index } : null;
    }).filter(Boolean) as Module[];

    setModules(reorderedModules);

    // Save the new order
    setIsSaving(true);
    try {
      await modulesApi.reorder(
        subjectId,
        reorderedItems.map((i) => i.id),
      );
      toast.success("Module order saved");
    } catch (err) {
      toast.error("Failed to save module order. Please try again.");
      fetchData(); // Reload to revert
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishAllModules = async () => {
    const draftModules = modules.filter((m) => m.status !== "PUBLISHED");
    if (draftModules.length === 0) return;

    setIsPublishing(true);
    try {
      await Promise.all(
        draftModules.map((m) => modulesApi.publish(m.id)),
      );
      setModules(modules.map((m) =>
        m.status !== "PUBLISHED" ? { ...m, status: "PUBLISHED" as const } : m,
      ));
      toast.success(`Published ${draftModules.length} modules`);
    } catch (err) {
      toast.error("Failed to publish modules");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      if (newStatus === "PUBLISHED") {
        await modulesApi.publish(moduleId);
      } else {
        await modulesApi.archive(moduleId);
      }
      setModules(modules.map((m) =>
        m.id === moduleId ? { ...m, status: newStatus as Module["status"] } : m,
      ));
      toast.success(`Module ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
    } catch (err) {
      toast.error("Failed to update module status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorEmpty onRetry={fetchData} />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <NoDataEmpty
          title="Subject Not Found"
          description="The subject you're looking for doesn't exist or may have been deleted."
        />
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader
        title={subject.name}
        subtitle={`${subject.code || ""} • Subject`}
        breadcrumbs={[
          { label: "Subjects", href: "/admin/subjects" },
          { label: subject.name },
        ]}
        badge={subject.status}
        badgeVariant={subject.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={[
          { label: "Modules", value: subject._count?.modules || modules.length },
          { label: "Lessons", value: subject._count?.lessons || 0 },
          { label: "Questions", value: subject._count?.questions || 0 },
          { label: "Assessments", value: subject._count?.assessments || 0 },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Module List with Drag-and-Drop */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-arc-navy-900">Modules</h2>
            <Badge variant="secondary">{modules.length} modules</Badge>
            {modules.filter((m) => m.status !== "PUBLISHED").length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                {modules.filter((m) => m.status !== "PUBLISHED").length} draft
              </Badge>
            )}
            {isSaving && (
              <span className="text-sm text-arc-slate-500 animate-pulse">Saving order...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {modules.filter((m) => m.status !== "PUBLISHED").length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishAllModules}
                disabled={isPublishing}
              >
                <Send className="h-4 w-4 mr-2" />
                {isPublishing ? "Publishing..." : "Publish All"}
              </Button>
            )}
            <Button variant="accent" size="sm" onClick={() => setShowModuleForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>

        <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3 mb-4">
          <p className="text-sm text-arc-slate-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag modules to reorder them. Changes are saved automatically.
          </p>
        </div>

        {modules.length === 0 ? (
          <NoDataEmpty
            title="No Modules Yet"
            description="Add your first module to start building the subject structure."
          />
        ) : (
          <DraggableList
            items={moduleItems}
            onReorder={handleReorderModules}
            renderItem={(item, dragHandleProps) => {
              const module = modules.find((m) => m.id === item.id);
              if (!module) return null;

              return (
                <Card className="hover:shadow-arc-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-1 text-arc-slate-400 hover:text-arc-slate-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-arc-slate-500 w-8">
                            {String(module.orderIndex + 1).padStart(2, "0")}
                          </span>
                          <h3 className="font-semibold text-arc-navy-900 truncate">{module.name}</h3>
                          <Badge className={statusColors[module.status]}>
                            {module.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 ml-11 text-sm text-arc-slate-500">
                          <span>{module._count?.topics || 0} Topics</span>
                          <span>•</span>
                          <span>{module._count?.lessons || 0} Lessons</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleModuleStatus(module.id, module.status);
                          }}
                        >
                          {module.status === "PUBLISHED" ? (
                            <Badge variant="success" className="cursor-pointer">Published</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 cursor-pointer">Draft</Badge>
                          )}
                        </button>
                        <Link href={`/admin/modules/${module.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{subject._count?.questions || 0}</div>
                <div className="text-sm text-blue-700">Questions in Bank</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">{subject._count?.assessments || 0}</div>
                <div className="text-sm text-purple-700">Assessments</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{modules.filter((m) => m.status === "PUBLISHED").length}/{modules.length || 1}</div>
                <div className="text-sm text-green-700">Modules Published</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Module Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-arc-navy-900">Add Module</h2>
                <button
                  onClick={() => setShowModuleForm(false)}
                  className="p-2 rounded-lg hover:bg-arc-slate-100"
                >
                  <svg className="h-5 w-5 text-arc-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ModuleForm
                onSubmit={handleAddModule}
                onCancel={() => setShowModuleForm(false)}
                subjectId={subjectId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Module"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all topics and lessons within this module.`}
        confirmLabel="Delete Module"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
