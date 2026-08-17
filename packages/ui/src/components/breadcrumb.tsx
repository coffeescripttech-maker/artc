import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>((props, ref) => {
  return (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", props.className)}
      {...props}
    />
  );
});
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>((props, ref) => {
  return (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words",
        props.className
      )}
      {...props}
    />
  );
});
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>((props, ref) => {
  return (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", props.className)}
      {...props}
    />
  );
});
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "transition-colors hover:text-foreground",
        className
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbHome = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      href="/"
      className={cn(
        "flex items-center gap-1.5 transition-colors hover:text-foreground",
        className
      )}
      {...props}
    >
      <Home className="h-4 w-4" />
    </a>
  );
});
BreadcrumbHome.displayName = "BreadcrumbHome";

const BreadcrumbSeparator = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden="true"
    className={cn(
      "text-muted-foreground/50 mx-2",
      className
    )}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </span>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
    </span>
  );
});
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbHome,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbEllipsis,
};
