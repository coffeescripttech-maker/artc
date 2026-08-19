export interface MasteryBand {
  label: string;
  cls: string;
}

/**
 * Maps a score percentage to an ARC mastery band. The `gate` is the mastery
 * threshold (e.g. 95). Framed as progress, not pass/fail.
 */
export function masteryBand(pct: number, gate = 95): MasteryBand {
  if (pct >= gate) return { label: "Mastered", cls: "bg-green-100 text-green-700" };
  if (pct >= 90) return { label: "Almost There", cls: "bg-emerald-100 text-emerald-700" };
  if (pct >= 80) return { label: "Developing", cls: "bg-yellow-100 text-yellow-700" };
  if (pct >= 70) return { label: "Needs Review", cls: "bg-orange-100 text-orange-700" };
  return { label: "Rebuild Foundation", cls: "bg-red-100 text-red-700" };
}
