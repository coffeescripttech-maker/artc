"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
} from "@/components/ui";
import {
  Search,
  Filter,
  BookOpen,
  Users,
  Star,
  Clock,
  CheckCircle,
  GraduationCap,
  Award,
  Globe,
  ChevronRight,
  Calculator,
  FlaskConical,
  Building2,
  Rocket,
  Cog,
  BookText,
  Scale,
} from "lucide-react";

const allPrograms = [
  {
    id: 1,
    name: "Grade 7 Mathematics",
    description: "Complete mathematics curriculum for Grade 7 students aligned with DepEd K-12 standards. Covers algebra, geometry, and statistics.",
    stage: "BASIC_EDUCATION",
    level: "Grade 7",
    subjects: 1,
    lessons: 120,
    students: 1250,
    rating: 4.8,
    reviews: 342,
    price: 1999,
    features: ["Video Lessons", "Practice Tests", "Progress Tracking", "Mock Exams"],
    icon: Calculator,
    color: "from-blue-500 to-blue-600",
    popular: false,
  },
  {
    id: 2,
    name: "Grade 8 Science",
    description: "Comprehensive science curriculum covering Physics, Chemistry, and Biology fundamentals with hands-on activities.",
    stage: "BASIC_EDUCATION",
    level: "Grade 8",
    subjects: 3,
    lessons: 180,
    students: 980,
    rating: 4.7,
    reviews: 256,
    price: 2499,
    features: ["Video Lessons", "Lab Simulations", "Practice Tests", "Progress Tracking"],
    icon: FlaskConical,
    color: "from-green-500 to-green-600",
    popular: false,
  },
  {
    id: 3,
    name: "College Entrance Exam Prep",
    description: "Intensive preparation for UPCAT, Ateneo, De La Salle, and other top college entrance exams.",
    stage: "ENTRANCE_EXAM",
    level: "Senior High",
    subjects: 5,
    lessons: 250,
    students: 2100,
    rating: 4.9,
    reviews: 567,
    price: 4999,
    features: ["Video Lessons", "Mock Exams", "Study Guides", "Personal Coach", "Progress Analytics"],
    icon: GraduationCap,
    color: "from-purple-500 to-purple-600",
    popular: true,
  },
  {
    id: 4,
    name: "Nursing Board Review",
    description: "Comprehensive nursing board exam review with mock boards, detailed explanations, and expert guidance.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 6,
    lessons: 300,
    students: 450,
    rating: 4.9,
    reviews: 189,
    price: 8999,
    features: ["Video Lessons", "Mock Boards", "Case Studies", "Expert Faculty", "Performance Analytics"],
    icon: Building2,
    color: "from-red-500 to-red-600",
    popular: true,
  },
  {
    id: 5,
    name: "Senior High: STEM Track",
    description: "Specialized STEM track program for Grades 11-12 with advanced mathematics and sciences.",
    stage: "BASIC_EDUCATION",
    level: "Grade 11-12",
    subjects: 8,
    lessons: 400,
    students: 720,
    rating: 4.6,
    reviews: 145,
    price: 3999,
    features: ["Video Lessons", "Advanced Topics", "Practice Tests", "Career Guidance"],
    icon: Rocket,
    color: "from-indigo-500 to-indigo-600",
    popular: false,
  },
  {
    id: 6,
    name: "Engineering Board Exam Review",
    description: "Professional engineering board exam review covering all major engineering disciplines.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 5,
    lessons: 280,
    students: 320,
    rating: 4.8,
    reviews: 98,
    price: 9999,
    features: ["Video Lessons", "Mock Boards", "Formula Library", "Expert Faculty", "Peer Discussion"],
    icon: Cog,
    color: "from-amber-500 to-amber-600",
    popular: false,
  },
  {
    id: 7,
    name: "Grade 9 English",
    description: "Comprehensive English language development for Grade 9 students. Grammar, vocabulary, and comprehension.",
    stage: "BASIC_EDUCATION",
    level: "Grade 9",
    subjects: 1,
    lessons: 100,
    students: 890,
    rating: 4.5,
    reviews: 178,
    price: 1499,
    features: ["Video Lessons", "Grammar Drills", "Reading Comprehension", "Writing Practice"],
    icon: BookText,
    color: "from-teal-500 to-teal-600",
    popular: false,
  },
  {
    id: 8,
    name: "Criminology Board Review",
    description: "Comprehensive criminology board exam preparation with case studies and mock examinations.",
    stage: "BOARD_EXAM",
    level: "Professional",
    subjects: 4,
    lessons: 200,
    students: 180,
    rating: 4.5,
    reviews: 67,
    price: 6999,
    features: ["Video Lessons", "Case Studies", "Mock Exams", "Expert Faculty"],
    icon: Scale,
    color: "from-gray-600 to-gray-700",
    popular: false,
  },
];

const stageLabels: Record<string, string> = {
  BASIC_EDUCATION: "Basic Education",
  ENTRANCE_EXAM: "Entrance Exam",
  BOARD_EXAM: "Board Exam",
  PROFESSIONAL: "Professional",
};

const stageColors: Record<string, string> = {
  BASIC_EDUCATION: "bg-blue-100 text-blue-700",
  ENTRANCE_EXAM: "bg-purple-100 text-purple-700",
  BOARD_EXAM: "bg-red-100 text-red-700",
  PROFESSIONAL: "bg-amber-100 text-amber-700",
};

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  const filteredPrograms = allPrograms.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "all" || program.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Our Programs</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Comprehensive learning programs for every stage of your educational journey.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "BASIC_EDUCATION", "ENTRANCE_EXAM", "BOARD_EXAM"].map((stage) => (
                <Button
                  key={stage}
                  variant={selectedStage === stage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStage(stage)}
                >
                  {stage === "all" ? "All Programs" : stageLabels[stage]}
                </Button>
              ))}
            </div>
          </div>

          {/* Popular Programs */}
          {selectedStage === "all" && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                Popular Programs
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {allPrograms.filter((p) => p.popular).map((program) => (
                  <Card key={program.id} className="overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${program.color}`} />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-xl bg-gradient-to-br ${program.color} text-white`}>
                          <program.icon className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={stageColors[program.stage]}>
                              {stageLabels[program.stage]}
                            </Badge>
                            {program.popular && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-0">
                                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {program.students.toLocaleString()} students
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              {program.rating} ({program.reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="text-2xl font-bold text-gray-900">₱{program.price.toLocaleString()}</div>
                        <Button>
                          Enroll Now
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Programs */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedStage === "all" ? "All Programs" : stageLabels[selectedStage]}
              <Badge variant="secondary" className="ml-2">{filteredPrograms.length}</Badge>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-all group">
                  <div className={`h-2 bg-gradient-to-r ${program.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${program.color} text-white text-2xl`}>
                        {program.image}
                      </div>
                      <Badge className={stageColors[program.stage]}>
                        {stageLabels[program.stage]}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {program.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {program.students.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        {program.rating}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {program.features.slice(0, 3).map((feature) => (
                        <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                      {program.features.length > 3 && (
                        <span className="text-xs text-gray-400">+{program.features.length - 3} more</span>
                      )}
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">₱{program.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">/year</span>
                      </div>
                      <Link href={`/programs/${program.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-12 py-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h3>
              <p className="text-blue-100 mb-4">Contact us and we'll help you find the perfect program.</p>
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
