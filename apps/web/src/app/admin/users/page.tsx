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

const roleColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  admin: "bg-amber-100 text-amber-700",
  school_admin: "bg-green-100 text-green-700",
  content_admin: "bg-cyan-100 text-cyan-700",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  pending: "bg-yellow-500",
  suspended: "bg-red-500",
};

const roleLabels: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
  school_admin: "School Admin",
  content_admin: "Content Admin",
};

const stats = [
  { label: "Total Users", value: "15,234", change: "+234", icon: Users, color: "blue" },
  { label: "Students", value: "14,521", change: "+220", icon: GraduationCap, color: "green" },
  { label: "Teachers", value: "682", change: "+12", icon: BookOpen, color: "purple" },
  { label: "Admins", value: "31", change: "+2", icon: Shield, color: "amber" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
};

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
        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <Badge variant="success" className="text-xs">{stat.change}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  All Users
                  <Badge variant="secondary">{filteredUsers.length}</Badge>
                </CardTitle>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                    <tr className="border-y bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-medium">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.program}</div>
                          <div className="text-xs text-gray-500">Enrolled: {user.enrolled}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${statusColors[user.status]}`} />
                            <span className="text-sm text-gray-700 capitalize">{user.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.progress !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${user.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{user.progress}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.lastActive}</td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem className="text-amber-600">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">
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
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <Input placeholder="Juan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <Input placeholder="Dela Cruz" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" placeholder="juan@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="school_admin">School Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option>Select a program</option>
                  <option>Grade 10 Mathematics</option>
                  <option>College Entrance Prep</option>
                  <option>Nursing Board Review</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button>Add User</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
