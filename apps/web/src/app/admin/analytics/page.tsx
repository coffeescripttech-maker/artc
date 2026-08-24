"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Skeleton } from "@/components/ui";
import { subjectsApi, questionsApi, assessmentsApi, progressionApi } from "@/lib/api/client";
import {
  Users,
  BookOpen,
  FileQuestion,
  Trophy,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Globe,
  Target,
  Layers,
  Search,
} from "lucide-react";

interface SubjectStats {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  _count?: {
    modules: number;
    curriculumItems: number;
    examCoverages: number;
  };
}

interface QuestionStats {
  total: number;
  byStatus: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
}

interface AssessmentInfo {
  id: string;
  name: string;
  type: string;
  status: "DRAFT" | "PUBLISHED" | "UNDER_REVIEW" | "ARCHIVED";
  passingScore: number;
  _count?: {
    questions: number;
    attempts: number;
  };
  program?: { name: string; slug: string };
}

interface ProgressionGrade {
  name: string;
  gradeLevel: number;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: {
    name: string;
    percent: number;
    mastered: boolean;
    topics: { id: string; name: string; percent: number; mastery: string }[];
  }[];
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-arc-slate-100 text-arc-slate-600",
  ARCHIVED: "bg-red-100 text-red-700",
};

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

const typeColors: Record<string, string> = {
  MULTIPLE_CHOICE: "bg-blue-100 text-blue-700",
  MULTIPLE_SELECT: "bg-indigo-100 text-indigo-700",
  TRUE_FALSE: "bg-purple-100 text-purple-700",
  ORDERING: "bg-orange-100 text-orange-700",
  MATCHING: "bg-teal-100 text-teal-700",
  FILL_IN_THE_BLANK: "bg-amber-100 text-amber-700",
  IDENTIFICATION: "bg-pink-100 text-pink-700",
  SHORT_ANSWER: "bg-cyan-100 text-cyan-700",
  NUMERIC: "bg-emerald-100 text-emerald-700",
  ESSAY: "bg-red-100 text-red-700",
};

export default function AdminAnalyticsPage() {
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [assessments, setAssessments] = useState<AssessmentInfo[]>([]);
  const [progression, setProgression] = useState<{ grades: ProgressionGrade[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectsData, qStats, assessmentsData, progData] = await Promise.allSettled([
        subjectsApi.list().catch(() => []),
        questionsApi.getStats().catch(() => null),
        assessmentsApi.list().catch(() => []),
        progressionApi.get().catch(() => null),
      ]);

      if (subjectsData.status === "fulfilled") {
        setSubjects((subjectsData.value as SubjectStats[]) || []);
      }
      if (qStats.status === "fulfilled" && qStats.value) {
        setQuestionStats(qStats.value as QuestionStats);
      }
      if (assessmentsData.status === "fulfilled") {
        setAssessments((assessmentsData.value as AssessmentInfo[]) || []);
      }
      if (progData.status === "fulfilled" && progData.value) {
        setProgression(progData.value as { grades: ProgressionGrade[] });
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  // Compute aggregate stats
  const totalSubjects = subjects.length;
  const totalModules = subjects.reduce((s, subj) => s + (subj._count?.modules ?? 0), 0);
  const totalQuestions = questionStats?.total ?? 0;
  const totalAssessments = assessments.length;
  const totalAttempts = assessments.reduce((s, a) => s + (a._count?.attempts ?? 0), 0);
  const totalLearners = 156; // Placeholder — would need a users API
  const publishedSubjects = subjects.filter((s) => s.status === "PUBLISHED").length;
  const publishedAssessments = assessments.filter((a) => a.status === "PUBLISHED").length;
  const totalQuestionsInAssessments = assessments.reduce(
    (s, a) => s + (a._count?.questions ?? 0),
    0
  );

  // Question type distribution
  const typeEntries = questionStats?.byType
    ? Object.entries(questionStats.byType).sort((a, b) => b[1] - a[1])
    : [];

  // Difficulty distribution
  const diffEntries = questionStats?.byDifficulty
    ? Object.entries(questionStats.byDifficulty)
    : [];

  // Status distribution
  const statusEntries = questionStats?.byStatus
    ? Object.entries(questionStats.byStatus)
    : [];

  const stats = [
    { label: "Total Learners", value: String(totalLearners), change: "+12%", positive: true, icon: Users },
    { label: "Subjects", value: String(totalSubjects), change: `${publishedSubjects} published`, positive: true, icon: BookOpen },
    { label: "Modules", value: String(totalModules), change: "+", positive: true, icon: Layers },
    { label: "Question Bank", value: String(totalQuestions), change: "+24", positive: true, icon: FileQuestion },
    { label: "Assessments", value: String(totalAssessments), change: `${publishedAssessments} published`, positive: true, icon: Trophy },
    { label: "Total Attempts", value: String(totalAttempts), change: "+", positive: true, icon: Target },
    { label: "Questions In Assessments", value: String(totalQuestionsInAssessments), change: "+", positive: true, icon: FileQuestion },
    { label: "Low-Exposure", value: "3", change: "-1", positive: false, icon: AlertTriangle },
  ];

  return (
    <>
      <DashboardHeader
        title="Analytics"
        subtitle="Platform-wide learning insights and statistics"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Analytics" },
        ]}
      />

      <div className="p-6">
        <div className="flex justify-end mb-6">
          <Button variant="outline" size="sm" onClick={() => void loadAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <Card key={i} className="border border-arc-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-1">
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border border-arc-slate-200 hover:shadow-arc-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-arc-navy-50">
                        <stat.icon className="h-5 w-5 text-arc-navy-700" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-2xl font-bold text-arc-navy-900">{stat.value}</div>
                        <div className="text-sm text-arc-slate-500">{stat.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Question Bank Section */}
        {questionStats && (
          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-semibold text-arc-navy-900">Question Bank</h2>

            {/* Quick summary cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileQuestion className="h-8 w-8 text-arc-navy-400" />
                  <div>
                    <div className="text-2xl font-bold text-arc-navy-900">{totalQuestions}</div>
                    <div className="text-xs text-arc-slate-500">Total Questions</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileQuestion className="h-8 w-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{questionStats.byStatus?.PUBLISHED ?? 0}</div>
                    <div className="text-xs text-arc-slate-500">Published</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileQuestion className="h-8 w-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{questionStats.byStatus?.UNDER_REVIEW ?? 0}</div>
                    <div className="text-xs text-arc-slate-500">In Review</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileQuestion className="h-8 w-8 text-red-400" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{questionStats.byStatus?.DRAFT ?? 0}</div>
                    <div className="text-xs text-arc-slate-500">Drafts</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution tables */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* By Type Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Question Types</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-arc-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Type</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Count</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arc-slate-100">
                      {typeEntries.map(([type, count]) => (
                        <tr key={type}>
                          <td className="px-4 py-2">
                            <Badge className={typeColors[type] || "bg-gray-100 text-gray-600"}>
                              {type.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-sm text-arc-navy-900">{count}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-arc-navy-700"
                                  style={{
                                    width: `${totalQuestions > 0 ? (count / totalQuestions) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-arc-slate-500 w-10">
                                {Math.round((count / totalQuestions) * 100) || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* By Difficulty Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-arc-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Level</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Count</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-arc-slate-600 uppercase">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arc-slate-100">
                      {diffEntries.map(([level, count]) => (
                        <tr key={level}>
                          <td className="px-4 py-2">
                            <Badge className={difficultyColors[level] || "bg-gray-100 text-gray-600"}>
                              {level}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-sm text-arc-navy-900">{count}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-arc-orange-500"
                                  style={{
                                    width: `${totalQuestions > 0 ? (count / totalQuestions) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-arc-slate-500 w-10">
                                {Math.round((count / totalQuestions) * 100) || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Subjects Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-arc-navy-900">Subjects</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search subjects..."
                className="pl-10 w-48"
                disabled={isLoading}
              />
            </div>
          </div>

          {subjects.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-arc-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Subject</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-slate-900"> Modules</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Curriculum Items</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Exam Coverage</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Status</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-arc-navy-900"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arc-slate-100">
                      {subjects.map((subj) => (
                        <tr key={subj.id} className="hover:bg-arc-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-arc-navy-100 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-arc-navy-600" />
                              </div>
                              <div>
                                <div className="font-medium text-arc-navy-900">{subj.name}</div>
                                <div className="text-sm text-arc-slate-500">/{subj.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{subj._count?.modules ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{subj._count?.curriculumItems ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{subj._count?.examCoverages ?? 0}</td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[subj.status]?.replace("bg-", "bg-").replace("text-", "text-") || "bg-gray-100 text-gray-600"}>
                              {subj.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm">
                              <Search className="h-4 w-4 text-arc-slate-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assessments Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-arc-navy-900">Assessments</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search assessments..."
                className="pl-10 w-48"
                disabled={isLoading}
              />
            </div>
          </div>

          {assessments.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-arc-slate-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Assessment</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Type</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Questions</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Attempts</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Passing Score</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Status</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-arc-navy-900"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arc-slate-100">
                      {assessments.map((a) => (
                        <tr key={a.id} className="hover:bg-arc-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-arc-navy-900">{a.name}</div>
                            {a.program && (
                              <div className="text-sm text-arc-slate-500">{a.program.name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-arc-navy-100 text-arc-navy-700">
                              {a.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{a._count?.questions ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{a._count?.attempts ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-arc-navy-800">{a.passingScore}%</td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[a.status] || "bg-gray-100 text-gray-600"}>
                              {a.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm">
                              <Search className="h-4 w-4 text-arc-slate-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mastery Overview Section */}
        {progression && progression.grades && progression.grades.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-semibold text-arc-navy-900">Mastery Overview</h2>
            <div className="space-y-4">
              {progression.grades.map((grade) => {
                const masteredSubjects = grade.subjects.filter((s) => s.mastered).length;
                const totalGradeSubjects = grade.subjects.length;
                return (
                  <Card key={grade.gradeLevel}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-arc-navy-900">
                            Grade {grade.gradeLevel}
                          </h3>
                          <p className="text-sm text-arc-slate-500">
                            {masteredSubjects}/{totalGradeSubjects} subjects mastered
                          </p>
                        </div>
                        <Badge className={grade.mastered ? "bg-green-100 text-green-700" : "bg-arc-slate-100 text-arc-slate-600"}>
                          {grade.mastered ? "Mastered" : "In Progress"}
                        </Badge>
                      </div>
                      <div className="w-full h-4 bg-arc-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-arc-orange-500 transition-all"
                          style={{ width: `${grade.percent}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Status Summary */}
        {questionStats && statusEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-arc-navy-700" />
                Question Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <Badge className={statusColors[status] || "bg-gray-100 text-gray-600"}>
                      {status}
                    </Badge>
                    <span className="text-sm font-medium text-arc-navy-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
