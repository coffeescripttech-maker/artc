/**
 * ARC Mastery Band System
 *
 * Shared constants for mastery levels and band thresholds.
 * These are application-wide, not per-user configurable.
 */

export const MASTERY_BANDS = {
  /** >= gate (default 95%) */
  MASTERED: "Mastered",
  /** >= 90% */
  ALMOST_THERE: "Almost There",
  /** >= 80% */
  DEVELOPING: "Developing",
  /** >= 70% */
  NEEDS_REVIEW: "Needs Review",
  /** < 70% */
  REBUILD: "Rebuild Foundation",
} as const;

export type MasteryBandLabel = (typeof MASTERY_BANDS)[keyof typeof MASTERY_BANDS];

/** Mastery band CSS classes for Tailwind styling */
export const MASTERY_BAND_CLASSES: Record<MasteryBandLabel, string> = {
  [MASTERY_BANDS.MASTERED]: "bg-green-100 text-green-700 border-green-200",
  [MASTERY_BANDS.ALMOST_THERE]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [MASTERY_BANDS.DEVELOPING]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [MASTERY_BANDS.NEEDS_REVIEW]: "bg-orange-100 text-orange-700 border-orange-200",
  [MASTERY_BANDS.REBUILD]: "bg-red-100 text-red-700 border-red-200",
};

/** Mastery band icons (Lucide icon names) */
export const MASTERY_BAND_ICONS: Record<MasteryBandLabel, string> = {
  [MASTERY_BANDS.MASTERED]: "Trophy",
  [MASTERY_BANDS.ALMOST_THERE]: "TrendingUp",
  [MASTERY_BANDS.DEVELOPING]: "Minus",
  [MASTERY_BANDS.NEEDS_REVIEW]: "AlertCircle",
  [MASTERY_BANDS.REBUILD]: "RefreshCw",
};

/** Default mastery threshold percentage */
export const DEFAULT_MASTERY_GATE = 95;

/** Mastery band thresholds (in order from highest to lowest) */
export const MASTERY_THRESHOLDS = {
  [MASTERY_BANDS.MASTERED]: 95,
  [MASTERY_BANDS.ALMOST_THERE]: 90,
  [MASTERY_BANDS.DEVELOPING]: 80,
  [MASTERY_BANDS.NEEDS_REVIEW]: 70,
  [MASTERY_BANDS.REBUILD]: 0,
} as const;

/** Prisma MasteryLevel enum values mapped to band labels */
export const MASTERY_LEVEL_TO_BAND: Record<string, MasteryBandLabel> = {
  MASTERED: MASTERY_BANDS.MASTERED,
  PROFICIENT: MASTERY_BANDS.ALMOST_THERE,
  PRACTICING: MASTERY_BANDS.DEVELOPING,
  LEARNING: MASTERY_BANDS.NEEDS_REVIEW,
  NOT_STARTED: MASTERY_BANDS.REBUILD,
};

/**
 * Get the mastery band label for a given percentage.
 * Uses the configurable gate for the "Mastered" threshold.
 */
export function getMasteryBand(pct: number, gate = DEFAULT_MASTERY_GATE): MasteryBandLabel {
  if (pct >= gate) return MASTERY_BANDS.MASTERED;
  if (pct >= MASTERY_THRESHOLDS[MASTERY_BANDS.ALMOST_THERE]) return MASTERY_BANDS.ALMOST_THERE;
  if (pct >= MASTERY_THRESHOLDS[MASTERY_BANDS.DEVELOPING]) return MASTERY_BANDS.DEVELOPING;
  if (pct >= MASTERY_THRESHOLDS[MASTERY_BANDS.NEEDS_REVIEW]) return MASTERY_BANDS.NEEDS_REVIEW;
  return MASTERY_BANDS.REBUILD;
}

/**
 * Get color class for a mastery level enum value.
 */
export function getMasteryLevelClass(level: string): string {
  return MASTERY_LEVEL_TO_BAND[level]
    ? MASTERY_BAND_CLASSES[MASTERY_LEVEL_TO_BAND[level]]
    : "bg-gray-100 text-gray-700 border-gray-200";
}
