"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  UserPlus,
  Download,
  Upload,
  Mail,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const users = [
  {
    id: 1,
    name: "Maria Santos",
    email: "maria.santos@email.com",
    avatar: "MS",
    role: "student",
    program: "Grade 10 Mathematics",
    status: "active",
    enrolled: "Aug 1, 2026",
    lastActive: "2 hours ago",
    progress: 72,
  },
  {
    id: 2,
    name: "Juan Cruz",
    email: "juan.cruz@email.com",
    avatar: "JC",
    role: "student",
    program: "College Entrance Prep",
    status: "active",
    enrolled: "Jul 15, 2026",
    lastActive: "30 minutes ago",
    progress: 85,
  },
  {
    id: 3,
    name: "Ana Reyes",
    email: "ana.reyes@aratc.ph",
    avatar: "AR",
    role: "teacher",
    program: "Mathematics Department",
    status: "active",
    enrolled: "Jun 1, 2026",
    lastActive: "1 hour ago",
    progress: null,
  },
  {
    id: 4,
    name: "Carlo Mendoza",
    email: "carlo.mendoza@email.com",
    avatar: "CM",
    role: "student",
    program: "Grade 8 Science",
    status: "inactive",
    enrolled: "Aug 10, 2026",
    lastActive: "5 days ago",
    progress: 45,
  },
  {
    id: 5,
    name: "Pedro Garcia",
    email: "pedro.garcia@email.com",
    avatar: "PG",
    role: "student",
    program: "Nursing Board Review",
    status: "pending",
    enrolled: "Aug 16, 2026",
    lastActive: "Never",
    progress: 0,
  },
  {
    id: 6,
    name: "Lisa Wong",
    email: "lisa.wong@aratc.ph",
    avatar: "LW",
    role: "admin",
    program: "System Administrator",
    status: "active",
    enrolled: "Jan 1, 2026",
    lastActive: "Just now",
    progress: null,
  },
  {
    id: 7,
    name: "Miguel Torres",
    email: "miguel.torres@email.com",
    avatar: "MT",
    role: "student",
    program: "Grade 9 Araling Panlipunan",
    status: "active",
    enrolled: "Jul 20, 2026",
    lastActive: "3 hours ago",
    progress: 68,
  },
  {
    id: 8,
    name: "Elena Diaz",
    email: "elena.diaz@aratc.ph",
    avatar: "ED",
    role: "teacher",
    program: "Science Department",
    status: "active",
    enrolled: "May 15, 2026",
    lastActive: "2 hours ago",
    progress: null,
  },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  student: { bg: "bg-blue-100", text: "text-blue-700" },
  teacher: { bg: "bg-purple-100", text: "text-purple-700" },
  admin: { bg: "bg-amber-100", text: "text-amber-700" },
  school_admin: { bg: "bg-green-100", text: "text-green-700" },
  content_admin: { bg: "bg-cyan-100", text: "text-cyan-700" },
};

const statusColors: Record<string, { dot: string; text: string }> = {
  active: { dot: "bg-green-500", text: "text-green-600" },
  inactive: { dot: "bg-gray-400", text: "text-gray-500" },
  pending: { dot: "bg-yellow-500", text: "text-yellow-600" },
  suspended: { dot: "bg-red-500", text: "text-red-600" },
};

const roleLabels: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
  school_admin: "School Admin",
  content_admin: "Content Admin",
};

const stats = [
  { label: "Total Users", value: "15,234", change: "+234", icon: Users, color: "arc-orange" },
  { label: "Students", value: "14,521", change: "+220", icon: GraduationCap, color: "blue" },
  { label: "Teachers", value: "682", change: "+12", icon: BookOpen, color: "purple" },
  { label: "Admins", value: "31", change: "+2", icon: Shield, color: "amber" },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / 10);

  return (
    <>
      <DashboardHeader title="User Management" subtitle="Manage all users across the platform" />

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
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <TrendingUp className="h-3 w-3" />
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

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList className="bg-arc-slate-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">All Users</TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Students</TabsTrigger>
              <TabsTrigger value="teachers" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Teachers</TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Admins</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-arc-slate-200 hover:bg-arc-slate-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="border-arc-slate-200 hover:bg-arc-slate-50">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm" variant="accent" onClick={() => setShowAddModal(true)} className="shadow-lg shadow-arc-orange-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          <Card className="shadow-arc-md">
            <CardHeader className="pb-4 border-b border-arc-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-arc-orange-600" />
                  </div>
                  All Users
                  <Badge variant="secondary" className="ml-2">{filteredUsers.length}</Badge>
                </CardTitle>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 border-arc-slate-200 focus:border-arc-navy-500"
                    />
                  </div>

                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                    <option value="school_admin">School Admin</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  {(searchQuery || selectedRole !== "all" || selectedStatus !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedRole("all");
                        setSelectedStatus("all");
                      }}
                      className="text-arc-slate-500 hover:text-arc-navy-900"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-arc-slate-50 border-b border-arc-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Last Active</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-arc-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white text-sm font-semibold">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-arc-navy-900">{user.name}</div>
                              <div className="text-sm text-arc-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role].bg} ${roleColors[user.role].text}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-arc-navy-900">{user.program}</div>
                          <div className="text-xs text-arc-slate-500">Enrolled: {user.enrolled}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusColors[user.status].dot}`} />
                            <span className={`text-sm font-medium capitalize ${statusColors[user.status].text}`}>{user.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.progress !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-arc-orange-500 to-arc-orange-600 rounded-full"
                                  style={{ width: `${user.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-arc-slate-600">{user.progress}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-arc-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-arc-slate-500">{user.lastActive}</td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors text-arc-slate-500">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Mail className="h-4 w-4 mr-2 text-arc-slate-500" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem className="cursor-pointer text-amber-600 hover:bg-amber-50">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="cursor-pointer text-green-600 hover:bg-green-50">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
                <div className="text-sm text-arc-slate-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="border-arc-slate-200 hover:bg-arc-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm font-medium text-arc-navy-900">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="border-arc-slate-200 hover:bg-arc-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-arc-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-arc-navy-900">Add New User</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">First Name</label>
                  <Input placeholder="Juan" className="border-arc-slate-200 focus:border-arc-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Last Name</label>
                  <Input placeholder="Dela Cruz" className="border-arc-slate-200 focus:border-arc-navy-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Email</label>
                <Input type="email" placeholder="juan@email.com" className="border-arc-slate-200 focus:border-arc-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Role</label>
                <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="school_admin">School Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Program</label>
                <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                  <option>Select a program</option>
                  <option>Grade 10 Mathematics</option>
                  <option>College Entrance Prep</option>
                  <option>Nursing Board Review</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-arc-slate-200">
                Cancel
              </Button>
              <Button variant="accent" className="shadow-lg shadow-arc-orange-500/20">
                Add User
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
