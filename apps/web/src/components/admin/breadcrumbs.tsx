"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "@aratc/ui";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  const crumbs = items?.length ? items : [{ label: "Dashboard", href: "/admin" }];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <a
            href="/admin"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </a>
        </BreadcrumbItem>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        {crumbs.map((crumb, index) => (
          <>
            <BreadcrumbItem key={index}>
              {crumb.href && index < crumbs.length - 1 ? (
                <a href={crumb.href} className="text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </BreadcrumbItem>
            {index < crumbs.length - 1 && <BreadcrumbSeparator />}
          </>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
