"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import {
  GraduationCap,
  BookOpen,
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

// Gradient fallbacks for the image header (when no imageUrl is set — the common case)
export const programTypeGradients: Record<string, string> = {
  BASIC_EDUCATION: "from-blue-50 to-blue-100",
  ENTRANCE_EXAM: "from-purple-50 to-purple-100",
  COLLEGE: "from-green-50 to-green-100",
  PROFESSIONAL: "from-orange-50 to-orange-100",
  BOARD_EXAM: "from-red-50 to-red-100",
  CERTIFICATION: "from-teal-50 to-teal-100",
  CONTINUING_EDUCATION: "from-gray-50 to-gray-100",
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PUBLISHED: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
  DRAFT: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Draft" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600", label: "Archived" },
};

export function ProgramCard({ program, onView, onEdit, onDuplicate, onDelete }: ProgramCardProps) {
  const [imgError, setImgError] = useState(false);
  const status = statusConfig[program.status] || statusConfig.DRAFT;
  const curriculumCount = program._count?.curriculums ?? 0;
  const enrollmentCount = program._count?.enrollments ?? 0;
  const typeConfig = programTypeColors[program.programType || "BASIC_EDUCATION"] || programTypeColors.BASIC_EDUCATION;
  const gradient = programTypeGradients[program.programType || "BASIC_EDUCATION"] || programTypeGradients.BASIC_EDUCATION;
  const TypeIcon = typeConfig.icon;
  const hasImage = program.imageUrl && !imgError;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group overflow-hidden border border-arc-slate-100 flex flex-col">
      {/* Image header — uses imageUrl if available, otherwise a type-colored gradient fallback */}
      <div className={`relative h-24 ${hasImage ? "" : `bg-gradient-to-br ${gradient}`}`}>
        {hasImage && (
          <img
            src={program.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {/* Faint type icon on the gradient (hidden when a real image is showing) */}
        {!hasImage && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
            <TypeIcon className={`h-16 w-16 ${typeConfig.iconColor}`} />
          </div>
        )}

        {/* Actions dropdown overlay */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                aria-label="Program actions"
              >
                <MoreVertical className="h-4 w-4 text-arc-navy-700" />
              </button>
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
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title hierarchy — name as the main title, line-clamp-2 for equal card heights */}
        <h3 className="font-semibold text-arc-navy-900 text-base group-hover:text-arc-navy-700 transition-colors line-clamp-2 leading-snug">
          {program.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 mb-3">
          {program.programType && (
            <span className="text-xs uppercase tracking-wide text-arc-slate-400 font-medium">
              {program.programType.replace(/_/g, " ")}
            </span>
          )}
          {program.programType && <span className="text-arc-slate-300 text-xs">·</span>}
          <Badge className={`${status.bg} ${status.text} text-xs`}>{status.label}</Badge>
        </div>

        {/* Description */}
        {program.description && (
          <p className="text-sm text-arc-slate-600 mb-3 line-clamp-2">{program.description}</p>
        )}

        {/* Inline stats — single line, replaces the 2×2 gray grid */}
        <div className="flex items-center gap-3 text-xs text-arc-slate-600 mb-3">
          {curriculumCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-arc-slate-400" />
              <span className="font-semibold">{curriculumCount}</span> Curriculum{curriculumCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <Link
              href={`/admin/curriculums/new?programId=${program.id}`}
              className="flex items-center gap-1.5 text-arc-orange-600 hover:text-arc-orange-700 font-medium"
            >
              <BookOpen className="h-3.5 w-3.5" />
              No curriculum <span className="underline">Add →</span>
            </Link>
          )}

          <span className="text-arc-slate-300">·</span>

          {enrollmentCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-arc-slate-400" />
              <span className="font-semibold">{enrollmentCount}</span> Enrolled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-arc-slate-400">
              <Users className="h-3.5 w-3.5" />
              No enrollments yet
            </span>
          )}
        </div>

        {/* Footer — action only, right-aligned */}
        <div className="flex items-center justify-end pt-3 border-t border-arc-slate-100 mt-auto">
          <Link href={`/admin/programs/${program.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-arc-navy-700 hover:text-arc-navy-900 hover:bg-arc-navy-50 font-semibold"
            >
              Manage
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgramCard;
