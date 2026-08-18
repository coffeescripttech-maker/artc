"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BarChart3, TrendingUp, Users, BookOpen, Download } from "lucide-react";

const stats = [
  { label: "Total Students", value: "105", change: "+12", icon: Users },
  { label: "Active Classes", value: "3", change: "+1", icon: BookOpen },
  { label: "Questions Created", value: "248", change: "+35", icon: BarChart3 },
  { label: "Avg. Score", value: "78%", change: "+5%", icon: TrendingUp },
];

const topPerformers = [
  { rank: 1, name: "Maria Santos", class: "Grade 7 Math A", score: 95 },
  { rank: 2, name: "Juan Dela Cruz", class: "Grade 7 Math A", score: 92 },
  { rank: 3, name: "Ana Reyes", class: "Grade 8 Science B", score: 89 },
];

const classProgress = [
  { name: "Grade 7 Math A", avgScore: 78, completion: 85 },
  { name: "Grade 8 Science B", avgScore: 82, completion: 72 },
  { name: "Grade 9 AP", avgScore: 75, completion: 68 },
];

export default function ReportsPage() {
  return (
    <>
      <DashboardHeader
        title="Class Reports"
        subtitle="Analytics and performance overview"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-arc-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-arc-navy-900">{stat.value}</div>
                  <div className="text-sm text-arc-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-arc-orange-600" />
                  Top Performers
                </CardTitle>
                <button className="flex items-center gap-1 text-sm text-arc-orange-500 hover:text-arc-orange-600">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((student) => (
                  <div key={student.rank} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-arc-orange-100 flex items-center justify-center text-sm font-bold text-arc-orange-600">
                      {student.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-arc-navy-900">{student.name}</div>
                      <div className="text-sm text-arc-slate-500">{student.class}</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">{student.score}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Class Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-arc-orange-600" />
                Class Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classProgress.map((cls) => (
                  <div key={cls.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-arc-navy-900">{cls.name}</span>
                      <span className="text-arc-slate-500">Avg: {cls.avgScore}%</span>
                    </div>
                    <div className="h-3 w-full bg-arc-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-arc-orange-400 to-arc-orange-500 rounded-full"
                        style={{ width: `${cls.completion}%` }}
                      />
                    </div>
                    <div className="text-xs text-arc-slate-400">{cls.completion}% completion rate</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
