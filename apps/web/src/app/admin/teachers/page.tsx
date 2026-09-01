"use client";

// CS#23.3 §27 — real teachers from the organization members API.

import ParticipantList from "@/components/admin/participant-list";

export default function TeachersPage() {
  return (
    <ParticipantList
      title="Teachers"
      subtitle="Organization teachers with real membership and assignment data"
      systemRole="teacher"
    />
  );
}