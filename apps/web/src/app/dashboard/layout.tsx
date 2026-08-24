"use client";

import { Sidebar, TopNav } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Determine role based on user's actual roles
  const getUserRole = () => {
    if (!user?.roles?.length) return "student";
    // Check for admin roles first
    if (user.roles.includes("super_admin") || user.roles.includes("content_admin") || user.roles.includes("school_admin")) {
      return "admin";
    }
    if (user.roles.includes("teacher")) return "teacher";
    return "student";
  };

  return (
    <ProtectedRoute>
      <Sidebar role={getUserRole()}>
        <TopNav />
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}
