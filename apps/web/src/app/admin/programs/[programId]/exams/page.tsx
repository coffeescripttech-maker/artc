"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/admin";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Plus,
  Award,
  Users,
  FileText,
  Clock,
  Target,
  Edit,
  Trash2,
} from "lucide-react";

// Mock data
const mockExams = [
  {
    id: "1",
    name: "Grade 9 Math Diagnostic",
    type: "DIAGNOSTIC",
    status: "PUBLISHED",
    questionCount: 50,
    timeLimit: 60,
    passingScore: 70,
    usageCount: 125,
  },
  {
    id: "2",
    name: "Algebra Quiz 1",
    type: "QUIZ",
    status: "PUBLISHED",
    questionCount: 20,
    timeLimit: 30,
    passingScore: 75,
    usageCount: 340,
  },
  {
    id: "3",
    name: "Grade 9 Midterm Exam",
    type: "MOCK_EXAM",
    status: "PUBLISHED",
    questionCount: 100,
    timeLimit: 120,
    passingScore: 65,
    usageCount: 89,
  },
  {
    id: "4",
    name: "Linear Equations Practice",
    type: "PRACTICE",
    status: "DRAFT",
    questionCount: 30,
    timeLimit: null,
    passingScore: null,
    usageCount: 0,
  },
];

const typeColors: Record<string, string> = {
  QUIZ: "bg-blue-100 text-blue-700",
  PRACTICE: "bg-green-100 text-green-700",
  DIAGNOSTIC: "bg-purple-100 text-purple-700",
  MOCK_EXAM: "bg-orange-100 text-orange-700",
  ASSIGNMENT: "bg-yellow-100 text-yellow-700",
  CET_SIMULATION: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function ProgramExamsPage() {
  const params = useParams();
  const programId = params.programId as string;
  const [exams] = useState(mockExams);

  return (
    <>
      <WorkspaceHeader
        title="Exams"
        subtitle="Manage assessments and mock exams for this program"
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: "ARC 4-Year", href: `/admin/programs/${programId}` },
          { label: "Exams" },
        ]}
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{exams.length}</div>
                <div className="text-sm text-arc-slate-500">Total Assessments</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {exams.filter((e) => e.status === "PUBLISHED").length}
                </div>
                <div className="text-sm text-arc-slate-500">Published</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {exams.reduce((sum, e) => sum + e.questionCount, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Total Questions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {exams.reduce((sum, e) => sum + e.usageCount, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Total Attempts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Assessment
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Questions
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Time
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Passing
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Attempts
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Status
                    </th>
                    <th className="w-24 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-arc-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-arc-navy-900">{exam.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={typeColors[exam.type]}>
                          {exam.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-arc-slate-600">
                        {exam.questionCount}
                      </td>
                      <td className="px-4 py-3">
                        {exam.timeLimit ? (
                          <div className="flex items-center gap-1 text-arc-slate-600">
                            <Clock className="h-4 w-4" />
                            {exam.timeLimit} min
                          </div>
                        ) : (
                          <span className="text-arc-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-arc-slate-600">
                        {exam.passingScore ? `${exam.passingScore}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-arc-slate-600">
                        {exam.usageCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[exam.status]}>
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                            <Edit className="h-4 w-4 text-arc-slate-500" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
