"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
  Progress,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  X,
  Filter,
  Grid3X3,
  List,
  Star,
  Award,
  GraduationCap,
  Layers,
} from "lucide-react";

const programs = [
  {
    id: 1,
    name: "Grade 7 Mathematics",
    description: "Complete mathematics curriculum for Grade 7 students aligned with DepEd K-12 standards.",
    stage: "BASIC_EDUCATION",
    level: "Grade 7",
    subjects: 1,
    lessons: 120,
    questions: 2500,
    students: 1250,
    price: 1999,
    status: "published",
    rating: 4.8,
    reviews: 342,
    created: "Jan 15, 2026",
    updated: "Aug 10, 2026",
  },
  {
    id: 2,
    name: "Grade 8 Science",
    description: "Comprehensive science curriculum covering Physics, Chemistry, and Biology fundamentals.",
    stage: "BASIC_EDUCATION",
    level: "Grade 8",
    subjects: 3,
    lessons: 180,
    questions: 3200,
    students: 980,
    price: 2499,
    status: "published",
    rating: 4.7,
    reviews: 256,
    created: "Feb 1, 2026",
    updated: "Aug 12, 2026",
  },
  {
    id: 3,
    name: "College Entrance Exam Prep",
    description: "Intensive preparation for UPCAT, Ateneo, De La Salle, and other college entrance exams.",
    stage: "ENTRANCE_EXAM",
    level: "Senior High",
    subjects: 5,
    lessons: 250,
    questions: 5000,
    students: 2100,
    price: 4999,
    status: "published",
    rating: 4.9,
    reviews: 567,
    created: "Mar 10, 2026",
    updated: "Aug 14, 2026",
  },
  {
    id: 4,
    name: "Nursing Board Review",
    description: "Comprehensive nursing board exam review with mock boards and detailed explanations.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 6,
    lessons: 300,
    questions: 8000,
    students: 450,
    price: 8999,
    status: "published",
    rating: 4.9,
    reviews: 189,
    created: "Apr 5, 2026",
    updated: "Aug 15, 2026",
  },
  {
    id: 5,
    name: "Senior High School: STEM",
    description: "Specialized STEM track program for Grades 11-12 with advanced mathematics and sciences.",
    stage: "BASIC_EDUCATION",
    level: "Grade 11-12",
    subjects: 8,
    lessons: 400,
    questions: 10000,
    students: 720,
    price: 3999,
    status: "published",
    rating: 4.6,
    reviews: 145,
    created: "May 20, 2026",
    updated: "Aug 8, 2026",
  },
  {
    id: 6,
    name: "Engineering Board Exam Review",
    description: "Professional engineering board exam review covering all major engineering disciplines.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 5,
    lessons: 280,
    questions: 7500,
    students: 320,
    price: 9999,
    status: "published",
    rating: 4.8,
    reviews: 98,
    created: "Jun 1, 2026",
    updated: "Aug 11, 2026",
  },
  {
    id: 7,
    name: "Elementary: Grades 4-6 English",
    description: "English language development program for upper elementary students.",
    stage: "BASIC_EDUCATION",
    level: "Grade 4-6",
    subjects: 1,
    lessons: 90,
    questions: 1800,
    students: 560,
    price: 1499,
    status: "draft",
    rating: 0,
    reviews: 0,
    created: "Jul 1, 2026",
    updated: "Aug 16, 2026",
  },
  {
    id: 8,
    name: "Criminology Board Review",
    description: "Comprehensive criminology board exam preparation with case studies and mock exams.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 4,
    lessons: 200,
    questions: 4000,
    students: 180,
    price: 6999,
    status: "archived",
    rating: 4.5,
    reviews: 67,
    created: "Feb 15, 2026",
    updated: "Jul 20, 2026",
  },
];

const stageLabels: Record<string, string> = {
  BASIC_EDUCATION: "Basic Education",
  ENTRANCE_EXAM: "Entrance Exam",
  COLLEGE: "College",
  PROFESSIONAL: "Professional",
  BOARD_EXAM: "Board Exam",
  CERTIFICATION: "Certification",
  CONTINUING_EDUCATION: "Continuing Ed",
};

const stageColors: Record<string, string> = {
  BASIC_EDUCATION: "bg-blue-100 text-blue-700",
  ENTRANCE_EXAM: "bg-purple-100 text-purple-700",
  COLLEGE: "bg-green-100 text-green-700",
  PROFESSIONAL: "bg-amber-100 text-amber-700",
  BOARD_EXAM: "bg-red-100 text-red-700",
  CERTIFICATION: "bg-cyan-100 text-cyan-700",
  CONTINUING_EDUCATION: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  published: { bg: "bg-green-100", text: "text-green-700" },
  draft: { bg: "bg-yellow-100", text: "text-yellow-700" },
  archived: { bg: "bg-gray-100", text: "text-gray-700" },
  beta: { bg: "bg-blue-100", text: "text-blue-700" },
};

const stats = [
  { label: "Total Programs", value: "48", change: "+5", icon: BookOpen, color: "blue" },
  { label: "Active Students", value: "15,234", change: "+12%", icon: Users, color: "green" },
  { label: "Total Revenue", value: "₱245K", change: "+8%", icon: DollarSign, color: "amber" },
  { label: "Avg Rating", value: "4.7", change: "+0.2", icon: Star, color: "purple" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
};

type ViewMode = "grid" | "list";

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "all" || program.stage === selectedStage;
    const matchesStatus = selectedStatus === "all" || program.status === selectedStatus;
    return matchesSearch && matchesStage && matchesStatus;
  });

  return (
    <>
      <DashboardHeader title="Program Management" subtitle="Manage educational programs and courses" />

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

        {/* Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-gray-500" />
              All Programs
              <Badge variant="secondary">{filteredPrograms.length}</Badge>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Stages</option>
              <option value="BASIC_EDUCATION">Basic Education</option>
              <option value="ENTRANCE_EXAM">Entrance Exam</option>
              <option value="COLLEGE">College</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="BOARD_EXAM">Board Exam</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={stageColors[program.stage]}>
                          {stageLabels[program.stage]}
                        </Badge>
                        <Badge className={statusColors[program.status].bg + " " + statusColors[program.status].text}>
                          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {program.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Program
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{program.subjects} Subjects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{program.lessons} Lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{program.students.toLocaleString()} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-600">
                        {program.rating > 0 ? `${program.rating} (${program.reviews})` : "No ratings"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold text-gray-900">₱{program.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Updated {program.updated}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                    View Program
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPrograms.map((program) => (
                      <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{program.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{program.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={stageColors[program.stage]}>
                            {stageLabels[program.stage]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div>{program.subjects} subjects</div>
                            <div className="text-gray-500">{program.lessons} lessons</div>
                            <div className="text-gray-500">{program.questions.toLocaleString()} questions</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{program.students.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          {program.rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium">{program.rating}</span>
                              <span className="text-sm text-gray-500">({program.reviews})</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No ratings</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">₱{program.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[program.status].bg + " " + statusColors[program.status].text}>
                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-md hover:bg-gray-100">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Program
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Create New Program</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                <Input placeholder="e.g., Grade 10 Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  placeholder="Describe what this program covers..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Stage</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="BASIC_EDUCATION">Basic Education</option>
                    <option value="ENTRANCE_EXAM">Entrance Exam</option>
                    <option value="COLLEGE">College</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BOARD_EXAM">Board Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <Input placeholder="e.g., Grade 10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                  <Input type="number" placeholder="1999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="beta">Beta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                <Input placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button>Create Program</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
