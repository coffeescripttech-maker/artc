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

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PUBLISHED: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
  DRAFT: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Draft" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600", label: "Archived" },
};

export function ProgramCard({
  program,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: ProgramCardProps) {
  const status = statusConfig[program.status] || statusConfig.DRAFT;
  const counts = program._count || {};

  return (
    <Card className="hover:shadow-arc-xl transition-all duration-300 group overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-arc-orange-500 to-arc-orange-400" />

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-arc-navy-600 to-arc-navy-700 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-arc-navy-900 text-lg group-hover:text-arc-orange-600 transition-colors">
                {program.name}
              </h3>
              {program.programType && (
                <Badge variant="secondary" className="mt-1 bg-arc-slate-100 text-arc-slate-600">
                  {program.programType}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-arc-slate-100 text-arc-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-arc-slate-500" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2 text-arc-slate-500" />
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
                <Copy className="h-4 w-4 mr-2 text-arc-slate-500" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {program.description && (
          <p className="text-sm text-arc-slate-600 mb-4 line-clamp-2">
            {program.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {counts.curriculums !== undefined && (
            <div className="flex items-center gap-1.5 p-2 bg-arc-slate-50 rounded-lg">
              <Layers className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.curriculums}</span> Curriculums
              </span>
            </div>
          )}
          {counts.subjects !== undefined && (
            <div className="flex items-center gap-1.5 p-2 bg-arc-slate-50 rounded-lg">
              <BookOpen className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.subjects}</span> Subjects
              </span>
            </div>
          )}
          {counts.modules !== undefined && (
            <div className="flex items-center gap-1.5 p-2 bg-arc-slate-50 rounded-lg">
              <Layers className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.modules}</span> Modules
              </span>
            </div>
          )}
          {counts.lessons !== undefined && (
            <div className="flex items-center gap-1.5 p-2 bg-arc-slate-50 rounded-lg">
              <FileText className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.lessons}</span> Lessons
              </span>
            </div>
          )}
          {counts.enrollments !== undefined && (
            <div className="flex items-center gap-1.5 p-2 bg-arc-slate-50 rounded-lg">
              <Users className="h-4 w-4 text-arc-slate-400" />
              <span className="text-xs text-arc-slate-600">
                <span className="font-semibold">{counts.enrollments}</span> Students
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-arc-slate-100">
          <Badge className={`${status.bg} ${status.text}`}>
            {status.label}
          </Badge>

          <Link href={`/admin/programs/${program.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-arc-orange-600 hover:text-arc-orange-700 hover:bg-arc-orange-50"
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
