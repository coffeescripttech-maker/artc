"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardHeader, MasteryLadder } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { lessonsApi, progressionApi, assessmentsApi, progressApi, enrollmentsApi } from "@/lib/api/client";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  Target,
  Star,
  Play,
  CheckCircle2,
  RefreshCw,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// Get current date formatted
const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface ProgressionGrade {
  curriculumId: string;
  name: string;
  gradeLevel: number;
  stage: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: {
    id: string;
    name: string;
    percent: number;
    mastered: boolean;
    topicCount: number;
    topics: { id: string; name: string; percent: number; mastery: string; tracked: boolean }[];
  }[];
}

interface ProgressionResult {
  program: { id: string; name: string } | null;
  gate: number;
  grades: ProgressionGrade[];
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

interface AttemptInfo {
  id: string;
  assessment: { name: string };
  score: number;
  maxScore: number;
  percentage: number;
  status: string;
}

interface MyEnrollment {
  id: string;
  status: string;
  active: boolean;
  expiresAt: string | null;
  program: { id: string; name: string; slug: string; status: string } | null;
}

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { user, isLoading } = useAuth();

  const [progression, setProgression] = useState<ProgressionResult | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [continueLessons, setContinueLessons] = useState<LessonInfo[]>([]);
  const [attempts, setAttempts] = useState<AttemptInfo[]>([]);
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingData(true);

    try {
      // Fetch progression ladder
      const progData = (await progressionApi.get()) as ProgressionResult;
      setProgression(progData);

      // Fetch weak topics
      const weakData = (await progressionApi.weakTopics()) as { topics: WeakTopic[] };
      setWeakTopics(weakData?.topics ?? []);
    } catch (err) {
      console.error("Failed to load progression:", err);
    }

    try {
      // Fetch recent attempts
      const attemptData = (await assessmentsApi.myAttempts()) as AttemptInfo[];
      setAttempts(attemptData?.slice(0, 5) || []);
    } catch (err) {
      console.error("Failed to load attempts:", err);
    }

    try {
      // Fetch enrollment status (CS#9 — student-facing visibility)
      const mine = (await enrollmentsApi.mine()) as MyEnrollment[];
      setEnrollments(Array.isArray(mine) ? mine : []);
    } catch (err) {
      console.error("Failed to load enrollments:", err);
    }

    // Fetch continue-learning lessons from first unlocked grade's subjects
    try {
      const progRes = await progressionApi.get();
      const prog = progRes as ProgressionResult;
      const unlockedGrade = prog?.grades?.find((g) => g.unlocked);
      const unlockedSubjects = unlockedGrade?.subjects || [];

      if (unlockedSubjects.length > 0) {
        const firstSubjectId = unlockedSubjects[0].id;
        // Fetch lessons for this subject's first topic
        // For simplicity, use subject-based lesson fetch
        const subjectLessons = await lessonsApi.getBySubject(firstSubjectId).catch(() => []);
        if (Array.isArray(subjectLessons)) {
          const lessonsWithProgress = await Promise.all(
            subjectLessons.slice(0, 3).map(async (l: any) => {
              try {
                const prog = (await progressApi.getLessonWithQuestions(l.id).catch(() => null)) as {
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
          setContinueLessons(lessonsWithProgress);
        }
      }
    } catch (err) {
      console.error("Failed to load lessons:", err);
    }

    setIsLoadingData(false);
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get user display name
  const getUserName = () => {
    if (isLoading) return "...";
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Quick stats — computed solely from real data (no fabricated deltas).
  // Overall mastery = mean of the current program ladder's subject percentages.
  const allSubjectPcts = (progression?.grades ?? []).flatMap((g) =>
    (g.subjects ?? []).map((s) => s.percent ?? 0)
  );
  const overallMastery =
    allSubjectPcts.length > 0
      ? Math.round(allSubjectPcts.reduce((s, x) => s + x, 0) / allSubjectPcts.length)
      : null;
  const activePrograms = enrollments.filter((e) => e.active).length;
  const completedAttempts = attempts.filter((a) => a.status === "COMPLETED");
  const avgScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((s, a) => s + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : null;

  const stats = [
    { label: "Overall Mastery", value: `${overallMastery ?? "—"}%`, icon: Star, hint: "average across your subjects" },
    { label: "Active Programs", value: `${activePrograms}`, icon: BookOpen, hint: "programs you are enrolled in" },
    { label: "Assessments Taken", value: `${attempts.length}`, icon: Trophy, hint: "attempts recorded" },
    { label: "Average Score", value: avgScore === null ? "—" : `${avgScore}%`, icon: TrendingUp, hint: "completed assessments only" },
  ];

  return (
    <>
      <DashboardHeader
        title={`${getGreeting()}, ${getUserName()}!`}
        subtitle={getFormattedDate()}
      />

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                    <stat.icon className="h-4.5 w-4.5 text-arc-navy-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-arc-navy-900">{stat.label}</h3>
                </div>
                <div className="text-3xl font-bold tracking-tight text-arc-navy-900">{stat.value}</div>
                <p className="text-xs text-arc-slate-500 mt-1">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="programs">Mastery</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Continue Learning */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-arc-orange-500" />
                        Continue Learning
                      </CardTitle>
                      <Link href="/dashboard/programs" className="text-sm text-arc-orange-600 hover:text-arc-orange-700 font-medium">
                        View all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingData && !continueLessons.length ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin text-arc-orange-500" />
                      </div>
                    ) : continueLessons.length === 0 ? (
                      <p className="text-sm text-arc-slate-500 text-center py-8">No lessons started yet. Browse programs to begin!</p>
                    ) : (
                      <div className="space-y-4">
                        {continueLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-arc-slate-50 hover:bg-arc-slate-100 transition-colors"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-arc-orange-100">
                              <BookOpen className="h-7 w-7 text-arc-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-arc-navy-900 truncate">{lesson.title}</div>
                              <div className="text-sm text-arc-slate-500">{lesson.subject}</div>
                              {lesson.questionStats && (
                                <div className="mt-1 text-xs text-arc-slate-500">
                                  {lesson.questionStats.answeredBlocks}/{lesson.questionStats.totalBlocks} questions answered
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Progress value={lesson.progress} className="h-2 flex-1" />
                                <span className="text-xs text-arc-slate-500">{lesson.progress}%</span>
                              </div>
                            </div>
                            <Link href={`/dashboard/lessons/${lesson.id}`}>
                              <Button size="sm" variant="outline" className="shrink-0">
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

                {/* Weak Topics / Focus Areas */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-red-500" />
                        Focus Areas
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {weakTopics.length === 0 ? (
                      <p className="text-sm text-arc-slate-500">No weak areas identified. Keep up the good work!</p>
                    ) : (
                      <div className="space-y-3">
                        {weakTopics.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-arc-slate-200 bg-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Target className="h-4 w-4 text-red-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-arc-navy-900">{t.topic?.name || "Topic"}</div>
                                <div className="text-xs text-arc-slate-500">{t.topic?.module?.subject?.name || "Unknown subject"}</div>
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Mastery Ladder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-arc-navy-700" />
                      Mastery Ladder
                    </CardTitle>
                    {progression?.program && (
                      <p className="text-sm text-arc-slate-500">{progression.program.name}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin text-arc-orange-500" />
                      </div>
                    ) : !progression ? (
                      <p className="text-sm text-arc-slate-500 text-center py-4">No progression data.</p>
                    ) : (
                      <MasteryLadder
                        grades={progression.grades}
                        gate={progression.gate}
                      />
                    )}
                  </CardContent>
                </Card>
                {/* My Enrollments (CS#9 — student-facing status + expiry) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-arc-navy-700" />
                      My Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingData && !enrollments.length ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin text-arc-orange-500" />
                      </div>
                    ) : enrollments.length === 0 ? (
                      <p className="text-sm text-arc-slate-500 text-center py-4">
                        No enrollments yet. You'll be enrolled by your school.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {enrollments.map((e) => (
                          <Link
                            key={e.id}
                            href={
                              e.program
                                ? `/dashboard/programs/${e.program.id}`
                                : "/dashboard/programs"
                            }
                            className="flex items-center justify-between p-3 rounded-lg border border-arc-slate-200 bg-white hover:border-arc-orange-300 hover:bg-arc-orange-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-arc-orange-500"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-arc-navy-900 truncate">
                                {e.program?.name ?? "Program"}
                              </div>
                              {e.expiresAt ? (
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-arc-slate-500">
                                  <Clock className="h-3 w-3" />
                                  Expires {new Date(e.expiresAt).toLocaleDateString()}
                                </div>
                              ) : (
                                <div className="mt-0.5 text-xs text-arc-slate-500">No expiry</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                className={
                                  e.active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-arc-slate-100 text-arc-slate-500"
                                }
                              >
                                {e.active ? "Active" : e.status}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-arc-slate-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>



                {/* Recent Attempts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-arc-orange-500" />
                      Recent Attempts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attempts.length === 0 ? (
                      <p className="text-sm text-arc-slate-500 text-center py-4">No attempts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {attempts.map((attempt) => (
                          <Link
                            key={attempt.id}
                            href={`/dashboard/assessments/history`}
                            className="block"
                          >
                            <div className="p-3 rounded-lg border border-arc-slate-200 hover:bg-arc-slate-50 transition-colors">
                              <div className="font-medium text-sm text-arc-navy-900">{attempt.assessment?.name || "Assessment"}</div>
                              <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-arc-slate-500">
                                  {attempt.percentage !== undefined ? `${attempt.percentage}%` : ""}
                                </div>
                                <Badge
                                  className={`text-xs ${
                                    attempt.percentage >= 70
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {attempt.status}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="programs">
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">Mastery Overview</h3>
                <p className="text-arc-slate-500 mb-4">View detailed mastery breakdown across all your programs and subjects.</p>
                {progression && (
                  <MasteryLadder grades={progression.grades} gate={progression.gate} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">Activity Timeline</h3>
                <p className="text-arc-slate-500 mb-4">View your complete learning activity timeline.</p>
                <Link href="/dashboard/activity">
                  <Button variant="accent" size="sm">
                    View Activity Feed
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
