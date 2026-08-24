"use client";

import { Sidebar, TopNav } from "@/components/dashboard";
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
          <TopNav />
          {children}
        </Sidebar>
      </WizardProvider>
    </ProtectedRoute>
  );
}
