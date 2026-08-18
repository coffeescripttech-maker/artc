"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Users, BookOpen, Plus, MoreVertical } from "lucide-react";

const mockClasses = [
  { id: 1, name: "Grade 7 - Mathematics A", students: 35, program: "Grade 7 Mathematics", status: "active" },
  { id: 2, name: "Grade 8 - Science B", students: 28, program: "Grade 8 Science", status: "active" },
  { id: 3, name: "Grade 9 - Araling Panlipunan", students: 42, program: "Grade 9 AP", status: "active" },
];

export default function ClassesPage() {
  return (
    <>
      <DashboardHeader
        title="My Classes"
        subtitle="Manage your assigned classes"
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-arc-navy-900">Your Classes</h2>
            <p className="text-sm text-arc-slate-500">3 active classes</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-arc-orange-500 text-white rounded-lg hover:bg-arc-orange-600 transition-colors">
            <Plus className="h-4 w-4" />
            Create Class
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-arc-orange-600" />
                  </div>
                  <button className="p-1 hover:bg-arc-slate-100 rounded">
                    <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                  </button>
                </div>
                <h3 className="font-semibold text-arc-navy-900 mb-1">{cls.name}</h3>
                <p className="text-sm text-arc-slate-500 mb-3">{cls.program}</p>
                <div className="flex items-center gap-2 text-sm text-arc-slate-600">
                  <Users className="h-4 w-4" />
                  <span>{cls.students} students</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
