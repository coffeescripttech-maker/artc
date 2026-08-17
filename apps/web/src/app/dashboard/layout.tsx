"use client";

import { Sidebar } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Sidebar role="student">
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}
