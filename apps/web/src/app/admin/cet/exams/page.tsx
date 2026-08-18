"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Award,
  Plus,
  Search,
  MoreVertical,
  Building,
  FileText,
  Users,
  Trophy,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";

const mockExams = [
  {
    id: 1,
    name: "UPCAT",
    slug: "upcat",
    examType: "ENTRANCE",
    conductingBody: "University of the Philippines",
    status: "PUBLISHED",
    profiles: 4,
    programs: 3,
    studentsEnrolled: 1250,
    website: "https://upcat.edu.ph",
  },
  {
    id: 2,
    name: "BUCET",
    slug: "bucet",
    examType: "ENTRANCE",
    conductingBody: "Bicol University",
    status: "PUBLISHED",
    profiles: 3,
    programs: 2,
    studentsEnrolled: 890,
    website: "https://bucol.edu.ph",
  },
  {
    id: 3,
    name: "PNU-NCE",
    slug: "pnu-nce",
    examType: "CERTIFICATION",
    conductingBody: "Philippine Normal University",
    status: "PUBLISHED",
    profiles: 2,
    programs: 1,
    studentsEnrolled: 450,
    website: "https://pnu.edu.ph",
  },
  {
    id: 4,
    name: "CSPC-CET",
    slug: "cspc-cet",
    examType: "ENTRANCE",
    conductingBody: "Catanduanes State University",
    status: "DRAFT",
    profiles: 1,
    programs: 1,
    studentsEnrolled: 0,
    website: "https://cspsc.edu.ph",
  },
  {
    id: 5,
    name: "LET",
    slug: "let",
    examType: "BOARD",
    conductingBody: "Professional Regulation Commission",
    status: "PUBLISHED",
    profiles: 2,
    programs: 4,
    studentsEnrolled: 2100,
    website: "https://prc.gov.ph",
  },
];

const examTypeLabels: Record<string, string> = {
  ENTRANCE: "Entrance Exam",
  BOARD: "Board Exam",
  CERTIFICATION: "Certification",
  SCHOLARSHIP: "Scholarship",
  INTERNAL: "Internal",
};

export default function CetExamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredExams = mockExams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.conductingBody.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || exam.examType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <DashboardHeader
        title="CET Exams"
        subtitle="Manage College Entrance Tests and Certifications"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Types</option>
              <option value="ENTRANCE">Entrance Exam</option>
              <option value="BOARD">Board Exam</option>
              <option value="CERTIFICATION">Certification</option>
            </select>
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add CET Exam
          </Button>
        </div>

        {/* Exam Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-arc-purple-500 to-arc-purple-600 flex items-center justify-center">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={exam.status === "PUBLISHED" ? "success" : "secondary"}
                      className={exam.status === "PUBLISHED" ? "bg-green-100 text-green-700" : ""}
                    >
                      {exam.status}
                    </Badge>
                    <button className="p-1 hover:bg-arc-slate-100 rounded">
                      <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-arc-navy-900 text-xl mb-1">{exam.name}</h3>
                <p className="text-sm text-arc-slate-500 mb-4">
                  {exam.conductingBody}
                </p>

                <div className="flex items-center gap-1 mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-arc-purple-50 text-arc-purple-700"
                  >
                    {examTypeLabels[exam.examType]}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">{exam.profiles}</div>
                    <div className="text-xs text-arc-slate-500">Profiles</div>
                  </div>
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">{exam.programs}</div>
                    <div className="text-xs text-arc-slate-500">Programs</div>
                  </div>
                  <div className="text-center p-2 bg-arc-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-arc-navy-900">
                      {exam.studentsEnrolled.toLocaleString()}
                    </div>
                    <div className="text-xs text-arc-slate-500">Students</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
                  <div className="flex items-center gap-2 text-xs text-arc-slate-400">
                    <Building className="h-3 w-3" />
                    {exam.website.replace("https://", "")}
                  </div>
                  <button className="flex items-center gap-1 text-sm text-arc-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              No exams found
            </h3>
            <p className="text-arc-slate-500 mb-4">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first CET exam to get started"}
            </p>
            {!searchQuery && typeFilter === "all" && (
              <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add CET Exam
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
