"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, TopicPickerCompact } from "@/components/admin";
import { assessmentsApi, programsApi, curriculumApi, subjectsApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { generateSlug } from "@/lib/utils/slug";
import { Button, Input, Card, CardContent } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
}

interface Curriculum {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

const assessmentTypes = [
  { value: "QUIZ", label: "Quiz", description: "Short quiz", icon: "📝" },
  { value: "PRACTICE", label: "Practice", description: "Practice test", icon: "✍️" },
  { value: "DIAGNOSTIC", label: "Diagnostic", description: "Knowledge gaps", icon: "🔍" },
  { value: "MOCK_EXAM", label: "Mock Exam", description: "Full exam", icon: "📋" },
  { value: "ASSIGNMENT", label: "Assignment", description: "Homework", icon: "📖" },
  { value: "CET_SIMULATION", label: "CET Simulation", description: "Entrance test", icon: "🎯" },
];

const steps = [
  { id: 1, label: "Basic Info", description: "Name, type, program" },
  { id: 2, label: "Configure", description: "Questions, time, scoring" },
  { id: 3, label: "Review", description: "Confirm and create" },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get context from URL params if coming from hierarchy
  const urlProgramId = searchParams.get("programId");
  const urlCurriculumId = searchParams.get("curriculumId");
  const urlSubjectId = searchParams.get("subjectId");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "QUIZ",
    programId: urlProgramId || "",
    curriculumId: urlCurriculumId || "",
    subjectId: urlSubjectId || "",
    questionCount: "20",
    timeLimitMinutes: "60",
    passingScore: "70",
    randomizeQuestions: false,
    showExplanations: true,
    allowRetake: false,
    topicIds: [] as string[],
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.programId) {
      fetchCurriculums(formData.programId);
    }
  }, [formData.programId]);

  useEffect(() => {
    if (formData.curriculumId) {
      fetchSubjects();
    }
  }, [formData.curriculumId]);

  const fetchPrograms = async () => {
    try {
      const data = await programsApi.list() as Program[];
      setPrograms(data);
      // Pre-select from URL if provided
      if (urlProgramId) {
        setFormData((prev) => ({ ...prev, programId: urlProgramId }));
      }
    } catch {
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const fetchCurriculums = async (programId: string) => {
    try {
      const data = await curriculumApi.list(programId) as Curriculum[] | { curriculums: Curriculum[] };
      const list = "curriculums" in data ? data.curriculums : data;
      setCurriculums(list || []);
    } catch {
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.list() as Subject[] | { subjects: Subject[] };
      const list = "subjects" in data ? data.subjects : data;
      setSubjects(list || []);
    } catch {
    }
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.programId) payload.programId = formData.programId;
      if (formData.curriculumId) payload.curriculumId = formData.curriculumId;
      if (formData.subjectId) payload.subjectId = formData.subjectId;
      if (formData.questionCount) payload.questionCount = parseInt(formData.questionCount);
      if (formData.timeLimitMinutes) payload.timeLimitMinutes = parseInt(formData.timeLimitMinutes);
      if (formData.passingScore) payload.passingScore = parseInt(formData.passingScore);
      payload.randomizeQuestions = formData.randomizeQuestions;
      payload.showExplanations = formData.showExplanations;
      payload.allowRetake = formData.allowRetake;
      if (formData.topicIds.length > 0) {
        payload.topicIds = formData.topicIds;
      }

      await assessmentsApi.create(payload);
      toast.success("Assessment created successfully");
      router.push("/admin/assessments");
    } catch (err: any) {
      setError(err.message || "Failed to create assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.name.trim() && formData.slug.trim() && formData.type;
  const isStep2Valid = formData.questionCount && parseInt(formData.questionCount) > 0;

  return (
    <>
      <WorkspaceHeader
        title="Create New Assessment"
        subtitle="Create an assessment or exam for your learners"
        breadcrumbs={[
          { label: "Assessments", href: "/admin/assessments" },
          { label: "New Assessment" },
        ]}
      />

      <div className="p-6 max-w-3xl mx-auto">
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-2 text-arc-slate-500 hover:text-arc-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Link>

        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-arc-orange-500 text-white"
                        : currentStep === step.id
                        ? "bg-arc-orange-100 text-arc-orange-600 border-2 border-arc-orange-500"
                        : "bg-arc-slate-100 text-arc-slate-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? "text-arc-navy-900" : "text-arc-slate-400"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-arc-slate-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-1 mx-4 rounded ${
                      currentStep > step.id ? "bg-arc-orange-500" : "bg-arc-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Assessment Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Math Quiz 1"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                      placeholder="e.g., math-quiz-1"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {assessmentTypes.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                          className={`p-3 rounded-lg border-2 text-left ${
                            formData.type === t.value
                              ? "border-arc-orange-500 bg-arc-orange-50"
                              : "border-arc-slate-200 hover:border-arc-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{t.icon}</span>
                            <div>
                              <div className="font-medium text-arc-navy-900 text-sm">{t.label}</div>
                              <div className="text-xs text-arc-slate-500">{t.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Program (Optional)
                    </label>
                    {isLoadingPrograms ? (
                      <div className="flex items-center gap-2 text-arc-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <select
                        value={formData.programId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, programId: e.target.value, curriculumId: "", subjectId: "" }))}
                        className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg bg-white"
                      >
                        <option value="">No program</option>
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {formData.programId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                          Curriculum (Optional)
                        </label>
                        <select
                          value={formData.curriculumId}
                          onChange={(e) => setFormData((prev) => ({ ...prev, curriculumId: e.target.value, subjectId: "" }))}
                          className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg bg-white"
                        >
                          <option value="">No curriculum</option>
                          {curriculums.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                          Subject (Optional)
                        </label>
                        <select
                          value={formData.subjectId}
                          onChange={(e) => setFormData((prev) => ({ ...prev, subjectId: e.target.value }))}
                          className="w-full h-10 px-3 border border-arc-slate-200 rounded-lg bg-white"
                        >
                          <option value="">No subject</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Configure */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Number of Questions <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.questionCount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, questionCount: e.target.value }))}
                      placeholder="20"
                      min="1"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                      Question Source
                    </label>
                    <p className="text-xs text-arc-slate-500 mb-2">
                      Select topics to pull questions from the question bank, or skip to add questions manually in the builder.
                    </p>
                    <TopicPickerCompact
                      selectedTopicIds={formData.topicIds}
                      onChange={(ids) => setFormData((prev) => ({ ...prev, topicIds: ids }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                        Time Limit (minutes)
                      </label>
                      <Input
                        type="number"
                        value={formData.timeLimitMinutes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, timeLimitMinutes: e.target.value }))}
                        placeholder="60"
                        min="1"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-arc-navy-900 mb-2">
                        Passing Score (%)
                      </label>
                      <Input
                        type="number"
                        value={formData.passingScore}
                        onChange={(e) => setFormData((prev) => ({ ...prev, passingScore: e.target.value }))}
                        placeholder="70"
                        min="0"
                        max="100"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.randomizeQuestions}
                        onChange={(e) => setFormData((prev) => ({ ...prev, randomizeQuestions: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Randomize questions</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.showExplanations}
                        onChange={(e) => setFormData((prev) => ({ ...prev, showExplanations: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Show explanations after answering</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.allowRetake}
                        onChange={(e) => setFormData((prev) => ({ ...prev, allowRetake: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Allow retake</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 bg-arc-slate-50 rounded-lg">
                    <h3 className="font-semibold text-arc-navy-900 mb-4">Assessment Summary</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Name:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Type:</dt>
                        <dd className="font-medium text-arc-navy-900">{assessmentTypes.find(t => t.value === formData.type)?.label}</dd>
                      </div>
                      {formData.programId && (
                        <div className="flex justify-between">
                          <dt className="text-arc-slate-500">Program:</dt>
                          <dd className="font-medium text-arc-navy-900">{programs.find(p => p.id === formData.programId)?.name}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Questions:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.questionCount}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Time Limit:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.timeLimitMinutes} minutes</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Passing Score:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.passingScore}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Randomize:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.randomizeQuestions ? "Yes" : "No"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Show Explanations:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.showExplanations ? "Yes" : "No"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-arc-slate-500">Allow Retake:</dt>
                        <dd className="font-medium text-arc-navy-900">{formData.allowRetake ? "Yes" : "No"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link href="/admin/assessments">
                    <Button type="button" variant="ghost">Cancel</Button>
                  </Link>
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      variant="accent"
                      onClick={handleNext}
                      disabled={currentStep === 1 && !isStep1Valid}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" variant="accent" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" />Create Assessment</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
