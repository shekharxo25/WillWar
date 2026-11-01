import { describe, expect, it } from "vitest";
import {
  addDays,
  clockAriaLabel,
  diffDays,
  formatClock,
  formatLongDay,
  formatShortDay,
  goalEndInstant,
  localDate,
  milestonesReached,
  MS_DAY,
  MS_HOUR,
  streakDayNumber,
  waterLevel,
  zonedTimeToUtc,
} from "./index";

describe("localDate", () => {
  it("uses the profile timezone, not UTC", () => {
    const at = new Date("2026-10-31T20:00:00Z");
    expect(localDate(at, "Asia/Kolkata")).toBe("2026-11-01"); // 01:30 IST
    expect(localDate(at, "America/New_York")).toBe("2026-10-31"); // 16:00 EDT
    expect(localDate(at, "Europe/London")).toBe("2026-10-31"); // 20:00 GMT
  });
});

describe("zonedTimeToUtc", () => {
  it("handles Asia/Kolkata (+05:30, no DST)", () => {
    expect(zonedTimeToUtc("2026-11-01", "Asia/Kolkata").toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });

  it("handles the 1 Nov 2026 US fall-back (a 25-hour day)", () => {
    const start = zonedTimeToUtc("2026-11-01", "America/New_York");
    const next = zonedTimeToUtc("2026-11-02", "America/New_York");
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z"); // EDT, UTC-4
    expect(next.toISOString()).toBe("2026-11-02T05:00:00.000Z"); // EST, UTC-5
    expect(next.getTime() - start.getTime()).toBe(25 * MS_HOUR);
  });

  it("handles Europe/London after the October change", () => {
    expect(zonedTimeToUtc("2026-11-01", "Europe/London").toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("date arithmetic", () => {
  it("adds and diffs calendar days across months", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(diffDays("2026-11-01", "2026-11-30")).toBe(29);
    expect(diffDays("2026-11-30", "2026-11-01")).toBe(-29);
  });
});

describe("clock formatting", () => {
  it("formats the Tide clock with padded units", () => {
    expect(formatClock(12 * MS_DAY + 4 * MS_HOUR + 31 * 60_000 + 8_000)).toBe("12d 04h 31m 08s");
    expect(formatClock(-5)).toBe("00d 00h 00m 00s");
  });

  it("builds a minute-level screen reader label", () => {
    expect(clockAriaLabel(MS_DAY + 60_000)).toBe("1 day, 0 hours, 1 minute");
  });
});

describe("streaks and milestones", () => {
  it("counts streak days by the local calendar", () => {
    const start = new Date("2026-10-31T18:30:00Z"); // 1 Nov 00:00 IST
    expect(streakDayNumber(start, new Date("2026-11-01T10:00:00Z"), "Asia/Kolkata")).toBe(1);
    expect(streakDayNumber(start, new Date("2026-11-06T19:00:00Z"), "Asia/Kolkata")).toBe(7);
    expect(streakDayNumber(start, new Date("2026-10-31T10:00:00Z"), "Asia/Kolkata")).toBe(0);
  });

  it("reaches milestones on elapsed time", () => {
    expect(milestonesReached(6.9 * MS_DAY)).toEqual([]);
    expect(milestonesReached(7 * MS_DAY)).toEqual([7]);
    expect(milestonesReached(30 * MS_DAY)).toEqual([7, 14, 21, 30]);
  });
});

describe("goal water level", () => {
  it("fills from start to midnight after the last day", () => {
    const tz = "Asia/Kolkata";
    const start = zonedTimeToUtc("2026-11-01", tz);
    expect(goalEndInstant("2026-11-30", tz).toISOString()).toBe("2026-11-30T18:30:00.000Z");
    expect(waterLevel(start, "2026-11-30", tz, start)).toBe(0);
    expect(waterLevel(start, "2026-11-30", tz, new Date(start.getTime() + 15 * MS_DAY))).toBeCloseTo(0.5, 5);
    expect(waterLevel(start, "2026-11-30", tz, new Date("2027-01-01T00:00:00Z"))).toBe(1);
  });
});

describe("day labels", () => {
  it("formats pledge and review dates", () => {
    expect(formatLongDay("2026-11-30")).toBe("Mon 30 November");
    expect(formatShortDay("2026-12-01")).toBe("Tue 1 Dec");
  });
});
