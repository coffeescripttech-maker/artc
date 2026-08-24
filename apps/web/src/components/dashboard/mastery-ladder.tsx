"use client";

import { Badge } from "@/components/ui";
import { CheckCircle, Lock, Star, Target } from "lucide-react";

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
  gradeLevel: number;
  stage: string;
  percent: number;
  mastered: boolean;
  unlocked: boolean;
  subjects: SubjectView[];
}

interface MasteryLadderProps {
  grades: GradeView[];
  gate: number;
}

const masteryColors: Record<string, string> = {
  NOT_STARTED: "bg-arc-slate-200",
  LEARNING: "bg-blue-400",
  PRACTICING: "bg-yellow-400",
  PROFICIENT: "bg-orange-400",
  MASTERED: "bg-green-400",
};

function MasteryDot({ mastery }: { mastery: string }) {
  const bg = masteryColors[mastery] || "bg-arc-slate-300";
  return <div className={`h-3 w-3 rounded-full ${bg} flex-shrink-0`} />;
}

export function MasteryLadder({ grades, gate }: MasteryLadderProps) {
  if (!grades || grades.length === 0) {
    return (
      <div className="text-sm text-arc-slate-500 text-center py-4">
        No progression data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-arc-slate-500">
        <span>Mastery gate: {gate}% to unlock next level</span>
        <Badge variant="secondary" className="text-xs">
          {grades.length} Levels
        </Badge>
      </div>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-arc-slate-200" />

        <div className="space-y-6">
          {grades.map((grade, index) => {
            const locked = !grade.unlocked;
            const pct = grade.percent;
            const mastered = grade.mastered;
            const levelNum = grade.gradeLevel ?? (index + 1);

            return (
              <div key={grade.curriculumId} className="relative">
                {/* Node circle */}
                <div
                  className={`absolute left-2 top-0.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 flex items-center justify-center ${
                    locked
                      ? "border-arc-slate-300 bg-arc-slate-100"
                      : mastered
                      ? "border-green-500 bg-green-100"
                      : "border-arc-orange-500 bg-arc-orange-50"
                  }`}
                >
                  {locked ? (
                    <Lock className="h-2.5 w-2.5 text-arc-slate-400" />
                  ) : mastered ? (
                    <Star className="h-3 w-3 text-green-500 fill-current" />
                  ) : (
                    <Target className="h-2.5 w-2.5 text-arc-orange-500" />
                  )}
                </div>

                <div
                  className={`ml-10 p-4 rounded-xl border transition-all ${
                    locked
                      ? "border-arc-slate-200 bg-arc-slate-50"
                      : "border-arc-slate-200 hover:border-arc-orange-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-arc-navy-900">
                          Grade {levelNum}
                        </span>
                        {locked && (
                          <Badge variant="secondary" className="text-xs">
                            Locked
                          </Badge>
                        )}
                        {mastered && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Mastered
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-arc-slate-600 mt-1">{grade.name}</p>
                    </div>
                    {!locked && (
                      <MasteryDot mastery={mastered ? "MASTERED" : grade.percent >= gate ? "PROFICIENT" : "LEARNING"} />
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-arc-slate-500">Mastery</span>
                      <span className="font-medium text-arc-navy-900">{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-arc-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          mastered
                            ? "bg-green-500"
                            : pct >= gate
                            ? "bg-arc-orange-500"
                            : "bg-blue-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Subject breakdown */}
                  <div className="mt-3 space-y-2">
                    {grade.subjects.slice(0, 3).map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-arc-slate-700">{subject.name}</span>
                          <span className="text-xs text-arc-slate-400">({subject.topicCount} topics)</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            subject.mastered ? "bg-green-100 text-green-700" : ""
                          }`}
                        >
                          {subject.mastered ? "✓" : `${subject.percent}%`}
                        </Badge>
                      </div>
                    ))}
                    {grade.subjects.length > 3 && (
                      <div className="text-xs text-arc-slate-400">
                        +{grade.subjects.length - 3} more subjects
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
