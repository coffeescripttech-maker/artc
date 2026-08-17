"use client";

import { BookOpen, Brain, FileText, TrendingUp, Clock, Trophy, Zap, Shield, Users } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Comprehensive Curriculum",
    description: "Aligned with DepEd K-12 and CHED college curriculum.",
    gradient: "from-arc-navy-900 to-arc-navy-700",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "AI-powered recommendations tailored to your pace.",
    gradient: "from-arc-purple-500 to-arc-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Real-time analytics and detailed reports.",
    gradient: "from-arc-green-500 to-arc-green-600",
  },
  {
    icon: FileText,
    title: "Question Bank",
    description: "10,000+ practice questions with explanations.",
    gradient: "from-arc-orange-500 to-arc-orange-600",
  },
  {
    icon: Clock,
    title: "Learn Anytime",
    description: "Mobile-friendly with downloadable content.",
    gradient: "from-arc-cyan-500 to-arc-cyan-600",
  },
  {
    icon: Trophy,
    title: "Board Exam Ready",
    description: "Comprehensive review for professional exams.",
    gradient: "from-arc-orange-500 to-arc-amber-500",
  },
  {
    icon: Shield,
    title: "Trusted & Accredited",
    description: "DepEd and PRC recognized materials.",
    gradient: "from-arc-navy-700 to-arc-purple-600",
  },
  {
    icon: Users,
    title: "Expert Tutors",
    description: "Learn from licensed teachers.",
    gradient: "from-arc-green-600 to-arc-cyan-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 bg-arc-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arc-orange-100 text-arc-orange-600 text-sm font-semibold mb-4">
            <Zap className="h-4 w-4" />
            Why Choose ARATC
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-arc-navy-900 mb-4">
            Everything You Need to <span className="text-arc-orange-500">Succeed</span>
          </h2>
          <p className="text-lg text-arc-slate-600 leading-relaxed">
            From basic education to professional examinations, ARATC provides a complete learning ecosystem designed for Filipino learners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((feature, index) => {
            const isLarge = index === 0 || index === 5;
            return (
              <div
                key={feature.title}
                className={`relative group ${isLarge ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1"}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-6 lg:p-8 rounded-3xl bg-white border border-arc-slate-100 group-hover:border-transparent transition-all duration-300 h-full">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-arc-navy-900 mb-2 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-arc-slate-600 group-hover:text-white/80 transition-colors leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
