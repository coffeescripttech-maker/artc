"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkspaceHeader, WorkspaceTabs, CurriculumSubjectManager } from "@/components/admin";
import { curriculumApi } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { PageLoader, EmptyState, NoDataEmpty } from "@/components/branding";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import {
  BookOpen,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
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
  const curriculumId = params.curriculumId as string;

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      toast.success("Curriculum published successfully");
    } catch (err) {
      toast.error("Failed to publish curriculum");
    }
  };

  const handleItemsUpdate = (items: CurriculumItem[]) => {
    if (curriculum) {
      setCurriculum({ ...curriculum, items });
    }
  };

  if (isLoading) {
    return <PageLoader text="Loading curriculum..." />;
  }

  if (!curriculum) {
    return (
      <div className="p-6">
        <EmptyState
          title="Curriculum Not Found"
          description="The curriculum you are looking for does not exist."
          action={{ label: "Back to Curriculums", href: "/admin/curriculums" }}
        />
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
          { label: "Curriculums", href: "/admin/curriculums" },
          { label: curriculum.name },
        ]}
        badge={curriculum.status}
        badgeVariant={curriculum.status.toLowerCase() as "published" | "draft" | "archived" | "default"}
        stats={stats}
        actions={
          curriculum.status === "DRAFT" ? (
            <Button variant="accent" size="sm" onClick={handlePublish}>
              Publish Curriculum
            </Button>
          ) : null
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCurriculum}>
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
                <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">Curriculum Details</h2>
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
                    {curriculum.program ? (
                      <Link
                        href={`/admin/programs/${curriculum.program.id}`}
                        className="font-medium text-arc-orange-600 hover:underline"
                      >
                        {curriculum.program.name}
                      </Link>
                    ) : (
                      <p className="font-medium text-arc-slate-400">Not linked</p>
                    )}
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
            programId={curriculum.program?.id}
            items={curriculum.items}
            onUpdate={handleItemsUpdate}
          />
        )}

        {/* Learners Tab */}
        {activeTab === "learners" && (
          <NoDataEmpty
            title="No Learners Enrolled"
            description="Learners will appear here when they enroll in this curriculum."
          />
        )}
      </div>
    </>
  );
}
