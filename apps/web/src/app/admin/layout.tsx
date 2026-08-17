"use client";

import { Sidebar } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "content_admin"]}>
      <Sidebar role="admin">
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}
