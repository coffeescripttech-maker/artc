"use client";

import { WorkspaceHeader } from "@/components/admin";
import { ComingSoonEmpty } from "@/components/branding";

export default function ImportQuestionsPage() {
  return (
    <>
      <WorkspaceHeader
        title="Import Questions"
        subtitle="Bulk import questions from CSV or external sources"
      />
      <div className="p-6">
        <ComingSoonEmpty
          title="Import Coming Soon"
          description="Bulk question import will allow you to upload questions from CSV files or migrate from external question banks, saving time on manual entry."
        />
      </div>
    </>
  );
}
