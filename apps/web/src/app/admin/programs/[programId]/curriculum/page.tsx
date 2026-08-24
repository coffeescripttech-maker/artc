"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/admin";
import { CurriculumJourney } from "@/components/admin";
import { PageLoader, ErrorEmpty, EmptyState } from "@/components/branding";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { Plus, Users } from "lucide-react";
import { programsApi, curriculumApi } from "@/lib/api/client";

interface Program {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  description?: string;
}

interface Curriculum {
  id: string;
  name: string;
  slug: string;
  gradeLevel?: string;
  stage: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  _count?: {
    subjects?: number;
    modules?: number;
    lessons?: number;
  };
}

export default function ProgramCurriculumPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    setNotFound(false);
    try {
      const [programData, curriculumData] = await Promise.all([
        programsApi.getById(programId),
        curriculumApi.list(programId),
      ]);
      setProgram(programData as Program);

      const curriculumList = curriculumData as Curriculum[] | { curriculums: Curriculum[] };
      setCurriculums("curriculums" in curriculumList ? curriculumList.curriculums : curriculumList);
    } catch (err: any) {
      if (err?.message?.includes("not found")) {
        setNotFound(true);
      } else {
        setError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCurriculum = () => {
    router.push(`/admin/curriculums/new?programId=${programId}`);
  };

  const handleViewCurriculum = (curriculumId: string) => {
    router.push(`/admin/programs/${programId}/curriculum/${curriculumId}`);
  };

  if (isLoading) {
    return <PageLoader text="Loading curriculum..." />;
  }

  if (notFound || !program) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Program not found</h2>
        <p className="text-arc-slate-500 mb-4">The program you are looking for does not exist.</p>
        <Button variant="accent" onClick={() => router.push("/admin/programs")}>
          Back to Programs
        </Button>
      </div>
    );
  }

  if (error) {
    return <ErrorEmpty onRetry={fetchData} />;
  }

  return (
    <>
      <WorkspaceHeader
        title="Curriculum"
        subtitle={`Build the learning journey for ${program.name}`}
        breadcrumbs={[
          { label: "Programs", href: "/admin/programs" },
          { label: program.name, href: `/admin/programs/${programId}` },
          { label: "Curriculum" },
        ]}
        badge={program.status}
        badgeVariant={
          program.status === "PUBLISHED" ? "published" : program.status === "ARCHIVED" ? "archived" : "draft"
        }
        actions={
          <Button variant="accent" size="sm" onClick={handleAddCurriculum}>
            <Plus className="h-4 w-4 mr-2" />
            Add Curriculum
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Journey Visualization */}
        {curriculums.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">
              Learning Path
            </h2>
            <CurriculumJourney
              curriculums={curriculums.map(c => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                gradeLevel: c.gradeLevel,
                stage: c.stage,
                status: c.status,
                orderIndex: c.orderIndex,
                _count: c._count,
              }))}
              programId={programId}
              onView={handleViewCurriculum}
            />
          </section>
        )}

        {/* Curriculum Details */}
        <section>
          <h2 className="text-lg font-semibold text-arc-navy-900 mb-4">
            Curriculum Details
          </h2>

          {curriculums.length === 0 ? (
            <EmptyState
              icon="book"
              title="No Curriculums Yet"
              description={`Create your first curriculum to start building the learning path for ${program.name}.`}
              action={{
                label: "Add Curriculum",
                onClick: handleAddCurriculum,
              }}
            />
          ) : (
            <div className="grid gap-4">
              {curriculums
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((curriculum) => (
                  <Card
                    key={curriculum.id}
                    className="hover:shadow-arc-md transition-shadow cursor-pointer"
                    onClick={() => handleViewCurriculum(curriculum.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-arc-navy-600 flex items-center justify-center text-white font-bold">
                            {curriculum.orderIndex + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-arc-navy-900">
                              {curriculum.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              {curriculum.gradeLevel && (
                                <Badge variant="secondary" className="bg-arc-slate-100 text-arc-slate-600 text-xs">
                                  {curriculum.gradeLevel.replace("GRADE_", "Grade ")}
                                </Badge>
                              )}
                              {curriculum._count?.subjects !== undefined && (
                                <span className="text-xs text-arc-slate-500">
                                  {curriculum._count.subjects} Subjects
                                </span>
                              )}
                              {curriculum._count?.modules !== undefined && (
                                <span className="text-xs text-arc-slate-500">
                                  {curriculum._count.modules} Modules
                                </span>
                              )}
                              {curriculum._count?.lessons !== undefined && (
                                <span className="text-xs text-arc-slate-500">
                                  {curriculum._count.lessons} Lessons
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              curriculum.status === "PUBLISHED"
                                ? "bg-green-100 text-green-700"
                                : curriculum.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {curriculum.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </section>

        {/* Quick Info */}
        <Card className="bg-arc-navy-50 border-arc-navy-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-arc-navy-600 flex-shrink-0" />
            <p className="text-sm text-arc-navy-800">
              <strong>Tip:</strong> Click on any curriculum card above to manage its subjects, modules, and lessons.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
