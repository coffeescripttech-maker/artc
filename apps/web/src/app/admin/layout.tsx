"use client";

import { Sidebar } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WizardProvider } from "@/contexts/wizard-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "content_admin"]}>
      <WizardProvider>
        <Sidebar role="admin">
          {children}
        </Sidebar>
      </WizardProvider>
    </ProtectedRoute>
  );
}
