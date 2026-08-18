"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, WorkspaceTabs, CurriculumSubjectManager } from "@/components/admin";
import { curriculumApi } from "@/lib/api/client";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import {
  RefreshCw,
  BookOpen,
  Layers,
  FileText,
  Settings,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  orderIndex: number;
  _count?: { topics: number };
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: string;
  orderIndex: number;
  _count?: { lessons: number };
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  slug?: string;
  modules?: Module[];
}

interface CurriculumItem {
  id: string;
  orderIndex: number;
  isRequired: boolean;
  customName?: string;
  subject: Subject;
}

interface Curriculum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  stage: string;
  gradeLevel?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  program?: {
    id: string;
    name: string;
  };
  items: CurriculumItem[];
}

const stageLabels: Record<string, string> = {
  BASIC_EDUCATION: "Basic Education",
  ENTRANCE_EXAM: "Entrance Exam",
  COLLEGE: "College",
  PROFESSIONAL: "Professional",
  BOARD_EXAM: "Board Exam",
  CERTIFICATION: "Certification",
  CONTINUING_EDUCATION: "Continuing Education",
};

export default function CurriculumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const curriculumId = params.curriculumId as string;

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch curriculum data
  useEffect(() => {
    fetchCurriculum();
  }, [curriculumId]);

  const fetchCurriculum = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await curriculumApi.getById(curriculumId) as Curriculum;
      if (data) {
        setCurriculum(data);
      }
    } catch (err) {
      console.error("Failed to fetch curriculum:", err);
      setError("Failed to load curriculum");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!curriculum) return;
    try {
      await curriculumApi.publish(curriculumId);
      setCurriculum({ ...curriculum, status: "PUBLISHED" });
    } catch (err) {
      console.error("Failed to publish curriculum:", err);
      alert("Failed to publish curriculum");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500 mx-auto mb-4" />
          <p className="text-arc-slate-500">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Curriculum not found</h2>
          <p className="text-arc-slate-500 mb-4">The curriculum you are looking for does not exist.</p>
          <Link href={`/admin/programs/${programId}`}>
            <Button variant="accent">Back to Program</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Subjects", value: curriculum.items.length, icon: BookOpen },
    { label: "Required", value: curriculum.items.filter((i) => i.isRequired).length, icon: Layers },
    { label: "Optional", value: curriculum.items.filter((i) => !i.isRequired).length, icon: FileText },
  ];

  return (
    <>
      <WorkspaceHeader
        title={curriculum.name}
        subtitle={curriculum.description || `Stage: ${stageLabels[curriculum.stage] || curriculum.stage}`}
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: curriculum.program?.name || "Program", href: `/admin/programs/${programId}` },
          { label: "Curriculums", href: `/admin/programs/${programId}?tab=curriculum` },
          { label: curriculum.name },
        ]}
        badge={curriculum.status}
        badgeVariant={curriculum.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={stats}
        actions={
          <div className="flex items-center gap-2">
            {curriculum.status === "DRAFT" && (
              <Button variant="accent" size="sm" onClick={handlePublish}>
                Publish Curriculum
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        }
      />

      <WorkspaceTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "subjects", label: "Subjects" },
          { id: "learners", label: "Learners" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <p className="text-yellow-700 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCurriculum}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Curriculum Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-4">Curriculum Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-arc-slate-500">Stage</label>
                    <p className="font-medium text-arc-navy-900">
                      {stageLabels[curriculum.stage] || curriculum.stage}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-arc-slate-500">Grade Level</label>
                    <p className="font-medium text-arc-navy-900">
                      {curriculum.gradeLevel
                        ? curriculum.gradeLevel.replace("GRADE_", "Grade ").replace("_", " ")
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-arc-slate-500">Slug</label>
                    <p className="font-medium text-arc-navy-900">{curriculum.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm text-arc-slate-500">Program</label>
                    <p className="font-medium text-arc-navy-900">
                      {curriculum.program?.name || "Not linked"}
                    </p>
                  </div>
                </div>
                {curriculum.description && (
                  <div className="mt-4">
                    <label className="text-sm text-arc-slate-500">Description</label>
                    <p className="text-arc-navy-900">{curriculum.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-arc-orange-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-arc-navy-900">{stat.value}</div>
                        <div className="text-sm text-arc-slate-500">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <CurriculumSubjectManager
            curriculumId={curriculumId}
            programId={programId}
            items={curriculum.items}
            onUpdate={(items) => setCurriculum((prev) => prev ? { ...prev, items } : null)}
          />
        )}

        {/* Learners Tab */}
        {activeTab === "learners" && (
          <Card>
            <CardContent className="p-12 text-center">
              <Layers className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                No Learners Enrolled
              </h3>
              <p className="text-arc-slate-500">
                Learners will appear here when they enroll in this curriculum.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
