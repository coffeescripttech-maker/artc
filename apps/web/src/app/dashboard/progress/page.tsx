"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { progressApi } from "@/lib/api/client";
import { Badge } from "@/components/ui";
import { masteryBand } from "@/lib/mastery";
import {
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  GraduationCap,
  ChevronDown,
  Trophy,
} from "lucide-react";

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
  gradeLevel?: string | null;
  stage?: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: SubjectView[];
}
interface Progression {
  program: { id: string; name: string } | null;
  gate: number;
  grades: GradeView[];
}

function fmtGrade(g?: string | null): string {
  if (!g) return "";
  return g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Bar({ percent, mastered }: { percent: number; mastered: boolean }) {
  return (
    <div className="h-2 rounded-full bg-arc-slate-100 overflow-hidden">
      <div
        className={`h-2 rounded-full ${mastered ? "bg-green-500" : "bg-arc-orange-500"}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export default function StudentProgressPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Progression | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = (await progressApi.progression()) as Progression;
        if (active) setData(res);
      } catch (err) {
        console.error("Failed to load progression:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const gate = data?.gate ?? 95;

  return (
    <>
      <DashboardHeader
        title="My Progress"
        subtitle={data?.program ? `${data.program.name} · College Readiness Ladder` : "College Readiness Ladder"}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Progress" }]}
      />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-arc-orange-500" />
          </div>
        ) : !data || data.grades.length === 0 ? (
          <div className="bg-arc-slate-50 rounded-xl p-10 text-center">
            <GraduationCap className="h-10 w-10 text-arc-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-1">No progression yet</h3>
            <p className="text-arc-slate-500">
              Once your program has curriculums and you take assessments, your readiness ladder appears here.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-arc-slate-500 mb-4">
              Master every subject at <span className="font-semibold text-arc-navy-900">{gate}%</span> to unlock the
              next level.
            </p>

            <div className="space-y-3">
              {data.grades.map((grade, i) => {
                const locked = !grade.unlocked;
                return (
                  <div key={grade.curriculumId}>
                    {i > 0 && (
                      <div className="flex justify-center py-1">
                        <ChevronDown className="h-5 w-5 text-arc-slate-300" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl border p-5 transition-colors ${
                        locked
                          ? "border-arc-slate-200 bg-arc-slate-50 opacity-80"
                          : grade.mastered
                            ? "border-green-200 bg-green-50/40"
                            : "border-arc-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              locked
                                ? "bg-arc-slate-200 text-arc-slate-400"
                                : grade.mastered
                                  ? "bg-green-500 text-white"
                                  : "bg-arc-orange-500 text-white"
                            }`}
                          >
                            {locked ? (
                              <Lock className="h-5 w-5" />
                            ) : grade.mastered ? (
                              <Trophy className="h-5 w-5" />
                            ) : (
                              <Unlock className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-arc-navy-900 truncate">{grade.name}</div>
                            {grade.gradeLevel && (
                              <div className="text-xs text-arc-slate-500">{fmtGrade(grade.gradeLevel)}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {grade.mastered ? (
                            <Badge className="bg-green-100 text-green-700">Mastered</Badge>
                          ) : locked ? (
                            <Badge className="bg-arc-slate-100 text-arc-slate-500">Locked</Badge>
                          ) : (
                            <span className="text-sm font-semibold text-arc-navy-900">{grade.percent}%</span>
                          )}
                        </div>
                      </div>

                      {!locked && (
                        <>
                          <div className="mt-3">
                            <Bar percent={grade.percent} mastered={grade.mastered} />
                          </div>

                          <div className="mt-4 space-y-2">
                            {grade.subjects.length === 0 ? (
                              <p className="text-sm text-arc-slate-400">No subjects in this level yet.</p>
                            ) : (
                              grade.subjects.map((s) => {
                                const band = masteryBand(s.percent, gate);
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center gap-3 rounded-lg border border-arc-slate-200 bg-white px-3 py-2.5"
                                  >
                                    {s.mastered ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                      <span className="h-4 w-4 rounded-full border border-arc-slate-300 flex-shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-arc-navy-900 truncate">
                                          {s.name}
                                        </span>
                                        <span className="text-xs text-arc-slate-500 flex-shrink-0">
                                          {s.percent}%
                                        </span>
                                      </div>
                                      <div className="mt-1.5">
                                        <Bar percent={s.percent} mastered={s.mastered} />
                                      </div>
                                    </div>
                                    <Badge className={`${band.cls} flex-shrink-0`}>{band.label}</Badge>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}

                      {locked && (
                        <p className="mt-3 text-sm text-arc-slate-500">
                          Master the previous level at {gate}% to unlock this stage.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
