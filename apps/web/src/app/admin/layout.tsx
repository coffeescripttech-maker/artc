"use client";

import { Sidebar } from "@/components/dashboard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar role="admin">
      {children}
    </Sidebar>
  );
}
