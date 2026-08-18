"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WizardContextType {
  // Parent context IDs
  programId?: string;
  curriculumId?: string;
  subjectId?: string;
  moduleId?: string;
  topicId?: string;

  // Context entities (for display names)
  programName?: string;
  curriculumName?: string;
  subjectName?: string;
  moduleName?: string;
  topicName?: string;

  // Actions
  setContext: (updates: Partial<WizardContextType>) => void;
  clearContext: () => void;
  clearContextFromLevel: (level: "program" | "curriculum" | "subject" | "module" | "topic") => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<Partial<WizardContextType>>({});

  const setContext = useCallback((updates: Partial<WizardContextType>) => {
    setContextState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearContext = useCallback(() => {
    setContextState({});
  }, []);

  const clearContextFromLevel = useCallback((level: "program" | "curriculum" | "subject" | "module" | "topic") => {
    setContextState((prev) => {
      const levels = ["program", "curriculum", "subject", "module", "topic"];
      const clearIndex = levels.indexOf(level);

      const cleared: Partial<WizardContextType> = {};

      // Clear this level and all children
      for (let i = clearIndex; i < levels.length; i++) {
        const levelName = levels[i] as keyof WizardContextType;
        const idName = `${levels[i]}Id` as keyof WizardContextType;
        const nameName = `${levels[i]}Name` as keyof WizardContextType;
        cleared[idName] = undefined;
        cleared[nameName] = undefined;
      }

      return { ...prev, ...cleared };
    });
  }, []);

  return (
    <WizardContext.Provider value={{ ...context, setContext, clearContext, clearContextFromLevel }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizardContext must be used within a WizardProvider");
  }
  return context;
}

// Helper hook to get context as URL params string
export function useWizardParams(): string {
  const ctx = useWizardContext();
  const params = new URLSearchParams();

  if (ctx.programId) params.set("programId", ctx.programId);
  if (ctx.curriculumId) params.set("curriculumId", ctx.curriculumId);
  if (ctx.subjectId) params.set("subjectId", ctx.subjectId);
  if (ctx.moduleId) params.set("moduleId", ctx.moduleId);
  if (ctx.topicId) params.set("topicId", ctx.topicId);

  return params.toString();
}

// Helper to build wizard URLs
export function buildWizardUrl(base: string, context: Partial<WizardContextType>): string {
  const params = new URLSearchParams();

  if (context.programId) params.set("programId", context.programId);
  if (context.curriculumId) params.set("curriculumId", context.curriculumId);
  if (context.subjectId) params.set("subjectId", context.subjectId);
  if (context.moduleId) params.set("moduleId", context.moduleId);
  if (context.topicId) params.set("topicId", context.topicId);

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
