"use client";

import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button, Card, CardContent } from "@/components/ui";
import {
  BookOpen,
  Brain,
  FileText,
  TrendingUp,
  Clock,
  Trophy,
  BarChart3,
  Users,
  Video,
  Download,
  Award,
  Shield,
  Smartphone,
  Globe,
  Star,
  CheckCircle,
  Play,
} from "lucide-react";

const coreFeatures = [
  {
    icon: BookOpen,
    title: "Comprehensive Curriculum",
    description: "Access Grade 1-12, college, entrance exam, and professional board review materials.",
    color: "navy",
  },
  {
    icon: Video,
    title: "Video Lessons",
    description: "10-15 minute micro-lessons with expert instructors. Learn at your own pace.",
    color: "purple",
  },
  {
    icon: FileText,
    title: "Question Bank",
    description: "10,000+ practice questions with detailed explanations and answer keys.",
    color: "green",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "AI-powered recommendations that adapt to your learning style and pace.",
    color: "orange",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Real-time analytics to monitor your improvement over time.",
    color: "cyan",
  },
  {
    icon: Trophy,
    title: "Mock Exams",
    description: "Simulate real exam conditions with timed mock tests and assessments.",
    color: "amber",
  },
  {
    icon: Download,
    title: "Offline Access",
    description: "Download lessons and materials for offline study anywhere.",
    color: "blue",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Earn certificates upon completing programs and achieving milestones.",
    color: "pink",
  },
];

const learningFeatures = [
  {
    icon: Clock,
    title: "Learn Anytime",
    description: "Study 24/7 at your own pace. No schedules to follow.",
    color: "navy",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Full-featured mobile app for learning on the go.",
    color: "purple",
  },
  {
    icon: Globe,
    title: "Philippine-Focused",
    description: "Content aligned with DepEd curriculum and Filipino learners.",
    color: "green",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Detailed insights into your learning progress and performance.",
    color: "orange",
  },
  {
    icon: Users,
    title: "Study Groups",
    description: "Connect with peers and learn together.",
    color: "cyan",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is safe with enterprise-grade security.",
    color: "amber",
  },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  navy: { bg: "bg-arc-navy-100", icon: "text-arc-navy-700" },
  purple: { bg: "bg-arc-purple-100", icon: "text-arc-purple-600" },
  green: { bg: "bg-arc-green-100", icon: "text-arc-green-600" },
  orange: { bg: "bg-arc-orange-100", icon: "text-arc-orange-600" },
  cyan: { bg: "bg-arc-cyan-100", icon: "text-arc-cyan-600" },
  amber: { bg: "bg-arc-amber-100", icon: "text-arc-amber-600" },
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  pink: { bg: "bg-pink-100", icon: "text-pink-600" },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-arc-bg">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-arc-navy-900 via-arc-navy-800 to-arc-purple-700 text-white py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for
              <span className="text-arc-orange-400"> Effective Learning</span>
            </h1>
            <p className="text-xl text-arc-navy-100 mb-8 max-w-2xl mx-auto">
              Everything you need to succeed in your educational journey, from basic education to professional board exams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="accent" size="lg" className="shadow-arc-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/programs">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                  View Programs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-arc-navy-900 mb-4">
                Core Learning Features
              </h2>
              <p className="text-arc-slate-600 max-w-2xl mx-auto">
                Built by educators for Filipino learners. Our platform combines proven teaching methods with modern technology.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {coreFeatures.map((feature) => {
                const colors = colorClasses[feature.color];
                return (
                  <Card key={feature.title} className="text-center hover:shadow-arc-lg transition-all">
                    <CardContent className="p-6">
                      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} mb-4`}>
                        <feature.icon className={`h-8 w-8 ${colors.icon}`} />
                      </div>
                      <h3 className="text-lg font-bold text-arc-navy-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-arc-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Video Preview Section */}
        <section className="py-20 bg-arc-navy-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Engaging Video Lessons
                </h2>
                <p className="text-arc-navy-200 mb-6">
                  Learn from expert instructors with our micro-learning videos. Each lesson is designed to be 10-15 minutes long — perfect for busy schedules.
                </p>
                <ul className="space-y-3">
                  {[
                    "HD Quality Video Content",
                    "Download for Offline Viewing",
                    "Interactive Quizzes",
                    "Subtitles & Transcripts",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-arc-green-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="inline-block mt-8">
                  <Button variant="accent" size="lg">
                    <Play className="h-5 w-5 mr-2" />
                    Try Free Lesson
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-arc-navy-700 to-arc-purple-800 flex items-center justify-center shadow-arc-2xl">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-arc-orange-500 text-white px-4 py-2 rounded-full font-semibold shadow-arc-lg">
                  New lessons weekly
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-arc-navy-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-arc-slate-600 max-w-2xl mx-auto">
                Additional features to enhance your learning experience.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {learningFeatures.map((feature) => {
                const colors = colorClasses[feature.color];
                return (
                  <Card key={feature.title} className="hover:shadow-arc-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${colors.bg}`}>
                          <feature.icon className={`h-6 w-6 ${colors.icon}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-arc-navy-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-arc-slate-600">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-arc-slate-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-arc-navy-900 to-arc-purple-700 rounded-3xl p-12 text-white shadow-arc-2xl">
              <Star className="h-12 w-12 text-arc-orange-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-arc-navy-100 mb-8 max-w-xl mx-auto">
                Join thousands of Filipino learners who are achieving their educational goals with ARATC.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button variant="accent" size="lg" className="shadow-arc-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
