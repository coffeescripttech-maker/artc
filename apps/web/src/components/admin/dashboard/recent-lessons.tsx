"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tooltip } from "@/components/ui";
import { Eye, Edit, FileText, Video, ClipboardList } from "lucide-react";
import { NoLessonsEmpty } from "@/components/branding";
import type { RecentLesson } from "@/lib/api/client";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils/date";

interface RecentLessonsProps {
  lessons: RecentLesson[];
}

const lessonTypeIcons = {
  VIDEO: <Video className="h-4 w-4 text-arc-blue-600" />,
  ARTICLE: <FileText className="h-4 w-4 text-arc-green-600" />,
  MIXED: <ClipboardList className="h-4 w-4 text-arc-purple-600" />,
  ACTIVITY: <ClipboardList className="h-4 w-4 text-arc-orange-600" />,
  PRACTICE: <FileText className="h-4 w-4 text-arc-navy-600" />,
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "DRAFT":
      return "draft";
    case "UNDER_REVIEW":
      return "warning";
    case "ARCHIVED":
      return "archived";
    default:
      return "secondary";
  }
};

function formatDate(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function RecentLessons({ lessons }: RecentLessonsProps) {
  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <NoLessonsEmpty />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Lessons</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/lessons">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-arc-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Lesson
                </th>
                <th className="text-left py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Subject
                </th>
                <th className="text-left py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Program / Grade
                </th>
                <th className="text-left py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Updated
                </th>
                <th className="text-right py-3 px-4 font-semibold text-arc-slate-600 uppercase text-xs tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="border-b border-arc-slate-50 last:border-0 hover:bg-arc-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {lessonTypeIcons[(lesson.type as keyof typeof lessonTypeIcons)] ?? (
                        <FileText className="h-4 w-4 text-arc-slate-600" />
                      )}
                      <Link
                        href={`/admin/lessons/${lesson.id}`}
                        className="font-medium text-arc-navy-900 hover:text-arc-orange-600 transition-colors"
                      >
                        {lesson.title}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-arc-slate-600">{lesson.subjectName}</td>
                  <td className="py-3 px-4 text-arc-slate-600">
                    {lesson.programName}
                    {lesson.gradeLevel && ` / ${lesson.gradeLevel}`}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadgeVariant(lesson.status)} className="font-medium">
                      {lesson.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-arc-slate-500">
                    {formatDate(lesson.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="View lesson">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/lessons/${lesson.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Edit lesson">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/lessons/${lesson.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
