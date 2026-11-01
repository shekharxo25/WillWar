import { isPaused, localDate, shortDate } from "@/lib/time";
import type { BoardRow, Challenge } from "@/lib/store/types";
import { SEASON } from "@/lib/config/season";

export type Metric = "current" | "best" | "days";

export const METRICS: { value: Metric; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "best", label: "Best" },
  { value: "days", label: "Days" },
];

export function metricDefinition(m: Metric, seasonLinked: boolean): string {
  if (m === "current") return "Time since each person's last reset.";
  if (m === "best") return seasonLinked ? `Longest streak during ${SEASON.name}.` : "Longest streak since joining.";
  return seasonLinked ? "Days checked in as held during the season." : "Days checked in as held.";
}

export function metricValue(r: BoardRow, m: Metric): number {
  return m === "current" ? r.currentStreakS : m === "best" ? r.bestStreakS : r.daysKept;
}

/** Big value + small unit. Streaks under a day show hours. */
export function formatMetric(r: BoardRow, m: Metric): { value: string; unit: string } {
  if (m === "days") return { value: String(r.daysKept), unit: "d" };
  const s = metricValue(r, m);
  if (s < 86400) return { value: String(Math.floor(s / 3600)), unit: "h" };
  return { value: String(Math.floor(s / 86400)), unit: "d" };
}

export type RankedRow = BoardRow & { rank: number; paused: boolean };

/** Sorted by the metric, ties share a rank. Paused: no check-in for two days. */
export function rankBoard(rows: BoardRow[], m: Metric, today: string): RankedRow[] {
  const sorted = [...rows].sort((a, b) => metricValue(b, m) - metricValue(a, m) || a.handle.localeCompare(b.handle));
  let prev: number | null = null;
  let rank = 0;
  return sorted.map((r, i) => {
    const v = metricValue(r, m);
    if (v !== prev) rank = i + 1;
    prev = v;
    return { ...r, rank, paused: isPaused(r.lastCheckin, today) };
  });
}

export function challengeLabel(c: Challenge, tz: string): string {
  const name = c.kind === "first_to_days" ? `First to ${c.targetDays} days` : c.kind === "longest_streak" ? "Longest streak" : "Most days kept";
  return `${name}, ends ${shortDate(localDate(new Date(c.endsAt), tz))}`;
}

export function activeChallenge(list: Challenge[], now: Date): Challenge | null {
  return [...list].filter((c) => new Date(c.endsAt) > now).sort((a, b) => a.endsAt.localeCompare(b.endsAt))[0] ?? null;
}

export function inviteLink(origin: string, code: string) {
  return `${origin}/app/join/${code}`;
}

export const CAMP_ERRORS: Record<string, string> = {
  bad_name: "Use 2 to 40 characters.",
  name_not_allowed: "Pick a different name.",
  invalid_code: "That code doesn't match a camp. Check it and try again.",
  camp_full: "That camp is full. Ask the owner about a Pro camp.",
  rate_limited: "Three nudges a day to one person. Try again tomorrow.",
  not_member: "You're not in this camp any more.",
  self_nudge: "You can't nudge yourself.",
  bad_dates: "The end has to come after the start.",
  bad_target: "Pick a target between 1 and 365 days.",
};
