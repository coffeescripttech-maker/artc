/**
 * Lightweight date helpers — avoids pulling in date-fns as a dependency.
 */

/**
 * Format a past date as a relative time string with a suffix.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
export function formatDistanceToNow(
  date: string | Date,
  options?: { addSuffix?: boolean }
): string {
  const target = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();

  if (isNaN(target.getTime())) return "—";

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let result: string;
  if (diffSeconds < 60) {
    result = diffSeconds <= 5 ? "just now" : `${diffSeconds}s`;
  } else if (diffMinutes < 60) {
    result = `${diffMinutes}m`;
  } else if (diffHours < 24) {
    result = `${diffHours}h`;
  } else if (diffDays < 7) {
    result = `${diffDays}d`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 5) {
      result = `${weeks}w`;
    } else {
      const months = Math.floor(diffDays / 30);
      result = `${months}mo`;
    }
  }

  // Full form with "ago"
  let fullResult: string;
  if (diffSeconds < 60 && diffSeconds >= 0) {
    fullResult = diffSeconds <= 5 ? "just now" : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    fullResult = `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    fullResult = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    fullResult = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    fullResult = `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  } else {
    fullResult = formatDate(date);
  }

  return options?.addSuffix === false ? result : fullResult;
}

/**
 * Format a date as a readable absolute date string.
 * e.g. "Aug 27, 2026"
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
