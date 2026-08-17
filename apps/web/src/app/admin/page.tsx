"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import {
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ChevronRight,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

const stats = [
  { label: "Total Users", value: "15,234", change: "+12%", positive: true, icon: Users, color: "blue" },
  { label: "Active Programs", value: "48", change: "+3", positive: true, icon: BookOpen, color: "green" },
  { label: "Questions", value: "12,847", change: "+234", positive: true, icon: FileText, color: "purple" },
  { label: "Revenue", value: "₱245,000", change: "+8%", positive: true, icon: DollarSign, color: "amber" },
];

const recentUsers = [
  { id: 1, name: "Maria Santos", email: "maria.santos@email.com", role: "Student", program: "Grade 10", status: "active", avatar: "MS" },
  { id: 2, name: "Juan Cruz", email: "juan.cruz@email.com", role: "Student", program: "College Entrance", status: "active", avatar: "JC" },
  { id: 3, name: "Ana Reyes", email: "ana.reyes@email.com", role: "Teacher", program: "Mathematics", status: "active", avatar: "AR" },
  { id: 4, name: "Carlo Mendoza", email: "carlo.mendoza@email.com", role: "Student", program: "Grade 8", status: "pending", avatar: "CM" },
];

const programStats = [
  { name: "Basic Education", students: 8500, progress: 78, revenue: "₱125,000" },
  { name: "Entrance Exam Prep", students: 3200, progress: 65, revenue: "₱65,000" },
  { name: "Board Exam Review", students: 1800, progress: 82, revenue: "₱45,000" },
  { name: "College", students: 1200, progress: 45, revenue: "₱10,000" },
];

const recentActivity = [
  { id: 1, action: "New student registered", user: "Pedro Garcia", time: "2 minutes ago", type: "success" },
  { id: 2, action: "New question added", user: "Admin", time: "15 minutes ago", type: "info" },
  { id: 3, action: "Payment received", user: "Maria Santos", time: "1 hour ago", type: "success" },
  { id: 4, action: "Program updated", user: "Teacher Ana", time: "2 hours ago", type: "warning" },
  { id: 5, action: "New enrollment", user: "Juan Cruz", time: "3 hours ago", type: "info" },
];

const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600", text: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600", text: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600", text: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600", text: "text-amber-600" },
};

export default function AdminDashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Overview of your platform"
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div className={`flex items-center text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.positive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Recent Users
                  </CardTitle>
                  <Button variant="ghost" size="sm">View all</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 text-sm font-medium text-gray-500">User</th>
                        <th className="pb-3 text-sm font-medium text-gray-500">Role</th>
                        <th className="pb-3 text-sm font-medium text-gray-500">Program</th>
                        <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-medium">
                                  {user.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant={user.role === "Teacher" ? "info" : "secondary"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm text-gray-600">{user.program}</td>
                          <td className="py-4">
                            <Badge variant={user.status === "active" ? "success" : "warning"}>
                              {user.status === "active" ? "Active" : "Pending"}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-red-500">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Program Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programStats.map((program) => (
                    <div key={program.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{program.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">{program.students.toLocaleString()} students</span>
                          <span className="text-green-600 font-medium">{program.revenue}</span>
                        </div>
                      </div>
                      <Progress value={program.progress} className="h-2" indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-full ${
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
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Questions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="h-4 w-4 mr-2" />
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
