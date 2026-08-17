"use client";

import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { BookOpen, Plus } from "lucide-react";

export default function SubjectsPage() {
  return (
    <>
      <DashboardHeader title="Subject Management" subtitle="Manage subjects within each program" />

      <div className="p-6">
        <Card className="shadow-arc-md">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-arc-orange-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-arc-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">Subject Management</h3>
            <p className="text-sm text-arc-slate-500 mb-4 max-w-md mx-auto">
              Manage subjects within each program. Create, edit, and organize subjects to build comprehensive curricula.
            </p>
            <p className="text-xs text-arc-slate-400">
              This feature is coming soon. Stay tuned for updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
