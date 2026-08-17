"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, Avatar, AvatarFallback } from "@/components/ui";
import {
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  UsersRound,
} from "lucide-react";

const stats = [
  { label: "Total Users", value: "15,234", change: "+12%", positive: true, icon: Users, color: "blue" },
  { label: "Active Programs", value: "48", change: "+3", positive: true, icon: BookOpen, color: "green" },
  { label: "Questions", value: "12,847", change: "+234", positive: true, icon: FileText, color: "purple" },
  { label: "Revenue", value: "₱245,000", change: "+8%", positive: true, icon: DollarSign, color: "amber" },
];

const recentUsers = [
  { id: 1, name: "Maria Santos", email: "maria.santos@email.com", role: "Student", program: "Grade 10", status: "active", avatar: "MS", color: "arc-orange" },
  { id: 2, name: "Juan Cruz", email: "juan.cruz@email.com", role: "Student", program: "College Entrance", status: "active", avatar: "JC", color: "arc-navy" },
  { id: 3, name: "Ana Reyes", email: "ana.reyes@email.com", role: "Teacher", program: "Mathematics", status: "active", avatar: "AR", color: "arc-purple" },
  { id: 4, name: "Carlo Mendoza", email: "carlo.mendoza@email.com", role: "Student", program: "Grade 8", status: "pending", avatar: "CM", color: "arc-green" },
];

const programStats = [
  { name: "Basic Education", students: 8500, progress: 78, revenue: "₱125,000", color: "from-blue-500 to-indigo-500" },
  { name: "Entrance Exam Prep", students: 3200, progress: 65, revenue: "₱65,000", color: "from-purple-500 to-pink-500" },
  { name: "Board Exam Review", students: 1800, progress: 82, revenue: "₱45,000", color: "from-orange-500 to-red-500" },
  { name: "College", students: 1200, progress: 45, revenue: "₱10,000", color: "from-green-500 to-teal-500" },
];

const recentActivity = [
  { id: 1, action: "New student registered", user: "Pedro Garcia", time: "2 minutes ago", type: "success" },
  { id: 2, action: "New question added", user: "Admin", time: "15 minutes ago", type: "info" },
  { id: 3, action: "Payment received", user: "Maria Santos", time: "1 hour ago", type: "success" },
  { id: 4, action: "Program updated", user: "Teacher Ana", time: "2 hours ago", type: "warning" },
  { id: 5, action: "New enrollment", user: "Juan Cruz", time: "3 hours ago", type: "info" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Overview of your platform"
      />

      <div className="p-6">
        {/* Stats Grid - Professional Design */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="relative overflow-hidden group hover:shadow-arc-xl transition-all duration-300"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arc-orange-500 to-arc-orange-400 transform origin-left transition-transform duration-300 group-hover:scale-x-100" />

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {/* Icon with consistent soft color */}
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-arc-orange-100">
                    <stat.icon className="h-6 w-6 text-arc-orange-600" />
                  </div>

                  {/* Change badge */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    stat.positive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>

                {/* Value and Label */}
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-arc-navy-950">{stat.value}</div>
                  <div className="text-sm font-medium text-arc-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Users */}
            <Card className="shadow-arc-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                      <UsersRound className="h-5 w-5 text-arc-orange-600" />
                    </div>
                    Recent Users
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-arc-orange-600 hover:text-arc-orange-700 hover:bg-arc-orange-50">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-arc-slate-50 border-b border-arc-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Program</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="border-b border-arc-slate-50 last:border-0 hover:bg-arc-slate-50 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarFallback className={`bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white text-sm font-semibold`}>
                                  {user.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-arc-navy-900">{user.name}</div>
                                <div className="text-xs text-arc-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant={user.role === "Teacher" ? "premium" : "secondary"} className="font-medium">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm text-arc-slate-600">{user.program}</td>
                          <td className="py-4">
                            <Badge variant={user.status === "active" ? "success" : "warning"} className="font-medium">
                              {user.status === "active" ? "Active" : "Pending"}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-2 rounded-lg hover:bg-arc-slate-100 text-arc-slate-500 transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-arc-slate-100 text-arc-slate-500 transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                                <Trash2 className="h-4 w-4" />
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

            {/* Program Performance */}
            <Card className="shadow-arc-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  Program Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {programStats.map((program) => (
                    <div key={program.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-arc-navy-900">{program.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-arc-slate-500">{program.students.toLocaleString()} students</span>
                          <span className="text-arc-orange-600 font-semibold">{program.revenue}</span>
                        </div>
                      </div>
                      <Progress value={program.progress} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:${program.color}" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="shadow-arc-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-arc-slate-50 transition-colors">
                      <div className={`mt-0.5 p-2 rounded-lg ${
                        activity.type === "success" ? "bg-green-100" :
                        activity.type === "warning" ? "bg-amber-100" :
                        "bg-blue-100"
                      }`}>
                        {activity.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : activity.type === "warning" ? (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-arc-navy-900">{activity.action}</p>
                        <p className="text-xs text-arc-slate-500">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-arc-md bg-gradient-to-br from-arc-navy-900 to-arc-navy-800 border-0 text-white">
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-arc-orange-500 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="accent" className="w-full justify-start bg-arc-orange-500 hover:bg-arc-orange-600 border-0 shadow-lg shadow-arc-orange-500/20">
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Questions
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
