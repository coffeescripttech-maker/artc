"use client";

import { GraduationCap, BookOpen, Award, Users, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";

const programs = [
  {
    icon: BookOpen,
    title: "Basic Education",
    subtitle: "Grades 1-12",
    description: "Complete K-12 curriculum coverage with video lessons, practice tests, and progress tracking for every grade level.",
    levels: ["Elementary (Grades 1-6)", "Junior High (Grades 7-10)", "Senior High (Grades 11-12)"],
    gradient: "from-arc-navy-900 to-arc-navy-700",
    accentColor: "bg-arc-navy-100",
    textColor: "text-arc-navy-600",
  },
  {
    icon: GraduationCap,
    title: "Entrance Exam Prep",
    subtitle: "All Levels",
    description: "Comprehensive preparation for school entrance examinations at all levels with mock tests and expert guidance.",
    levels: ["JHS Entrance", "SHS Entrance", "College Entrance"],
    gradient: "from-arc-purple-600 to-arc-purple-500",
    accentColor: "bg-arc-purple-100",
    textColor: "text-arc-purple-600",
  },
  {
    icon: Award,
    title: "Board Exam Review",
    subtitle: "Professional",
    description: "Intensive review programs for professional licensure examinations with mock boards and detailed analytics.",
    levels: ["Nursing Board", "Engineering Board", "LET & More"],
    gradient: "from-arc-orange-500 to-arc-amber-500",
    accentColor: "bg-arc-orange-100",
    textColor: "text-arc-orange-600",
  },
  {
    icon: Users,
    title: "School Platform",
    subtitle: "For Institutions",
    description: "Full-featured platform for schools with teacher tools, student management, and comprehensive analytics.",
    levels: ["Teacher Portal", "Student Management", "Analytics Dashboard"],
    gradient: "from-arc-green-600 to-arc-green-500",
    accentColor: "bg-arc-green-100",
    textColor: "text-arc-green-600",
  },
];

export function ProgramsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-arc-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-arc-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header - Centered */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arc-green-100 text-arc-green-600 text-sm font-semibold mb-4">
            <Play className="h-4 w-4" />
            Our Programs
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-arc-navy-900 mb-4">
            Learn at <span className="text-arc-orange-500">Any Stage</span>
          </h2>
          <p className="text-lg text-arc-slate-600 leading-relaxed">
            Whether you are in basic education, preparing for entrance exams, or reviewing for board examinations — ARATC has a program for you.
          </p>
        </div>

        {/* Programs Grid - 2 columns asymmetric */}
        <div className="grid gap-6 lg:grid-cols-2">
          {programs.map((program, index) => (
            <div
              key={program.title}
              className={`relative group ${index === 0 || index === 3 ? "lg:mt-8" : ""}`}
            >
              {/* Background shape */}
              <div className={`absolute inset-0 bg-gradient-to-br ${program.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Main card */}
              <div className={`relative p-8 lg:p-10 rounded-3xl bg-white border border-arc-slate-100 group-hover:border-transparent transition-all duration-300 ${index === 1 ? "lg:mr-8" : ""}`}>
                {/* Decorative corner */}
                <div className={`absolute top-0 ${index % 2 === 0 ? "right-0" : "left-0"} w-40 h-40 bg-gradient-to-bl ${program.accentColor} to-transparent rounded-bl-[4rem] opacity-50 group-hover:opacity-0 transition-opacity`} />

                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Icon */}
                  <div className={`flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br ${program.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <program.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl lg:text-2xl font-bold text-arc-navy-900 group-hover:text-white transition-colors">
                          {program.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full ${program.accentColor} ${program.textColor} text-xs font-semibold`}>
                          {program.subtitle}
                        </span>
                      </div>
                    </div>

                    <p className={`text-arc-slate-600 mb-5 leading-relaxed group-hover:text-white/80 transition-colors`}>
                      {program.description}
                    </p>

                    {/* Levels */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {program.levels.map((level) => (
                        <span
                          key={level}
                          className={`px-3 py-1.5 rounded-full ${program.accentColor} ${program.textColor} text-xs font-medium group-hover:bg-white/20 group-hover:text-white transition-colors`}
                        >
                          {level}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      href="/programs"
                      className={`inline-flex items-center gap-2 font-semibold ${program.textColor} group-hover:text-white transition-colors`}
                    >
                      Explore Program
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <p className="text-arc-slate-600">
              Ready to start your learning journey?
            </p>
            <Link href="/register">
              <Button variant="accent" size="lg" className="shadow-lg shadow-arc-orange-500/20">
                Create a free account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
