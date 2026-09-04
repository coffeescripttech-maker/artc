"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@aratc/ui";
import {
  Button,
  buttonVariants,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Skeleton,
} from "@/components/ui";
import { DashboardHeader } from "@/components/dashboard";
import { toast } from "sonner";
import {
  Database,
  Building2,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Loader2,
  Shield,
  Users,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  fetchPlatformOrganizations,
  fetchResetPreview,
  performFullReset,
  performOrgReset,
  type PlatformOrganization,
  type ResetPreview,
  type ResetCounts,
} from "@/lib/platform-api";

/**
 * Enterprise-grade System Maintenance / Data Reset workflow (CS#26 redesign).
 *
 * Review-first modal flow for both platform-wide and organization-scoped resets.
 * Preserves all existing backend APIs; only the UX surface is enhanced.
 */

// ---------------------------------------------------------------------------
// Stat categories — each metric is assigned to exactly one logical group so
// the overview reads as structured information, not a flat sea of numbers.
// ---------------------------------------------------------------------------

type StatCategory = {
  label: string;
  keys: string[];
};

const STAT_CATEGORIES: StatCategory[] = [
  {
    label: "Organizations",
    keys: ["organizations"],
  },
  {
    label: "Users & Learners",
    keys: ["memberships", "learners", "enrollments", "users", "superUsers"],
  },
  {
    label: "Academic Content",
    keys: ["programs", "curriculums", "subjects", "modules", "topics", "lessons"],
  },
  {
    label: "Assessments",
    keys: ["passages", "questions", "assessments", "attempts"],
  },
  {
    label: "System",
    keys: ["batches"],
  },
];

// Flattened label map for stat cards.
const STAT_LABELS: Record<string, string> = {
  organizations: "Organizations",
  memberships: "Memberships",
  learners: "Learners",
  enrollments: "Enrollments",
  programs: "Programs",
  curriculums: "Curriculums",
  subjects: "Subjects",
  modules: "Modules",
  topics: "Topics",
  lessons: "Lessons",
  passages: "Passages",
  questions: "Questions",
  assessments: "Assessments",
  attempts: "Attempts",
  batches: "Batches",
  users: "Users",
  superUsers: "Super Users",
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

function generateResetId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RST-${yy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
}

// Category-icon map for visual hierarchy (icons are optional decoration).
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Organizations: <Building2 className="h-5 w-5 text-arc-navy-600" />,
  "Users & Learners": <Users className="h-5 w-5 text-arc-navy-600" />,
  "Academic Content": <BookOpen className="h-5 w-5 text-arc-navy-600" />,
  Assessments: <ClipboardList className="h-5 w-5 text-arc-navy-600" />,
  System: <Database className="h-5 w-5 text-arc-navy-600" />,
};

// Keys available in the org-scoped preview from the backend.
const ORG_PREVIEW_KEYS = [
  "learners",
  "memberships",
  "programs",
  "curriculums",
  "lessons",
  "questions",
  "assessments",
  "enrollments",
];

// Preserved data items for platform reset (always preserved by the backend).
const PLATFORM_PRESERVED_ITEMS = [
  { label: "Super Admin accounts", detail: "All super_admin user accounts" },
  { label: "RBAC system tables", detail: "Roles, permissions, and role-permission assignments" },
  { label: "Audit history", detail: "Platform reset audit record (written after completion)" },
  { label: "Platform settings", detail: "Site configuration and global settings" },
];

// Preserved data items for organization reset.
const ORG_PRESERVED_ITEMS = [
  "Other organizations and all their data",
  "Platform-level RBAC and role definitions",
  "Super Admin accounts not in this organization",
  "Platform configuration and settings",
];

// Human-readable labels for the deletion counts returned by the reset API.
const DELETED_RECORD_LABELS: Record<string, string> = {
  organizations: "Organizations",
  memberships: "Memberships",
  learners: "Learners",
  users: "Users",
  userRoles: "User roles",
  sessions: "Sessions",
  enrollments: "Enrollments",
  programs: "Programs",
  curriculums: "Curriculums",
  curriculumsItems: "Curriculums",
  subjects: "Subjects",
  curriculumItems: "Curriculum items",
  modules: "Modules",
  topics: "Topics",
  lessons: "Lessons",
  passages: "Passages",
  questions: "Questions",
  questionBankLinks: "Question bank links",
  questionExposures: "Question exposures",
  assessments: "Assessments",
  assessmentQuestions: "Assessment questions",
  attempts: "Attempts",
  attemptAnswers: "Attempt answers",
  batches: "Batches",
  batchMembers: "Batch members",
  batchTeachers: "Batch teachers",
  progressRecords: "Progress records",
  contentVersions: "Content versions",
  parentStudents: "Parent–student links",
  payments: "Payments",
  subscriptions: "Subscriptions",
  cetExams: "CET exams",
  cetProfiles: "CET profiles",
  examCoverages: "Exam coverages",
  programCets: "CET program links",
  auditEvents: "Audit history",
};

// Display order for the success screen (mirrors the backend transaction order).
const DELETED_DISPLAY_ORDER: Record<"organization" | "platform", string[]> = {
  platform: [
    "organizations",
    "memberships",
    "learners",
    "users",
    "userRoles",
    "sessions",
    "enrollments",
    "programs",
    "curriculums",
    "subjects",
    "modules",
    "topics",
    "lessons",
    "passages",
    "questions",
    "questionBankLinks",
    "questionExposures",
    "assessments",
    "assessmentQuestions",
    "attempts",
    "attemptAnswers",
    "batches",
    "batchMembers",
    "batchTeachers",
    "progressRecords",
    "contentVersions",
    "parentStudents",
    "payments",
    "subscriptions",
    "cetExams",
    "cetProfiles",
    "examCoverages",
    "programCets",
    "auditEvents",
  ],
  organization: [
    "memberships",
    "learners",
    "sessions",
    "enrollments",
    "programs",
    "curriculums",
    "curriculumItems",
    "subjects",
    "modules",
    "topics",
    "lessons",
    "questions",
    "questionBankLinks",
    "questionExposures",
    "assessments",
    "assessmentQuestions",
    "attempts",
    "attemptAnswers",
    "batches",
    "batchMembers",
    "batchTeachers",
    "progressRecords",
    "contentVersions",
    "parentStudents",
    "programCets",
    "auditEvents",
  ],
};

// ---------------------------------------------------------------------------
// Focus-trap hook — keeps Tab/Shift+Tab cycling inside a container.
// ---------------------------------------------------------------------------

function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    container.addEventListener("keydown", handleKeydown);
    return () => container.removeEventListener("keydown", handleKeydown);
  }, [isActive, containerRef]);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Loading skeleton for the stat grid. */
function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 17 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
    </div>
  );
}

/** Compact stat card used inside category sections. */
function CompactStatCard({ label, value }: { label: string; value: number }) {
  const display = value > 0 ? formatCount(value) : "—";
  return (
    <div className="bg-white border border-arc-slate-200 rounded-lg p-4 hover:shadow-arc transition-shadow">
      <div className="text-2xl font-bold text-arc-navy-900">{display}</div>
      <div className="text-xs text-arc-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

/** Renders one category of stats with a header and grid of cards. */
function StatCategorySection({
  category,
  counts,
}: {
  category: StatCategory;
  counts: ResetCounts;
}) {
  const icon = CATEGORY_ICONS[category.label];
  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {category.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {category.keys.map((key) => (
            <CompactStatCard
              key={key}
              label={STAT_LABELS[key] ?? key}
              value={counts[key] ?? 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DestructiveConfirmationModal — accessible review-first confirmation for
// irreversible org-wide and platform-wide resets. Requires both an
// acknowledgement checkbox AND an exact-typed confirmation phrase.
// ---------------------------------------------------------------------------

interface DestructiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "organization" | "platform";
  orgName?: string;
  preview?: ResetPreview | null;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  error?: string | null;
}

function DestructiveConfirmationModal({
  isOpen, onClose, mode, orgName = "", preview, onConfirm,
  isProcessing, error,
}: DestructiveConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);

  useFocusTrap(isOpen && !isProcessing, modalRef);

  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      setConfirmText("");
      setInternalError(null);
      setTimeout(() => {
        const cb = modalRef.current?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        cb?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Escape to close — disabled while processing.
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, isProcessing, onClose]);

  // Lock body scroll when open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const expectedPhrase =
    mode === "organization"
      ? `RESET ${orgName}`
      : "DELETE ALL PLATFORM DATA";
  const isConfirmed =
    acknowledged && confirmText.trim() === expectedPhrase;
  const displayError = error || internalError;

  const handleConfirmClick = async () => {
    if (!isConfirmed || isProcessing) return;
    setInternalError(null);
    try {
      await onConfirm();
    } catch (err) {
      setInternalError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  if (!isOpen) return null;

  const keysForMode = mode === "organization"
    ? ORG_PREVIEW_KEYS
    : STAT_CATEGORIES.flatMap((c) => c.keys);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby={`dm-title-${mode}`}
      aria-describedby={`dm-desc-${mode}`}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-arc-2xl w-full max-w-lg mx-4 border border-arc-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-arc-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-arc-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-arc-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id={`dm-title-${mode}`} className="text-xl font-bold text-arc-navy-900">
                {mode === "organization"
                  ? "Confirm Organization Reset"
                  : "Confirm Platform Reset"}
              </h2>
              <p id={`dm-desc-${mode}`} className="mt-1 text-sm text-arc-slate-500">
                {mode === "organization"
                  ? `You are about to permanently delete all data for "${orgName}". This action cannot be undone.`
                  : "You are about to permanently delete ALL platform data. This action cannot be undone."}
              </p>
            </div>
            <button
              type="button"
              onClick={isProcessing ? undefined : onClose}
              disabled={isProcessing}
              className={cn(
                "p-2 rounded-lg transition-colors flex-shrink-0",
                isProcessing
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-arc-slate-100 text-arc-slate-500",
              )}
              aria-label={isProcessing ? "Processing" : "Close dialog"}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-5">
            {/* Preview counts */}
            {preview && (
              <div>
                <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                  {mode === "organization"
                    ? "Affected records"
                    : "Records to be deleted"}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {keysForMode.map((key) => (
                    <div key={key} className="flex justify-between py-1 border-b border-arc-slate-100">
                      <span className="text-arc-slate-500">
                        {STAT_LABELS[key] ?? key}
                      </span>
                      <span className="font-medium text-arc-navy-900">
                        {formatCount(preview.counts?.[key] ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mode === "organization" && (
              <div className="text-xs text-arc-slate-500 italic">
                Additional organization-scoped records (subjects, modules,
                topics, attempts, and derived data) will also be permanently
                deleted.
              </div>
            )}

            {/* Preserved data (platform mode) */}
            {mode === "platform" && (
              <div>
                <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                  Preserved data
                </h3>
                <ul className="space-y-2 text-sm">
                  {PLATFORM_PRESERVED_ITEMS.map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-arc-navy-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <span className="text-arc-navy-700">{item.label}</span>
                        <p className="text-arc-slate-500 mt-0.5">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preserved data (org mode) */}
            {mode === "organization" && (
              <div>
                <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                  What is preserved
                </h3>
                <ul className="space-y-1 text-sm text-arc-slate-600">
                  {ORG_PRESERVED_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-arc-navy-400 flex-shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Irreversible warning */}
            <div
              className="rounded-lg bg-arc-red-50 border border-arc-red-200 p-4"
              role="alert"
              aria-label="Warning: This action cannot be undone"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-arc-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-semibold text-arc-red-800">
                  ⚠ This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Acknowledgement checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id={`ack-${mode}`}
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isProcessing}
                className="mt-0.5 h-4 w-4 rounded border-arc-slate-300 text-arc-red-600 focus:ring-arc-red-500"
                aria-required="true"
              />
              <label htmlFor={`ack-${mode}`} className="text-sm text-arc-navy-700 cursor-pointer leading-relaxed">
                I understand that this data cannot be recovered.
              </label>
            </div>

            {/* Text confirmation */}
            <div className="pt-2">
              <label htmlFor={`confirm-text-${mode}`} className="block text-sm font-medium text-arc-navy-700 mb-2">
                Type{" "}
                <code className="font-mono text-arc-red-700 bg-arc-red-50 px-1.5 py-0.5 rounded">
                  {expectedPhrase}
                                </code>{" "}
                to confirm:
              </label>
              <Input
                id={`confirm-text-${mode}`}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isProcessing}
                placeholder={expectedPhrase}
                className={cn(
                  "w-full",
                  confirmText.trim() === expectedPhrase
                    ? "border-arc-green-300 focus:ring-arc-green-500"
                    : "border-arc-slate-300",
                )}
                aria-required="true"
                aria-invalid={confirmText.length > 0 && confirmText.trim() !== expectedPhrase}
                aria-describedby={`confirm-hint-${mode}`}
              />
              {confirmText.length > 0 && confirmText.trim() !== expectedPhrase && (
                <p id={`confirm-hint-${mode}`} className="mt-1 text-xs text-arc-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  Confirmation text does not match.
                </p>
              )}
            </div>

            {/* Error state */}
            {displayError && (
              <div className="rounded-lg bg-arc-red-50 border border-arc-red-200 p-3 text-sm text-arc-red-700" role="alert" aria-live="polite">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-arc-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{displayError}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cancel and close dialog"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={!isConfirmed || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                <span>Resetting data… Do not close this window.</span>
              </>
            ) : mode === "organization" ? (
              "Permanently reset organization"
            ) : (
              "Permanently reset platform"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResetSuccessState — displayed after a successful reset operation.
// Shows audit ID, timestamp, deleted counts, preserved records, and
// navigation actions.
// ---------------------------------------------------------------------------

interface ResetSuccessStateProps {
  flow: "organization" | "platform";
  orgName?: string;
  counts: ResetCounts;
  auditId: string;
  timestamp: Date;
  onReturnToDashboard: () => void;
}

function ResetSuccessState({
  flow, orgName, counts, auditId, timestamp, onReturnToDashboard,
}: ResetSuccessStateProps) {
  const displayCounts = DELETED_DISPLAY_ORDER[flow].filter(
    (k) => (counts?.[k] ?? 0) > 0,
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  useFocusTrap(true, overlayRef);

  // Lock body scroll and move focus into the dialog.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTarget = overlayRef.current?.querySelector<HTMLButtonElement>(
      'button:not([disabled])',
    );
    focusTarget?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-success-title"
    >
      <div
        className="bg-white rounded-2xl shadow-arc-2xl w-full max-w-2xl border border-arc-slate-200 overflow-hidden max-h-[95vh] flex flex-col"
        aria-live="polite"
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-arc-slate-200 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-arc-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-arc-green-600" aria-hidden="true" />
          </div>
          <h2 id="reset-success-title" className="text-2xl font-bold text-arc-navy-900">
            Reset completed
          </h2>
          <p className="mt-2 text-sm text-arc-slate-500">
            {flow === "organization"
              ? `All data for "${orgName}" has been permanently deleted.`
              : "All platform data has been permanently deleted."}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <div className="space-y-5">
            {/* Audit reference */}
            <div>
              <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                Audit reference
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-arc-slate-500">Reset ID</dt>
                  <dd className="font-mono font-medium text-arc-navy-900">{auditId}</dd>
                </div>
                <div>
                  <dt className="text-arc-slate-500">Timestamp</dt>
                  <dd className="font-medium text-arc-navy-900">{formatDate(timestamp)}</dd>
                </div>
                <div>
                  <dt className="text-arc-slate-500">Scope</dt>
                  <dd className="font-medium text-arc-navy-900">
                    {flow === "organization" ? "Organization-wide" : "Platform-wide"}
                  </dd>
                </div>
                <div>
                  <dt className="text-arc-slate-500">Event type</dt>
                  <dd className="font-mono text-arc-navy-900">
                    {flow === "organization" ? "ORG_RESET" : "PLATFORM_RESET"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Deleted counts */}
            <div>
              <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                Deleted records
              </h3>
              {displayCounts.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {displayCounts.map((key) => (
                      <tr key={key} className="border-b border-arc-slate-100">
                        <td className="py-1.5 text-arc-slate-500">{DELETED_RECORD_LABELS[key] ?? key}</td>
                        <td className="py-1.5 text-right font-medium text-arc-red-700">
                          {formatCount(counts[key] ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-arc-slate-500">No records were affected.</p>
              )}
            </div>

            {/* Preserved records */}
            <div>
              <h3 className="text-sm font-semibold text-arc-navy-700 mb-2">
                Preserved records
              </h3>
              <ul className="space-y-1.5 text-sm">
                {flow === "platform"
                  ? PLATFORM_PRESERVED_ITEMS.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-arc-navy-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span className="text-arc-slate-600">{item.label}: {item.detail}</span>
                      </li>
                    ))
                  : ORG_PRESERVED_ITEMS.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-arc-navy-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span className="text-arc-slate-600">{item}</span>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 px-6 py-4 border-t border-arc-slate-200 bg-arc-slate-50 sm:flex-row sm:justify-end">
          <Link
            href="/admin/access"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center gap-2",
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View Audit Record
          </Link>
          <Button variant="default" size="sm" onClick={onReturnToDashboard}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

interface SuccessResult {
  flow: "organization" | "platform";
  orgName?: string;
  counts: ResetCounts;
  auditId: string;
  timestamp: Date;
}

export default function SettingsPage() {
  // ── Platform data overview ──
  const [stats, setStats] = useState<ResetCounts | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Organizations (for selector) ──
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // ── Platform reset workflow ──
  const [platformPreview, setPlatformPreview] = useState<ResetPreview | null>(null);
  const [platformPreviewLoading, setPlatformPreviewLoading] = useState(false);
  const [platformConfirmOpen, setPlatformConfirmOpen] = useState(false);
  const [platformProcessing, setPlatformProcessing] = useState(false);
  const [platformProcessingError, setPlatformProcessingError] = useState<string | null>(null);
  const [platformSuccess, setPlatformSuccess] = useState<SuccessResult | null>(null);

  // ── Organization reset workflow ──
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [orgPreview, setOrgPreview] = useState<ResetPreview | null>(null);
  const [orgReviewLoading, setOrgReviewLoading] = useState(false);
  const [orgConfirmOpen, setOrgConfirmOpen] = useState(false);
  const [orgProcessing, setOrgProcessing] = useState(false);
  const [orgProcessingError, setOrgProcessingError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<SuccessResult | null>(null);

  const router = useRouter();

  // ── Data fetching ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const preview = await fetchResetPreview();
      setStats(preview.counts);
      setLastUpdated(new Date());
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "Failed to load platform data."
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const data = await fetchPlatformOrganizations(false);
      setOrgs(data.filter((o) => !o.deleted));
    } catch (err) {
      // Non-fatal — the review button stays disabled so the user is never
      // led into a reset they cannot verify.
      console.error("Failed to load organizations:", err);
      toast.error("Failed to load organizations. Please refresh and try again.");
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadOrgs();
  }, [loadStats, loadOrgs]);

  // ── Platform reset handlers ──
  const handlePlatformReview = async () => {
    setPlatformPreviewLoading(true);
    setPlatformProcessingError(null);
    try {
      const preview = await fetchResetPreview();
      setPlatformPreview(preview);
      setPlatformConfirmOpen(true);
    } catch (err) {
      setPlatformProcessingError(
        err instanceof Error ? err.message : "Failed to load reset preview."
      );
      toast.error("Failed to load reset preview. Please try again.");
    } finally {
      setPlatformPreviewLoading(false);
    }
  };

  const handlePlatformConfirm = async () => {
    setPlatformProcessing(true);
    setPlatformProcessingError(null);
    try {
      // Send the literal confirmation as required by the backend schema.
      const result = await performFullReset();
      setPlatformConfirmOpen(false);
      setPlatformSuccess({
        flow: "platform",
        counts: result.deleted,
        auditId: generateResetId(),
        timestamp: new Date(),
      });
      toast.success("Platform reset completed successfully.");
      // Refresh the stats after a moment to show the reset state.
      setTimeout(() => loadStats(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset platform data.";
      setPlatformProcessingError(msg);
      toast.error(msg);
    } finally {
      setPlatformProcessing(false);
    }
  };

  // ── Organization reset handlers ──
  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);
  const selectedOrgName = selectedOrg?.name ?? "";

  const handleOrgReview = async () => {
    if (!selectedOrgId) {
      toast.error("Please select an organization first.");
      return;
    }
    setOrgReviewLoading(true);
    setOrgProcessingError(null);
    try {
      const preview = await fetchResetPreview(selectedOrgId);
      setOrgPreview(preview);
      setOrgConfirmOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load reset preview.";
      setOrgProcessingError(msg);
      toast.error(msg);
    } finally {
      setOrgReviewLoading(false);
    }
  };

  const handleOrgConfirm = async () => {
    setOrgProcessing(true);
    setOrgProcessingError(null);
    try {
      const result = await performOrgReset(selectedOrgId);
      setOrgConfirmOpen(false);
      setOrgSuccess({
        flow: "organization",
        orgName: selectedOrgName,
        counts: result.deleted,
        auditId: generateResetId(),
        timestamp: new Date(),
      });
      toast.success("Organization reset completed successfully.");
      setTimeout(() => loadStats(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset organization data.";
      setOrgProcessingError(msg);
      toast.error(msg);
    } finally {
      setOrgProcessing(false);
    }
  };

  // ── Reset to idle (from success state) ──
  const resetToIdle = () => {
    setPlatformSuccess(null);
    setOrgSuccess(null);
    setPlatformProcessingError(null);
    setOrgProcessingError(null);
    setLastUpdated(null);
  };


  // ── Success overlays ──
  if (platformSuccess) {
    return (
      <ResetSuccessState
        flow="platform"
        counts={platformSuccess.counts}
        auditId={platformSuccess.auditId}
        timestamp={platformSuccess.timestamp}
        onReturnToDashboard={() => {
          resetToIdle();
          router.push("/admin");
        }}
      />
    );
  }

  if (orgSuccess) {
    return (
      <ResetSuccessState
        flow="organization"
        orgName={orgSuccess.orgName}
        counts={orgSuccess.counts}
        auditId={orgSuccess.auditId}
        timestamp={orgSuccess.timestamp}
        onReturnToDashboard={() => {
          resetToIdle();
          router.push("/admin");
        }}
      />
    );
  }

  return (
    <>
      <DashboardHeader
        title="Platform Settings"
        subtitle="Manage platform-wide configuration and perform destructive data operations."
        breadcrumbs={[
          { label: "Platform", href: "/platform/organizations" },
          { label: "Settings" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats()}
            disabled={statsLoading}
            aria-label={statsLoading ? "Refreshing data" : "Refresh data"}
          >
            <RefreshCw className={cn("h-4 w-4", statsLoading && "animate-spin")} aria-hidden="true" />
          </Button>
        }
      />

      <main className="px-6 py-6 space-y-8 pb-12">
        {/* ── Platform Data Overview ── */}
        <section aria-labelledby="platform-data-overview-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="platform-data-overview-heading" className="text-xl font-bold text-arc-navy-900">
              Platform Data Overview
            </h2>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-arc-slate-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Last updated: {formatDate(lastUpdated)}</span>
              </div>
            )}
          </div>

          {statsLoading ? (
            <StatsLoadingSkeleton />
          ) : statsError ? (
            <Card className="border-arc-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-arc-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Failed to load platform data</p>
                    <p className="text-sm mt-1">{statsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={loadStats}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {STAT_CATEGORIES.map((category) => (
                <StatCategorySection
                  key={category.label}
                  category={category}
                  counts={stats ?? {}}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Destructive Data Operations ── */}
        <section
          aria-labelledby="destructive-heading"
          className="border-t border-arc-slate-200 pt-8"
        >
          <div className="max-w-2xl">
            <h2 id="destructive-heading" className="text-xl font-bold text-arc-navy-900">
              Destructive Data Operations
            </h2>
            <p className="mt-1 text-sm text-arc-slate-500">
              These operations permanently delete data and cannot be undone.
              All destructive operations are recorded in the audit log.
            </p>
          </div>

          {/* Platform reset card */}
          <Card className="mt-6 border-arc-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-arc-navy-900">
                <Database className="h-5 w-5 text-arc-red-600" aria-hidden="true" />
                Platform Reset
              </CardTitle>
              <CardDescription>
                Permanently delete all organizations, users, content, and
                assessments across the entire platform. Super Admin accounts,
                RBAC definitions, and platform settings are preserved.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/admin/access"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "inline-flex items-center gap-2",
                )}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Audit Log
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={handlePlatformReview}
                disabled={platformPreviewLoading || platformConfirmOpen}
              >
                {platformPreviewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Loading…
                  </>
                ) : (
                  "Review platform reset"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Organization reset card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-arc-navy-900">
                <Building2 className="h-5 w-5 text-arc-navy-600" aria-hidden="true" />
                Organization Reset
              </CardTitle>
              <CardDescription>
                Permanently delete all data for a single organization —
                members, learners, programs, content, assessments, and
                attempts. Other organizations are untouched.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="org-selector"
                    className="block text-sm font-medium text-arc-navy-700 mb-1"
                  >
                    Select organization
                  </label>
                  {orgsLoading ? (
                    <Skeleton className="h-11 w-full rounded-lg" />
                  ) : (
                    <select
                      id="org-selector"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      disabled={orgConfirmOpen || orgProcessing}
                      className="w-full h-11 px-4 rounded-lg border border-arc-slate-300 bg-white text-sm text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500 focus:border-arc-navy-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Select organization to reset"
                    >
                      <option value="" disabled>
                        Choose an organization…
                      </option>
                      {orgs.length === 0 && (
                        <option value="" disabled>
                          No organizations available
                        </option>
                      )}
                      {orgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={handleOrgReview}
                disabled={
                  !selectedOrgId ||
                  orgReviewLoading ||
                  orgsLoading ||
                  orgConfirmOpen
                }
              >
                {orgReviewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Loading…
                  </>
                ) : (
                  "Review organization reset"
                )}
              </Button>
            </CardFooter>
          </Card>
        </section>
      </main>

      {/* ── Modals ── */}
      <DestructiveConfirmationModal
        isOpen={platformConfirmOpen}
        onClose={() => {
          setPlatformConfirmOpen(false);
          setPlatformProcessingError(null);
        }}
        mode="platform"
        preview={platformPreview}
        onConfirm={handlePlatformConfirm}
        isProcessing={platformProcessing}
        error={platformProcessingError}
      />

      <DestructiveConfirmationModal
        isOpen={orgConfirmOpen}
        onClose={() => {
          setOrgConfirmOpen(false);
          setOrgProcessingError(null);
        }}
        mode="organization"
        orgName={selectedOrgName}
        preview={orgPreview}
        onConfirm={handleOrgConfirm}
        isProcessing={orgProcessing}
        error={orgProcessingError}
      />
    </>
  );
}


