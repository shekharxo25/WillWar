/**
 * Pure time functions. The Clock is always computed from timestamps, never from an
 * incrementing counter, so it is right after the phone sleeps.
 * Date-only values are ISO strings "YYYY-MM-DD" interpreted in the profile's IANA timezone.
 */

export const DAY_MS = 86_400_000;
export const MILESTONES = [7, 14, 21, 30] as const;

export type Elapsed = { days: number; hours: number; minutes: number; seconds: number; totalMs: number };

export function elapsed(from: Date | string | number, now: Date | number): Elapsed {
  const start = new Date(from).getTime();
  const ms = Math.max(0, new Date(now).getTime() - start);
  return splitMs(ms);
}

export function splitMs(ms: number): Elapsed {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalMs: Math.max(0, ms),
  };
}

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

/** The local calendar date of an instant in a timezone, as YYYY-MM-DD. */
export function localDate(at: Date | number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Local hour (0-23) of an instant in a timezone. */
export function localHour(at: Date | number, timeZone: string): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(new Date(at));
  return Number(h) % 24;
}

/** Offset (ms) of the timezone from UTC at a given instant. */
function tzOffsetMs(at: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const v = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour") % 24, v("minute"), v("second"));
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** The instant of local midnight at the start of `date` in `timeZone` (DST-aware). */
export function zonedMidnight(date: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let ts = guess - tzOffsetMs(guess, timeZone);
  // Second pass corrects for an offset change between the guess and the answer.
  ts = guess - tzOffsetMs(ts, timeZone);
  return new Date(ts);
}

/** Whole calendar days from a to b (b - a), both YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "Mon 30 Nov" for a date-only string. */
export function shortDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const mon = dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return `${wd} ${d} ${mon}`;
}

/** "Mon 30 November" for a date-only string. */
export function longDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const mon = dt.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
  return `${wd} ${d} ${mon}`;
}

export function weekday(at: Date | number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone }).format(new Date(at));
}

/** Day number of a streak: Day 1 starts at the moment of the start (or reset). */
export function streakDay(startedAt: Date | string | number, now: Date | number): number {
  const start = new Date(startedAt).getTime();
  const n = new Date(now).getTime();
  if (n < start) return 0;
  return Math.floor((n - start) / DAY_MS) + 1;
}

/** Length of a challenge in days, inclusive of both ends. */
export function goalLength(startDate: string, endsOn: string): number {
  return daysBetween(startDate, endsOn) + 1;
}

/** The goal ends at local midnight after its last day. Refund date is that day. */
export function goalEndInstant(endsOn: string, timeZone: string): Date {
  return zonedMidnight(addDays(endsOn, 1), timeZone);
}

export type SeasonWindow = { start: Date; end: Date };
export function seasonWindow(startsOn: string, endsOn: string, timeZone: string): SeasonWindow {
  return { start: zonedMidnight(startsOn, timeZone), end: goalEndInstant(endsOn, timeZone) };
}

export type CheckinLike = { localDate: string; status: "held" | "reset" | "shielded" };

/** Days kept: held or shielded check-ins, optionally inside a date window. Resets never remove strokes. */
export function tallyCount(checkins: CheckinLike[], from?: string, to?: string): number {
  return checkins.filter(
    (c) =>
      (c.status === "held" || c.status === "shielded") &&
      (!from || c.localDate >= from) &&
      (!to || c.localDate <= to),
  ).length;
}

/** Milestone reached exactly at this stroke count, if any. */
export function milestoneAt(strokes: number): (typeof MILESTONES)[number] | null {
  return (MILESTONES as readonly number[]).includes(strokes) ? (strokes as (typeof MILESTONES)[number]) : null;
}

/** Board row is paused after two whole days without a check-in. */
export function isPaused(lastCheckin: string | null, today: string): boolean {
  if (!lastCheckin) return true;
  return daysBetween(lastCheckin, today) >= 2;
}

/** Best streak in ms, optionally clipped to a window. */
export function bestStreakMs(
  streaks: { startedAt: string; endedAt: string | null }[],
  now: Date | number,
  window?: SeasonWindow,
): number {
  const n = new Date(now).getTime();
  let best = 0;
  for (const s of streaks) {
    let a = new Date(s.startedAt).getTime();
    let b = s.endedAt ? new Date(s.endedAt).getTime() : n;
    if (window) {
      a = Math.max(a, window.start.getTime());
      b = Math.min(b, window.end.getTime(), n);
    }
    if (b > a) best = Math.max(best, b - a);
  }
  return best;
}

/** Seeded PRNG (mulberry32) for deterministic chalk jitter and locker numbers. */
export function seeded(seed: number | string): () => number {
  let h = typeof seed === "number" ? seed >>> 0 : hashString(seed);
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Two-digit locker number from an avatar seed. */
export function lockerNumber(seed: string): string {
  return pad2(Math.floor(seeded(seed)() * 99) + 1);
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
