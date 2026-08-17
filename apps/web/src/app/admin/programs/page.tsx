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
  TrendingDown,
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
  { label: "Total Programs", value: "48", change: "+5", positive: true, icon: BookOpen },
  { label: "Active Students", value: "15,234", change: "+12%", positive: true, icon: Users },
  { label: "Total Revenue", value: "₱245K", change: "+8%", positive: true, icon: DollarSign },
  { label: "Avg Rating", value: "4.7", change: "+0.2", positive: true, icon: Star },
];

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
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-arc-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arc-orange-500 to-arc-orange-400 transform origin-left transition-transform duration-300 group-hover:scale-x-100" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-arc-orange-100">
                    <stat.icon className="h-6 w-6 text-arc-orange-600" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-arc-navy-950">{stat.value}</div>
                  <div className="text-sm font-medium text-arc-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-arc-orange-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-arc-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-arc-navy-900">All Programs</h2>
              <Badge variant="secondary" className="mt-1">{filteredPrograms.length} programs</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-arc-slate-200 focus:border-arc-navy-500"
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
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
              className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex items-center border border-arc-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 ${viewMode === "grid" ? "bg-arc-orange-500 text-white" : "text-arc-slate-500 hover:bg-arc-slate-50"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 ${viewMode === "list" ? "bg-arc-orange-500 text-white" : "text-arc-slate-500 hover:bg-arc-slate-50"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button variant="accent" onClick={() => setShowAddModal(true)} className="shadow-lg shadow-arc-orange-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-arc-xl transition-all duration-300 group">
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
                      <CardTitle className="text-lg group-hover:text-arc-orange-600 transition-colors">
                        {program.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-arc-slate-100 text-arc-slate-500">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                          <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                          <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                          Edit Program
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                          <Copy className="h-4 w-4 mr-2 text-arc-slate-500" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-arc-slate-600 mb-4 line-clamp-2">{program.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-arc-slate-400" />
                      <span className="text-arc-slate-600">{program.subjects} Subjects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-arc-slate-400" />
                      <span className="text-arc-slate-600">{program.lessons} Lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-arc-slate-400" />
                      <span className="text-arc-slate-600">{program.students.toLocaleString()} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-arc-slate-600">
                        {program.rating > 0 ? `${program.rating} (${program.reviews})` : "No ratings"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
                    <div className="text-lg font-bold text-arc-navy-900">₱{program.price.toLocaleString()}</div>
                    <div className="text-sm text-arc-slate-500">Updated {program.updated}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full group-hover:bg-arc-orange-500 group-hover:text-white group-hover:border-arc-orange-500 transition-colors">
                    View Program
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card className="shadow-arc-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-arc-slate-50 border-b border-arc-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Stage</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Content</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Students</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {filteredPrograms.map((program) => (
                      <tr key={program.id} className="hover:bg-arc-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-arc-navy-900">{program.name}</div>
                            <div className="text-sm text-arc-slate-500 max-w-xs truncate">{program.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={stageColors[program.stage]}>
                            {stageLabels[program.stage]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-arc-slate-600">{program.subjects} subjects</div>
                            <div className="text-arc-slate-500">{program.lessons} lessons</div>
                            <div className="text-arc-slate-500">{program.questions.toLocaleString()} questions</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-arc-navy-900">{program.students.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          {program.rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-arc-navy-900">{program.rating}</span>
                              <span className="text-sm text-arc-slate-500">({program.reviews})</span>
                            </div>
                          ) : (
                            <span className="text-sm text-arc-slate-400">No ratings</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-arc-navy-900">₱{program.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[program.status].bg + " " + statusColors[program.status].text}>
                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-arc-slate-100 text-arc-slate-500">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                                Edit Program
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                                <Copy className="h-4 w-4 mr-2 text-arc-slate-500" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-arc-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-arc-navy-900">Create New Program</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Program Name</label>
                <Input placeholder="e.g., Grade 10 Mathematics" className="border-arc-slate-200 focus:border-arc-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Description</label>
                <textarea
                  className="w-full h-24 px-3 py-2 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  placeholder="Describe what this program covers..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Education Stage</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="BASIC_EDUCATION">Basic Education</option>
                    <option value="ENTRANCE_EXAM">Entrance Exam</option>
                    <option value="COLLEGE">College</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BOARD_EXAM">Board Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Level</label>
                  <Input placeholder="e.g., Grade 10" className="border-arc-slate-200 focus:border-arc-navy-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Price (₱)</label>
                  <Input type="number" placeholder="1999" className="border-arc-slate-200 focus:border-arc-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Status</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="beta">Beta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Cover Image URL</label>
                <Input placeholder="https://..." className="border-arc-slate-200 focus:border-arc-navy-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-arc-slate-200">Cancel</Button>
              <Button variant="accent" className="shadow-lg shadow-arc-orange-500/20">Create Program</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
