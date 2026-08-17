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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-red-100 text-red-700",
};

const typeIcons: Record<string, string> = {
  multiple_choice: "A",
  true_or_false: "T/F",
  fill_in_blank: "___",
  essay: "📝",
};

const stats = [
  { label: "Total Questions", value: "12,847", change: "+234", icon: FileText, color: "blue" },
  { label: "Published", value: "11,520", change: "+200", icon: CheckCircle, color: "green" },
  { label: "Draft", value: "1,327", change: "+34", icon: Clock, color: "amber" },
  { label: "Avg Correct Rate", value: "72%", change: "+2%", icon: Star, color: "purple" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
};

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
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          {stats.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.label}>
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

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              All Questions
              <Badge variant="secondary">{filteredQuestions.length}</Badge>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              Add Question
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
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
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Questions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correct Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Times Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 line-clamp-2">{question.content}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-gray-100 text-xs font-medium text-gray-600">
                          {typeIcons[question.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{question.subject}</div>
                        <div className="text-xs text-gray-500">{question.topic}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={difficultyColors[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                question.correctRate >= 80 ? "bg-green-500" :
                                question.correctRate >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${question.correctRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{question.correctRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{question.timesUsed}</td>
                      <td className="px-6 py-4">
                        <Badge variant={question.status === "published" ? "success" : "secondary"}>
                          {question.status === "published" ? "Published" : "Draft"}
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
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
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
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Add New Question</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_or_false">True or False</option>
                  <option value="fill_in_blank">Fill in the Blank</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  placeholder="Enter your question..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>Araling Panlipunan</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <Input placeholder="Enter topic" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button>Save Question</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
