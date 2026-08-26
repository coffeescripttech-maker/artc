"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { GraduationCap, ArrowRight, Check, Users, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";

// Mascot lives in /public, so next/image loads it as an optimized URL at /assets/images/arci_mascot.png

/**
 * A floating element around ARCI. Wraps children with a gentle, non-uniform
 * floating motion so each element moves at a slightly different cadence.
 * Pass tailwind animation classes via `className` (e.g. "animate-float-y")
 * and override the duration via the `style` prop (e.g. { animationDuration: "6s" }).
 */
function FloatingElement({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={style}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[680px] flex items-center bg-arc-bg overflow-hidden">
      {/* Subtle glow behind ARCI — extremely soft radial gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_#216FD105_0%,_transparent_70%)] rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-0 w-full">
        <div className="grid lg:grid-cols-12 gap-4 items-center">
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

          {/* Right Content - ARCI as central hero with floating learning elements */}
          <div
            className={`lg:col-span-6 relative flex items-center justify-center transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Orbital composition container */}
            <div className="relative w-[540px] h-[530px] flex items-center justify-center">
              {/* ELEMENT 1 — TOP: Speech bubble "Let's learn! 👋" */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-15">
                <div className="relative flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-[18px] shadow-arc-lg border border-arc-slate-100">
                  <span className="text-[14px] font-semibold text-arc-navy-900">
                    Let's learn! 👋
                  </span>
                  <span className="text-xs">✨</span>
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-arc-slate-100 rotate-45 shadow-arc-sm" />
                </div>
              </div>

              {/* ELEMENT 2 — UPPER LEFT: "🎓 15K+ Learners" */}
              <div className="absolute top-[30%] left-0 z-5 hidden sm:block">
                <FloatingElement className="animate-float-y motion-reduce:animate-none" style={{ animationDuration: "6s" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-arc-slate-200 shadow-arc-sm text-xs">
                    <GraduationCap className="h-3 w-3 text-arc-navy-600" />
                    <span className="font-semibold text-arc-navy-700">15K+ Learners</span>
                  </div>
                </FloatingElement>
              </div>

              {/* ELEMENT 3 — UPPER RIGHT: "🏆 94% Pass Rate" */}
              <div className="absolute top-[35%] right-0 z-5 hidden sm:block">
                <FloatingElement className="animate-float-y motion-reduce:animate-none" style={{ animationDuration: "7s" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-arc-slate-200 shadow-arc-sm text-xs">
                    <Trophy className="h-3 w-3 text-arc-orange-500" />
                    <span className="font-semibold text-arc-navy-700">
                      <span className="text-arc-orange-500">94%</span> Pass Rate
                    </span>
                  </div>
                </FloatingElement>
              </div>

              {/* ARCI Mascot — center, largest element */}
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <FloatingElement
                  className="animate-float-y motion-reduce:animate-none"
                  style={{ animationDuration: "5.5s" }}
                >
                  <Image
                    src="/assets/images/arci_mascot.png"
                    alt="ARCI the learning companion owl"
                    width={320}
                    height={320}
                    sizes="320px"
                    className="drop-shadow-2xl"
                  />
                </FloatingElement>
              </div>

              {/* ELEMENT 4 — LOWER LEFT: "📚 50+ Subjects" */}
              <div className="absolute bottom-[30%] left-0 z-5 hidden sm:block">
                <FloatingElement className="animate-float-y motion-reduce:animate-none" style={{ animationDuration: "6.8s" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-arc-slate-200 shadow-arc-sm text-xs">
                    <BookOpen className="h-3 w-3 text-arc-navy-600" />
                    <span className="font-semibold text-arc-navy-700">50+ Subjects</span>
                  </div>
                </FloatingElement>
              </div>

              {/* ELEMENT 5 — LOWER RIGHT: "⭐ +250 XP" */}
              <div className="absolute bottom-[35%] right-0 z-5">
                <FloatingElement className="animate-float-y motion-reduce:animate-none" style={{ animationDuration: "5.8s" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-arc-slate-200 shadow-arc-sm text-xs">
                    <span className="text-sm">⭐</span>
                    <span className="font-semibold text-arc-navy-700">
                      <span className="text-arc-orange-500">+250 XP</span>
                    </span>
                  </div>
                </FloatingElement>
              </div>

              {/* ELEMENT 6 — BOTTOM: "📈 Your Progress" */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-5 hidden sm:block">
                <FloatingElement className="animate-float-y motion-reduce:animate-none" style={{ animationDuration: "7.2s" }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-arc-slate-200 shadow-arc-sm text-xs">
                    <Check className="h-3 w-3 text-arc-green-600" />
                    <span className="font-semibold text-arc-navy-700">Your Progress</span>
                  </div>
                </FloatingElement>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
