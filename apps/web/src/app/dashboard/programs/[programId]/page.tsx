"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Button, Badge, Progress } from "@/components/ui";
import { programsApi, progressionApi } from "@/lib/api/client";
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  FileQuestion,
  Clock,
  Target,
  Layers,
  ListTree,
  GraduationCap,
  Play,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/* ---- API response shapes (subset used by the UI) ---- */

interface LessonNode {
  id: string;
  title: string;
  slug: string;
  durationMinutes?: number | null;
}
interface TopicNode {
  id: string;
  name: string;
  lessons: LessonNode[];
}
interface ModuleNode {
  id: string;
  name: string;
  topics: TopicNode[];
}
interface SubjectNode {
  id: string;
  name: string;
  customName?: string | null;
  modules: ModuleNode[];
}
interface CurriculumItemNode {
  id: string;
  subject: SubjectNode;
}
interface CurriculumNode {
  id: string;
  name: string;
  gradeLevel: number;
  stage: string;
  items: CurriculumItemNode[];
}
interface ProgramAssessmentNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  questionCount?: number | null;
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  randomizeQuestions?: boolean;
  allowRetake?: boolean;
  maxAttempts?: number | null;
  _count?: { questions?: number };
}
interface ProgramHierarchy {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  programType?: string | null;
  curriculums: CurriculumNode[];
  assessments: ProgramAssessmentNode[];
}

interface ProgTopic {
  id: string;
  name: string;
  percent: number;
  mastery: string;
  tracked: boolean;
}
interface ProgSubject {
  id: string;
  name: string;
  percent: number;
  mastered: boolean;
  topicCount: number;
  topics: ProgTopic[];
}
interface ProgGrade {
  curriculumId: string;
  name: string;
  gradeLevel: number;
  stage: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: ProgSubject[];
}
interface ProgressionResult {
  program: { id: string; name: string } | null;
  gate: number;
  grades: ProgGrade[];
}

// CS#23.5 — deterministic lesson-weighted program completion (GET /progression/programs/:id/completion)
interface ProgramCompletion {
  program: { id: string; name: string };
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  mastery: string;
  subjects: {
    subjectId: string;
    name: string;
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
  }[];
}

const stageLabel: Record<string, string> = {
  BASIC_EDUCATION: "Basic Education",
  ENTRANCE_EXAM: "College Entrance Exam",
  BOARD_EXAM: "Board Exam",
  PROFESSIONAL: "Professional",
};

const assessmentTypeLabels: Record<string, string> = {
  QUIZ: "Quiz",
  PRACTICE: "Practice Assessment",
  DIAGNOSTIC: "Diagnostic Assessment",
  MOCK_EXAM: "Mock Examination",
  ASSIGNMENT: "Assignment",
  CET_SIMULATION: "CET Simulation",
};

/** Flatten every lesson across the hierarchy (ordered subject → module → topic). */
function flattenLessons(hierarchy?: ProgramHierarchy | null): LessonNode[] {
  if (!hierarchy) return [];
  const out: LessonNode[] = [];
  for (const cur of hierarchy.curriculums)
    for (const item of cur.items)
      for (const mod of item.subject.modules)
        for (const topic of mod.topics) out.push(...topic.lessons);
  return out;
}

export default function StudentProgramOverviewPage() {
  const params = useParams();
  const programId = params.programId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hierarchy, setHierarchy] = useState<ProgramHierarchy | null>(null);
  const [progression, setProgression] = useState<ProgressionResult | null>(null);
  const [completion, setCompletion] = useState<ProgramCompletion | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // ID → slug, then full published curriculum hierarchy.
        const meta = (await programsApi.getById(programId)) as { id: string; slug: string };
        const prog = (await programsApi.getBySlug(meta.slug)) as ProgramHierarchy;
        const progData = (await progressionApi.get(programId)) as ProgressionResult;
        if (!active) return;
        setHierarchy(prog);
        setProgression(progData);
        // Expand the first subject by default so the tree reads immediately.
        const firstSubject = prog.curriculums[0]?.items[0]?.subject?.id;
        if (firstSubject) setExpanded({ [firstSubject]: true });
      } catch (err) {
        if (!active) return;
        console.error("Failed to load program overview:", err);
        setError(
          "This program could not be loaded. It may be unpublished, or your account may not be enrolled in it."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [programId]);

  // CS#23.5 — program completion (enrollment-gated). Fetched separately so a
  // non-critical completion failure never takes down the whole overview.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const completionData = (await progressionApi.programCompletion(programId)) as ProgramCompletion;
        if (active) setCompletion(completionData);
      } catch (err) {
        if (active) {
          console.warn("Completion unavailable for program", programId, err);
          setCompletion(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [programId]);

  // Real metadata derived from the published hierarchy + assessment.
  const subjects = hierarchy?.curriculums.flatMap((c) => c.items.map((i) => i.subject)) ?? [];
  const lessons = flattenLessons(hierarchy);
  const modules = subjects.flatMap((s) => s.modules);
  const topics = modules.flatMap((m) => m.topics);

  // CS#22.7 (H-4) — the assessment CTA is derived from the program's own
  // published assessments (mock exam first), never from a hardcoded BUCET slug.
  const programAssessments = hierarchy?.assessments ?? [];
  const primaryAssessment: ProgramAssessmentNode | null =
    programAssessments.find((a) => a.type === "MOCK_EXAM") ?? programAssessments[0] ?? null;
  const assessmentQuestions =
    primaryAssessment?.questionCount ?? primaryAssessment?._count?.questions ?? 0;
  const assessmentTypeLabel =
    (primaryAssessment && assessmentTypeLabels[primaryAssessment.type]) ||
    primaryAssessment?.type ||
    "Assessment";

  // Program-level progress = mean of all subject progress rows (0 if none tracked).
  const allSubjects = progression?.grades.flatMap((g) => g.subjects) ?? [];
  const overall =
    allSubjects.length > 0
      ? Math.round(allSubjects.reduce((sum, s) => sum + s.percent, 0) / allSubjects.length)
      : 0;

  const continueLessonId = lessons[0]?.id;

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const progressBySubject = new Map(
    allSubjects.map((s) => [s.id, s.percent] as [string, number])
  );

  const header = hierarchy?.name ?? progression?.program?.name ?? "Program";

  if (loading) {
    return (
      <>
        <DashboardHeader title="Program" subtitle="Loading program…" />
        <div className="p-6 flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500" />
        </div>
      </>
    );
  }

  if (error || !hierarchy) {
    return (
      <>
        <DashboardHeader title="Program" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center py-16">
            <GraduationCap className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">Program unavailable</h3>
            <p className="text-arc-slate-500 mb-6">{error}</p>
            <Link href="/dashboard/programs">
              <Button variant="outline">Back to My Programs</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Program Overview"
        subtitle={header}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Programs", href: "/dashboard/programs" },
          { label: header },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* ---- Program header ---- */}
        <div className="rounded-2xl bg-arc-navy-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-arc-navy-900 via-arc-navy-800 to-arc-navy-700" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-12">
            <Link
              href="/dashboard/programs"
              className="inline-flex items-center gap-1 text-xs text-arc-navy-200 hover:text-white mb-5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to My Programs
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-arc-orange-300 mb-2">
              <GraduationCap className="h-4 w-4" />
              ARC Review Center
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold font-heading mb-2">{header}</h1>
            <p className="text-sm sm:text-base text-arc-navy-100 max-w-2xl leading-relaxed">
              {hierarchy.description || "Prepare. Practice. Measure your progress."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {continueLessonId ? (
                <Link href={`/dashboard/lessons/${continueLessonId}`}>
                  <Button className="bg-arc-orange-500 hover:bg-arc-orange-600 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </Link>
              ) : null}
              {primaryAssessment ? (
                <Link href={`/dashboard/assessments/${primaryAssessment.id}`}>
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    <Target className="h-4 w-4 mr-2" />
                    Start {assessmentTypeLabel.replace(" Assessment", "")}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* ---- Quick stats (real, derived) ---- */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
          <Stat icon={<BookOpen />} label="Lessons" value={lessons.length} />
          <Stat icon={<ListTree />} label="Subjects" value={subjects.length} />
          <Stat icon={<Layers />} label="Modules" value={modules.length} />
          <Stat icon={<FileQuestion />} label="Topics" value={topics.length} />
          <Stat
            icon={<Target />}
            label={primaryAssessment ? assessmentTypeLabel.replace(" Assessment", "") : "Assessment"}
            value={assessmentQuestions || "—"}
          />
          <Stat
            icon={<CheckCircle2 />}
            label="Completion"
            value={completion ? `${completion.completionPercentage}%` : "—"}
          />
        </div>

        {/* ---- CS#23.5 Program completion card (real, enrollment-gated) ---- */}
        {completion ? (
          <div className="rounded-2xl border border-arc-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-arc-navy-900">Your completion</h2>
              <Badge variant={completion.completionPercentage >= (progression?.gate ?? 95) ? "success" : "info"}>
                {completion.mastery}
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-arc-slate-500 mb-1.5">
                <span>
                  {completion.completedLessons} of {completion.totalLessons} lessons completed
                </span>
                <span className="font-semibold text-arc-navy-900">{completion.completionPercentage}%</span>
              </div>
              <Progress
                value={completion.completionPercentage}
                variant={completion.completionPercentage >= (progression?.gate ?? 95) ? "mastery" : "learning"}
              />
            </div>
          </div>
        ) : null}


        {/* ---- Body: curriculum + mock exam ---- */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Curriculum tree */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-arc-navy-900">Curriculum</h2>
              {allSubjects.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-arc-slate-500">
                  <Progress
                    value={overall}
                    variant={overall >= (progression?.gate ?? 95) ? "mastery" : "learning"}
                    className="w-36"
                    showLabel
                  />
                </div>
              )}
            </div>

            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-arc-slate-300 bg-white p-10 text-center">
                <BookOpen className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
                <p className="text-arc-slate-500">This program has no published curriculum yet.</p>
              </div>
            ) : (
              subjects.map((subject) => {
                const isOpen = !!expanded[subject.id];
                const subjPercent = progressBySubject.get(subject.id) ?? 0;
                return (
                  <div key={subject.id} className="rounded-2xl border border-arc-slate-200 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(subject.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-arc-slate-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isOpen ? "bg-arc-navy-900 text-white" : "bg-arc-navy-100 text-arc-navy-700"
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="font-semibold text-arc-navy-900 block">
                          {subject.customName || subject.name}
                        </span>
                        <span className="text-xs text-arc-slate-500">
                          {subject.modules.length} module
                          {subject.modules.length === 1 ? "" : "s"} ·{" "}
                          {subject.modules.reduce((a, m) => a + m.topics.length, 0)} topics
                        </span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="w-20 hidden sm:block">
                          <Progress value={subjPercent} variant="learning" size="sm" />
                        </span>
                        <span className="text-sm font-medium text-arc-slate-600 w-9 text-right">
                          {subjPercent}%
                        </span>
                        {isOpen ? (
                          <ChevronDown className="h-5 w-5 text-arc-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-arc-slate-400" />
                        )}
                      </span>
                    </button>


                    {isOpen && (
                      <div className="border-t border-arc-slate-100 px-5 py-4 space-y-4 bg-arc-slate-50/50">
                        {subject.modules.map((mod) => (
                          <div key={mod.id}>
                            <div className="flex items-center gap-2 text-sm font-semibold text-arc-navy-800 mb-2">
                              <Layers className="h-4 w-4 text-arc-purple-500" />
                              {mod.name}
                            </div>
                            <div className="space-y-1.5 ml-6">
                              {mod.topics.map((topic) => (
                                <div key={topic.id}>
                                  <div className="flex items-center gap-2 text-sm text-arc-slate-600 font-medium">
                                    <ChevronRight className="h-3.5 w-3.5 text-arc-slate-300" />
                                    {topic.name}
                                    <span className="text-xs text-arc-slate-400">
                                      · {topic.lessons.length} lesson
                                      {topic.lessons.length === 1 ? "" : "s"}
                                    </span>
                                  </div>
                                  {topic.lessons.length > 0 && (
                                    <div className="ml-6 mt-1 mb-3 space-y-1">
                                      {topic.lessons.map((lesson) => (
                                        <Link
                                          key={lesson.id}
                                          href={`/dashboard/lessons/${lesson.id}`}
                                          className="flex items-center gap-2 text-sm text-arc-slate-600 hover:text-arc-orange-600 rounded-lg px-2 py-1 hover:bg-arc-orange-50 transition-colors"
                                        >
                                          <span className="h-1.5 w-1.5 rounded-full bg-arc-slate-300 flex-shrink-0" />
                                          {lesson.title}
                                          {lesson.durationMinutes ? (
                                            <span className="ml-auto flex items-center gap-1 text-xs text-arc-slate-400 shrink-0">
                                              <Clock className="h-3 w-3" />
                                              {lesson.durationMinutes}m
                                            </span>
                                          ) : null}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>


          {/* Assessment CTA card + about */}
          <div className="space-y-6">
            {primaryAssessment ? (
              <div className="rounded-2xl border border-arc-purple-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-arc-purple-50 px-5 py-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-arc-purple-700">
                    <Target className="h-4 w-4" />
                    {assessmentTypeLabel}
                  </span>
                  <Badge variant="practice">Demo</Badge>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-arc-navy-900">{primaryAssessment.name}</h3>
                  {primaryAssessment.description && (
                    <p className="text-sm text-arc-slate-500 mt-1 line-clamp-2">{primaryAssessment.description}</p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Meta icon={<FileQuestion />} label="Questions" value={String(assessmentQuestions || 0)} />
                    <Meta icon={<Clock />} label="Time" value={primaryAssessment.timeLimitMinutes ? `${primaryAssessment.timeLimitMinutes} min` : "—"} />
                    <Meta icon={<Target />} label="Passing" value={primaryAssessment.passingScore ? `${primaryAssessment.passingScore}%` : "—"} />
                    <Meta icon={<Sparkles />} label="Randomized" value={primaryAssessment.randomizeQuestions ? "Questions" : "—"} />
                  </div>

                  <div className="mt-4 text-xs text-arc-slate-500 flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-arc-green-500 mt-0.5 flex-shrink-0" />
                    Your attempt is preserved if you refresh or resume.
                  </div>

                  <Link href={`/dashboard/assessments/${primaryAssessment.id}`} className="block mt-4">
                    <Button variant="accent" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Start {assessmentTypeLabel.replace(" Assessment", "")}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-arc-slate-200 bg-white p-5 text-center">
                <Target className="h-8 w-8 text-arc-slate-300 mx-auto mb-2" />
                <p className="text-sm text-arc-slate-500">
                  No assessments have been published for this program yet.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-arc-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-arc-slate-500 uppercase tracking-wide mb-3">
                About this program
              </h3>
              <p className="text-sm text-arc-slate-600 leading-relaxed">
                {hierarchy.description ||
                  "This program helps students prepare for college entrance testing and academic readiness through reviewer lessons, practice questions, mock examinations, and progress tracking."}
              </p>
              {hierarchy.programType && (
                <div className="mt-3">
                  <Badge variant="info">{stageLabel[hierarchy.programType] || hierarchy.programType}</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-arc-slate-200 bg-white p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-arc-navy-100 text-arc-navy-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-arc-navy-900 leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-arc-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-arc-slate-50 px-3 py-2 flex items-center gap-2">
      <span className="text-arc-purple-600 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-arc-slate-400">{label}</div>
        <div className="text-sm font-semibold text-arc-navy-900 truncate">{value}</div>
      </div>
    </div>
  );
}

