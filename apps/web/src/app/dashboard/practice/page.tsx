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
  Input,
} from "@/components/ui";
import {
  Search,
  FileText,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  BookOpen,
  Trophy,
  BarChart3,
  Filter,
} from "lucide-react";

const practiceSets = [
  {
    id: 1,
    title: "Quadratic Equations",
    subject: "Mathematics",
    topic: "Algebra",
    questions: 20,
    timeLimit: 30,
    difficulty: "Intermediate",
    completed: true,
    score: 85,
    questionsAnswered: 20,
    correctAnswers: 17,
    image: "📐",
  },
  {
    id: 2,
    title: "Chemical Bonding",
    subject: "Science",
    topic: "Chemistry",
    questions: 25,
    timeLimit: 40,
    difficulty: "Advanced",
    completed: true,
    score: 72,
    questionsAnswered: 25,
    correctAnswers: 18,
    image: "⚗️",
  },
  {
    id: 3,
    title: "Philippine History",
    subject: "Araling Panlipunan",
    topic: "History",
    questions: 30,
    timeLimit: 45,
    difficulty: "Intermediate",
    completed: false,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    image: "📜",
  },
  {
    id: 4,
    title: "English Grammar",
    subject: "English",
    topic: "Grammar",
    questions: 15,
    timeLimit: 20,
    difficulty: "Easy",
    completed: true,
    score: 100,
    questionsAnswered: 15,
    correctAnswers: 15,
    image: "📖",
  },
  {
    id: 5,
    title: "Linear Equations",
    subject: "Mathematics",
    topic: "Algebra",
    questions: 20,
    timeLimit: 30,
    difficulty: "Easy",
    completed: false,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    image: "📊",
  },
  {
    id: 6,
    title: "Cell Biology",
    subject: "Science",
    topic: "Biology",
    questions: 25,
    timeLimit: 35,
    difficulty: "Intermediate",
    completed: false,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    image: "🧬",
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
};

const stats = [
  { label: "Practice Sets", value: "24", icon: FileText, color: "blue" },
  { label: "Questions Answered", value: "486", icon: Target, color: "green" },
  { label: "Accuracy Rate", value: "78%", icon: TrendingUp, color: "purple" },
  { label: "Time Spent", value: "12.5h", icon: Clock, color: "amber" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
};

export default function PracticePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredPractice = practiceSets.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || p.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === "all" ||
      (selectedStatus === "completed" && p.completed) ||
      (selectedStatus === "not-started" && !p.completed);
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  return (
    <>
      <DashboardHeader title="Practice" subtitle="Sharpen your skills with practice tests" />

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

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search practice sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
            <option value="English">English</option>
            <option value="Araling Panlipunan">Araling Panlipunan</option>
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="not-started">Not Started</option>
          </select>
        </div>

        {/* Practice Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPractice.map((practice) => (
            <Card key={practice.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{practice.image}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{practice.title}</h3>
                      <p className="text-sm text-gray-500">{practice.subject}</p>
                    </div>
                  </div>
                  <Badge className={difficultyColors[practice.difficulty]}>
                    {practice.difficulty}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{practice.questions}</div>
                    <div className="text-xs text-gray-500">Questions</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{practice.timeLimit}m</div>
                    <div className="text-xs text-gray-500">Time</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{practice.topic}</div>
                    <div className="text-xs text-gray-500">Topic</div>
                  </div>
                </div>

                {practice.completed ? (
                  <>
                    {/* Completed Stats */}
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Your Score</span>
                        <span className="text-lg font-bold text-green-600">{practice.score}%</span>
                      </div>
                      <Progress value={practice.score} className="h-2" indicatorClassName="bg-green-500" />
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {practice.correctAnswers} correct
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {practice.questionsAnswered - practice.correctAnswers} wrong
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-700">Not started yet</p>
                      <p className="text-xs text-blue-600">Test your knowledge!</p>
                    </div>
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Start Practice
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
