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
  Progress,
} from "@/components/ui";
import {
  Trophy,
  Calendar,
  Clock,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Star,
  Calculator,
  FlaskConical,
  FileArchive,
  Crosshair,
  FlaskRound,
  BarChart3,
} from "lucide-react";

const upcomingExams = [
  {
    id: 1,
    title: "Mathematics Chapter 5 Test",
    subject: "Mathematics",
    date: "Tomorrow, 9:00 AM",
    questions: 20,
    duration: 30,
    type: "Chapter Test",
    icon: Calculator,
  },
  {
    id: 2,
    title: "Science Quarterly Exam",
    subject: "Science",
    date: "Aug 20, 2026, 1:00 PM",
    questions: 50,
    duration: 60,
    type: "Quarterly Exam",
    icon: FlaskConical,
  },
  {
    id: 3,
    title: "English Midterm Exam",
    subject: "English",
    date: "Aug 25, 2026, 10:00 AM",
    questions: 40,
    duration: 45,
    type: "Midterm Exam",
    icon: BookOpen,
  },
];

const pastExams = [
  {
    id: 4,
    title: "Mathematics Chapter 4 Test",
    subject: "Mathematics",
    date: "Aug 10, 2026",
    score: 88,
    highestScore: 100,
    totalStudents: 45,
    rank: 5,
    status: "reviewed",
    icon: Calculator,
  },
  {
    id: 5,
    title: "Science Quiz 3",
    subject: "Science",
    date: "Aug 8, 2026",
    score: 75,
    highestScore: 95,
    totalStudents: 42,
    rank: 12,
    status: "pending_review",
    icon: FlaskConical,
  },
  {
    id: 6,
    title: "Araling Panlipunan Quiz 2",
    subject: "Araling Panlipunan",
    date: "Aug 5, 2026",
    score: 92,
    highestScore: 100,
    totalStudents: 38,
    rank: 2,
    status: "reviewed",
    icon: FileArchive,
  },
  {
    id: 7,
    title: "Mathematics Midterm Exam",
    subject: "Mathematics",
    date: "Jul 28, 2026",
    score: 85,
    highestScore: 98,
    totalStudents: 45,
    rank: 8,
    status: "reviewed",
    icon: Calculator,
  },
];

const mockExams = [
  {
    id: 8,
    title: "UPCAT Math Practice Exam",
    description: "Simulated UPCAT mathematics exam",
    questions: 60,
    duration: 90,
    attempts: 3,
    bestScore: 78,
    icon: Crosshair,
    available: true,
  },
  {
    id: 9,
    title: "College Entrance: Science",
    description: "General science for college entrance",
    questions: 75,
    duration: 120,
    attempts: 1,
    bestScore: 65,
    icon: FlaskRound,
    available: true,
  },
  {
    id: 10,
    title: "Board Exam: Math Basics",
    description: "Practice for teacher licensure exam",
    questions: 50,
    duration: 90,
    attempts: 0,
    bestScore: 0,
    icon: BarChart3,
    available: false,
  },
];

const stats = [
  { label: "Upcoming Exams", value: "3", icon: Calendar, color: "blue" },
  { label: "Completed", value: "24", icon: CheckCircle, color: "green" },
  { label: "Avg Score", value: "82%", icon: TrendingUp, color: "purple" },
  { label: "Total Rank", value: "#5", icon: Award, color: "amber" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
};

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <>
      <DashboardHeader title="Exams & Mock Tests" subtitle="Track your exam progress and take mock tests" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          {stats.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          {[
            { id: "upcoming", label: "Upcoming", count: upcomingExams.length },
            { id: "past", label: "Past Exams", count: pastExams.length },
            { id: "mock", label: "Mock Exams", count: mockExams.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-2">{tab.count}</Badge>
            </button>
          ))}
        </div>

        {/* Upcoming Exams */}
        {activeTab === "upcoming" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {upcomingExams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <exam.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                      <p className="text-sm text-gray-500">{exam.subject}</p>
                      <Badge className="mt-2" variant="info">{exam.type}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{exam.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {exam.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exam.duration} min
                      </span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Take Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Past Exams */}
        {activeTab === "past" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pastExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <exam.icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{exam.title}</div>
                              <div className="text-sm text-gray-500">{exam.subject}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{exam.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold text-gray-900">{exam.score}%</div>
                            <div className="text-xs text-gray-500">/ {exam.highestScore}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={exam.rank <= 3 ? "success" : "secondary"}>
                            #{exam.rank} of {exam.totalStudents}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={exam.status === "reviewed" ? "success" : "warning"}>
                            {exam.status === "reviewed" ? "Reviewed" : "Pending Review"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock Exams */}
        {activeTab === "mock" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockExams.map((exam) => (
              <Card key={exam.id} className={!exam.available ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <exam.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    {exam.available ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{exam.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{exam.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">{exam.questions}</div>
                      <div className="text-xs text-gray-500">Questions</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">{exam.duration}m</div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                  </div>

                  {exam.attempts > 0 ? (
                    <div className="p-3 bg-green-50 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Best Score</span>
                        <span className="text-lg font-bold text-green-600">{exam.bestScore}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{exam.attempts} attempt(s) made</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg mb-4 text-center">
                      <p className="text-sm text-gray-500">No attempts yet</p>
                    </div>
                  )}

                  <Button className="w-full" disabled={!exam.available}>
                    <Target className="h-4 w-4 mr-2" />
                    {exam.attempts > 0 ? "Retake Exam" : "Start Exam"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
