"use client";

import Link from "next/link";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { Layers, BookOpen, FileText, Eye, Plus, Users } from "lucide-react";

interface CurriculumItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  gradeLevel?: string;
  stage?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  orderIndex: number;
  _count?: {
    // For curriculum list view
    subjects?: number;
    modules?: number;
    lessons?: number;
    // For curriculum detail view
    items?: number;
    learnerProfiles?: number;
  };
  items?: any[];
}

interface CurriculumJourneyProps {
  curriculums: CurriculumItem[];
  programId: string;
  onView?: (curriculumId: string) => void;
  onAdd?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PUBLISHED: { bg: "bg-green-500", text: "text-white", label: "Published" },
  DRAFT: { bg: "bg-yellow-400", text: "text-white", label: "Draft" },
  ARCHIVED: { bg: "bg-gray-400", text: "text-white", label: "Archived" },
};

export function CurriculumJourney({ curriculums, programId, onView, onAdd }: CurriculumJourneyProps) {
  if (curriculums.length === 0) {
    return (
      <div className="bg-arc-slate-50 rounded-xl p-8 text-center">
        <Layers className="h-12 w-12 text-arc-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
          No Curriculums Yet
        </h3>
        <p className="text-arc-slate-500 max-w-md mx-auto mb-4">
          Create your first curriculum to start building the learning path for this program.
        </p>
        {onAdd && (
          <Button variant="accent" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Curriculum
          </Button>
        )}
      </div>
    );
  }

  // Sort by orderIndex
  const sortedCurriculums = [...curriculums].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="relative">
      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {sortedCurriculums.map((curriculum, index) => {
          const status = statusConfig[curriculum.status] || statusConfig.DRAFT;
          const isLast = index === sortedCurriculums.length - 1;

          const handleClick = (e: React.MouseEvent) => {
            if (onView) {
              e.preventDefault();
              onView(curriculum.id);
            }
          };

          const content = (
            <>
              {/* Status indicator */}
              <div className={`h-10 rounded-t-lg ${status.bg} ${status.text} flex items-center justify-center text-sm font-semibold`}>
                {index + 1}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-arc-navy-900 group-hover:text-arc-orange-600 transition-colors truncate flex-1">
                    {curriculum.name}
                  </h4>
                  <Badge className="ml-2 bg-arc-slate-100 text-arc-slate-600 text-xs">
                    {status.label}
                  </Badge>
                </div>

                {curriculum.gradeLevel && (
                  <Badge variant="secondary" className="mb-3 bg-arc-slate-100 text-arc-slate-600 text-xs">
                    Grade {curriculum.gradeLevel.replace("GRADE_", "")}
                  </Badge>
                )}

                {/* Mini stats */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-arc-slate-600">
                    <Layers className="h-3.5 w-3.5 text-arc-slate-400" />
                    <span>{curriculum._count?.items || curriculum._count?.subjects || 0} Subjects</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-arc-slate-600">
                    <Users className="h-3.5 w-3.5 text-arc-slate-400" />
                    <span>{curriculum._count?.learnerProfiles || 0} Learners</span>
                  </div>
                </div>

                {/* View button */}
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-arc-orange-600 hover:bg-arc-orange-50"
                    onClick={handleClick}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                )}
              </CardContent>
            </>
          );

          // Use Link if no onView handler, otherwise use Card directly
          if (onView) {
            return (
              <div key={curriculum.id} className="flex items-center">
                <div
                  className="group flex-shrink-0 cursor-pointer"
                  onClick={handleClick}
                >
                  <Card className="w-56 hover:shadow-arc-xl transition-all duration-300 border-2 border-transparent hover:border-arc-orange-300">
                    {content}
                  </Card>
                </div>
              </div>
            );
          }

          return (
            <div key={curriculum.id} className="flex items-center">
              <Link
                href={`/admin/programs/${programId}/curriculum/${curriculum.id}`}
                className="group flex-shrink-0"
              >
                <Card className="w-56 hover:shadow-arc-xl transition-all duration-300 border-2 border-transparent hover:border-arc-orange-300">
                  {content}
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CurriculumJourney;
