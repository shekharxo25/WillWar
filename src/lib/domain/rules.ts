// Pure business rules. Each mirrors a database function in supabase/migrations so
// device mode and cloud mode behave identically; the database stays authoritative
// in cloud mode. Error codes match the SQL `raise exception` codes.
import {
  BACKDATE_HOURS,
  CHEST_LIMITS,
  CRISIS_COOLDOWN_DAYS,
  type Currency,
  type ForfeitRule,
  MAX_CUSTOM_GOAL_DAYS,
  MAX_WHY_TAGS,
  OFFER_HOURS,
  OFFER_MIN_DAYS_LEFT,
  type Season,
  SHIELD_WINDOW_DAYS,
} from "./constants";
import type { Checkin, Goal, LocalDate, Streak, WarChest } from "./types";
import { addDays, diffDays, localDate, localHour, MS_DAY, MS_HOUR, zonedTimeToUtc } from "@/lib/time";

export class RuleError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RuleError";
  }
}

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function handleError(raw: string): string | null {
  const h = normaliseHandle(raw);
  if (!HANDLE_RE.test(h)) return "Use 3–20 letters, numbers or underscores.";
  return null;
}

/** True when the person is 18 or over on `today` (birthday counts). */
export function isAdult(birthDate: LocalDate, today: LocalDate): boolean {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age >= 18;
}

export interface StartWindow {
  min: Date;
  max: Date;
}

/**
 * Allowed streak start at onboarding: back to the season start (honor system) or
 * 48 hours, up to now; or the season start itself if the season hasn't begun.
 */
export function startWindow(now: Date, seasonStart: Date | null): StartWindow {
  const back = new Date(now.getTime() - BACKDATE_HOURS * MS_HOUR);
  return {
    min: seasonStart && seasonStart < back ? seasonStart : back,
    max: seasonStart && seasonStart > now ? seasonStart : now,
  };
}

export interface GoalChoice {
  seasonId: string | null;
  endsOn: LocalDate | null;
}

/** Resolves the goal end date; throws season_over / bad_end_date like complete_onboarding. */
export function resolveGoalEnd(choice: GoalChoice, season: Season | null, today: LocalDate): LocalDate {
  if (choice.seasonId) {
    if (!season || season.id !== choice.seasonId) throw new RuleError("bad_season");
    if (season.endsOn < today) throw new RuleError("season_over");
    return season.endsOn;
  }
  const end = choice.endsOn;
  if (!end || end <= today || diffDays(today, end) > MAX_CUSTOM_GOAL_DAYS) throw new RuleError("bad_end_date");
  return end;
}

export function seasonStartInstant(season: Season, tz: string): Date {
  return zonedTimeToUtc(season.startsOn, tz);
}

export function validateWhyTags<T extends string>(tags: T[]): T[] {
  const unique = Array.from(new Set(tags));
  if (unique.length > MAX_WHY_TAGS) throw new RuleError("too_many_reasons");
  return unique;
}

/** Forfeit for one reset: Steady 25% of the original amount, Strict everything left. */
export function forfeitFor(chest: Pick<WarChest, "forfeitRule" | "amountMinor" | "forfeitedMinor">): number {
  const remaining = chest.amountMinor - chest.forfeitedMinor;
  if (remaining <= 0) return 0;
  if (chest.forfeitRule === "strict") return remaining;
  return Math.min(Math.floor(chest.amountMinor / 4), remaining);
}

export function validChestAmount(amountMinor: number, currency: Currency): boolean {
  const lim = CHEST_LIMITS[currency];
  return Number.isInteger(amountMinor) && amountMinor >= lim.min && amountMinor <= lim.max;
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  const whole = Number.isInteger(major);
  const n = major.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${CHEST_LIMITS[currency].symbol}${n}`;
}

export interface OfferState {
  now: Date;
  timezone: string;
  warChestOfferedAt: string | null;
  goal: Pick<Goal, "endsOn" | "pledgeSignedAt" | "closedAt"> | null;
  hasHeldCheckin: boolean;
  hasChestForGoal: boolean;
  lastCrisisCardAt: Date | null;
}

/** Mirrors war_chest_offer_eligible(): once ever, after a signed pledge and a held day. */
export function warChestOfferEligible(s: OfferState): boolean {
  if (s.warChestOfferedAt) return false;
  if (!s.goal || s.goal.closedAt || !s.goal.pledgeSignedAt) return false;
  if (diffDays(localDate(s.now, s.timezone), s.goal.endsOn) < OFFER_MIN_DAYS_LEFT) return false;
  const hour = localHour(s.now, s.timezone);
  if (hour < OFFER_HOURS.from || hour > OFFER_HOURS.to) return false;
  if (!s.hasHeldCheckin || s.hasChestForGoal) return false;
  if (s.lastCrisisCardAt && s.now.getTime() - s.lastCrisisCardAt.getTime() < CRISIS_COOLDOWN_DAYS * MS_DAY) {
    return false;
  }
  return true;
}

/** Mirrors use_shield(): a missed day in the last three days, inside the open streak. */
export function shieldError(
  target: LocalDate,
  today: LocalDate,
  openStreak: Streak | null,
  checkins: Checkin[],
  timezone: string,
): string | null {
  if (target >= today || target < addDays(today, -SHIELD_WINDOW_DAYS)) return "shield_window";
  if (checkins.some((c) => c.localDate === target)) return "already_recorded";
  if (!openStreak || localDate(new Date(openStreak.startedAt), timezone) > target) return "not_in_streak";
  return null;
}

/** Days in the shield window that a shield could still cover, newest first. */
export function shieldableDays(
  today: LocalDate,
  openStreak: Streak | null,
  checkins: Checkin[],
  timezone: string,
): LocalDate[] {
  const out: LocalDate[] = [];
  for (let i = 1; i <= SHIELD_WINDOW_DAYS; i++) {
    const d = addDays(today, -i);
    if (!shieldError(d, today, openStreak, checkins, timezone)) out.push(d);
  }
  return out;
}

/** Longest streak in ms, optionally clipped to a window (pact_leaderboard "Best"). */
export function bestStreakMs(streaks: Streak[], now: Date, window?: { start: Date; end: Date }): number {
  let best = 0;
  for (const s of streaks) {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    const ws = window ? Math.max(start, window.start.getTime()) : start;
    const we = window ? Math.min(end, window.end.getTime(), now.getTime()) : end;
    if (we > ws) best = Math.max(best, we - ws);
  }
  return best;
}

/** Days kept (held or shielded), optionally inside a date window. */
export function daysKept(checkins: Checkin[], from?: LocalDate, to?: LocalDate): number {
  return checkins.filter(
    (c) =>
      (c.status === "held" || c.status === "shielded") &&
      (!from || c.localDate >= from) &&
      (!to || c.localDate <= to),
  ).length;
}

/** "Paused" after two days without a check-in. */
export function isPaused(lastCheckin: LocalDate | null, today: LocalDate, streakStart: LocalDate | null): boolean {
  const ref = lastCheckin ?? streakStart;
  if (!ref) return false;
  return diffDays(ref, today) > 2;
}

/** Average intensity drop across completed urge sessions with both scores (needs 3+). */
export function averageDrop(sessions: { intensityBefore: number | null; intensityAfter: number | null }[]): number | null {
  const scored = sessions.filter((s) => s.intensityBefore != null && s.intensityAfter != null);
  if (scored.length < 3) return null;
  const total = scored.reduce((sum, s) => sum + ((s.intensityBefore as number) - (s.intensityAfter as number)), 0);
  return Math.round((total / scored.length) * 10) / 10;
}

export function remainingMinor(chest: Pick<WarChest, "amountMinor" | "forfeitedMinor">): number {
  return Math.max(0, chest.amountMinor - chest.forfeitedMinor);
}

export function forfeitRuleLabel(rule: ForfeitRule): string {
  return rule === "steady" ? "Steady" : "Strict";
}
