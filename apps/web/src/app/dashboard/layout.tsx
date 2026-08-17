"use client";

import { Sidebar } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar role="student">
      {children}
    </Sidebar>
  );
}
