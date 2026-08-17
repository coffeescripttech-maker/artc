"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/components/landing";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import LogoImage from "../../../assets/images/logo/logo.png";
import {
  Target,
  Heart,
  Users,
  Award,
  Globe,
  BookOpen,
  Trophy,
  Lightbulb,
  Shield,
  Clock,
  Star,
  Linkedin,
  Twitter,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react";

const stats = [
  { value: "50,000+", label: "Active Learners", icon: Users },
  { value: "95%", label: "Pass Rate", icon: Trophy },
  { value: "1,000+", label: "Video Lessons", icon: BookOpen },
  { value: "50+", label: "Expert Instructors", icon: Award },
];

const values = [
  {
    icon: Target,
    title: "Excellence in Education",
    description: "We believe every Filipino deserves access to quality education that prepares them for success.",
    color: "arc-navy",
  },
  {
    icon: Heart,
    title: "Student-Centered",
    description: "Your success is our priority. We tailor our approach to meet your individual learning needs.",
    color: "arc-orange",
  },
  {
    icon: Globe,
    title: "Filipino-First",
    description: "Proudly built for Filipino learners, aligned with local curriculum and cultural context.",
    color: "arc-green",
  },
  {
    icon: Sparkles,
    title: "Innovation-Driven",
    description: "We leverage technology to create engaging, effective, and accessible learning experiences.",
    color: "arc-purple",
  },
];

const team = [
  {
    name: "Maria Santos",
    role: "Chief Executive Officer",
    bio: "Former DepEd Director with 20+ years in education",
    initials: "MS",
    color: "arc-navy",
  },
  {
    name: "Juan Reyes",
    role: "Chief Technology Officer",
    bio: "Tech entrepreneur, ex-Google engineer",
    initials: "JR",
    color: "arc-purple",
  },
  {
    name: "Ana Cruz",
    role: "Head of Curriculum",
    bio: "PhD Education, UP Diliman",
    initials: "AC",
    color: "arc-green",
  },
  {
    name: "Carlos Mendoza",
    role: "Head of Operations",
    bio: "Operations expert, ex-Grab PH",
    initials: "CM",
    color: "arc-orange",
  },
];

const milestones = [
  {
    year: "2022",
    title: "Foundation",
    description: "ARATC was founded with a vision to democratize education in the Philippines.",
  },
  {
    year: "2023",
    title: "Launch",
    description: "Platform launched with 100 video lessons and 1,000 beta users.",
  },
  {
    year: "2024",
    title: "Growth",
    description: "Reached 10,000 active learners and launched mobile app.",
  },
  {
    year: "2025",
    title: "Expansion",
    description: "Added college entrance and professional board exam programs.",
  },
  {
    year: "2026",
    title: "National Reach",
    description: "50,000+ learners across all 17 regions of the Philippines.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-arc-bg">
      <Navbar />

      <main>
        {/* Hero - Enhanced with asymmetric design */}
        <section className="relative overflow-hidden bg-arc-navy-950 text-white">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-arc-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-arc-purple-500/10 rounded-full blur-3xl translate-y-1/3" />
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-arc-navy-700/30 rounded-full blur-2xl" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Diagonal cut */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-arc-bg" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-36">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <Badge className="bg-arc-orange-500/20 text-arc-orange-300 border-arc-orange-500/30 mb-6 backdrop-blur-sm">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Our Story
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Empowering Filipino <span className="text-arc-orange-400">Learners</span> Nationwide
                </h1>
                <p className="text-xl text-white/70 mb-8 max-w-xl">
                  ARATC is the Philippines' leading digital learning platform, helping students achieve their educational dreams from Grade 1 to professional board exams.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button variant="accent" size="lg" className="shadow-lg shadow-arc-orange-500/20">
                      Start Learning
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block relative">
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  {/* Decorative circles */}
                  <div className="absolute inset-0 rounded-full border border-arc-orange-500/20 animate-pulse" />
                  <div className="absolute inset-8 rounded-full border border-arc-purple-500/20" />
                  <div className="absolute inset-16 rounded-full bg-gradient-to-br from-arc-navy-800 to-arc-purple-900 flex items-center justify-center">
                    <div className="relative h-32 w-48 rounded-xl bg-white shadow-xl overflow-hidden p-1">
                      <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 -mt-16 relative z-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center bg-white shadow-arc-lg hover:shadow-arc-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-arc-orange-100 mb-4">
                      <stat.icon className="h-6 w-6 text-arc-orange-600" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-arc-navy-900 mb-1">
                      {stat.value}
                    </div>
                    <p className="text-sm text-arc-slate-500 font-medium">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-arc-navy-100 via-arc-purple-50 to-arc-orange-50 flex items-center justify-center relative overflow-hidden">
                  {/* Decorative elements inside */}
                  <div className="absolute top-4 right-4 w-20 h-20 rounded-xl bg-arc-orange-500/10" />
                  <div className="absolute bottom-4 left-4 w-16 h-16 rounded-xl bg-arc-purple-500/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-24 w-24 rounded-2xl bg-arc-orange-100 flex items-center justify-center">
                      <GraduationCap className="h-14 w-14 text-arc-orange-500" />
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 bg-arc-orange-500 text-white p-5 rounded-2xl shadow-arc-xl">
                  <Trophy className="h-8 w-8 mb-1" />
                  <p className="font-bold text-lg">95% Pass Rate</p>
                </div>
              </div>
              <div>
                <Badge className="bg-arc-navy-100 text-arc-navy-700 mb-4">
                  <Target className="h-4 w-4 mr-1" />
                  Our Purpose
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-arc-navy-900 mb-6">
                  Democratizing Quality Education
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-arc-navy-900 mb-2 flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-arc-navy-900 flex items-center justify-center text-white text-sm">M</span>
                      Our Mission
                    </h3>
                    <p className="text-arc-slate-600 leading-relaxed pl-10">
                      To democratize quality education in the Philippines by providing accessible, affordable, and effective digital learning solutions for every Filipino student.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-arc-navy-900 mb-2 flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-arc-orange-500 flex items-center justify-center text-white text-sm">V</span>
                      Our Vision
                    </h3>
                    <p className="text-arc-slate-600 leading-relaxed pl-10">
                      To become the most trusted learning partner for 1 million Filipino learners by 2030, bridging the gap between aspiration and achievement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-arc-navy-950 text-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-arc-orange-500/5 rounded-full blur-3xl -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-arc-purple-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-arc-orange-500/20 text-arc-orange-300 border-arc-orange-500/30 mb-4">
                What We Stand For
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                These core principles guide everything we do at ARATC.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <Card key={value.title} className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-arc-orange-500/30 transition-all group">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-arc-orange-500/20 mb-4 group-hover:bg-arc-orange-500/30 transition-colors">
                      <value.icon className="h-7 w-7 text-arc-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                    <p className="text-sm text-white/60">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-arc-navy-100 text-arc-navy-700 mb-4">
                Our Journey
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-arc-navy-900 mb-4">From Vision to Reality</h2>
              <p className="text-arc-slate-600 max-w-2xl mx-auto">
                From a small startup to the Philippines' leading e-learning platform.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 -translate-x-px h-full w-1 bg-gradient-to-b from-arc-navy-200 via-arc-purple-200 to-arc-orange-200 rounded-full" />

              <div className="space-y-12">
                {milestones.map((milestone, i) => (
                  <div
                    key={milestone.year}
                    className={`relative flex items-center gap-8 ${
                      i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                      <div className={`inline-block ${i % 2 === 0 ? "ml-auto" : ""}`}>
                        <Card className={`hover:shadow-arc-lg transition-shadow ${
                          milestone.year === "2026" ? "ring-2 ring-arc-orange-500" : ""
                        }`}>
                          <CardContent className="p-5">
                            <Badge className={`mb-2 ${
                              milestone.year === "2026"
                                ? "bg-arc-orange-500 text-white"
                                : "bg-arc-navy-100 text-arc-navy-700"
                            }`}>
                              {milestone.year}
                            </Badge>
                            <h3 className="font-bold text-arc-navy-900 mb-1">{milestone.title}</h3>
                            <p className="text-sm text-arc-slate-600">{milestone.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-arc-orange-500 ring-4 ring-white shadow-lg z-10" />

                    <div className="flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-arc-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-arc-orange-100 text-arc-orange-700 mb-4">
                <Users className="h-4 w-4 mr-1" />
                Our People
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-arc-navy-900 mb-4">Meet Our Team</h2>
              <p className="text-arc-slate-600 max-w-2xl mx-auto">
                Passionate educators, technologists, and innovators united by a common mission.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <Card key={member.name} className="text-center hover:shadow-arc-xl transition-all group">
                  <CardContent className="p-6">
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-${member.color}-100 to-${member.color}-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                      <span className={`text-2xl font-bold text-${member.color}-700`}>{member.initials}</span>
                    </div>
                    <h3 className="font-bold text-arc-navy-900 mb-1">{member.name}</h3>
                    <p className="text-sm font-medium text-arc-orange-600 mb-2">{member.role}</p>
                    <p className="text-xs text-arc-slate-500 mb-4">{member.bio}</p>
                    <div className="flex justify-center gap-2">
                      <a href="#" className="p-2 rounded-lg bg-arc-slate-100 hover:bg-arc-slate-200 transition-colors">
                        <Linkedin className="h-4 w-4 text-arc-slate-600" />
                      </a>
                      <a href="#" className="p-2 rounded-lg bg-arc-slate-100 hover:bg-arc-slate-200 transition-colors">
                        <Twitter className="h-4 w-4 text-arc-slate-600" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="text-center hover:shadow-arc-lg transition-all border-t-4 border-t-arc-navy-500">
                <CardContent className="p-8">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-arc-navy-100 mb-5">
                    <Shield className="h-7 w-7 text-arc-navy-600" />
                  </div>
                  <h3 className="font-bold text-arc-navy-900 mb-2 text-lg">Secure & Private</h3>
                  <p className="text-sm text-arc-slate-600">
                    Your data is protected with enterprise-grade security. We're PDPA compliant.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-arc-lg transition-all border-t-4 border-t-arc-orange-500">
                <CardContent className="p-8">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-arc-orange-100 mb-5">
                    <Clock className="h-7 w-7 text-arc-orange-600" />
                  </div>
                  <h3 className="font-bold text-arc-navy-900 mb-2 text-lg">24/7 Access</h3>
                  <p className="text-sm text-arc-slate-600">
                    Learn anytime, anywhere. Our platform is available 24/7 across all time zones.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-arc-lg transition-all border-t-4 border-t-arc-purple-500">
                <CardContent className="p-8">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-arc-purple-100 mb-5">
                    <Award className="h-7 w-7 text-arc-purple-600" />
                  </div>
                  <h3 className="font-bold text-arc-navy-900 mb-2 text-lg">Verified Quality</h3>
                  <p className="text-sm text-arc-slate-600">
                    Content created by licensed teachers and reviewed by education experts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-br from-arc-navy-950 via-arc-navy-900 to-arc-purple-900 rounded-3xl p-10 md:p-16 text-white overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-arc-orange-500/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-arc-purple-500/20 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3" />

              <div className="relative z-10 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-arc-orange-500/20 mb-6">
                  <Star className="h-8 w-8 text-arc-orange-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Join the ARATC Community
                </h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto text-lg">
                  Be part of the fastest-growing learning community in the Philippines.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button variant="accent" size="lg" className="shadow-lg shadow-arc-orange-500/20 min-w-[180px]">
                      Get Started Free
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 min-w-[180px]">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
