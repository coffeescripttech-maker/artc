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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  Trophy,
  Star,
  Medal,
  Target,
  Flame,
  BookOpen,
  Zap,
  Clock,
  Award,
  Lock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const earnedAchievements = [
  {
    id: 1,
    title: "First Steps",
    description: "Complete your first lesson",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    dateEarned: "Aug 1, 2026",
    points: 100,
  },
  {
    id: 2,
    title: "Quiz Master",
    description: "Score 100% on 5 quizzes",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-100",
    dateEarned: "Aug 5, 2026",
    points: 250,
  },
  {
    id: 3,
    title: "Week Warrior",
    description: "Study for 7 days straight",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    dateEarned: "Aug 8, 2026",
    points: 300,
  },
  {
    id: 4,
    title: "Speed Demon",
    description: "Complete a quiz in under 5 minutes with 90%+ score",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    dateEarned: "Aug 10, 2026",
    points: 200,
  },
  {
    id: 5,
    title: "Bookworm",
    description: "Complete 50 lessons",
    icon: BookOpen,
    color: "text-green-500",
    bgColor: "bg-green-100",
    dateEarned: "Aug 12, 2026",
    points: 500,
  },
];

const lockedAchievements = [
  {
    id: 6,
    title: "Perfect Score",
    description: "Score 100% on a mock exam",
    icon: Award,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 0,
    requirement: "Score 100% on any mock exam",
  },
  {
    id: 7,
    title: "Night Owl",
    description: "Study after 10 PM for 10 days",
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 60,
    requirement: "Study late 10 times",
  },
  {
    id: 8,
    title: "Master of Subjects",
    description: "Get 90%+ in all subjects",
    icon: Target,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 75,
    requirement: "90%+ in Math, Science, English, AP",
  },
  {
    id: 9,
    title: "Century",
    description: "Answer 100 questions correctly",
    icon: Medal,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 78,
    requirement: "100 correct answers",
  },
  {
    id: 10,
    title: "Month Champion",
    description: "Study for 30 days straight",
    icon: Flame,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 40,
    requirement: "30 day streak",
  },
  {
    id: 11,
    title: "Top 10",
    description: "Reach top 10 in weekly rankings",
    icon: Trophy,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    progress: 0,
    requirement: "End week in top 10",
  },
];

const stats = [
  { label: "Achievements", value: earnedAchievements.length.toString(), icon: Trophy, change: "+1", positive: true },
  { label: "Total Points", value: earnedAchievements.reduce((acc, a) => acc + a.points, 0).toLocaleString(), icon: Star, change: "+350", positive: true },
  { label: "Locked", value: lockedAchievements.length.toString(), icon: Lock, change: "-1", positive: false },
  { label: "Progress", value: `${Math.round((earnedAchievements.length / (earnedAchievements.length + lockedAchievements.length)) * 100)}%`, icon: Target, change: "+5%", positive: true },
];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState("earned");

  return (
    <>
      <DashboardHeader title="Achievements" subtitle="Track your accomplishments and unlock rewards" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-500 transform origin-left transition-transform duration-300" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-yellow-100">
                    <stat.icon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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

        {/* Current Streak Banner */}
        <Card className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Flame className="h-10 w-10" />
                </div>
                <div>
                  <div className="text-3xl font-bold">12 Day Streak!</div>
                  <p className="text-orange-100">Keep it up! You're doing great!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">+50 pts</div>
                <p className="text-orange-100 text-sm">Daily streak bonus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-arc-slate-100">
              <TabsTrigger value="earned" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">
                Earned ({earnedAchievements.length})
              </TabsTrigger>
              <TabsTrigger value="locked" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">
                Locked ({lockedAchievements.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Earned Achievements */}
          <TabsContent value="earned">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {earnedAchievements.map((achievement) => (
                <Card key={achievement.id} className="relative overflow-hidden">
                  {/* Gold border accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${achievement.bgColor}`}>
                        <achievement.icon className={`h-8 w-8 ${achievement.color}`} />
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Earned on</span>
                      <span className="font-medium">{achievement.dateEarned}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Locked Achievements */}
          <TabsContent value="locked">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${achievement.bgColor}`}>
                        <achievement.icon className={`h-8 w-8 ${achievement.color}`} />
                      </div>
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>

                    {achievement.progress > 0 ? (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-700">{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                        <p className="text-xs text-gray-400">{achievement.requirement}</p>
                      </>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{achievement.requirement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Leaderboard Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Weekly Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rank: 1, name: "Maria Santos", points: 2450, avatar: "MS" },
                { rank: 2, name: "Juan Cruz", points: 2380, avatar: "JC" },
                { rank: 3, name: "You", points: 2150, avatar: "JD", isCurrent: true },
                { rank: 4, name: "Ana Reyes", points: 2100, avatar: "AR" },
                { rank: 5, name: "Carlo Mendoza", points: 2050, avatar: "CM" },
              ].map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.isCurrent ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      user.rank === 1 ? "bg-yellow-400 text-white" :
                      user.rank === 2 ? "bg-gray-400 text-white" :
                      user.rank === 3 ? "bg-amber-600 text-white" :
                      "bg-gray-200 text-gray-600"
                    }`}>
                      {user.rank}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                          {user.isCurrent && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                        </div>
                        <div className="text-sm text-gray-500">{user.points.toLocaleString()} points</div>
                      </div>
                    </div>
                  </div>
                  {user.rank <= 3 && (
                    <Badge className={user.rank === 1 ? "bg-yellow-400" : user.rank === 2 ? "bg-gray-400" : "bg-amber-600"}>
                      Top {user.rank}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
