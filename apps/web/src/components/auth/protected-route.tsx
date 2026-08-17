"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If roles are specified, check if user has the required role
    if (allowedRoles && user?.roles) {
      const hasRequiredRole = allowedRoles.some(role =>
        user.roles.includes(role)
      );
      if (!hasRequiredRole) {
        // Redirect to dashboard if user doesn't have required role
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router, pathname]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-arc-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-arc-orange-500 animate-spin" />
          <p className="text-arc-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role authorization
  if (allowedRoles && user?.roles) {
    const hasRequiredRole = allowedRoles.some(role =>
      user.roles.includes(role)
    );
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-arc-bg">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-arc-navy-900 mb-2">Access Denied</h2>
            <p className="text-arc-slate-500">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
