"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, X, Check } from "lucide-react";
import { topicsApi, modulesApi, subjectsApi } from "@/lib/api/client";
import { Input, Button, Card, CardContent } from "@/components/ui";
import { cn } from "@aratc/ui";

interface Topic {
  id: string;
  name: string;
  moduleId: string;
  module?: {
    id: string;
    name: string;
    subjectId: string;
    subject?: {
      id: string;
      name: string;
    };
  };
}

interface Module {
  id: string;
  name: string;
  subjectId: string;
  subject?: {
    id: string;
    name: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

interface TopicPickerProps {
  selectedTopicIds: string[];
  onChange: (topicIds: string[]) => void;
  programId?: string;
}

export function TopicPicker({ selectedTopicIds, onChange, programId }: TopicPickerProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [programId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsData, modulesData, subjectsData] = await Promise.all([
        topicsApi.list() as Promise<Topic[]>,
        modulesApi.list() as Promise<Module[]>,
        subjectsApi.list() as Promise<Subject[]>,
      ]);

      setTopics(topicsData || []);
      setModules(modulesData || []);
      setSubjects(subjectsData || []);

      // Expand first subject by default
      if (subjectsData && subjectsData.length > 0) {
        setExpandedSubjects(new Set([subjectsData[0].id]));
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group topics by subject > module
  const grouped = subjects.map((subject) => {
    const subjectModules = modules.filter((m) => m.subjectId === subject.id);
    return {
      subject,
      modules: subjectModules.map((mod) => ({
        module: mod,
        topics: topics.filter((t) => t.moduleId === mod.id),
      })),
    };
  }).filter((g) => g.modules.length > 0);

  // Filter by search
  const filtered = searchQuery
    ? grouped.map((g) => ({
        ...g,
        modules: g.modules
          .map((m) => ({
            ...m,
            topics: m.topics.filter(
              (t) =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((m) => m.topics.length > 0),
      })).filter((g) => g.modules.length > 0)
    : grouped;

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      onChange([...selectedTopicIds, topicId]);
    }
  };

  const selectAllInSubject = (subjectId: string) => {
    const subjectTopicIds = topics
      .filter((t) => modules.find((m) => m.id === t.moduleId)?.subjectId === subjectId)
      .map((t) => t.id);
    const allSelected = subjectTopicIds.every((id) => selectedTopicIds.includes(id));
    if (allSelected) {
      onChange(selectedTopicIds.filter((id) => !subjectTopicIds.includes(id)));
    } else {
      onChange([...new Set([...selectedTopicIds, ...subjectTopicIds])]);
    }
  };

  const selectAll = () => {
    if (selectedTopicIds.length === topics.length) {
      onChange([]);
    } else {
      onChange(topics.map((t) => t.id));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-arc-slate-500">
        Loading topics...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={selectAll}>
          {selectedTopicIds.length === topics.length ? "Deselect All" : "Select All"}
        </Button>
        {selectedTopicIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear
          </Button>
        )}
      </div>

      {/* Selected count */}
      {selectedTopicIds.length > 0 && (
        <div className="text-sm text-arc-slate-500">
          {selectedTopicIds.length} topic{selectedTopicIds.length !== 1 ? "s" : ""} selected
        </div>
      )}

      {/* Topic tree */}
      <div className="max-h-64 overflow-y-auto border border-arc-slate-200 rounded-lg">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-arc-slate-500">
            No topics found
          </div>
        ) : (
          filtered.map(({ subject, modules: subjectModules }) => (
            <div key={subject.id} className="border-b border-arc-slate-100 last:border-b-0">
              {/* Subject header */}
              <button
                onClick={() => toggleSubject(subject.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-arc-slate-50 transition-colors text-left"
              >
                {expandedSubjects.has(subject.id) ? (
                  <ChevronDown className="h-4 w-4 text-arc-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-arc-slate-400" />
                )}
                <span className="font-medium text-arc-navy-900">{subject.name}</span>
                <span className="text-xs text-arc-slate-400 ml-auto">
                  {topics.filter((t) => modules.find((m) => m.id === t.moduleId)?.subjectId === subject.id).length}
                </span>
              </button>

              {/* Modules */}
              {expandedSubjects.has(subject.id) && (
                <div className="pl-6 pb-2">
                  {subjectModules.map(({ module, topics: moduleTopics }) => (
                    <div key={module.id} className="mt-1">
                      {/* Module header */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-arc-slate-50 rounded transition-colors text-left"
                      >
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="h-3 w-3 text-arc-slate-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-arc-slate-400" />
                        )}
                        <span className="text-sm text-arc-slate-700">{module.name}</span>
                        <span className="text-xs text-arc-slate-400 ml-auto">
                          {moduleTopics.length}
                        </span>
                      </button>

                      {/* Topics */}
                      {expandedModules.has(module.id) && (
                        <div className="pl-6 space-y-0.5">
                          {moduleTopics.map((topic) => {
                            const isSelected = selectedTopicIds.includes(topic.id);
                            return (
                              <button
                                key={topic.id}
                                onClick={() => toggleTopic(topic.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                                  isSelected
                                    ? "bg-arc-orange-50 text-arc-orange-700"
                                    : "hover:bg-arc-slate-50 text-arc-slate-600"
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center",
                                    isSelected
                                      ? "bg-arc-orange-500 border-arc-orange-500"
                                      : "border-arc-slate-300"
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-sm">{topic.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Compact version for inline use
interface TopicPickerCompactProps {
  selectedTopicIds: string[];
  onChange: (topicIds: string[]) => void;
}

export function TopicPickerCompact({ selectedTopicIds, onChange }: TopicPickerCompactProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span>
          {selectedTopicIds.length === 0
            ? "Select topics..."
            : `${selectedTopicIds.length} topic${selectedTopicIds.length !== 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-arc-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-arc-slate-100 bg-arc-slate-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-arc-slate-600">
                  {selectedTopicIds.length > 0
                    ? `${selectedTopicIds.length} selected — click to deselect`
                    : "Click topics to select"}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-arc-orange-600 hover:text-arc-orange-700 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <TopicPicker
                selectedTopicIds={selectedTopicIds}
                onChange={(ids) => {
                  onChange(ids);
                  // Don't close on selection - stay open to select more
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
