"use client";

/**
 * My Programs (CS#22.7 — H-3).
 *
 * Lists every ACTIVE enrollment from the real enrollment API
 * (`GET /my/enrollments`) so a learner enrolled in both BUCET and CRP sees
 * both programs. Per-program mastery comes from the real progression API
 * (`GET /progression?programId=…`), which already supports per-program
 * queries — no fabricated data, no hardcoded program assumptions.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { Button, Badge, Card, CardContent, Progress } from "@/components/ui";
import { enrollmentsApi, progressionApi } from "@/lib/api/client";
import {
  RefreshCw,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";

interface MyEnrollment {
  id: string;
  status: string;
  active: boolean;
  expiresAt: string | null;
  program: { id: string; name: string; slug: string; status: string } | null;
}

interface ProgramCard {
  enrollmentId: string;
  programId: string;
  name: string;
  slug: string;
  active: boolean;
  status: string;
  expiresAt: string | null;
  /** Overall mastery percent from the program's real progression data (null = no data). */
  masteryPercent: number | null;
}

export default function MyProgramsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramCard[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const mine = (await enrollmentsApi.mine()) as MyEnrollment[];
        const list = (Array.isArray(mine) ? mine : []).filter(
          (e) => e.program && e.active && e.status === "ACTIVE"
        );
        // Real per-program progression (mastery percent) — failures degrade
        // gracefully to "no data" rather than fabricating a value.
        const cards = await Promise.all(
          list.map(async (e) => {
            let masteryPercent: number | null = null;
            try {
              const prog = (await progressionApi.get(e.program!.id)) as {
                grades?: { subjects?: { percent: number }[] }[];
              } | null;
              const subjects = prog?.grades?.flatMap((g) => g.subjects ?? []) ?? [];
              if (subjects.length > 0) {
                masteryPercent = Math.round(
                  subjects.reduce((s, x) => s + (x.percent ?? 0), 0) / subjects.length
                );
              }
            } catch {
              masteryPercent = null;
            }
            return {
              enrollmentId: e.id,
              programId: e.program!.id,
              name: e.program!.name,
              slug: e.program!.slug,
              active: e.active,
              status: e.status,
              expiresAt: e.expiresAt,
              masteryPercent,
            } as ProgramCard;
          })
        );
        if (!active) return;
        setPrograms(cards);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load enrollments:", err);
        setError("Your enrollments could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);


  if (loading) {
    return (
      <>
        <DashboardHeader title="My Programs" subtitle="Loading your programs…" />
        <div className="p-6 flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-arc-orange-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="My Programs"
        subtitle="Programs you are enrolled in"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Programs" },
        ]}
      />

      <div className="p-6">
        {error ? (
          <div className="max-w-lg mx-auto text-center py-12">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-arc-slate-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">No Program Enrolled</h3>
              <p className="text-arc-slate-500">
                You don&apos;t have an active program. Contact your administrator to get enrolled.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {programs.map((p) => (
              <Link
                key={p.enrollmentId}
                href={`/dashboard/programs/${p.programId}`}
                className="group block rounded-2xl border border-arc-slate-200 bg-white overflow-hidden hover:border-arc-orange-300 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-arc-orange-500"
              >
                <div className="bg-arc-navy-900 px-5 py-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-arc-navy-900 via-arc-navy-800 to-arc-navy-700" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-arc-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-arc-orange-300" />
                      </div>
                      <h3 className="text-base font-semibold text-white truncate group-hover:text-arc-orange-200 transition-colors">
                        {p.name}
                      </h3>
                    </div>
                    <Badge
                      className={
                        p.active
                          ? "bg-green-500/20 text-green-300 border border-green-400/30 shrink-0"
                          : "bg-arc-slate-500/20 text-arc-slate-300 shrink-0"
                      }
                    >
                      {p.active ? "Active" : p.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  {p.masteryPercent !== null ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-arc-slate-500">Overall mastery</span>
                        <span className="font-semibold text-arc-navy-900">{p.masteryPercent}%</span>
                      </div>
                      <Progress value={p.masteryPercent} className="h-2" />
                    </div>
                  ) : (
                    <p className="text-sm text-arc-slate-500 mb-4">
                      No progress recorded yet — start your first lesson to begin tracking mastery.
                    </p>
                  )}

                  {p.expiresAt && (
                    <div className="flex items-center gap-1 text-xs text-arc-slate-500 mb-4">
                      <Clock className="h-3 w-3" />
                      Expires {new Date(p.expiresAt).toLocaleDateString()}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 text-sm font-medium text-arc-orange-600 group-hover:text-arc-orange-700">
                    View Program
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
