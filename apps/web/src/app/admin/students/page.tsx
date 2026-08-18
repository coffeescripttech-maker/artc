"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge, Avatar, AvatarFallback } from "@/components/ui";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  GraduationCap,
  Trophy,
  TrendingUp,
  UserPlus,
} from "lucide-react";

const mockStudents = [
  {
    id: 1,
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@email.com",
    program: "ARC 4-Year College Readiness",
    curriculum: "Grade 9 - Foundation",
    gradeLevel: "Grade 9",
    progress: 78,
    streak: 12,
    totalPoints: 2450,
    status: "ACTIVE",
    enrolledAt: "2026-06-15",
  },
  {
    id: 2,
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@email.com",
    program: "ARC 4-Year College Readiness",
    curriculum: "Grade 10 - Accelerator",
    gradeLevel: "Grade 10",
    progress: 65,
    streak: 5,
    totalPoints: 1820,
    status: "ACTIVE",
    enrolledAt: "2026-06-20",
  },
  {
    id: 3,
    firstName: "Ana",
    lastName: "Reyes",
    email: "ana.reyes@email.com",
    program: "CET Intensive Review",
    curriculum: "CET Intensive",
    gradeLevel: "Grade 12",
    progress: 92,
    streak: 30,
    totalPoints: 5680,
    status: "ACTIVE",
    enrolledAt: "2026-05-01",
  },
  {
    id: 4,
    firstName: "Pedro",
    lastName: "Garcia",
    email: "pedro.garcia@email.com",
    program: "ARC 4-Year College Readiness",
    curriculum: "Grade 11 - Pre-CET",
    gradeLevel: "Grade 11",
    progress: 45,
    streak: 0,
    totalPoints: 980,
    status: "INACTIVE",
    enrolledAt: "2026-07-10",
  },
  {
    id: 5,
    firstName: "Lisa",
    lastName: "Martinez",
    email: "lisa.martinez@email.com",
    program: "BUCET Preparation",
    curriculum: "BUCET Review",
    gradeLevel: "Grade 12",
    progress: 88,
    streak: 21,
    totalPoints: 4200,
    status: "ACTIVE",
    enrolledAt: "2026-04-15",
  },
];

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-arc-slate-100 text-arc-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <DashboardHeader
        title="Students"
        subtitle="Manage enrolled students"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{mockStudents.length}</div>
                <div className="text-sm text-arc-slate-500">Total Students</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockStudents.filter((s) => s.status === "ACTIVE").length}
                </div>
                <div className="text-sm text-arc-slate-500">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {Math.round(mockStudents.reduce((sum, s) => sum + s.progress, 0) / mockStudents.length)}%
                </div>
                <div className="text-sm text-arc-slate-500">Avg. Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockStudents.filter((s) => s.streak >= 7).length}
                </div>
                <div className="text-sm text-arc-slate-500">Week Streaks</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Student
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Program
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Progress
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Streak
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Points
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Status
                    </th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {filteredStudents.map((student) => {
                    const initials = `${student.firstName[0]}${student.lastName[0]}`;
                    const fullName = `${student.firstName} ${student.lastName}`;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-arc-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-arc-navy-900">{fullName}</div>
                              <div className="text-sm text-arc-slate-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-arc-navy-900">{student.program}</div>
                          <div className="text-xs text-arc-slate-500">{student.curriculum}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-arc-green-500 to-arc-green-600 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-arc-navy-900">
                              {student.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={
                              student.streak >= 7
                                ? "bg-orange-100 text-orange-700"
                                : "bg-arc-slate-100 text-arc-slate-600"
                            }
                          >
                            {student.streak > 0 ? `${student.streak} days` : "No streak"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-arc-navy-900">
                            {student.totalPoints.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[student.status]}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <Eye className="h-4 w-4 text-arc-slate-400" />
                            </button>
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <Edit className="h-4 w-4 text-arc-slate-400" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No students found
                </h3>
                <p className="text-arc-slate-500 mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first student to get started"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
