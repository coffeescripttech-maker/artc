"use client";

import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui";
import { Plus, Upload, BookOpen, BookMarked, FileText, HelpCircle, Zap } from "lucide-react";
import Link from "next/link";

const createContentItems = [
  {
    label: "Create Program",
    href: "/admin/programs/new",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: "Create Subject",
    href: "/admin/subjects/new",
    icon: <BookMarked className="h-4 w-4" />,
  },
  {
    label: "Create Module",
    href: "/admin/modules/new",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Create Lesson",
    href: "/admin/lessons/new",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Create Quiz",
    href: "/admin/assessments/new",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    label: "Create Question",
    href: "/admin/question-bank",
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    label: "Import PDF",
    href: "/admin/question-bank/import",
    icon: <Upload className="h-4 w-4" />,
  },
];

export function CreateContentDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="accent" size="sm" className="shadow-arc-sm hover:shadow-arc">
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border border-arc-slate-200 shadow-arc-xl z-50">
        <DropdownMenuLabel className="font-semibold text-arc-navy-900">
          Create New Content
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {createContentItems.map((item) => (
          <DropdownMenuItem key={item.label} className="py-2.5 focus:bg-arc-orange-50 focus:text-arc-orange-700 cursor-pointer">
            <Link href={item.href} className="flex items-center gap-3 w-full">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2 focus:bg-arc-navy-50 focus:text-arc-navy-700 cursor-pointer">
          <Link href="/admin/analytics" className="flex items-center gap-3 w-full">
            <Zap className="h-4 w-4" />
            <span>Generate Report</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
