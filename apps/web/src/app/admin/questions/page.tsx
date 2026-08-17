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
  Filter,
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  X,
  Download,
  Upload,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const questions = [
  {
    id: 1,
    type: "multiple_choice",
    content: "What is the value of x in the equation 2x + 5 = 15?",
    subject: "Mathematics",
    topic: "Algebra",
    difficulty: "Easy",
    correctRate: 92,
    timesUsed: 45,
    status: "published",
  },
  {
    id: 2,
    type: "multiple_choice",
    content: "Which of the following is the powerhouse of the cell?",
    subject: "Science",
    topic: "Biology",
    difficulty: "Easy",
    correctRate: 88,
    timesUsed: 62,
    status: "published",
  },
  {
    id: 3,
    type: "multiple_choice",
    content: "What year did the Philippines gain independence from Spain?",
    subject: "Araling Panlipunan",
    topic: "Philippine History",
    difficulty: "Medium",
    correctRate: 65,
    timesUsed: 38,
    status: "published",
  },
  {
    id: 4,
    type: "multiple_choice",
    content: "Calculate the derivative of f(x) = x³ + 2x² - 5x + 1",
    subject: "Mathematics",
    topic: "Calculus",
    difficulty: "Hard",
    correctRate: 45,
    timesUsed: 28,
    status: "published",
  },
  {
    id: 5,
    type: "multiple_choice",
    content: "Which gas is most abundant in the Earth's atmosphere?",
    subject: "Science",
    topic: "Chemistry",
    difficulty: "Easy",
    correctRate: 78,
    timesUsed: 55,
    status: "draft",
  },
  {
    id: 6,
    type: "true_or_false",
    content: "The mitochondria is responsible for producing energy in the cell.",
    subject: "Science",
    topic: "Biology",
    difficulty: "Easy",
    correctRate: 95,
    timesUsed: 30,
    status: "published",
  },
];

const difficultyColors: Record<string, { bg: string; text: string }> = {
  Easy: { bg: "bg-green-100", text: "text-green-700" },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Hard: { bg: "bg-red-100", text: "text-red-700" },
};

const typeIcons: Record<string, { label: string; color: string }> = {
  multiple_choice: { label: "A", color: "bg-blue-100 text-blue-700" },
  true_or_false: { label: "T/F", color: "bg-purple-100 text-purple-700" },
  fill_in_blank: { label: "___", color: "bg-amber-100 text-amber-700" },
  essay: { label: "E", color: "bg-green-100 text-green-700" },
};

const stats = [
  { label: "Total Questions", value: "12,847", change: "+234", positive: true, icon: FileText },
  { label: "Published", value: "11,520", change: "+200", positive: true, icon: CheckCircle },
  { label: "Draft", value: "1,327", change: "+34", positive: true, icon: Clock },
  { label: "Avg Correct Rate", value: "72%", change: "+2%", positive: true, icon: Star },
];

export default function QuestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || q.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === "all" || q.status === selectedStatus;
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  return (
    <>
      <DashboardHeader title="Question Bank" subtitle="Manage your question database" />

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

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-arc-orange-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-arc-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-arc-navy-900">All Questions</h2>
              <Badge variant="secondary" className="mt-1">{filteredQuestions.length} questions</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              Add Question
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-arc-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-arc-slate-200 focus:border-arc-navy-500"
                />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Araling Panlipunan">Araling Panlipunan</option>
                <option value="English">English</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
              >
                <option value="all">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {(searchQuery || selectedSubject !== "all" || selectedDifficulty !== "all" || selectedStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("all");
                    setSelectedDifficulty("all");
                    setSelectedStatus("all");
                  }}
                  className="text-arc-slate-500 hover:text-arc-navy-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card className="shadow-arc-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Question</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Difficulty</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Correct Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Times Used</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {filteredQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-arc-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm font-medium text-arc-navy-900 line-clamp-2">{question.content}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${typeIcons[question.type].color}`}>
                          {typeIcons[question.type].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-arc-navy-900">{question.subject}</div>
                        <div className="text-xs text-arc-slate-500">{question.topic}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`font-semibold ${difficultyColors[question.difficulty].bg} ${difficultyColors[question.difficulty].text}`}>
                          {question.difficulty}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-arc-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                question.correctRate >= 80 ? "bg-green-500" :
                                question.correctRate >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${question.correctRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-arc-slate-600">{question.correctRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-arc-slate-600">{question.timesUsed}</td>
                      <td className="px-6 py-4">
                        <Badge variant={question.status === "published" ? "success" : "secondary"} className="font-medium">
                          {question.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors text-arc-slate-500">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                              <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-arc-slate-50">
                              <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                              Edit
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
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-arc-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-arc-navy-900">Add New Question</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Question Type</label>
                <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_or_false">True or False</option>
                  <option value="fill_in_blank">Fill in the Blank</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Question</label>
                <textarea
                  className="w-full h-24 px-3 py-2 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  placeholder="Enter your question..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Subject</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>Araling Panlipunan</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Topic</label>
                  <Input placeholder="Enter topic" className="border-arc-slate-200 focus:border-arc-navy-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Difficulty</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Status</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-arc-slate-200">
                Cancel
              </Button>
              <Button variant="accent" className="shadow-lg shadow-arc-orange-500/20">
                Save Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
