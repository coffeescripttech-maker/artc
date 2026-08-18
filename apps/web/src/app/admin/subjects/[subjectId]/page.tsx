"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, DraggableList, type DraggableItem, ModuleForm } from "@/components/admin";
import { subjectsApi, modulesApi } from "@/lib/api/client";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Plus,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  Settings,
  Layers,
  ArrowRight,
  GripVertical,
  RefreshCw,
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

const mockSubject: Subject = {
  id: "1",
  name: "Mathematics",
  slug: "mathematics",
  code: "MATH",
  icon: "🧮",
  color: "blue",
  status: "PUBLISHED",
  _count: {
    modules: 4,
    lessons: 18,
    questions: 120,
    assessments: 8,
  },
};

const mockModules: Module[] = [
  { id: "1", name: "Number System", slug: "number-system", orderIndex: 0, status: "PUBLISHED", _count: { topics: 4, lessons: 8 } },
  { id: "2", name: "Algebra", slug: "algebra", orderIndex: 1, status: "PUBLISHED", _count: { topics: 5, lessons: 12 } },
  { id: "3", name: "Geometry", slug: "geometry", orderIndex: 2, status: "PUBLISHED", _count: { topics: 4, lessons: 10 } },
  { id: "4", name: "Statistics", slug: "statistics", orderIndex: 3, status: "DRAFT", _count: { topics: 3, lessons: 7 } },
];

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);

  // Fetch subject and modules
  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to fetch from API
      const [subjectData, modulesData] = await Promise.all([
        subjectsApi.getById(subjectId).catch(() => null),
        modulesApi.list(subjectId).catch(() => null),
      ]);

      if (subjectData) {
        setSubject(subjectData as Subject);
      } else {
        setSubject(mockSubject);
      }

      if (modulesData && Array.isArray(modulesData)) {
        setModules(modulesData as Module[]);
      } else {
        setModules(mockModules);
      }
    } catch (err) {
      console.error("Failed to fetch subject data:", err);
      setError("Failed to load subject data. Using demo data.");
      setSubject(mockSubject);
      setModules(mockModules);
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
      const newModule = await modulesApi.create(
        {
          name: data.name,
          subjectId: data.subjectId || subjectId,
          description: data.description
        },
        "" // Token would come from auth context
      );
      setModules([...modules, newModule as Module]);
      setShowModuleForm(false);
    } catch (err) {
      // Fallback to local state for demo
      const newModule: Module = {
        id: Date.now().toString(),
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, "-"),
        orderIndex: modules.length,
        status: "DRAFT",
        _count: { topics: 0, lessons: 0 },
      };
      setModules([...modules, newModule]);
      setShowModuleForm(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      await modulesApi.delete(moduleId, "");
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err) {
      // Fallback to local state for demo
      setModules(modules.filter((m) => m.id !== moduleId));
    }
  };

  // Convert modules to DraggableItem format
  const moduleItems: DraggableItem[] = modules.map((module) => ({
    id: module.id,
    title: module.name,
    subtitle: `${module._count?.topics || 0} Topics • ${module._count?.lessons || 0} Lessons`,
    badge: module.status,
    badgeVariant: (module.status === "PUBLISHED" ? "success" : module.status === "DRAFT" ? "warning" : "default") as "success" | "warning" | "default",
    onClick: () => {},
    onEdit: () => console.log("Edit module:", module.id),
    onDelete: () => handleDeleteModule(module.id),
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
        ""
      );
    } catch (err) {
      console.error("Failed to reorder modules:", err);
      // Revert on error - would need to store original state
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading subject...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Subject not found</h2>
          <p className="text-arc-slate-500 mb-4">The subject you're looking for doesn't exist.</p>
          <Link href="/admin/subjects">
            <Button variant="accent">Back to Subjects</Button>
          </Link>
        </div>
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
        actions={
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {/* Error banner */}
        {error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}

        {/* Module List with Drag-and-Drop */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-arc-navy-900">Modules</h2>
            <Badge variant="secondary">{modules.length} modules</Badge>
            {isSaving && (
              <span className="text-sm text-arc-slate-500 animate-pulse">Saving order...</span>
            )}
          </div>
          <Button variant="accent" size="sm" onClick={() => setShowModuleForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>

        <div className="bg-arc-slate-50 border border-dashed border-arc-slate-300 rounded-lg p-3 mb-4">
          <p className="text-sm text-arc-slate-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Drag modules to reorder them. Changes are saved automatically.
          </p>
        </div>

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
                      <Link href={`/admin/modules/${module.id}`}>
                        <Button variant="ghost" size="sm">
                          Manage
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      <button
                        className="p-1.5 hover:bg-arc-slate-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit module:", module.id);
                        }}
                      >
                        <Edit className="h-4 w-4 text-arc-slate-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-red-50 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(module.id);
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
                <div className="text-2xl font-bold text-green-900">78%</div>
                <div className="text-sm text-green-700">Content Complete</div>
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
    </>
  );
}
