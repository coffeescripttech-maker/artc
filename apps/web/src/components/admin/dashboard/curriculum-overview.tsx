"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { ChevronRight, ChevronDown, GraduationCap, BookOpen, BookMarked } from "lucide-react";
import { NoProgramsEmpty } from "@/components/branding";
import type { CurriculumOverviewProgram } from "@/lib/api/client";
import Link from "next/link";

interface CurriculumOverviewProps {
  data: CurriculumOverviewProgram[];
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "DRAFT":
      return "draft";
    case "UNDER_REVIEW":
      return "warning";
    case "ARCHIVED":
      return "archived";
    default:
      return "secondary";
  }
};

export function CurriculumOverview({ data }: CurriculumOverviewProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-arc-navy-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-arc-navy-700" />
            </div>
            Curriculum Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoProgramsEmpty />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-arc-navy-100 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-arc-navy-700" />
          </div>
          Curriculum Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.map((program) => (
            <ProgramRow key={program.id} program={program} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramRow({ program }: { program: CurriculumOverviewProgram }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-arc-slate-100 last:border-0">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-arc-slate-50 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={`h-4 w-4 text-arc-slate-500 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <div className="h-8 w-8 rounded-lg bg-arc-navy-100 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-arc-navy-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-arc-navy-900">{program.name}</p>
          <p className="text-xs text-arc-slate-500">
            {program.learnerCount} learners enrolled
          </p>
        </div>
        <Badge variant={statusBadgeVariant(program.status)} className="font-medium">
          {program.status.toLowerCase()}
        </Badge>
      </div>

      {expanded && (
        <div className="pl-6 border-l-2 border-arc-slate-200 ml-2 space-y-1">
          {program.curriculums.length === 0 ? (
            <p className="text-xs text-arc-slate-500 py-2">No published curriculums</p>
          ) : (
            program.curriculums.map((curr) => (
              <CurriculumRow key={curr.id} curriculum={curr} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CurriculumRow({ curriculum }: { curriculum: any }) {
  const [expanded, setExpanded] = useState(false);

  const gradeLabel = curriculum.gradeLevel
    ? curriculum.gradeLevel.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
    : curriculum.stage.replace(/_/g, " ");

  return (
    <div className="py-1">
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-arc-slate-50 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={`h-4 w-4 text-arc-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <div className="h-7 w-7 rounded-lg bg-arc-orange-100 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-arc-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-arc-navy-900 truncate">{curriculum.name}</p>
          <p className="text-xs text-arc-slate-500">{gradeLabel}</p>
        </div>
        <Badge variant="outline" size="sm" className="font-medium">
          {curriculum.subjects.length} subjects
        </Badge>
      </div>

      {expanded && (
        <div className="pl-6 border-l-2 border-arc-slate-100 ml-1.5 space-y-0.5">
          {curriculum.subjects.length === 0 ? (
            <p className="text-xs text-arc-slate-500 py-1.5">No published subjects</p>
          ) : (
            curriculum.subjects.map((subj: any) => (
              <SubjectRow key={subj.id} subject={subj} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SubjectRow({ subject }: { subject: any }) {
  return (
    <Link
      href={`/admin/subjects/${subject.id}`}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-arc-slate-50 transition-colors"
    >
      <div className="h-6 w-6 rounded-lg bg-arc-purple-100 flex items-center justify-center">
        <BookMarked className="h-3 w-3 text-arc-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-arc-navy-900 truncate">{subject.name}</p>
      </div>
      <Badge variant="secondary" size="sm">
        {subject.moduleCount} modules
      </Badge>
    </Link>
  );
}
