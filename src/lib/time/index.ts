// Pure time helpers. All "local" values are in the profile's IANA timezone, never
// the device's, so a traveller's day matches what the server decides.
import { MILESTONES } from "@/lib/domain/constants";
import type { LocalDate } from "@/lib/domain/types";

export const MS_SECOND = 1_000;
export const MS_MINUTE = 60 * MS_SECOND;
export const MS_HOUR = 60 * MS_MINUTE;
export const MS_DAY = 24 * MS_HOUR;

const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(tz, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function zonedParts(at: Date, tz: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(tz).formatToParts(at)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function toLocalDate(y: number, m: number, d: number): LocalDate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function parseLocalDate(date: LocalDate): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`bad_local_date:${date}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** The calendar date at `at` in `tz`. Mirrors `(now() at time zone tz)::date`. */
export function localDate(at: Date, tz: string): LocalDate {
  const p = zonedParts(at, tz);
  return toLocalDate(p.year, p.month, p.day);
}

export function localHour(at: Date, tz: string): number {
  return zonedParts(at, tz).hour;
}

/** Offset of `tz` from UTC at instant `at`, in ms (positive east of Greenwich). */
export function tzOffsetMs(at: Date, tz: string): number {
  const p = zonedParts(at, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant when the wall clock in `tz` reads `date hh:mm`. Mirrors `timestamp at time zone tz`. */
export function zonedTimeToUtc(date: LocalDate, tz: string, hh = 0, mm = 0): Date {
  const { y, m, d } = parseLocalDate(date);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let t = wall - tzOffsetMs(new Date(wall), tz);
  t = wall - tzOffsetMs(new Date(t), tz);
  return new Date(t);
}

export function addDays(date: LocalDate, n: number): LocalDate {
  const { y, m, d } = parseLocalDate(date);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toLocalDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Whole days from `a` to `b` (b − a). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  const pa = parseLocalDate(a);
  const pb = parseLocalDate(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / MS_DAY);
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export interface ElapsedParts {
  d: number;
  h: number;
  m: number;
  s: number;
}

export function elapsedParts(ms: number): ElapsedParts {
  const total = Math.max(0, Math.floor(ms / MS_SECOND));
  return {
    d: Math.floor(total / 86_400),
    h: Math.floor((total % 86_400) / 3_600),
    m: Math.floor((total % 3_600) / 60),
    s: total % 60,
  };
}

/** "12d 04h 31m 08s" — the Tide clock. */
export function formatClock(ms: number): string {
  const { d, h, m, s } = elapsedParts(ms);
  return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

/** "12d 04h" — leaderboards and stats. */
export function formatDaysHours(ms: number): string {
  const { d, h } = elapsedParts(ms);
  return `${pad(d)}d ${pad(h)}h`;
}

/** Screen-reader clock, updated each minute: "12 days, 4 hours, 31 minutes". */
export function clockAriaLabel(ms: number): string {
  const { d, h, m } = elapsedParts(ms);
  const unit = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
  return `${unit(d, "day")}, ${unit(h, "hour")}, ${unit(m, "minute")}`;
}

/** "Starts in 4h 12m" style countdown pieces. */
export function formatCountdown(ms: number): string {
  const { d, h, m } = elapsedParts(ms);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${Math.max(1, m)}m`;
}

/** Milestone days reached by an elapsed streak duration. */
export function milestonesReached(elapsedMs: number): number[] {
  return MILESTONES.filter((day) => elapsedMs >= day * MS_DAY);
}

/** Day N of a streak by local calendar: the start date is Day 1. */
export function streakDayNumber(startedAt: Date, now: Date, tz: string): number {
  if (now < startedAt) return 0;
  return diffDays(localDate(startedAt, tz), localDate(now, tz)) + 1;
}

/** The instant a goal ends: midnight after its last local day. */
export function goalEndInstant(endsOn: LocalDate, tz: string): Date {
  return zonedTimeToUtc(addDays(endsOn, 1), tz);
}

/** Water level for the Tide: elapsed ÷ (goal end − streak start), clamped to 0..1. */
export function waterLevel(startedAt: Date, endsOn: LocalDate, tz: string, now: Date): number {
  const span = goalEndInstant(endsOn, tz).getTime() - startedAt.getTime();
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (now.getTime() - startedAt.getTime()) / span));
}

const dayLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortDayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function utcNoon(date: LocalDate): Date {
  const { y, m, d } = parseLocalDate(date);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "Mon 30 November" */
export function formatLongDay(date: LocalDate): string {
  return dayLabelFormatter.format(utcNoon(date)).replace(",", "");
}

/** "Tue 1 Dec" */
export function formatShortDay(date: LocalDate): string {
  return shortDayFormatter.format(utcNoon(date)).replace(",", "");
}

/** "Sun 1 Nov, 00:00" in the profile timezone. */
export function formatInstantShort(at: Date, tz: string): string {
  const p = zonedParts(at, tz);
  return `${formatShortDay(toLocalDate(p.year, p.month, p.day))}, ${pad(p.hour)}:${pad(p.minute)}`;
}
