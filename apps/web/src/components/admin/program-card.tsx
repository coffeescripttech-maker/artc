"use client";

import Link from "next/link";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import {
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  Users,
  MoreVertical,
  ArrowRight,
  Edit,
  Copy,
  Trash2,
  Eye,
  Award,
  Zap,
  Building,
  Target,
  Trophy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProgramCardProps {
  program: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    programType?: string;
    imageUrl?: string;
    _count?: {
      curriculums?: number;
      subjects?: number;
      modules?: number;
      lessons?: number;
      enrollments?: number;
    };
  };
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

// Color mapping for program types (matching curriculum stage colors)
export const programTypeColors: Record<string, { bg: string; text: string; iconColor: string; icon: React.ElementType }> = {
  BASIC_EDUCATION: { bg: "bg-blue-100", text: "text-blue-700", iconColor: "text-blue-600", icon: GraduationCap },
  ENTRANCE_EXAM: { bg: "bg-purple-100", text: "text-purple-700", iconColor: "text-purple-600", icon: Trophy },
  COLLEGE: { bg: "bg-green-100", text: "text-green-700", iconColor: "text-green-600", icon: Building },
  PROFESSIONAL: { bg: "bg-orange-100", text: "text-orange-700", iconColor: "text-orange-600", icon: Award },
  BOARD_EXAM: { bg: "bg-red-100", text: "text-red-700", iconColor: "text-red-600", icon: Target },
  CERTIFICATION: { bg: "bg-teal-100", text: "text-teal-700", iconColor: "text-teal-600", icon: Zap },
  CONTINUING_EDUCATION: { bg: "bg-gray-100", text: "text-gray-700", iconColor: "text-gray-600", icon: BookOpen },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PUBLISHED: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
  DRAFT: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Draft" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600", label: "Archived" },
};

export function ProgramCard({ program, onView, onEdit, onDuplicate, onDelete }: ProgramCardProps) {
  const status = statusConfig[program.status] || statusConfig.DRAFT;
  const counts = program._count || {};
  const typeConfig = programTypeColors[program.programType || "BASIC_EDUCATION"] || programTypeColors.BASIC_EDUCATION;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group overflow-hidden border border-arc-slate-100">
      {/* Top accent bar matching program type color */}
      <div className={`h-1 ${typeConfig.bg}`} />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* Colored Icon Background - matches Curriculum card design */}
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
              <TypeIcon className={`h-6 w-6 ${typeConfig.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-arc-navy-900 text-lg group-hover:text-arc-navy-700 transition-colors truncate">
                {program.name}
              </h3>
              {program.programType && (
                <Badge variant="secondary" className={`mt-1 ${typeConfig.bg} ${typeConfig.text}`}>
                  {program.programType.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown - cleaner styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Program actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-white border border-arc-slate-200 shadow-lg rounded-xl p-1 z-50"
            >
              <DropdownMenuItem
                onClick={onView}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onEdit}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDuplicate}
                className="cursor-pointer px-3 py-2 text-sm text-arc-navy-700 hover:bg-arc-navy-50 hover:text-arc-navy-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-orange-500"
              >
                <Copy className="h-4 w-4 mr-2 text-arc-slate-500" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-arc-slate-200 my-1" />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {program.description && (
          <p className="text-sm text-arc-slate-600 mb-4 line-clamp-2">{program.description}</p>
        )}

        {/* Stats Grid - matching Curriculum card style */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {counts.curriculums !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-arc-slate-50 rounded-lg hover:bg-arc-slate-100 transition-colors">
              <BookOpen className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.curriculums}</span> Curriculum{counts.curriculums !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {counts.subjects !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-arc-slate-50 rounded-lg hover:bg-arc-slate-100 transition-colors">
              <Layers className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.subjects}</span> Subject{counts.subjects !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {counts.modules !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-arc-slate-50 rounded-lg hover:bg-arc-slate-100 transition-colors">
              <FileText className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.modules}</span> Module{counts.modules !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {counts.lessons !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-arc-slate-50 rounded-lg hover:bg-arc-slate-100 transition-colors">
              <Award className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.lessons}</span> Lesson{counts.lessons !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {counts.enrollments !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-arc-slate-50 rounded-lg hover:bg-arc-slate-100 transition-colors col-span-2">
              <Users className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.enrollments}</span> Enrollment{counts.enrollments !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
          <Badge className={`${status.bg} ${status.text} text-xs`}>{status.label}</Badge>

          <Link href={`/admin/programs/${program.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-arc-navy-700 hover:text-arc-navy-900 hover:bg-arc-navy-50 font-semibold"
            >
              Manage Curriculum
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgramCard;