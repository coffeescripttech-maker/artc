"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { GraduationCap, ArrowRight, Check, Users, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center bg-arc-bg overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large curved navy shape - bottom right */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-arc-navy-900/5 rounded-full blur-3xl" />
        {/* Orange accent circle - top right */}
        <div className="absolute top-20 right-[15%] w-32 h-32 bg-arc-orange-500/10 rounded-full blur-2xl" />
        {/* Small purple dot */}
        <div className="absolute bottom-40 right-[25%] w-16 h-16 bg-arc-purple-500/10 rounded-full blur-xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-0 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          {/* Left Content - 6 columns */}
          <div
            className={`lg:col-span-6 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arc-navy-900/5 text-arc-navy-700 text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              Bicol's #1 Learning Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-bold tracking-tight text-arc-navy-900 leading-[1.05] mb-6">
              Learn.
              <br />
              <span className="text-arc-orange-500">Practice.</span>
              <br />
              Excel.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-arc-slate-600 max-w-lg mb-8 leading-relaxed">
              Your lifelong digital learning companion — from Grade 1 through professional
              examinations. Structured curriculum, comprehensive question banks, and personalized
              learning paths.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/register">
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg shadow-arc-orange-500/20"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/programs">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-arc-navy-900 text-arc-navy-900 hover:bg-arc-navy-900/5"
                >
                  View Programs
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {[
                { icon: Check, text: "DepEd Aligned", color: "text-arc-green-500" },
                { icon: Trophy, text: "PRC Accredited", color: "text-arc-orange-500" },
                { icon: Users, text: "50,000+ Learners", color: "text-arc-navy-500" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-arc-slate-500">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - 6 columns with asymmetric composition */}
          <div
            className={`lg:col-span-6 relative transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Main visual container - asymmetric shape */}
            <div className="relative">
              {/* Decorative shape behind main card */}
              <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-arc-orange-500/20 to-arc-purple-500/20 rounded-[2.5rem] transform rotate-3" />

              {/* Main card with organic shape */}
              <div className="relative bg-white rounded-[2rem] rounded-tr-[4rem] p-8 shadow-arc-xl border border-arc-slate-100 overflow-hidden">
                {/* Inner decorative accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-arc-orange-100/50 to-transparent rounded-bl-[4rem]" />

                {/* Header */}
                <div className="relative flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-arc-navy-900 to-arc-navy-700 flex items-center justify-center shadow-lg shadow-arc-navy-900/20">
                    <GraduationCap className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-arc-navy-900">Quick Stats</h3>
                    <p className="text-sm text-arc-slate-500">Real-time learning metrics</p>
                  </div>
                </div>

                {/* Stats grid - asymmetric */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-arc-navy-50 to-arc-navy-100/50">
                    <div className="text-3xl font-bold text-arc-navy-900 mb-1">15,000+</div>
                    <div className="text-sm text-arc-slate-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Active Learners
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-arc-orange-50 to-arc-orange-100/50">
                    <div className="text-3xl font-bold text-arc-orange-600 mb-1">94%</div>
                    <div className="text-sm text-arc-slate-500 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" />
                      Pass Rate
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-arc-green-50 to-arc-green-100/50">
                    <div className="text-3xl font-bold text-arc-green-600 mb-1">50+</div>
                    <div className="text-sm text-arc-slate-500 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Subjects
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-arc-purple-50 to-arc-purple-100/50">
                    <div className="text-3xl font-bold text-arc-purple-600 mb-1">12</div>
                    <div className="text-sm text-arc-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Programs
                    </div>
                  </div>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Video Lessons", "Practice Tests", "Progress Tracking", "Expert Tutors"].map(
                    (feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1.5 rounded-full bg-arc-slate-100 text-arc-slate-600 text-xs font-medium"
                      >
                        {feature}
                      </span>
                    )
                  )}
                </div>

                {/* CTA */}
                <Link href="/register" className="block">
                  <Button variant="accent" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Floating accent card - overlaps bottom */}
              <div className="absolute -bottom-4 -left-4 md:-left-8 bg-white rounded-2xl rounded-bl-lg p-4 shadow-arc-lg border border-arc-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-arc-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-arc-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-arc-navy-900">DepEd Aligned</div>
                  <div className="text-xs text-arc-slate-500">Curriculum Approved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
