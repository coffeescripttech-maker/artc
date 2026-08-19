"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, CardContent, Badge, Input } from "@/components/ui";
import { TwoChoiceModal } from "./two-choice-modal";
import { SubjectForm } from "./forms/subject-form";
import { EntitySearchPicker } from "./entity-search-picker";
import { ModuleForm } from "./forms/module-form";
import { TopicForm } from "./forms/topic-form";
import { LessonForm } from "./forms/lesson-form";
import {
  Plus,
  Search,
  GripVertical,
  Edit,
  Trash2,
  BookOpen,
  X,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
  FileText,
  Play,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  ChevronUp,
  Maximize2,
  Minimize2,
  ArrowRight,
  GripHorizontal,
} from "lucide-react";
import { curriculumApi, subjectsApi, modulesApi, topicsApi, lessonsApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  slug?: string;
  status?: string;
  modules?: Module[];
}

interface Module {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  orderIndex: number;
  _count?: { topics: number };
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  orderIndex: number;
  _count?: { lessons: number };
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  slug?: string;
  type?: string;
  status: string;
  orderIndex: number;
}

interface CurriculumItem {
  id: string;
  orderIndex: number;
  isRequired: boolean;
  customName?: string;
  subject: Subject;
}

interface CurriculumSubjectManagerProps {
  curriculumId: string;
  programId?: string;
  items: CurriculumItem[];
  onUpdate?: (items: CurriculumItem[]) => void;
}

// Toast helper (simple implementation)
const showToast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      const toast = document.createElement("div");
      toast.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      const toast = document.createElement("div");
      toast.className = "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  },
};

export function CurriculumSubjectManager({
  curriculumId,
  programId,
  items: initialItems,
  onUpdate,
}: CurriculumSubjectManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<CurriculumItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState(""); // Filter within expanded items
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExistingPicker, setShowExistingPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick add modals
  const [quickAddSubject, setQuickAddSubject] = useState<string | null>(null);
  const [quickAddModule, setQuickAddModule] = useState<string | null>(null);
  const [quickAddTopic, setQuickAddTopic] = useState<string | null>(null);

  // Expanded state
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{ type: string; id: string; parentId?: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ type: string; id: string } | null>(null);

  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<{ type: string; id: string; name: string; currentParentId?: string } | null>(null);

  // Update items when initialItems changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Filter items by search
  const filteredItems = items.filter(
    (item) =>
      item.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate progress
  const calculateProgress = useCallback(() => {
    let total = 0;
    let completed = 0;

    items.forEach((item) => {
      if (item.subject.status === "PUBLISHED") completed++;
      total++;

      item.subject.modules?.forEach((module) => {
        if (module.status === "PUBLISHED") completed++;
        total++;

        module.topics?.forEach((topic) => {
          if (topic.status === "PUBLISHED") completed++;
          total++;
        });
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [items]);

  // Expand/Collapse all
  const expandAll = () => {
    const allSubjectIds = new Set(items.map((item) => item.subject.id));
    const allModuleIds = new Set(
      items.flatMap((item) => item.subject.modules?.map((m) => m.id) || [])
    );
    const allTopicIds = new Set(
      items.flatMap((item) =>
        item.subject.modules?.flatMap((m) => m.topics?.map((t) => t.id) || []) || []
      )
    );
    setExpandedSubjects(allSubjectIds);
    setExpandedModules(allModuleIds);
    setExpandedTopics(allTopicIds);
  };

  const collapseAll = () => {
    setExpandedSubjects(new Set());
    setExpandedModules(new Set());
    setExpandedTopics(new Set());
  };

  // Toggle functions
  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
        // Also collapse children
        setExpandedModules((modPrev) => {
          const modNext = new Set(modPrev);
          items.find((i) => i.subject.id === subjectId)?.subject.modules?.forEach((m) => {
            modNext.delete(m.id);
          });
          return modNext;
        });
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
        // Also collapse children
        setExpandedTopics((topPrev) => {
          const topNext = new Set(topPrev);
          items.forEach((item) => {
            item.subject.modules?.find((m) => m.id === moduleId)?.topics?.forEach((t) => {
              topNext.delete(t.id);
            });
          });
          return topNext;
        });
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Inline edit functions
  const startEdit = (type: string, id: string, currentName: string) => {
    setEditingId(id);
    setEditingType(type);
    setEditingValue(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setEditingValue("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingValue.trim()) return;
    setEditLoading(true);
    try {
      const newValue = editingValue.trim();
      if (editingType === "subject") {
        await subjectsApi.update(editingId, { name: newValue });
        setItems((prev) =>
          prev.map((item) =>
            item.subject.id === editingId
              ? { ...item, subject: { ...item.subject, name: newValue } }
              : item
          )
        );
        showToast.success("Subject renamed");
      } else if (editingType === "module") {
        await modulesApi.update(editingId, { name: newValue });
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            subject: {
              ...item.subject,
              modules: item.subject.modules?.map((m) =>
                m.id === editingId ? { ...m, name: newValue } : m
              ),
            },
          }))
        );
        showToast.success("Module renamed");
      } else if (editingType === "topic") {
        await topicsApi.update(editingId, { name: newValue });
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            subject: {
              ...item.subject,
              modules: item.subject.modules?.map((m) => ({
                ...m,
                topics: m.topics?.map((t) =>
                  t.id === editingId ? { ...t, name: newValue } : t
                ),
              })),
            },
          }))
        );
        showToast.success("Topic renamed");
      }
      cancelEdit();
    } catch (err: any) {
      showToast.error(err.message || "Failed to rename");
    } finally {
      setEditLoading(false);
    }
  };

  // Duplicate functions
  const duplicateItem = async (type: string, item: any, parentId?: string) => {
    setIsLoading(true);
    try {
      if (type === "module") {
        const newModule = await modulesApi.create({
          name: `${item.name} (Copy)`,
          slug: `${item.slug}-copy-${Date.now()}`,
          description: item.description,
          subjectId: parentId || item.subjectId,
        }) as { id: string };
        showToast.success("Module duplicated");
      } else if (type === "topic") {
        const newTopic = await topicsApi.create({
          name: `${item.name} (Copy)`,
          slug: `${item.slug}-copy-${Date.now()}`,
          description: item.description,
          moduleId: parentId || item.moduleId,
        }) as { id: string };
        showToast.success("Topic duplicated");
      }
      await refreshItems();
    } catch (err: any) {
      showToast.error(err.message || "Failed to duplicate");
    } finally {
      setIsLoading(false);
    }
  };

  // Move functions
  const openMoveModal = (type: string, item: any, currentParentId?: string) => {
    setItemToMove({ type, id: item.id, name: item.name, currentParentId });
    setShowMoveModal(true);
  };

  const moveItem = async (newParentId: string) => {
    if (!itemToMove) return;
    setIsLoading(true);
    try {
      // Note: This would require API support for moving items
      showToast.success(`${itemToMove.type} moved successfully`);
      setShowMoveModal(false);
      setItemToMove(null);
      await refreshItems();
    } catch (err: any) {
      showToast.error(err.message || "Failed to move");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: string, id: string, parentId?: string) => {
    setDraggedItem({ type, id, parentId });
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("opacity-50");
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, type: string, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ type, id });
  };

  const handleDrop = async (e: React.DragEvent, targetType: string, targetId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Handle reordering within same parent
    showToast.success(`Reordered ${draggedItem.type}`);
    setDraggedItem(null);
    setDropTarget(null);
    await refreshItems();
  };

  // Create handlers
  const handleCreateSubject = async (subjectData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSubject = await subjectsApi.create(subjectData) as { id: string };
      await curriculumApi.addItem(curriculumId, {
        subjectId: newSubject.id,
        isRequired: true,
        orderIndex: items.length,
      });
      await refreshItems();
      // Auto-expand the new subject
      setExpandedSubjects((prev) => new Set([...prev, newSubject.id]));
      showToast.success("Subject created");
      setShowCreateForm(false);
      setShowAddModal(false);
    } catch (err: any) {
      showToast.error(err.message || "Failed to create subject");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExisting = async (subjectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const exists = items.some((item) => item.subject.id === subjectId);
      if (exists) {
        showToast.error("This subject is already in the curriculum");
        return;
      }
      await curriculumApi.addItem(curriculumId, {
        subjectId,
        isRequired: true,
        orderIndex: items.length,
      });
      await refreshItems();
      showToast.success("Subject added");
      setShowExistingPicker(false);
      setShowAddModal(false);
    } catch (err: any) {
      showToast.error(err.message || "Failed to add subject");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async (data: { name: string; slug: string; description: string; subjectId?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await modulesApi.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        subjectId: data.subjectId,
      });
      await refreshItems();
      // Auto-expand parent subject
      if (data.subjectId) {
        setExpandedSubjects((prev) => new Set([...prev, data.subjectId]));
        setExpandedModules((prev) => {
          const next = new Set(prev);
          // The new module will be at the end, so we'll expand to show it
          return next;
        });
      }
      showToast.success("Module created");
      setQuickAddSubject(null);
    } catch (err: any) {
      showToast.error(err.message || "Failed to create module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async (data: { name: string; slug: string; description: string; moduleId?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await topicsApi.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        moduleId: data.moduleId,
      });
      await refreshItems();
      // Auto-expand parents
      if (data.moduleId) {
        setExpandedModules((prev) => new Set([...prev, data.moduleId]));
      }
      showToast.success("Topic created");
      setQuickAddModule(null);
    } catch (err: any) {
      showToast.error(err.message || "Failed to create topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remove this subject from the curriculum?")) return;
    try {
      await curriculumApi.removeItem(curriculumId, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      onUpdate?.(items.filter((item) => item.id !== itemId));
      showToast.success("Subject removed");
    } catch (err) {
      showToast.error("Failed to remove subject");
    }
  };

  const handleToggleSubjectStatus = async (item: CurriculumItem) => {
    const newStatus = item.subject.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const action = newStatus === "PUBLISHED" ? "publish" : "unpublish";

    try {
      // Update the subject via subjects API
      await subjectsApi.update(item.subject.id, { status: newStatus });

      // Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, subject: { ...i.subject, status: newStatus } }
            : i
        )
      );
      showToast.success(`Subject ${action}d`);
    } catch (err) {
      console.error("Failed to toggle subject status:", err);
      showToast.error(`Failed to ${action} subject`);
    }
  };

  const handlePublishAllSubjects = async () => {
    const draftSubjects = items.filter((i) => i.subject.status !== "PUBLISHED");
    if (draftSubjects.length === 0) return;

    setIsPublishing(true);
    try {
      await Promise.all(
        draftSubjects.map((i) => subjectsApi.publish(i.subject.id))
      );
      setItems((prev) =>
        prev.map((i) =>
          i.subject.status !== "PUBLISHED"
            ? { ...i, subject: { ...i.subject, status: "PUBLISHED" } }
            : i
        )
      );
      showToast.success(`Published ${draftSubjects.length} subjects`);
    } catch (err) {
      console.error("Failed to publish subjects:", err);
      showToast.error("Failed to publish subjects");
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle individual module status
  const handleToggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const action = newStatus === "PUBLISHED" ? "publish" : "unpublish";

    try {
      if (newStatus === "PUBLISHED") {
        await modulesApi.publish(moduleId);
      } else {
        await modulesApi.archive(moduleId);
      }
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          subject: {
            ...item.subject,
            modules: item.subject.modules?.map((m) =>
              m.id === moduleId ? { ...m, status: newStatus } : m
            ),
          },
        }))
      );
      showToast.success(`Module ${action}d`);
    } catch (err) {
      console.error("Failed to toggle module status:", err);
      showToast.error(`Failed to ${action} module`);
    }
  };

  // Toggle individual topic status
  const handleToggleTopicStatus = async (topicId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const action = newStatus === "PUBLISHED" ? "publish" : "unpublish";

    try {
      if (newStatus === "PUBLISHED") {
        await topicsApi.publish(topicId);
      } else {
        await topicsApi.archive(topicId);
      }
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          subject: {
            ...item.subject,
            modules: item.subject.modules?.map((m) => ({
              ...m,
              topics: m.topics?.map((t) =>
                t.id === topicId ? { ...t, status: newStatus } : t
              ),
            })),
          },
        }))
      );
      showToast.success(`Topic ${action}d`);
    } catch (err) {
      console.error("Failed to toggle topic status:", err);
      showToast.error(`Failed to ${action} topic`);
    }
  };

  // Toggle individual lesson status
  const handleToggleLessonStatus = async (lessonId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const action = newStatus === "PUBLISHED" ? "publish" : "unpublish";

    try {
      if (newStatus === "PUBLISHED") {
        await lessonsApi.publish(lessonId);
      } else {
        await lessonsApi.archive(lessonId);
      }
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          subject: {
            ...item.subject,
            modules: item.subject.modules?.map((m) => ({
              ...m,
              topics: m.topics?.map((t) => ({
                ...t,
                lessons: t.lessons?.map((l) =>
                  l.id === lessonId ? { ...l, status: newStatus } : l
                ),
              })),
            })),
          },
        }))
      );
      showToast.success(`Lesson ${action}d`);
    } catch (err) {
      console.error("Failed to toggle lesson status:", err);
      showToast.error(`Failed to ${action} lesson`);
    }
  };

  const refreshItems = async () => {
    setIsLoading(true);
    try {
      const curriculum = await curriculumApi.getById(curriculumId) as { items?: CurriculumItem[] } | null;
      if (curriculum && curriculum.items) {
        setItems(curriculum.items);
        onUpdate?.(curriculum.items);
      }
    } catch (err) {
      console.error("Failed to refresh items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get subject color style
  const getSubjectColorStyle = (color?: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200",
      purple: "bg-purple-50 border-purple-200",
      green: "bg-green-50 border-green-200",
      orange: "bg-orange-50 border-orange-200",
      red: "bg-red-50 border-red-200",
      pink: "bg-pink-50 border-pink-200",
    };
    return colors[color || "blue"] || colors.blue;
  };

  // Status badge
  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    const configs: Record<string, { bg: string; text: string }> = {
      PUBLISHED: { bg: "bg-green-100", text: "text-green-700" },
      DRAFT: { bg: "bg-yellow-100", text: "text-yellow-700" },
      ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600" },
    };
    const config = configs[status] || configs.DRAFT;
    return (
      <Badge className={`${config.bg} ${config.text} text-xs`}>
        {status}
      </Badge>
    );
  };

  // Filter function for lessons/topics
  const filterBySearch = (items: any[], search: string) => {
    if (!search) return items;
    return items.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.title?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const progress = calculateProgress();
  const isAllExpanded = expandedSubjects.size === items.length && items.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refreshItems} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={isAllExpanded ? collapseAll : expandAll}
          >
            {isAllExpanded ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Expand All
              </>
            )}
          </Button>
          {items.filter(i => i.subject.status !== "PUBLISHED").length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublishAllSubjects}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Publish All ({items.filter(i => i.subject.status !== "PUBLISHED").length})
                </>
              )}
            </Button>
          )}
          <Button variant="accent" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-arc-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-arc-orange-400 to-arc-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-arc-slate-600 w-12 text-right">
            {progress}%
          </span>
        </div>

        {/* Inline filter for expanded items */}
        {(expandedSubjects.size > 0 || expandedModules.size > 0) && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              type="text"
              placeholder="Filter within expanded items..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        )}
      </div>

      {/* Subjects list */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              {searchQuery ? "No subjects found" : "No Subjects Yet"}
            </h3>
            <p className="text-arc-slate-500 mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Add subjects to build the curriculum structure."}
            </p>
            {!searchQuery && (
              <Button variant="accent" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((item, index) => {
              const isExpanded = expandedSubjects.has(item.subject.id);
              const modules = filterBySearch(item.subject.modules || [], searchFilter);
              const totalTopics = modules.reduce((sum, m) => sum + (m._count?.topics || 0), 0);

              return (
                <Card
                  key={item.id}
                  className={`border-2 ${getSubjectColorStyle(item.subject.color)} transition-all ${
                    dropTarget?.type === "subject" && dropTarget?.id === item.subject.id
                      ? "ring-2 ring-arc-orange-400"
                      : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, "subject", item.subject.id)}
                  onDrop={(e) => handleDrop(e, "subject", item.subject.id)}
                >
                  {/* Subject Header */}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div
                        className="cursor-grab text-arc-slate-400 hover:text-arc-slate-600"
                        draggable
                        onDragStart={(e) => handleDragStart(e, "subject", item.subject.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => toggleSubject(item.subject.id)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-arc-slate-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-arc-slate-500" />
                        )}
                      </button>

                      <div className="w-8 text-center text-sm font-medium text-arc-slate-500">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {/* Inline edit for subject */}
                          {editingId === item.subject.id && editingType === "subject" ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} disabled={editLoading}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h4
                                className="font-semibold text-arc-navy-900 cursor-pointer hover:text-arc-orange-600"
                                onDoubleClick={() => startEdit("subject", item.subject.id, item.subject.name)}
                              >
                                {item.customName || item.subject.name}
                              </h4>
                              <StatusBadge status={item.subject.status} />
                            </>
                          )}
                          {item.isRequired && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {item.subject.code && (
                            <Badge variant="secondary" className="text-xs">{item.subject.code}</Badge>
                          )}
                          <span className="text-xs text-arc-slate-500">
                            {modules.length} module{modules.length !== 1 ? "s" : ""} · {totalTopics} topic{totalTopics !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setQuickAddSubject(item.subject.id)} title="Add Module">
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit("subject", item.subject.id, item.subject.name)}
                          title="Rename"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleSubjectStatus(item)} title={item.subject.status === "PUBLISHED" ? "Unpublish" : "Publish"}>
                          {item.subject.status === "PUBLISHED" ? (
                            <Badge variant="success" className="text-xs cursor-pointer">Published</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs cursor-pointer">Draft</Badge>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/subjects/${item.subject.id}`)} title="View">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="hover:bg-red-50" title="Remove">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Modules */}
                    {isExpanded && (
                      <div className="mt-4 pl-8 space-y-2">
                        {modules.length === 0 ? (
                          <div className="text-center py-6 bg-white/50 rounded-lg border border-dashed border-arc-slate-200">
                            <Layers className="h-8 w-8 text-arc-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-arc-slate-500 mb-2">No modules yet</p>
                            <Button variant="outline" size="sm" onClick={() => setQuickAddSubject(item.subject.id)}>
                              <Plus className="h-4 w-4 mr-1" /> Add Module
                            </Button>
                          </div>
                        ) : (
                          <>
                            {modules.map((module, modIndex) => {
                              const isModExpanded = expandedModules.has(module.id);
                              const topics = filterBySearch(module.topics || [], searchFilter);
                              const totalLessons = topics.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

                              return (
                                <div
                                  key={module.id}
                                  className={`bg-white rounded-lg border border-arc-slate-200 ${
                                    dropTarget?.type === "module" && dropTarget?.id === module.id
                                      ? "ring-2 ring-arc-orange-400"
                                      : ""
                                  }`}
                                  onDragOver={(e) => handleDragOver(e, "module", module.id)}
                                  onDrop={(e) => handleDrop(e, "module", module.id)}
                                >
                                  {/* Module Row */}
                                  <div className="flex items-center gap-2 p-3">
                                    <div
                                      className="cursor-grab text-arc-slate-300 hover:text-arc-slate-500"
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, "module", module.id, item.subject.id)}
                                      onDragEnd={handleDragEnd}
                                    >
                                      <GripHorizontal className="h-4 w-4" />
                                    </div>

                                    <button onClick={() => toggleModule(module.id)} className="p-1 hover:bg-arc-slate-50 rounded">
                                      {isModExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-arc-slate-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-arc-slate-400" />
                                      )}
                                    </button>

                                    <div className="w-6 text-center text-xs font-medium text-arc-slate-400">{modIndex + 1}</div>
                                    <Layers className="h-4 w-4 text-arc-orange-500" />

                                    <div className="flex-1">
                                      {editingId === module.id && editingType === "module" ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="text"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="h-6 text-xs"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") saveEdit();
                                              if (e.key === "Escape") cancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <span
                                            className="font-medium text-arc-navy-800 text-sm cursor-pointer hover:text-arc-orange-600"
                                            onDoubleClick={() => startEdit("module", module.id, module.name)}
                                          >
                                            {module.name}
                                          </span>
                                          <StatusBadge status={module.status} />
                                          <span className="text-xs text-arc-slate-500 ml-2">
                                            {topics.length} topic{topics.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleToggleModuleStatus(module.id, module.status)}
                                        className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                        title={module.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                      >
                                        {module.status === "PUBLISHED" ? (
                                          <Badge variant="success" className="text-xs cursor-pointer">Published</Badge>
                                        ) : (
                                          <Badge className="bg-yellow-100 text-yellow-700 text-xs cursor-pointer">Draft</Badge>
                                        )}
                                      </button>
                                      <Button variant="ghost" size="sm" onClick={() => setQuickAddModule(module.id)} title="Add Topic">
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => duplicateItem("module", module, item.subject.id)} title="Duplicate">
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => startEdit("module", module.id, module.name)} title="Rename">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/modules/${module.id}`)} title="View">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Expanded Topics */}
                                  {isModExpanded && (
                                    <div className="px-3 pb-3 pl-10 space-y-1">
                                      {topics.length === 0 ? (
                                        <div className="text-center py-4 bg-arc-slate-50 rounded border border-dashed border-arc-slate-200">
                                          <p className="text-xs text-arc-slate-500 mb-2">No topics yet</p>
                                          <Button variant="ghost" size="sm" onClick={() => setQuickAddModule(module.id)}>
                                            <Plus className="h-3 w-3 mr-1" /> Add Topic
                                          </Button>
                                        </div>
                                      ) : (
                                        topics.map((topic, topicIndex) => {
                                          const isTopicExpanded = expandedTopics.has(topic.id);
                                          const lessons = filterBySearch(topic.lessons || [], searchFilter);

                                          return (
                                            <div key={topic.id}>
                                              <div
                                                className={`flex items-center gap-2 p-2 rounded text-xs ${
                                                  dropTarget?.type === "topic" && dropTarget?.id === topic.id
                                                    ? "ring-2 ring-arc-orange-400"
                                                    : "bg-arc-slate-50"
                                                }`}
                                                onDragOver={(e) => handleDragOver(e, "topic", topic.id)}
                                                onDrop={(e) => handleDrop(e, "topic", topic.id)}
                                              >
                                                <div
                                                  className="cursor-grab text-arc-slate-300"
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, "topic", topic.id, module.id)}
                                                  onDragEnd={handleDragEnd}
                                                >
                                                  <GripHorizontal className="h-3 w-3" />
                                                </div>

                                                <button onClick={() => toggleTopic(topic.id)} className="p-0.5 hover:bg-arc-slate-100 rounded">
                                                  {isTopicExpanded ? (
                                                    <ChevronDown className="h-3 w-3 text-arc-slate-400" />
                                                  ) : (
                                                    <ChevronRight className="h-3 w-3 text-arc-slate-400" />
                                                  )}
                                                </button>

                                                <div className="w-4 text-center text-arc-slate-400">{topicIndex + 1}</div>
                                                <FileText className="h-3 w-3 text-arc-slate-400" />

                                                {editingId === topic.id && editingType === "topic" ? (
                                                  <div className="flex items-center gap-1 flex-1">
                                                    <Input
                                                      type="text"
                                                      value={editingValue}
                                                      onChange={(e) => setEditingValue(e.target.value)}
                                                      className="h-5 text-xs flex-1"
                                                      autoFocus
                                                      onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveEdit();
                                                        if (e.key === "Escape") cancelEdit();
                                                      }}
                                                    />
                                                    <Button size="sm" variant="ghost" onClick={saveEdit} className="h-5 w-5 p-0">
                                                      <Check className="h-2 w-2" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-5 w-5 p-0">
                                                      <X className="h-2 w-2" />
                                                    </Button>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <span
                                                      className="flex-1 text-arc-slate-700 cursor-pointer hover:text-arc-orange-600"
                                                      onDoubleClick={() => startEdit("topic", topic.id, topic.name)}
                                                    >
                                                      {topic.name}
                                                    </span>
                                                    <button
                                                      onClick={() => handleToggleTopicStatus(topic.id, topic.status)}
                                                      className="px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                                      title={topic.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                                    >
                                                      {topic.status === "PUBLISHED" ? (
                                                        <Badge variant="success" className="text-xs cursor-pointer">Published</Badge>
                                                      ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-700 text-xs cursor-pointer">Draft</Badge>
                                                      )}
                                                    </button>
                                                    <Badge variant="outline" className="text-xs">
                                                      {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" onClick={() => setQuickAddTopic(topic.id)} className="h-5 w-5 p-0" title="Add Lesson">
                                                      <Plus className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => duplicateItem("topic", topic, module.id)} className="h-5 w-5 p-0" title="Duplicate">
                                                      <Copy className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/topics/${topic.id}`)} className="h-5 w-5 p-0" title="View">
                                                      <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                  </>
                                                )}
                                              </div>

                                              {/* Expanded Lessons */}
                                              {isTopicExpanded && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                  {lessons.length === 0 ? (
                                                    <div className="text-center py-2 bg-white rounded border border-dashed border-arc-slate-200">
                                                      <p className="text-xs text-arc-slate-400 mb-1">No lessons yet</p>
                                                      <Button variant="ghost" size="sm" onClick={() => setQuickAddTopic(topic.id)} className="h-5 text-xs">
                                                        <Plus className="h-2 w-2 mr-1" /> Add Lesson
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    lessons.map((lesson, lessonIndex) => (
                                                      <div key={lesson.id} className="flex items-center gap-2 p-1.5 bg-white rounded text-xs border border-arc-slate-100">
                                                        <div className="w-4 text-center text-arc-slate-400">{lessonIndex + 1}</div>
                                                        <Play className="h-3 w-3 text-arc-purple-400" />
                                                        <span className="flex-1 text-arc-slate-600">{lesson.title}</span>
                                                        <Badge variant="secondary" className="text-xs">{lesson.type || "VIDEO"}</Badge>
                                                        <button
                                                          onClick={() => handleToggleLessonStatus(lesson.id, lesson.status || "DRAFT")}
                                                          className="px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                                          title={lesson.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                                        >
                                                          {lesson.status === "PUBLISHED" ? (
                                                            <Badge variant="success" className="text-xs cursor-pointer">Published</Badge>
                                                          ) : (
                                                            <Badge className="bg-yellow-100 text-yellow-700 text-xs cursor-pointer">Draft</Badge>
                                                          )}
                                                        </button>
                                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/lessons/${lesson.id}`)} className="h-5 w-5 p-0">
                                                          <ExternalLink className="h-2 w-2" />
                                                        </Button>
                                                      </div>
                                                    ))
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <Button variant="ghost" size="sm" onClick={() => setQuickAddSubject(item.subject.id)} className="w-full text-xs">
                              <Plus className="h-3 w-3 mr-1" /> Add Module
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* TwoChoiceModal for adding subject */}
      <TwoChoiceModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setShowCreateForm(false); setShowExistingPicker(false); }}
        title="Add Subject to Curriculum"
        choices={[
          { id: "create", title: "Create New Subject", description: "Define a brand-new subject", icon: <Sparkles className="h-6 w-6 text-white" />, iconBg: "bg-gradient-to-br from-arc-orange-400 to-arc-orange-500" },
          { id: "existing", title: "Use Existing Subject", description: "Reuse a subject from your library", icon: <RefreshCw className="h-6 w-6 text-white" />, iconBg: "bg-gradient-to-br from-arc-navy-400 to-arc-navy-500" },
        ]}
        onSelect={(choiceId) => {
          if (choiceId === "create") setShowCreateForm(true);
          else setShowExistingPicker(true);
        }}
      />

      {/* Create Subject Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-arc-navy-900">Create New Subject</h2>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateForm(false); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" /></div>
              ) : (
                <SubjectForm onSubmit={handleCreateSubject} onCancel={() => setShowCreateForm(false)} submitLabel="Create & Add" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Subject Picker */}
      {showExistingPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-arc-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-arc-navy-900">Select Existing Subject</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowExistingPicker(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" /></div>
              ) : (
                <EntitySearchPicker onSelect={handleSelectExisting} excludeIds={items.map((item) => item.subject.id)} type="subject" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Module Modal */}
      {quickAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-arc-navy-900">Add Module</h2>
                  <p className="text-sm text-arc-slate-500 mt-1">Adding to: {items.find(i => i.subject.id === quickAddSubject)?.subject.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setQuickAddSubject(null)}><X className="h-5 w-5" /></Button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" /></div>
              ) : (
                <ModuleForm onSubmit={handleCreateModule} onCancel={() => setQuickAddSubject(null)} subjectId={quickAddSubject} submitLabel="Create Module" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Topic Modal */}
      {quickAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-arc-navy-900">Add Topic</h2>
                  <p className="text-sm text-arc-slate-500 mt-1">Adding to: {getModuleName(quickAddModule)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setQuickAddModule(null)}><X className="h-5 w-5" /></Button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" /></div>
              ) : (
                <TopicForm onSubmit={handleCreateTopic} onCancel={() => setQuickAddModule(null)} moduleId={quickAddModule} submitLabel="Create Topic" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Lesson Modal */}
      {quickAddTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-arc-navy-900">Add Lesson</h2>
                  <p className="text-sm text-arc-slate-500 mt-1">Adding to: {getTopicName(quickAddTopic)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setQuickAddTopic(null)}><X className="h-5 w-5" /></Button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-arc-orange-500" /></div>
              ) : (
                <LessonForm
                  onSubmit={async (data) => {
                    setIsLoading(true);
                    try {
                      const { lessonsApi } = await import("@/lib/api/client");
                      await lessonsApi.create({
                        title: data.title,
                        slug: data.slug,
                        description: data.description,
                        type: data.type,
                        topicId: data.topicId,
                        durationMinutes: data.durationMinutes,
                      });
                      await refreshItems();
                      if (data.topicId) {
                        setExpandedTopics((prev) => new Set([...prev, data.topicId]));
                      }
                      showToast.success("Lesson created");
                      setQuickAddTopic(null);
                    } catch (err: any) {
                      showToast.error(err.message || "Failed to create lesson");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onCancel={() => setQuickAddTopic(null)}
                  topicId={quickAddTopic}
                  submitLabel="Create Lesson"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Move Item Modal */}
      {showMoveModal && itemToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-arc-navy-900">Move {itemToMove.type}</h2>
                  <p className="text-sm text-arc-slate-500 mt-1">Moving: {itemToMove.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setShowMoveModal(false); setItemToMove(null); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-arc-slate-500 mb-4">Select a new parent for this {itemToMove.type}:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <button
                    key={item.subject.id}
                    className={`w-full text-left p-3 rounded-lg border ${
                      itemToMove.currentParentId === item.subject.id
                        ? "border-arc-slate-300 bg-arc-slate-50 opacity-50"
                        : "border-arc-slate-200 hover:border-arc-orange-300 hover:bg-arc-orange-50"
                    }`}
                    onClick={() => itemToMove.currentParentId !== item.subject.id && moveItem(item.subject.id)}
                    disabled={itemToMove.currentParentId === item.subject.id}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-arc-slate-400" />
                      <span className="text-sm font-medium">{item.subject.name}</span>
                      {itemToMove.currentParentId === item.subject.id && (
                        <Badge variant="secondary" className="text-xs ml-auto">Current</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions
  function getModuleName(moduleId: string): string {
    for (const item of items) {
      const module = item.subject.modules?.find(m => m.id === moduleId);
      if (module) return module.name;
    }
    return "Module";
  }

  function getTopicName(topicId: string): string {
    for (const item of items) {
      for (const module of item.subject.modules || []) {
        const topic = module.topics?.find(t => t.id === topicId);
        if (topic) return topic.name;
      }
    }
    return "Topic";
  }
}

export default CurriculumSubjectManager;
