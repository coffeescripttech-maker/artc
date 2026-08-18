"use client";

import { LayoutDashboard, BookOpen, Award, Settings } from "lucide-react";
import { WorkspaceTabs } from "@/components/admin";
import { useParams } from "next/navigation";

const tabs = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Curriculum", href: "/curriculum", icon: BookOpen },
  { label: "Exams", href: "/exams", icon: Award },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function ProgramWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const programId = params.programId as string;

  return (
    <div className="min-h-screen bg-arc-slate-50">
      <WorkspaceTabs
        tabs={tabs.map((tab) => ({
          ...tab,
          href: `/admin/programs/${programId}${tab.href}`,
        }))}
      />
      <div className="p-6">{children}</div>
    </div>
  );
}
