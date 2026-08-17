"use client";

import * as React from "react";
import { cn } from "@aratc/ui";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

export function Tabs({
  children,
  value,
  onValueChange,
  defaultValue,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value);

  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    setInternalValue(newValue);
    onValueChange(newValue);
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pills" | "underline";
}

export function TabsList({ children, className, variant = "default", ...props }: TabsListProps) {
  if (variant === "pills") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex h-11 items-center gap-1 rounded-lg bg-arc-slate-100 p-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex h-11 items-center gap-6 border-b border-arc-slate-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // default
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-arc-slate-100 p-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: "default" | "pills" | "underline";
}

export function TabsTrigger({
  children,
  value,
  className,
  variant = "default",
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs();
  const isSelected = selectedValue === value;

  if (variant === "pills") {
    return (
      <button
        role="tab"
        type="button"
        aria-selected={isSelected}
        data-state={isSelected ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all",
          "disabled:pointer-events-none disabled:opacity-50",
          isSelected
            ? "bg-white text-arc-navy-900 shadow-arc-sm"
            : "text-arc-slate-600 hover:text-arc-navy-900",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "underline") {
    return (
      <button
        role="tab"
        type="button"
        aria-selected={isSelected}
        data-state={isSelected ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap pb-3 text-sm font-semibold transition-all border-b-2 -mb-[1px]",
          "disabled:pointer-events-none disabled:opacity-50",
          isSelected
            ? "border-arc-orange-500 text-arc-navy-900"
            : "border-transparent text-arc-slate-500 hover:text-arc-navy-900 hover:border-arc-slate-300",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }

  // default
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-white text-arc-navy-900 shadow-arc-sm"
          : "text-arc-slate-600 hover:text-arc-navy-900",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  children,
  value,
  className,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabs();
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "mt-4 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
