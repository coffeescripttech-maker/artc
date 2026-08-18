"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Award,
  FileText,
  Clock,
  Target,
} from "lucide-react";

const mockProfiles = [
  {
    id: 1,
    name: "Science Track",
    exam: "UPCAT",
    description: "For students targeting science-related degree programs",
    subjects: [
      { name: "Mathematics", percentage: 30 },
      { name: "English", percentage: 25 },
      { name: "Science", percentage: 30 },
      { name: "Abstract Reasoning", percentage: 15 },
    ],
    totalQuestions: 100,
    timeLimit: 120,
    passingScore: 65,
    status: "PUBLISHED",
  },
  {
    id: 2,
    name: "General Profile",
    exam: "BUCET",
    description: "Standard entrance exam profile for all degree programs",
    subjects: [
      { name: "Mathematics", percentage: 25 },
      { name: "English", percentage: 25 },
      { name: "Science", percentage: 25 },
      { name: "Araling Panlipunan", percentage: 25 },
    ],
    totalQuestions: 150,
    timeLimit: 180,
    passingScore: 60,
    status: "PUBLISHED",
  },
  {
    id: 3,
    name: "Engineering Track",
    exam: "UPCAT",
    description: "For students targeting engineering degree programs",
    subjects: [
      { name: "Mathematics", percentage: 40 },
      { name: "Physics", percentage: 30 },
      { name: "English", percentage: 20 },
      { name: "Abstract Reasoning", percentage: 10 },
    ],
    totalQuestions: 120,
    timeLimit: 150,
    passingScore: 70,
    status: "PUBLISHED",
  },
  {
    id: 4,
    name: "Education Track",
    exam: "PNU-NCE",
    description: "For students aspiring to become teachers",
    subjects: [
      { name: "General Education", percentage: 100 },
    ],
    totalQuestions: 200,
    timeLimit: 240,
    passingScore: 75,
    status: "DRAFT",
  },
];

export default function CetProfilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState("all");

  const filteredProfiles = mockProfiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.exam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = examFilter === "all" || profile.exam === examFilter;
    return matchesSearch && matchesExam;
  });

  const exams = [...new Set(mockProfiles.map((p) => p.exam))];

  return (
    <>
      <DashboardHeader
        title="CET Profiles"
        subtitle="Manage exam profiles and subject distributions"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
              />
            </div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Exams</option>
              {exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Profile
          </Button>
        </div>

        {/* Profile Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-arc-purple-500 to-arc-purple-600 flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-arc-navy-900 text-lg">{profile.name}</h3>
                      <Badge variant="secondary" className="bg-arc-purple-50 text-arc-purple-700">
                        {profile.exam}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        profile.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-arc-slate-100 text-arc-slate-600"
                      }
                    >
                      {profile.status}
                    </Badge>
                    <button className="p-1 hover:bg-arc-slate-100 rounded">
                      <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-arc-slate-600 mb-4">{profile.description}</p>

                {/* Subject Distribution */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-arc-navy-900 mb-2">Subject Distribution</div>
                  <div className="space-y-2">
                    {profile.subjects.map((subject, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-arc-slate-600">{subject.name}</span>
                          <span className="font-medium text-arc-navy-900">{subject.percentage}%</span>
                        </div>
                        <div className="h-2 bg-arc-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-arc-purple-500 to-arc-purple-400 rounded-full"
                            style={{ width: `${subject.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-arc-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-arc-slate-500">
                      <FileText className="h-4 w-4" />
                      {profile.totalQuestions} Qs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-arc-slate-500">
                      <Clock className="h-4 w-4" />
                      {profile.timeLimit} min
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-arc-slate-500">
                      <Target className="h-4 w-4" />
                      {profile.passingScore}%
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-arc-slate-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Coverage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              No profiles found
            </h3>
            <p className="text-arc-slate-500 mb-4">
              {searchQuery || examFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first CET profile to get started"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
