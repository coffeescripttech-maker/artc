"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardHeader, MasteryLadder } from "@/components/dashboard";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Progress } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { progressionApi, lessonsApi, progressApi } from "@/lib/api/client";
import { masteryBand } from "@/lib/mastery";
import {
  RefreshCw,
  BookOpen,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
} from "lucide-react";

interface TopicInfo {
  id: string;
  name: string;
  percent: number;
  mastery: string;
  tracked: boolean;
}

interface SubjectInfo {
  id: string;
  name: string;
  percent: number;
  mastered: boolean;
  topicCount: number;
  topics: TopicInfo[];
}

interface GradeInfo {
  curriculumId: string;
  name: string;
  gradeLevel: number;
  stage: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: SubjectInfo[];
}

interface ProgramInfo {
  id: string;
  name: string;
  slug: string;
}

interface WeakTopic {
  id: string;
  name: string;
  completionPercentage: number;
  mastery: string;
  topic: { id: string; name: string; module: { subject: { id: string; name: string } } };
}

interface LessonInfo {
  id: string;
  title: string;
  subject: string;
  progress: number;
  questionStats?: {
    answeredBlocks: number;
    totalBlocks: number;
    earnedPoints: number;
    totalPoints: number;
    correctAnswers: number;
  } | null;
}

interface ProgressionResult {
  program: ProgramInfo | null;
  gate: number;
  grades: GradeInfo[];
}

export default function MyProgramsPage() {
  const [loading, setLoading] = useState(true);
  const [progression, setProgression] = useState<ProgressionResult | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [studyLessons, setStudyLessons] = useState<LessonInfo[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const loadProgression = useCallback(async () => {
    setLoading(true);
    try {
      const [progData, weakData] = await Promise.all([
        progressionApi.get().catch(() => null),
        progressionApi.weakTopics().catch(() => null),
      ]);

      const prog = progData as ProgressionResult | null;
      setProgression(prog);
      setWeakTopics((weakData as { topics: WeakTopic[] })?.topics ?? []);

      // Fetch continue-learning lessons from first unlocked grade's first subject
      if (prog?.grades?.length) {
        const unlockedGrade = prog.grades.find((g) => g.unlocked);
        const unlockedSubjects = unlockedGrade?.subjects || [];
        if (unlockedSubjects.length > 0) {
          const firstSubjectId = unlockedSubjects[0].id;
          const subjectLessons = await lessonsApi.getBySubject(firstSubjectId).catch(() => []);
          if (Array.isArray(subjectLessons)) {
            const lessonsWithProgress = await Promise.all(
              subjectLessons.slice(0, 3).map(async (l: any) => {
                try {
                  const prog = (await progressApi
                    .getLessonWithQuestions(l.id)
                    .catch(() => null)) as {
                    completionPercentage: number;
                    questionStats: LessonInfo["questionStats"];
                  } | null;
                  return {
                    id: l.id,
                    title: l.title,
                    subject: l.topic?.module?.subject?.name || "Subject",
                    progress: prog?.completionPercentage ?? 0,
                    questionStats: prog?.questionStats ?? null,
                  };
                } catch {
                  return {
                    id: l.id,
                    title: l.title,
                    subject: l.topic?.module?.subject?.name || "Subject",
                    progress: 0,
                    questionStats: null,
                  };
                }
              })
            );
            setStudyLessons(lessonsWithProgress);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load progression:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgression();
  }, [loadProgression]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  if (loading) {
    return (
      <>
        <DashboardHeader title="My Programs" subtitle="Manage your enrolled programs" />
        <div className="p-6 flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="My Programs"
        subtitle={progression?.program?.name || "Manage your enrolled programs"}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Programs" },
        ]}
      />

      <div className="p-6">
        {progression && progression.program && (
          <>
            {/* Program Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">
                      <Link
                        href={`/dashboard/programs/${progression.program.id}`}
                        className="hover:text-arc-orange-600 transition-colors"
                      >
                        {progression.program.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-arc-slate-500 mt-1">
                      Mastery gate: <strong>{progression.gate}%</strong> to unlock the next grade level
                    </p>
                  </div>
                  <Link href={`/dashboard/programs/${progression.program.id}`} className="shrink-0">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      View Program
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <MasteryLadder grades={progression.grades} gate={progression.gate} />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-5 mb-8 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-arc-orange-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-arc-navy-900">{progression.grades.length}</div>
                      <div className="text-sm text-arc-slate-500">Grade Levels</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-arc-navy-900">
                        {Math.round(
                          progression.grades.reduce(
                            (sum, g) => sum + g.percent * g.subjects.length,
                            0
                          ) /
                            (progression.grades.reduce((sum, g) => sum + g.subjects.length, 0) || 1)
                        )}%
                      </div>
                      <div className="text-sm text-arc-slate-500">Overall Mastery</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-arc-navy-900">
                        {weakTopics.length}
                      </div>
                      <div className="text-sm text-arc-slate-500">Focus Areas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-arc-navy-900">{studyLessons.length}</div>
                      <div className="text-sm text-arc-slate-500">Lessons to Continue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject Breakdown by Grade */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-arc-navy-900">Subjects by Grade Level</h2>
              {progression.grades.map((grade) => (
                <Card key={grade.curriculumId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        Grade {grade.gradeLevel} — {grade.name}
                        {grade.mastered && (
                          <Badge className="text-xs bg-green-100 text-green-700">Mastered</Badge>
                        )}
                      </CardTitle>
                      {!grade.unlocked && (
                        <Badge variant="secondary" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Progress value={grade.percent} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-arc-navy-900">{grade.percent}%</span>
                    </div>
                    <div className="space-y-2">
                      {grade.subjects.map((subject) => {
                        const isExpanded = expandedSubjects[subject.id] ?? false;
                        return (
                          <div key={subject.id} className={`border rounded-lg transition-colors ${grade.unlocked ? "border-arc-slate-200 bg-white" : "border-arc-slate-200 bg-arc-slate-50"}`}>
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer"
                              onClick={() => grade.unlocked && toggleSubject(subject.id)}
                            >
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-arc-orange-500" />
                                <span className={`font-medium ${grade.unlocked ? "text-arc-navy-900" : "text-arc-slate-400"}`}>
                                  {subject.name}
                                </span>
                                <span className={`text-xs text-arc-slate-500`}>
                                  ({subject.topicCount} topics)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={subject.mastered ? "default" : "secondary"}
                                  className={`text-xs ${subject.mastered ? "bg-green-100 text-green-700" : ""}`}
                                >
                                  {subject.mastered ? "✓" : `${subject.percent}%`}
                                </Badge>
                                {grade.unlocked && (
                                  isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-arc-slate-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-arc-slate-400" />
                                  )
                                )}
                              </div>
                            </div>

                            {isExpanded && grade.unlocked && (
                              <div className="px-3 pb-3 space-y-2 border-t border-arc-slate-200">
                                {subject.topics.map((topic) => (
                                  <div key={topic.id} className="flex items-center justify-between text-sm">
                                    <span className="text-arc-slate-700">{topic.name}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-arc-slate-500">{topic.percent}%</div>
                                      <div className="w-16 h-1.5 bg-arc-slate-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            topic.mastery === "MASTERED"
                                              ? "bg-green-500"
                                              : topic.mastery === "PRACTICING"
                                              ? "bg-orange-400"
                                              : "bg-blue-400"
                                          }`}
                                          style={{ width: `${topic.percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Focus Areas (Weak Topics) */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-500" />
                  Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weakTopics.length === 0 ? (
                  <p className="text-sm text-arc-slate-500">No weak areas identified. Keep up the good work!</p>
                ) : (
                  <div className="space-y-3">
                    {weakTopics.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-arc-slate-200 bg-white"
                      >
                        <div>
                          <div className="font-medium text-arc-navy-900">{t.topic?.name || "Topic"}</div>
                          <div className="text-xs text-arc-slate-500">
                            {t.topic?.module?.subject?.name || "Unknown subject"}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(t.completionPercentage ?? 0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Continue Learning */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-arc-orange-500" />
                  Continue Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studyLessons.length === 0 ? (
                  <p className="text-sm text-arc-slate-500">No lessons started yet. Browse subjects to begin!</p>
                ) : (
                  <div className="space-y-4">
                    {studyLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-arc-slate-50 hover:bg-arc-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-arc-navy-900 truncate">{lesson.title}</div>
                          <div className="text-sm text-arc-slate-500">{lesson.subject}</div>
                          {lesson.questionStats && (
                            <div className="mt-1 text-xs text-arc-slate-500">
                              {lesson.questionStats.answeredBlocks}/{lesson.questionStats.totalBlocks} questions answered
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <Progress value={lesson.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-arc-slate-500">{lesson.progress}%</span>
                          </div>
                        </div>
                        <Link href={`/dashboard/lessons/${lesson.id}`}>
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" />
                            Continue
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!progression?.program && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Program Enrolled</h3>
              <p className="text-arc-slate-500">
                You don't have an active program. Contact your administrator to get enrolled.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
