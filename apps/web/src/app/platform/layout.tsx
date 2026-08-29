"use client";

import { Sidebar, TopNav } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Platform (superadmin) pages render inside the SAME app shell as /admin —
 * same sidebar (with the superadmin-only PLATFORM section), same TopNav with
 * the org switcher and notifications. The only difference is the stricter
 * guard: super_admin only (backend enforces the same on /api/platform/*).
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <Sidebar role="admin">
        <TopNav />
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}
