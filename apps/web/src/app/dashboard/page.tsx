"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, Avatar, AvatarFallback } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  Target,
  Flame,
  Star,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Leaf,
  FileText,
  Crosshair,
  Sparkles,
  BookMarked,
} from "lucide-react";

// Get current date formatted
const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const recentLessons = [
  { id: 1, title: "Introduction to Quadratic Equations", subject: "Mathematics", progress: 75, duration: "15 min", icon: Calculator },
  { id: 2, title: "Photosynthesis Process", subject: "Science", progress: 100, duration: "20 min", icon: Leaf },
  { id: 3, title: "Philippine History: Spanish Colonization", subject: "Araling Panlipunan", progress: 30, duration: "25 min", icon: FileText },
];

const weeklyGoals = [
  { id: 1, title: "Complete 5 Math Lessons", current: 3, target: 5, color: "bg-blue-500" },
  { id: 2, title: "Take 3 Practice Tests", current: 2, target: 3, color: "bg-purple-500" },
  { id: 3, title: "Review 2 Weak Topics", current: 1, target: 2, color: "bg-green-500" },
];

const achievements = [
  { id: 1, title: "First Steps", description: "Complete your first lesson", icon: Crosshair, earned: true },
  { id: 2, title: "Quiz Master", description: "Score 100% on 5 quizzes", icon: Sparkles, earned: true },
  { id: 3, title: "Week Warrior", description: "Study for 7 days straight", icon: Flame, earned: false },
  { id: 4, title: "Bookworm", description: "Complete 50 lessons", icon: BookMarked, earned: false },
];

const upcomingExams = [
  { id: 1, title: "Mathematics Chapter 5 Test", date: "Tomorrow", questions: 20, duration: "30 min" },
  { id: 2, title: "Science Quarterly Exam", date: "In 3 days", questions: 50, duration: "60 min" },
];

const stats = [
  { label: "Total Points", value: "2,450", change: "+120", positive: true, icon: Star },
  { label: "Lessons Completed", value: "47", change: "+5", positive: true, icon: BookOpen },
  { label: "Practice Tests", value: "23", change: "+3", positive: true, icon: Trophy },
  { label: "Study Streak", value: "12 days", change: "-2", positive: false, icon: Flame },
];

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { user, isLoading } = useAuth();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get user display name
  const getUserName = () => {
    if (isLoading) return "...";
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <>
      <DashboardHeader
        title={`${getGreeting()}, ${getUserName()}!`}
        subtitle={getFormattedDate()}
      />

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left transition-transform duration-300" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="programs">My Programs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Continue Learning */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Continue Learning
                      </CardTitle>
                      <Link href="/dashboard/programs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                            <lesson.icon className="h-7 w-7 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{lesson.title}</div>
                            <div className="text-sm text-gray-500">{lesson.subject} • {lesson.duration}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <Progress value={lesson.progress} className="h-2 flex-1" />
                              <span className="text-xs text-gray-500">{lesson.progress}%</span>
                            </div>
                          </div>
                          <Link href={`/dashboard/lessons/${lesson.id}`}>
                            <Button size="sm" variant="outline" className="shrink-0">
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Weekly Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {weeklyGoals.map((goal) => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{goal.title}</span>
                            <span className="text-gray-500">{goal.current}/{goal.target}</span>
                          </div>
                          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${goal.color}`} style={{ width: `${(goal.current / goal.target) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upcoming Exams */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      Upcoming Exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingExams.map((exam) => (
                        <div key={exam.id} className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                          <div className="font-medium text-gray-900 text-sm">{exam.title}</div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {exam.date}
                            </span>
                            <span>{exam.questions} questions</span>
                            <span>{exam.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-3 rounded-lg text-center ${
                            achievement.earned
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-gray-50 border border-gray-200 opacity-50"
                          }`}
                        >
                          <div className="h-10 w-10 mx-auto rounded-xl bg-yellow-100 flex items-center justify-center mb-2">
                            <achievement.icon className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="text-xs font-medium text-gray-900">{achievement.title}</div>
                          {achievement.earned && <Badge variant="success" className="mt-1 text-xs">Earned</Badge>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Study Streak */}
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 border-0 text-white">
                  <CardContent className="p-6 text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                      <Flame className="h-10 w-10" />
                    </div>
                    <div className="text-3xl font-bold">12 Day Streak!</div>
                    <div className="text-orange-100 text-sm mt-1">Keep it going!</div>
                    <Button variant="secondary" className="mt-4 w-full bg-white/20 text-white hover:bg-white/30 border-0">
                      <Clock className="h-4 w-4 mr-2" />
                      Start Today's Lesson
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="programs">
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Programs</h3>
                <p className="text-gray-500 mb-4">View and manage all your enrolled programs here.</p>
                <Button>Browse Programs</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Timeline</h3>
                <p className="text-gray-500">Track your learning activity over time.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
