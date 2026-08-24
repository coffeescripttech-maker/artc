"use client";

import { WorkspaceHeader } from "@/components/admin";
import { ComingSoonEmpty } from "@/components/branding";

export default function CategoriesPage() {
  return (
    <>
      <WorkspaceHeader
        title="Question Categories"
        subtitle="Organize questions into categories for targeted practice"
      />
      <div className="p-6">
        <ComingSoonEmpty
          title="Categories Coming Soon"
          description="Question categories will allow you to organize questions by topic, difficulty, and skill area for targeted practice sets and assessments."
        />
      </div>
    </>
  );
}
