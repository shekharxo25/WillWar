// Derived, read-only views over a Snapshot used by several screens.
import { CAUSES, CURRENT_SEASON, type Season } from "@/lib/domain/constants";
import { remainingMinor } from "@/lib/domain/rules";
import type { Snapshot } from "@/lib/domain/types";
import { addDays, localDate, streakDayNumber, waterLevel } from "@/lib/time";

export function isPro(s: Snapshot, now = new Date()): boolean {
  const e = s.entitlement;
  if (!e || e.status !== "active") return false;
  return !e.currentPeriodEnd || new Date(e.currentPeriodEnd) > now;
}

export function seasonFor(s: Snapshot): Season | null {
  return s.goal?.seasonId === CURRENT_SEASON.id ? CURRENT_SEASON : null;
}

export function today(s: Snapshot, now = new Date()) {
  return localDate(now, s.profile.timezone);
}

export function checkedInToday(s: Snapshot, now = new Date()): boolean {
  const t = today(s, now);
  return s.checkins.some((c) => c.localDate === t && (c.status === "held" || c.status === "shielded"));
}

export function streakStart(s: Snapshot): Date | null {
  return s.openStreak ? new Date(s.openStreak.startedAt) : null;
}

/**
 * Before the season starts the clock hasn't begun. A few seconds of tolerance covers a
 * streak that started on this device a moment ago (a reset) while the UI clock is a tick behind.
 */
export function hasStarted(s: Snapshot, now = new Date()): boolean {
  const start = streakStart(s);
  return Boolean(start && start.getTime() <= now.getTime() + 5000);
}

export function dayNumber(s: Snapshot, now = new Date()): number {
  const start = streakStart(s);
  return start ? streakDayNumber(start, now, s.profile.timezone) : 0;
}

export function level(s: Snapshot, now = new Date()): number {
  const start = streakStart(s);
  if (!start || !s.goal) return 0;
  return waterLevel(start, s.goal.endsOn, s.profile.timezone, now);
}

export function lastCheckin(s: Snapshot): string | null {
  return s.checkins[0]?.localDate ?? null;
}

export function availableShields(s: Snapshot): number {
  return s.shields.filter((sh) => !sh.usedOn).length;
}

export function activeChest(s: Snapshot) {
  const c = s.warChest;
  return c && (c.status === "active" || c.status === "settling") ? c : null;
}

export function chestRemaining(s: Snapshot): number {
  const c = activeChest(s);
  return c ? remainingMinor(c) : 0;
}

export function causeFor(id: string | null | undefined) {
  return CAUSES.find((c) => c.id === id) ?? null;
}

/** The day after the goal's last day: when a War Chest comes back. */
export function returnDate(s: Snapshot): string | null {
  return s.goal ? addDays(s.goal.endsOn, 1) : null;
}

export function wavesRidden(s: Snapshot): number {
  return s.urgeSessions.filter((u) => u.completed).length;
}
