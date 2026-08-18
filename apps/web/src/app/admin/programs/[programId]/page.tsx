"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, WorkspaceTabs, CurriculumJourney } from "@/components/admin";
import { programsApi, curriculumApi, questionsApi, assessmentsApi } from "@/lib/api/client";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import {
  BookOpen,
  Layers,
  FileText,
  Play,
  HelpCircle,
  Users,
  Award,
  TrendingUp,
  Plus,
  Edit,
  RefreshCw,
  Eye,
  Clock,
  ChevronRight,
  Search,
  Minimize2,
  Maximize2,
} from "lucide-react";

// Types
interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  programType?: string;
  imageUrl?: string | null;
  _count?: {
    curriculums: number;
    enrollments: number;
    assessments: number;
  };
}

interface Curriculum {
  id: string;
  name: string;
  slug: string;
  gradeLevel?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  _count?: {
    items: number;
    learnerProfiles: number;
  };
  items?: any[];
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: {
    modules: number;
  };
  modules?: Module[];
  curriculumId?: string;
  curriculumName?: string;
}

interface Module {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: {
    topics: number;
  };
  topics?: Topic[];
  subjectId?: string;
  subjectName?: string;
  curriculumId?: string;
  curriculumName?: string;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: {
    lessons: number;
  };
  lessons?: Lesson[];
  moduleId?: string;
  moduleName?: string;
  subjectId?: string;
  subjectName?: string;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  durationMinutes?: number;
  topicId?: string;
  topicName?: string;
  moduleId?: string;
  moduleName?: string;
  subjectId?: string;
  subjectName?: string;
}

interface Question {
  id: string;
  stem: string;
  type: string;
  difficulty: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW";
}

interface Assessment {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  _count?: {
    questions: number;
  };
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
        <p className="text-arc-slate-500">Loading program...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ProgramOverviewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProgramOverviewContent />
    </Suspense>
  );
}

// Inner component that uses useSearchParams
function ProgramOverviewContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.programId as string;

  // Get initial tab from URL params
  const urlTab = searchParams.get("tab");

  const [program, setProgram] = useState<Program | null>(null);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Search and expand state for list views
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  // Toggle functions
  const toggleSubject = (id: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubjects(newSet);
  };

  const toggleModule = (id: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedModules(newSet);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedSubjects(new Set());
      setExpandedModules(new Set());
    } else {
      setExpandedSubjects(new Set(subjects.map(s => s.id)));
      setExpandedModules(new Set(modules.map(m => m.id)));
    }
    setAllExpanded(!allExpanded);
  };

  // Update tab when URL changes
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Fetch program and curriculums
  useEffect(() => {
    fetchData();
  }, [programId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [programsData, curriculumsData, questionsData, assessmentsData] = await Promise.all([
        programsApi.list().catch((e) => {
          console.error("Programs API error:", e);
          return [];
        }),
        curriculumApi.list(programId).catch((e) => {
          console.error("Curriculum API error:", e);
          return [];
        }),
        questionsApi.list().catch((e) => {
          console.error("Questions API error:", e);
          return [];
        }),
        assessmentsApi.list({ programId }).catch((e) => {
          console.error("Assessments API error:", e);
          return [];
        }),
      ]);

      console.log("Programs:", programsData);
      console.log("Curriculums:", curriculumsData);

      // Find the specific program from the list
      if (Array.isArray(programsData)) {
        const found = programsData.find((p: any) => p.id === programId);
        if (found) {
          setProgram(found as Program);
        } else {
          setProgram((programsData as Program[])[0] || null);
        }
      }

      // Set curriculums
      if (curriculumsData && Array.isArray(curriculumsData)) {
        setCurriculums(curriculumsData as Curriculum[]);

        // Extract subjects, modules, lessons from curriculum hierarchy
        const allSubjects: Subject[] = [];
        const allModules: Module[] = [];
        const allLessons: Lesson[] = [];
        const seenSubjectIds = new Set<string>();
        const seenModuleIds = new Set<string>();
        const seenLessonIds = new Set<string>();

        for (const curriculum of curriculumsData as any[]) {
          for (const item of curriculum.items || []) {
            const subject = item.subject;
            if (subject && !seenSubjectIds.has(subject.id)) {
              seenSubjectIds.add(subject.id);
              allSubjects.push({
                id: subject.id,
                name: subject.name,
                code: subject.code,
                color: subject.color,
                slug: subject.slug,
                status: subject.status,
                _count: { modules: subject.modules?.length || 0 },
                modules: subject.modules,
                curriculumId: curriculum.id,
                curriculumName: curriculum.name,
              });

              // Extract modules from this subject
              for (const module of subject.modules || []) {
                if (!seenModuleIds.has(module.id)) {
                  seenModuleIds.add(module.id);
                  allModules.push({
                    id: module.id,
                    name: module.name,
                    slug: module.slug,
                    description: module.description,
                    status: module.status,
                    _count: { topics: module.topics?.length || 0 },
                    topics: module.topics,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    curriculumId: curriculum.id,
                    curriculumName: curriculum.name,
                  });

                  // Extract topics and lessons from this module
                  for (const topic of module.topics || []) {
                    // Extract lessons from this topic
                    for (const lesson of topic.lessons || []) {
                      if (!seenLessonIds.has(lesson.id)) {
                        seenLessonIds.add(lesson.id);
                        allLessons.push({
                          id: lesson.id,
                          title: lesson.title,
                          slug: lesson.slug,
                          type: lesson.type,
                          status: lesson.status,
                          durationMinutes: lesson.durationMinutes,
                          topicId: topic.id,
                          topicName: topic.name,
                          moduleId: module.id,
                          moduleName: module.name,
                          subjectId: subject.id,
                          subjectName: subject.name,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }

        setSubjects(allSubjects);
        setModules(allModules);
        setLessons(allLessons);

        console.log("Extracted subjects:", allSubjects);
        console.log("Extracted modules:", allModules);
        console.log("Extracted lessons:", allLessons);
      }

      // Set questions and assessments
      if (questionsData && Array.isArray(questionsData)) {
        setQuestions(questionsData as Question[]);
      }
      if (assessmentsData && Array.isArray(assessmentsData)) {
        setAssessments(assessmentsData as Assessment[]);
      }
    } catch (err) {
      console.error("Failed to fetch program data:", err);
      setError("Failed to load program data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProgram = () => {
    router.push(`/admin/programs/${programId}/edit`);
  };

  const handleAddCurriculum = () => {
    router.push(`/admin/curriculums/new?programId=${programId}`);
  };

  const handleViewCurriculum = (curriculumId: string) => {
    router.push(`/admin/programs/${programId}/curriculum/${curriculumId}`);
  };

  const handlePublishProgram = async () => {
    if (!program) return;
    try {
      await programsApi.publish(programId);
      setProgram({ ...program, status: "PUBLISHED" });
    } catch (err) {
      console.error("Failed to publish program:", err);
      alert("Failed to publish program");
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Program not found</h2>
          <p className="text-arc-slate-500 mb-4">The program you are looking for does not exist.</p>
          <Link href="/admin/programs">
            <Button variant="accent">Back to Programs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Curriculums", value: program._count?.curriculums || curriculums.length || 0, icon: Layers },
    { label: "Enrollments", value: program._count?.enrollments || 0, icon: Users },
    { label: "Assessments", value: program._count?.assessments || 0, icon: Award },
  ];

  return (
    <>
      <WorkspaceHeader
        title={program.name}
        subtitle={program.description}
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: program.name },
        ]}
        badge={program.status}
        badgeVariant={program.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={stats}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEditProgram}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Program
            </Button>
            {program.status === "DRAFT" && (
              <Button variant="accent" size="sm" onClick={handlePublishProgram}>
                Publish Program
              </Button>
            )}
          </div>
        }
      />

      <WorkspaceTabs
        tabs={[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "curriculum", label: "Curriculum", icon: BookOpen },
          { id: "subjects", label: "Subjects", icon: Layers },
          { id: "modules", label: "Modules", icon: FileText },
          { id: "lessons", label: "Lessons", icon: Play },
          { id: "questions", label: "Questions", icon: HelpCircle },
          { id: "assessments", label: "Assessments", icon: Award },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <p className="text-yellow-700 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-arc-orange-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-arc-navy-900">{stat.value}</div>
                        <div className="text-sm text-arc-slate-500">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Curriculum Journey Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-arc-navy-900">Curriculum Journey</h3>
                  <Button variant="outline" size="sm" onClick={() => handleTabChange("curriculum")}>
                    View All
                  </Button>
                </div>
                <CurriculumJourney
                  curriculums={curriculums}
                  programId={programId}
                  onView={handleViewCurriculum}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-arc-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-arc-slate-300" />
                  <p>Activity tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Curriculum Tab */}
        {activeTab === "curriculum" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-arc-navy-900">Curriculums</h2>
              <Button variant="accent" size="sm" onClick={handleAddCurriculum}>
                <Plus className="h-4 w-4 mr-2" />
                Add Curriculum
              </Button>
            </div>
            <CurriculumJourney
              curriculums={curriculums}
              programId={programId}
              onView={handleViewCurriculum}
            />
          </div>
        )}

        {/* Subjects Tab - List View with Hierarchy */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            {/* Header with search and controls */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-arc-navy-900">Subjects ({subjects.length})</h2>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 w-64"
                  />
                </div>
                {/* Expand/Collapse All */}
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {allExpanded ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
                  {allExpanded ? "Collapse All" : "Expand All"}
                </Button>
                {/* Add Subject */}
                <Link href={`/admin/subjects/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </Link>
              </div>
            </div>

            {/* Empty State */}
            {subjects.length === 0 ? (
              <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
                <Layers className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Subjects Yet</h3>
                <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
                  Create your first subject to start building your curriculum.
                </p>
                <Link href={`/admin/subjects/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </Link>
              </div>
            ) : (
              /* Hierarchical List */
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-arc-slate-500 bg-arc-slate-50 rounded-lg">
                  <div className="w-6"></div>
                  <div className="flex-1">Name</div>
                  <div className="w-24 text-center">Modules</div>
                  <div className="w-24 text-center">Topics</div>
                  <div className="w-20 text-center">Status</div>
                  <div className="w-20"></div>
                </div>

                {/* Subject Rows with Modules */}
                {subjects
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((subject) => {
                    const isExpanded = expandedSubjects.has(subject.id);
                    const isPublished = subject.status === "PUBLISHED";
                    const moduleCount = subject.modules?.length || 0;
                    const topicCount = subject.modules?.reduce((sum, m) => sum + (m.topics?.length || 0), 0) || 0;

                    return (
                      <div key={subject.id} className="space-y-1">
                        {/* Subject Row */}
                        <div
                          className={`flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors ${isExpanded ? "rounded-b-none border-b-0" : ""}`}
                        >
                          <button
                            onClick={() => toggleSubject(subject.id)}
                            className="flex items-center justify-center w-6 h-6 rounded hover:bg-arc-slate-100"
                          >
                            <ChevronRight className={`h-4 w-4 text-arc-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>

                          {/* Subject Icon & Name */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                              style={{ backgroundColor: subject.color || "#6366f1" }}
                            >
                              {subject.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-arc-navy-900 truncate">{subject.name}</div>
                              {subject.code && (
                                <div className="text-xs text-arc-slate-500">{subject.code}</div>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="w-24 text-center text-sm text-arc-slate-600">{moduleCount}</div>
                          <div className="w-24 text-center text-sm text-arc-slate-600">{topicCount}</div>

                          {/* Status */}
                          <div className="w-20 text-center">
                            <Badge
                              variant={isPublished ? "published" : subject.status === "ARCHIVED" ? "archived" : "draft"}
                              className="text-xs"
                            >
                              {subject.status}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="w-20">
                            <Link href={`/admin/subjects/${subject.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Expanded Modules */}
                        {isExpanded && subject.modules?.map((module) => {
                          const isModuleExpanded = expandedModules.has(module.id);
                          const isModulePublished = module.status === "PUBLISHED";
                          const topicCount = module.topics?.length || 0;

                          return (
                            <div key={module.id} className="pl-10 space-y-1">
                              {/* Module Row */}
                              <div
                                className={`flex items-center gap-2 px-4 py-2 bg-arc-slate-50 rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors ${isModuleExpanded ? "rounded-b-none border-b-0" : ""}`}
                              >
                                <button
                                  onClick={() => toggleModule(module.id)}
                                  className="flex items-center justify-center w-5 h-5 rounded hover:bg-arc-slate-200"
                                >
                                  <ChevronRight className={`h-3.5 w-3.5 text-arc-slate-400 transition-transform ${isModuleExpanded ? "rotate-90" : ""}`} />
                                </button>

                                {/* Module Name */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-arc-slate-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-arc-navy-900 truncate">{module.name}</div>
                                    {module.description && (
                                      <div className="text-xs text-arc-slate-500 truncate">{module.description}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="w-24 text-center text-sm text-arc-slate-600">{topicCount}</div>
                                <div className="w-24"></div>

                                {/* Status */}
                                <div className="w-20 text-center">
                                  <Badge
                                    variant={isModulePublished ? "published" : module.status === "ARCHIVED" ? "archived" : "draft"}
                                    className="text-xs"
                                  >
                                    {module.status}
                                  </Badge>
                                </div>

                                {/* Actions */}
                                <div className="w-20">
                                  <Link href={`/admin/modules/${module.id}`}>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>

                              {/* Expanded Topics */}
                              {isModuleExpanded && module.topics?.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="pl-16 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-arc-slate-100 hover:border-arc-orange-300 transition-colors"
                                >
                                  <Layers className="h-4 w-4 text-arc-slate-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-arc-navy-900 truncate">{topic.name}</div>
                                    {topic.description && (
                                      <div className="text-xs text-arc-slate-500 truncate">{topic.description}</div>
                                    )}
                                  </div>
                                  <div className="w-24"></div>
                                  <div className="w-24 text-center text-sm text-arc-slate-600">
                                    {topic._count?.lessons || 0} lessons
                                  </div>
                                  <div className="w-20"></div>
                                  <div className="w-20">
                                    <Link href={`/admin/topics/${topic.id}`}>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-arc-navy-900">Modules ({modules.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 w-64"
                  />
                </div>
                <Link href={`/admin/modules/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </Link>
              </div>
            </div>
            {modules.length === 0 ? (
              <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
                <FileText className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Modules Yet</h3>
                <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
                  Create your first module to organize your content.
                </p>
                <Link href={`/admin/modules/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-arc-slate-500 bg-arc-slate-50 rounded-lg">
                  <div className="flex-1">Name</div>
                  <div className="w-32">Subject</div>
                  <div className="w-24 text-center">Topics</div>
                  <div className="w-20 text-center">Status</div>
                  <div className="w-16"></div>
                </div>
                {modules
                  .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((module) => {
                    const isPublished = module.status === "PUBLISHED";
                    const topicCount = module.topics?.length || 0;
                    return (
                      <div
                        key={module.id}
                        className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-arc-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-arc-navy-900 truncate">{module.name}</div>
                          {module.description && (
                            <div className="text-xs text-arc-slate-500 truncate">{module.description}</div>
                          )}
                        </div>
                        <div className="w-32 text-sm text-arc-slate-600 truncate">
                          {module.subjectName || "-"}
                        </div>
                        <div className="w-24 text-center text-sm text-arc-slate-600">{topicCount}</div>
                        <div className="w-20 text-center">
                          <Badge
                            variant={isPublished ? "published" : module.status === "ARCHIVED" ? "archived" : "draft"}
                            className="text-xs"
                          >
                            {module.status}
                          </Badge>
                        </div>
                        <div className="w-16">
                          <Link href={`/admin/modules/${module.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-arc-navy-900">Lessons ({lessons.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 w-64"
                  />
                </div>
                <Link href={`/admin/lessons/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </Link>
              </div>
            </div>
            {lessons.length === 0 ? (
              <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
                <Play className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Lessons Yet</h3>
                <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
                  Create your first lesson to deliver content to learners.
                </p>
                <Link href={`/admin/lessons/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-arc-slate-500 bg-arc-slate-50 rounded-lg">
                  <div className="flex-1">Title</div>
                  <div className="w-28 text-center">Type</div>
                  <div className="w-32">Path</div>
                  <div className="w-20 text-center">Status</div>
                  <div className="w-16"></div>
                </div>
                {lessons
                  .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((lesson) => {
                    const isPublished = lesson.status === "PUBLISHED";
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors"
                      >
                        <Play className="h-5 w-5 text-arc-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-arc-navy-900 truncate">{lesson.title}</div>
                          {lesson.durationMinutes && (
                            <div className="text-xs text-arc-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.durationMinutes} min
                            </div>
                          )}
                        </div>
                        <div className="w-28 text-center">
                          <Badge variant="outline" className="text-xs capitalize">
                            {lesson.type?.replace("_", " ").toLowerCase()}
                          </Badge>
                        </div>
                        <div className="w-32 text-xs text-arc-slate-500 truncate">
                          {lesson.subjectName && (
                            <span className="flex items-center gap-1">
                              {lesson.subjectName}
                              {lesson.moduleName && <ChevronRight className="h-3 w-3" />}
                              {lesson.moduleName}
                            </span>
                          )}
                        </div>
                        <div className="w-20 text-center">
                          <Badge
                            variant={isPublished ? "published" : lesson.status === "ARCHIVED" ? "archived" : "draft"}
                            className="text-xs"
                          >
                            {lesson.status}
                          </Badge>
                        </div>
                        <div className="w-16">
                          <Link href={`/admin/lessons/${lesson.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-arc-navy-900">Question Bank ({questions.length})</h2>
              <Link href={`/admin/question-bank/new?programId=${programId}`}>
                <Button variant="accent" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </Link>
            </div>
            {questions.length === 0 ? (
              <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
                <HelpCircle className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No Questions Yet
                </h3>
                <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
                  Create your first question to build your question bank.
                </p>
                <Link href={`/admin/question-bank/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.slice(0, 20).map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-arc-navy-900 line-clamp-2">
                            {question.stem.length > 150 ? `${question.stem.substring(0, 150)}...` : question.stem}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {question.type?.replace("_", " ").toLowerCase()}
                            </Badge>
                            <Badge
                              variant={
                                question.difficulty === "EASY" ? "success" :
                                question.difficulty === "MEDIUM" ? "warning" :
                                question.difficulty === "HARD" ? "alert" : "default"
                              }
                              className="text-xs"
                            >
                              {question.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant={question.status === "PUBLISHED" ? "published" : question.status === "UNDER_REVIEW" ? "warning" : "draft"}
                          className="text-xs"
                        >
                          {question.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {questions.length > 20 && (
                  <div className="text-center pt-4">
                    <Link href="/admin/question-bank">
                      <Button variant="outline">View all {questions.length} questions</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === "assessments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-arc-navy-900">Assessments ({assessments.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-arc-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-arc-orange-500 w-64"
                  />
                </div>
                <Link href={`/admin/assessments/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </Link>
              </div>
            </div>
            {assessments.length === 0 ? (
              <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
                <Award className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Assessments Yet</h3>
                <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
                  Create your first assessment to test learner knowledge.
                </p>
                <Link href={`/admin/assessments/new?programId=${programId}`}>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-arc-slate-500 bg-arc-slate-50 rounded-lg">
                  <div className="flex-1">Name</div>
                  <div className="w-28 text-center">Type</div>
                  <div className="w-24 text-center">Questions</div>
                  <div className="w-20 text-center">Status</div>
                  <div className="w-16"></div>
                </div>
                {assessments
                  .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((assessment) => {
                    const isPublished = assessment.status === "PUBLISHED";
                    return (
                      <div
                        key={assessment.id}
                        className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-arc-slate-200 hover:border-arc-orange-300 transition-colors"
                      >
                        <Award className="h-5 w-5 text-arc-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-arc-navy-900 truncate">{assessment.name}</div>
                        </div>
                        <div className="w-28 text-center">
                          <Badge variant="outline" className="text-xs capitalize">
                            {assessment.type?.replace("_", " ").toLowerCase()}
                          </Badge>
                        </div>
                        <div className="w-24 text-center text-sm text-arc-slate-600">
                          {assessment._count?.questions || 0}
                        </div>
                        <div className="w-20 text-center">
                          <Badge
                            variant={isPublished ? "published" : assessment.status === "ARCHIVED" ? "archived" : "draft"}
                            className="text-xs"
                          >
                            {assessment.status}
                          </Badge>
                        </div>
                        <div className="w-16">
                          <Link href={`/admin/assessments/${assessment.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
