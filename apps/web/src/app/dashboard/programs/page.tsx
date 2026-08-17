"use client";

import { useState } from "react";
import Link from "next/link";
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
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  Star,
  Filter,
} from "lucide-react";

const enrolledPrograms = [
  {
    id: 1,
    name: "Grade 10 Mathematics",
    description: "Algebra, Geometry, Statistics and Probability",
    progress: 72,
    lessonsCompleted: 43,
    totalLessons: 60,
    hoursSpent: 28.5,
    streak: 12,
    rating: 4.8,
    nextLesson: "Quadratic Equations: Applications",
    image: "📐",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    name: "Grade 10 Science",
    description: "Physics, Chemistry, Biology fundamentals",
    progress: 58,
    lessonsCompleted: 35,
    totalLessons: 60,
    hoursSpent: 22.0,
    streak: 8,
    rating: 4.7,
    nextLesson: "Chemical Bonding",
    image: "🔬",
    color: "from-green-500 to-green-600",
  },
  {
    id: 3,
    name: "College Entrance Prep: Math",
    description: "UPCAT, Ateneo, DLSU Math review",
    progress: 35,
    lessonsCompleted: 18,
    totalLessons: 50,
    hoursSpent: 15.0,
    streak: 5,
    rating: 4.9,
    nextLesson: "Advanced Trigonometry",
    image: "📊",
    color: "from-purple-500 to-purple-600",
  },
];

const recommendedPrograms = [
  {
    id: 4,
    name: "Araling Panlipunan: Grade 10",
    description: "Philippine History and Government",
    students: 2500,
    rating: 4.6,
    image: "📜",
  },
  {
    id: 5,
    name: "English Proficiency",
    description: "Grammar, Vocabulary, Comprehension",
    students: 3200,
    rating: 4.8,
    image: "📖",
  },
  {
    id: 6,
    name: "College Entrance: English",
    description: "Entrance exam English preparation",
    students: 1800,
    rating: 4.7,
    image: "✍️",
  },
];

export default function MyProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  return (
    <>
      <DashboardHeader title="My Programs" subtitle="Manage your enrolled programs" />

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-500">Enrolled Programs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">96</div>
                  <div className="text-sm text-gray-500">Lessons Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">65.5h</div>
                  <div className="text-sm text-gray-500">Total Study Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-500">Best Streak (days)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "in-progress", "completed"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "in-progress" ? "In Progress" : "Completed"}
              </Button>
            ))}
          </div>
        </div>

        {/* Enrolled Programs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Enrolled Programs</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {enrolledPrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${program.color} p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{program.image}</span>
                    <Badge className="bg-white/20 text-white border-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {program.streak} day streak
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{program.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{program.description}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{program.progress}%</span>
                    </div>
                    <Progress value={program.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {program.lessonsCompleted} of {program.totalLessons} lessons
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{program.hoursSpent}h studied</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>{program.rating} rating</span>
                    </div>
                  </div>

                  {/* Next Lesson */}
                  <div className="p-3 bg-gray-50 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 mb-1">Up Next</p>
                    <p className="text-sm font-medium text-gray-900">{program.nextLesson}</p>
                  </div>

                  {/* Action */}
                  <Button className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommended Programs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
            <Link href="/programs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Browse all programs →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{program.image}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{program.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{program.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {program.students.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            {program.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Program
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
