"use client";

// CS#23.3 §26 — real students from the organization members API.

import ParticipantList from "@/components/admin/participant-list";

export default function StudentsPage() {
  return (
    <ParticipantList
      title="Students"
      subtitle="Organization students with real enrollment and membership data"
      systemRole="student"
    />
  );
}