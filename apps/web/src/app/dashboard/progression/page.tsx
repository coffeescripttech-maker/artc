"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button } from "@/components/ui";
import { Gauge as ProgressIcon, Lock, Unlock, Trophy, TrendingUp, Minus, AlertCircle, RefreshCw, ChevronRight, BookOpen } from "lucide-react";
import { progressApi, enrollmentsApi } from "@/lib/api/client";
import { DEFAULT_MASTERY_GATE, MASTERY_BANDS, MASTERY_BAND_CLASSES } from "@/lib/mastery-constants";
import { cn } from "@aratc/ui";

interface TopicView {
  id: string;
  name: string;
  percent: number;
  mastery: string;
  tracked: boolean;
}

interface SubjectView {
  id: string;
  name: string;
  percent: number;
  mastered: boolean;
  topicCount: number;
  topics: TopicView[];
}

interface GradeView {
  curriculumId: string;
  name: string;
  gradeLevel: string;
  stage: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: SubjectView[];
}

interface ProgressionData {
  program: { id: string; name: string } | null;
  gate: number;
  grades: GradeView[];
}

// Mastery band icon component
function MasteryIcon({ mastery, className }: { mastery: string; className?: string }) {
  switch (mastery) {
    case "MASTERED":
      return <Trophy className={cn("h-4 w-4", className)} />;
    case "PROFICIENT":
      return <TrendingUp className={cn("h-4 w-4", className)} />;
    case "PRACTICING":
      return <TrendingUp className={cn("h-4 w-4", className)} />;
    case "LEARNING":
      return <Minus className={cn("h-4 w-4", className)} />;
    case "NOT_STARTED":
      return <AlertCircle className={cn("h-4 w-4", className)} />;
    default:
      return <RefreshCw className={cn("h-4 w-4", className)} />;
  }
}

// Get mastery band class for display
function getMasteryBandClass(mastery: string): string {
  switch (mastery) {
    case "MASTERED":
      return "bg-green-100 text-green-700";
    case "PROFICIENT":
      return "bg-emerald-100 text-emerald-700";
    case "PRACTICING":
      return "bg-yellow-100 text-yellow-700";
    case "LEARNING":
      return "bg-orange-100 text-orange-700";
    case "NOT_STARTED":
    default:
      return "bg-gray-100 text-gray-500";
  }
}

// Get mastery label
function getMasteryLabel(mastery: string): string {
  switch (mastery) {
    case "MASTERED":
      return MASTERY_BANDS.MASTERED;
    case "PROFICIENT":
      return MASTERY_BANDS.ALMOST_THERE;
    case "PRACTICING":
      return MASTERY_BANDS.DEVELOPING;
    case "LEARNING":
      return MASTERY_BANDS.NEEDS_REVIEW;
    case "NOT_STARTED":
    default:
      return MASTERY_BANDS.REBUILD;
  }
}

export default function ProgressionPage() {
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // CS#22.8: surface every ACTIVE enrolled program as a switcher so a learner
  // enrolled in both BUCET and CRP can view either program's progression.
  const [enrollments, setEnrollments] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mine = (await enrollmentsApi.mine()) as {
          id: string;
          active: boolean;
          status: string;
          program: { id: string; name: string; slug: string } | null;
        }[];
        const list = (Array.isArray(mine) ? mine : [])
          .filter((e) => e.active && e.status === "ACTIVE" && e.program)
          .map((e) => e.program!);
        setEnrollments(list);
      } catch {
        // Progression still loads below; the switcher is an enhancement.
      }
    })();
  }, []);

  useEffect(() => {
    async function fetchProgression() {
      try {
        setLoading(true);
        // null → backend default (current program); otherwise the selected program.
        const result = (await progressApi.progression(
          selectedProgramId ?? undefined
        )) as ProgressionData;
        setData(result);
        // Expand first grade by default
        if (result.grades.length > 0) {
          setExpandedGrades(new Set([result.grades[0].curriculumId]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load progression");
      } finally {
        setLoading(false);
      }
    }
    fetchProgression();
  }, [selectedProgramId]);

  const toggleGrade = (id: string) => {
    const next = new Set(expandedGrades);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedGrades(next);
  };

  const toggleSubject = (id: string) => {
    const next = new Set(expandedSubjects);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSubjects(next);
  };

  const gate = data?.gate ?? DEFAULT_MASTERY_GATE;

  // Calculate overall stats
  const totalGrades = data?.grades.length ?? 0;
  const masteredGrades = data?.grades.filter((g) => g.mastered).length ?? 0;
  const unlockedGrades = data?.grades.filter((g) => g.unlocked).length ?? 0;
  const overallPercent = totalGrades > 0
    ? Math.round(data!.grades.reduce((s, g) => s + g.percent, 0) / totalGrades)
    : 0;

  return (
    <>
      <DashboardHeader
        title="My Learning Progress"
        subtitle="Track your mastery journey through the curriculum"
      />

      {/* Program switcher (CS#22.8): both enrolled programs are reachable. */}
      {enrollments.length > 1 && (
        <div className="px-6 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-arc-slate-400 mr-1">
              Program
            </span>
            {enrollments.map((p) => {
              const isCurrent =
                selectedProgramId === p.id ||
                (selectedProgramId === null && data?.program?.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProgramId(p.id)}
                  aria-pressed={isCurrent}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-arc-orange-500",
                    isCurrent
                      ? "border-arc-orange-400 bg-arc-orange-50 text-arc-orange-700"
                      : "border-arc-slate-200 bg-white text-arc-slate-600 hover:border-arc-slate-300"
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Overall Progress Card */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Overall Progress</span>
                <ProgressIcon className="h-5 w-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-2">{overallPercent}%</div>
              <Progress value={overallPercent} className="h-2 bg-blue-400/30" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Levels Completed</span>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {masteredGrades}
                <span className="text-lg font-normal text-gray-400 ml-1">/ {totalGrades}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Mastered grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Unlocked</span>
                <Unlock className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {unlockedGrades}
                <span className="text-lg font-normal text-gray-400 ml-1">/ {totalGrades}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Available to study</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Mastery Gate</span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{gate}%</div>
              <p className="text-sm text-gray-500 mt-1">To master a level</p>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Mastery Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.values(MASTERY_BANDS).map((band) => (
                <div
                  key={band}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border",
                    MASTERY_BAND_CLASSES[band]
                  )}
                >
                  {band} {band !== MASTERY_BANDS.REBUILD ? `≥${band === MASTERY_BANDS.MASTERED ? gate : band === MASTERY_BANDS.ALMOST_THERE ? 90 : band === MASTERY_BANDS.DEVELOPING ? 80 : 70}%` : ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Ladder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ProgressIcon className="h-5 w-5 text-blue-600" />
              Learning Ladder
            </CardTitle>
            {data?.program && (
              <p className="text-sm text-gray-500 mt-1">{data.program.name}</p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : !data || data.grades.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Programs Yet</h3>
                <p className="text-gray-500">Enroll in a program to start tracking your progress.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.grades.map((grade, index) => (
                  <div
                    key={grade.curriculumId}
                    className={cn(
                      "border rounded-xl overflow-hidden transition-all",
                      grade.unlocked
                        ? "border-gray-200 hover:border-blue-300"
                        : "border-gray-200 bg-gray-50 opacity-75"
                    )}
                  >
                    {/* Grade Header */}
                    <button
                      onClick={() => toggleGrade(grade.curriculumId)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 text-left transition-colors",
                        grade.unlocked ? "hover:bg-gray-50" : "cursor-default"
                      )}
                      disabled={!grade.unlocked}
                    >
                      {/* Level Number */}
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                          grade.mastered
                            ? "bg-green-100 text-green-700"
                            : grade.unlocked
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        {index + 1}
                      </div>

                      {/* Grade Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{grade.name}</span>
                          {grade.mastered ? (
                            <Badge variant="mastery" className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              Mastered
                            </Badge>
                          ) : !grade.unlocked ? (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{grade.subjects.length} subjects</span>
                          <span>{grade.subjects.reduce((s, sub) => s + sub.topicCount, 0)} topics</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="w-32">
                          <Progress
                            value={grade.percent}
                            className={cn(
                              "h-2",
                              grade.mastered ? "" : "bg-gray-200"
                            )}
                          />
                          <div className="text-xs text-gray-500 mt-1 text-right">{grade.percent}%</div>
                        </div>

                        {/* Expand/Collapse */}
                        {grade.unlocked && (
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 text-gray-400 transition-transform",
                              expandedGrades.has(grade.curriculumId) && "rotate-90"
                            )}
                          />
                        )}
                        {!grade.unlocked && (
                          <Lock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Subjects */}
                    {grade.unlocked && expandedGrades.has(grade.curriculumId) && (
                      <div className="border-t bg-gray-50/50 p-4">
                        <div className="space-y-2">
                          {grade.subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                            >
                              {/* Subject Header */}
                              <button
                                onClick={() => toggleSubject(subject.id)}
                                className="w-full flex items-center gap-4 p-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                    subject.mastered
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-50 text-blue-600"
                                  )}
                                >
                                  <MasteryIcon mastery={subject.mastered ? "MASTERED" : "PRACTICING"} className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-900">{subject.name}</span>
                                  <Badge
                                    className={cn(
                                      "ml-2 text-xs",
                                      getMasteryBandClass(
                                        subject.mastered ? "MASTERED" : subject.percent >= 50 ? "PRACTICING" : "LEARNING"
                                      )
                                    )}
                                  >
                                    {getMasteryLabel(
                                      subject.mastered ? "MASTERED" : subject.percent >= 50 ? "PRACTICING" : "LEARNING"
                                    )}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-24">
                                    <Progress value={subject.percent} className="h-2" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-600 w-10 text-right">
                                    {subject.percent}%
                                  </span>
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 text-gray-400 transition-transform",
                                      expandedSubjects.has(subject.id) && "rotate-90"
                                    )}
                                  />
                                </div>
                              </button>

                              {/* Topics */}
                              {expandedSubjects.has(subject.id) && (
                                <div className="border-t bg-gray-50 p-3">
                                  <div className="space-y-2">
                                    {subject.topics.map((topic) => (
                                      <div
                                        key={topic.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100"
                                      >
                                        <MasteryIcon
                                          mastery={topic.mastery}
                                          className={cn(
                                            "h-4 w-4 shrink-0",
                                            topic.mastery === "MASTERED"
                                              ? "text-green-500"
                                              : topic.mastery === "NOT_STARTED"
                                              ? "text-gray-400"
                                              : "text-blue-500"
                                          )}
                                        />
                                        <span className="flex-1 text-sm text-gray-700">{topic.name}</span>
                                        <Badge
                                          className={cn(
                                            "text-xs shrink-0",
                                            getMasteryBandClass(topic.mastery)
                                          )}
                                        >
                                          {getMasteryLabel(topic.mastery)}
                                        </Badge>
                                        <Link href={`/dashboard/assessments?topic=${topic.id}`}>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                                            Practice
                                          </Button>
                                        </Link>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
