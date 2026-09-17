import { DAY_MS, WEEK_MS, YEAR_MS } from "../../convex/lib/constants";

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const MONTH_MS = YEAR_MS / 12;

export function formatAge(ms: number): string {
  if (ms < DAY_MS) return "less than a day";

  const days = Math.floor(ms / DAY_MS);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;

  if (ms < YEAR_MS) {
    const months = Math.floor(ms / MONTH_MS);
    if (months < 2) {
      const weeks = Math.floor(ms / WEEK_MS);
      return `${weeks} week${weeks === 1 ? "" : "s"}`;
    }
    return `${months} months`;
  }

  const years = Math.floor(ms / YEAR_MS);
  const remainingMonths = Math.floor((ms % YEAR_MS) / MONTH_MS);
  if (remainingMonths === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} yr ${remainingMonths} mo`;
}
