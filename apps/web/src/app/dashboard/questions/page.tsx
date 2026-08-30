"use client";

import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Button } from "@/components/ui";
import { FileText } from "lucide-react";

// CS#22.9 — the question bank is authored by teachers/admins, not students.
// This page shows an honest empty state instead of fabricated question rows.
export default function QuestionsPage() {
  return (
    <>
      <DashboardHeader
        title="My Questions"
        subtitle="Questions you have saved or authored"
      />

      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="h-14 w-14 rounded-full bg-arc-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7 text-arc-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
            No saved questions yet
          </h3>
          <p className="text-arc-slate-500 max-w-md mx-auto">
            Your question bank is managed by your school. Practice questions
            appear inside lessons and assessments.
          </p>
          <Link href="/dashboard/assessments" className="inline-block mt-5">
            <Button variant="accent" size="sm">
              Browse Assessments
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}