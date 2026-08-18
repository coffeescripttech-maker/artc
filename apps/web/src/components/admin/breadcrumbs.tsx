"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // If items provided, use them; otherwise derive from pathname
  const breadcrumbs = items ?? deriveBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className={`flex items-center gap-1 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-arc-slate-400 flex-shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-arc-slate-500 hover:text-arc-orange-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`${
                  isLast ? "text-arc-navy-900 font-medium" : "text-arc-slate-500"
                }`}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function deriveBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Skip "admin" segment
  const adminIndex = segments.indexOf("admin");
  const relevantSegments = adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;

  const breadcrumbs: BreadcrumbItem[] = [];

  relevantSegments.forEach((segment, index) => {
    const href = `/admin/${segments.slice(0, adminIndex + 1 + index + 1).join("/")}`;
    const label = formatSegment(segment);

    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
}

function formatSegment(segment: string): string {
  // Handle UUIDs
  if (segment.match(/^[a-z0-9]{20,}$/i)) {
    return "Details";
  }

  // Handle numeric IDs
  if (/^\d+$/.test(segment)) {
    return "Details";
  }

  // Format slugs to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default Breadcrumbs;
