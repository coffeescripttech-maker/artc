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
  TrendingUp,
  TrendingDown,
  BookOpen,
  Target,
  Clock,
  Trophy,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
} from "lucide-react";

const weeklyData = [
  { day: "Mon", hours: 2.5, lessons: 3 },
  { day: "Tue", hours: 1.8, lessons: 2 },
  { day: "Wed", hours: 3.2, lessons: 4 },
  { day: "Thu", hours: 2.0, lessons: 2 },
  { day: "Fri", hours: 2.8, lessons: 3 },
  { day: "Sat", hours: 1.5, lessons: 2 },
  { day: "Sun", hours: 0.5, lessons: 1 },
];

const subjectPerformance = [
  { subject: "Mathematics", score: 85, trend: "+5%", color: "bg-blue-500" },
  { subject: "Science", score: 78, trend: "+3%", color: "bg-green-500" },
  { subject: "English", score: 92, trend: "+8%", color: "bg-purple-500" },
  { subject: "Araling Panlipunan", score: 81, trend: "+2%", color: "bg-amber-500" },
];

const weakAreas = [
  { topic: "Trigonometry", questions: 25, correctRate: 45, improvement: "+12%" },
  { topic: "Chemical Reactions", questions: 18, correctRate: 52, improvement: "+8%" },
  { topic: "Grammar: Tenses", questions: 30, correctRate: 65, improvement: "+15%" },
];

const strongAreas = [
  { topic: "Basic Algebra", questions: 50, correctRate: 95, improvement: "+2%" },
  { topic: "Cell Biology", questions: 40, correctRate: 92, improvement: "+5%" },
  { topic: "Vocabulary", questions: 60, correctRate: 98, improvement: "+3%" },
];

const stats = [
  { label: "Total Study Time", value: "14.3h", change: "+2.5h", positive: true, icon: Clock },
  { label: "Lessons This Week", value: "17", change: "+3", positive: true, icon: BookOpen },
  { label: "Accuracy Rate", value: "78%", change: "+5%", positive: true, icon: Target },
  { label: "Weekly Rank", value: "#12", change: "+3", positive: true, icon: Trophy },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week");
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Track your learning progress and performance" />

      <div className="p-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
          <div className="flex gap-2">
            {["week", "month", "year"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                    {stat.positive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Weekly Study Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around gap-2">
                {weeklyData.map((day) => (
                  <div key={day.day} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">{day.hours}h</span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg transition-all hover:from-blue-600 hover:to-indigo-600"
                        style={{ height: `${(day.hours / maxHours) * 180}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-around text-sm text-gray-500">
                <span>Total: 14.3 hours</span>
                <span>Avg: 2.0 hours/day</span>
                <span>17 lessons</span>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectPerformance.map((subject) => (
                  <div key={subject.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{subject.subject}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-semibold">{subject.score}%</span>
                        <Badge variant="success" className="text-xs">{subject.trend}</Badge>
                      </div>
                    </div>
                    <Progress value={subject.score} className="h-3" indicatorClassName={subject.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weak & Strong Areas */}
        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          {/* Weak Areas */}
          <Card className="border-l-4 border-l-red-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakAreas.map((area) => (
                  <div key={area.topic} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{area.topic}</span>
                      <Badge variant="destructive">{area.improvement}</Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{area.questions} questions answered</span>
                      <span>{area.correctRate}% correct rate</span>
                    </div>
                    <Progress value={area.correctRate} className="h-2 mt-2" indicatorClassName="bg-red-500" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Practice More on Weak Areas
              </Button>
            </CardContent>
          </Card>

          {/* Strong Areas */}
          <Card className="border-l-4 border-l-green-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Strong Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strongAreas.map((area) => (
                  <div key={area.topic} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{area.topic}</span>
                      <Badge variant="success">+Mastered</Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{area.questions} questions answered</span>
                      <span>{area.correctRate}% correct rate</span>
                    </div>
                    <Progress value={area.correctRate} className="h-2 mt-2" indicatorClassName="bg-green-500" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Keep Practicing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Learning Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">2:00 PM</div>
                <p className="text-sm text-gray-600">Your most productive study time</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-1">15 min</div>
                <p className="text-sm text-gray-600">Average lesson duration</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">78%</div>
                <p className="text-sm text-gray-600">Your overall accuracy rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
