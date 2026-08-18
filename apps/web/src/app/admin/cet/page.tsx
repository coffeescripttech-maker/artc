"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { WorkspaceHeader } from "@/components/admin";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Plus,
  Building,
  Award,
  Users,
  FileText,
  ArrowRight,
  Settings,
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockExams = [
  {
    id: "1",
    name: "UPCAT",
    slug: "upcat",
    conductingBody: "University of the Philippines",
    examType: "ENTRANCE",
    status: "PUBLISHED",
    profileCount: 3,
    coverageCount: 15,
    mockExamCount: 5,
  },
  {
    id: "2",
    name: "BUCET",
    slug: "bucet",
    conductingBody: "Bicol University",
    examType: "ENTRANCE",
    status: "PUBLISHED",
    profileCount: 2,
    coverageCount: 10,
    mockExamCount: 3,
  },
  {
    id: "3",
    name: "PNU-NCE",
    slug: "pnu-nce",
    conductingBody: "Philippine Normal University",
    examType: "ENTRANCE",
    status: "PUBLISHED",
    profileCount: 1,
    coverageCount: 5,
    mockExamCount: 2,
  },
  {
    id: "4",
    name: "CSPC-CET",
    slug: "cspc-cet",
    conductingBody: "Camarines Sur Polytechnic Colleges",
    examType: "ENTRANCE",
    status: "PUBLISHED",
    profileCount: 1,
    coverageCount: 5,
    mockExamCount: 2,
  },
];

const examTypeColors: Record<string, string> = {
  ENTRANCE: "bg-purple-100 text-purple-700",
  BOARD: "bg-red-100 text-red-700",
  CERTIFICATION: "bg-blue-100 text-blue-700",
  SCHOLARSHIP: "bg-green-100 text-green-700",
  INTERNAL: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function CetExamsPage() {
  const [exams] = useState(mockExams);

  return (
    <>
      <DashboardHeader
        title="CET Management"
        subtitle="Manage college entrance exams and university partnerships"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{exams.length}</div>
                <div className="text-sm text-arc-slate-500">CET Exams</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {[...new Set(exams.map((e) => e.conductingBody))].length}
                </div>
                <div className="text-sm text-arc-slate-500">Universities</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {exams.reduce((sum, e) => sum + e.mockExamCount, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Mock Exams</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">2,150</div>
                <div className="text-sm text-arc-slate-500">Test Takers</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-arc-navy-900">Entrance Exams</h2>
          <Button variant="accent">
            <Plus className="h-4 w-4 mr-2" />
            Add Exam
          </Button>
        </div>

        {/* Exam Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-arc-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{exam.name.slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-arc-navy-900 text-lg">{exam.name}</h3>
                      <p className="text-sm text-arc-slate-500">{exam.conductingBody}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={examTypeColors[exam.examType]}>
                      {exam.examType}
                    </Badge>
                    <Badge className={statusColors[exam.status]}>
                      {exam.status}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">{exam.profileCount}</div>
                    <div className="text-xs text-arc-slate-500">Profiles</div>
                  </div>
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">{exam.coverageCount}</div>
                    <div className="text-xs text-arc-slate-500">Subjects</div>
                  </div>
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">{exam.mockExamCount}</div>
                    <div className="text-xs text-arc-slate-500">Mock Exams</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-arc-slate-100">
                  <Link href={`/admin/cet/${exam.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Award className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
