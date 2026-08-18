"use client";

import { useState, useEffect, useCallback } from "react";
import { Input, Card, CardContent, Badge, Button } from "@/components/ui";
import { Search, X, Check, Loader2, BookOpen, FileText, Box, Play, BookMarked } from "lucide-react";
import { subjectsApi, modulesApi, topicsApi, lessonsApi } from "@/lib/api/client";

interface EntitySearchPickerProps {
  onSelect: (entityId: string) => void;
  excludeIds?: string[];
  type: "subject" | "module" | "topic" | "lesson";
  subjectId?: string;
  moduleId?: string;
  topicId?: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

interface Module {
  id: string;
  name: string;
  description?: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
}

interface Lesson {
  id: string;
  name: string;
  title: string;
  type?: string;
}

const entityIcons = {
  subject: BookOpen,
  module: Box,
  topic: FileText,
  lesson: Play,
};

const entityLabels = {
  subject: "Subject",
  module: "Module",
  topic: "Topic",
  lesson: "Lesson",
};

export function EntitySearchPicker({
  onSelect,
  excludeIds = [],
  type,
  subjectId,
  moduleId,
  topicId,
}: EntitySearchPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || query.length === 0) {
        searchEntities(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchEntities = async (pageNum: number) => {
    setIsLoading(true);
    try {
      let data: any[] = [];

      switch (type) {
        case "subject": {
          const subjectData = await subjectsApi.list() as any;
          data = subjectData.subjects || subjectData || [];
          if (query) {
            data = (data as Subject[]).filter((s: Subject) =>
              s.name.toLowerCase().includes(query.toLowerCase())
            );
          }
          break;
        }
        case "module": {
          const moduleData = await modulesApi.list(subjectId) as any;
          data = moduleData.modules || moduleData || [];
          if (query) {
            data = (data as Module[]).filter((m: Module) =>
              m.name.toLowerCase().includes(query.toLowerCase())
            );
          }
          break;
        }
        case "topic": {
          const topicData = await topicsApi.list(moduleId) as any;
          data = topicData.topics || topicData || [];
          if (query) {
            data = (data as Topic[]).filter((t: Topic) =>
              t.name.toLowerCase().includes(query.toLowerCase())
            );
          }
          break;
        }
        case "lesson": {
          const lessonData = await lessonsApi.list(topicId) as any;
          data = lessonData.lessons || lessonData || [];
          if (query) {
            data = (data as Lesson[]).filter((l: Lesson) =>
              (l.name || l.title || "").toLowerCase().includes(query.toLowerCase())
            );
          }
          break;
        }
      }

      // Filter out excluded IDs
      const filtered = (data as any[]).filter(
        (item) => !excludeIds.includes(item.id)
      );

      if (pageNum === 1) {
        setResults(filtered);
      } else {
        setResults((prev) => [...prev, ...filtered]);
      }

      setHasMore(filtered.length >= 10);
      setPage(pageNum);
    } catch (err) {
      console.error(`Failed to search ${type}:`, err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (entityId: string) => {
    setSelectedId(entityId);
    // Small delay to show selection state
    setTimeout(() => {
      onSelect(entityId);
    }, 150);
  };

  const Icon = entityIcons[type];

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
        <Input
          type="text"
          placeholder={`Search ${entityLabels[type]}s...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-arc-slate-400 hover:text-arc-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 && !isLoading ? (
        <div className="text-center py-8">
          <Icon className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
          <p className="text-arc-slate-500">
            {query ? `No ${entityLabels[type]}s found` : `No ${entityLabels[type]}s available`}
          </p>
          <p className="text-sm text-arc-slate-400 mt-1">
            {query ? "Try a different search term" : "Create one first"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((entity) => {
            const isSelected = selectedId === entity.id;
            const isExcluded = excludeIds.includes(entity.id);

            return (
              <Card
                key={entity.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-arc-orange-500 bg-arc-orange-50"
                    : isExcluded
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-arc-md"
                }`}
                onClick={() => !isExcluded && !isSelected && handleSelect(entity.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-arc-slate-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-arc-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-arc-navy-900 truncate">
                        {entity.name || entity.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {entity.code && (
                          <Badge variant="secondary" className="text-xs">
                            {entity.code}
                          </Badge>
                        )}
                        {entity.description && (
                          <p className="text-xs text-arc-slate-500 truncate">
                            {entity.description}
                          </p>
                        )}
                        {entity.type && (
                          <Badge variant="outline" className="text-xs">
                            {entity.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-arc-orange-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {isExcluded && (
                      <Badge variant="outline" className="text-xs text-arc-slate-400">
                        Already added
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => searchEntities(page + 1)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading && results.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-arc-orange-500" />
        </div>
      )}
    </div>
  );
}

export default EntitySearchPicker;
