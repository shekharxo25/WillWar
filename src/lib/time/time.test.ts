import { describe, expect, it } from "vitest";
import { addDays, bestStreakMs, daysBetween, elapsed, isPaused, localDate, localHour, milestoneAt, seasonWindow, shortDate, streakDay, tallyCount, zonedMidnight } from ".";

describe("zonedMidnight", () => {
  it("Kolkata (no DST)", () => {
    expect(zonedMidnight("2026-11-01", "Asia/Kolkata").toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });
  it("New York on the 1 Nov 2026 DST change (midnight is still EDT)", () => {
    expect(zonedMidnight("2026-11-01", "America/New_York").toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(zonedMidnight("2026-11-02", "America/New_York").toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });
  it("London after its October change (GMT)", () => {
    expect(zonedMidnight("2026-11-01", "Europe/London").toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
  it("New York 1 Nov is a 25-hour day", () => {
    const a = zonedMidnight("2026-11-01", "America/New_York").getTime();
    const b = zonedMidnight("2026-11-02", "America/New_York").getTime();
    expect((b - a) / 3600_000).toBe(25);
  });
});

describe("localDate and localHour", () => {
  const t = new Date("2026-11-01T03:30:00Z");
  it("differs per zone", () => {
    expect(localDate(t, "Asia/Kolkata")).toBe("2026-11-01");
    expect(localDate(t, "America/New_York")).toBe("2026-10-31");
    expect(localDate(t, "Europe/London")).toBe("2026-11-01");
    expect(localHour(t, "Asia/Kolkata")).toBe(9);
  });
  it("New York 01:30 happens twice on 1 Nov; both are 1 Nov", () => {
    expect(localDate(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe("2026-11-01");
    expect(localDate(new Date("2026-11-01T06:30:00Z"), "America/New_York")).toBe("2026-11-01");
  });
});

describe("season window", () => {
  it("spans 30 local days in each zone", () => {
    for (const tz of ["Asia/Kolkata", "America/New_York", "Europe/London"]) {
      const w = seasonWindow("2026-11-01", "2026-11-30", tz);
      const days = (w.end.getTime() - w.start.getTime()) / 86400_000;
      expect(days).toBeCloseTo(tz === "America/New_York" ? 30 + 1 / 24 : 30, 5);
    }
  });
});

describe("elapsed and day numbers", () => {
  it("splits", () => {
    const e = elapsed("2026-11-01T00:00:00Z", new Date("2026-11-13T04:31:08Z"));
    expect([e.days, e.hours, e.minutes, e.seconds]).toEqual([12, 4, 31, 8]);
  });
  it("is right after the phone sleeps (computed, not counted)", () => {
    const start = "2026-11-01T00:00:00Z";
    expect(elapsed(start, new Date("2026-11-02T00:00:01Z")).days).toBe(1);
  });
  it("Day 1 starts now", () => {
    const now = new Date("2026-11-05T10:00:00Z");
    expect(streakDay(now, now)).toBe(1);
    expect(streakDay("2026-11-01T10:00:00Z", now)).toBe(5);
  });
});

describe("tally, milestones, paused", () => {
  const c = [
    { localDate: "2026-11-01", status: "held" as const },
    { localDate: "2026-11-02", status: "shielded" as const },
    { localDate: "2026-11-03", status: "reset" as const },
    { localDate: "2026-11-04", status: "held" as const },
  ];
  it("counts held and shielded; resets keep strokes", () => {
    expect(tallyCount(c)).toBe(3);
    expect(tallyCount(c, "2026-11-02", "2026-11-30")).toBe(2);
  });
  it("milestones", () => {
    expect(milestoneAt(7)).toBe(7);
    expect(milestoneAt(8)).toBeNull();
    expect(milestoneAt(30)).toBe(30);
  });
  it("paused after two days", () => {
    expect(isPaused("2026-11-04", "2026-11-05")).toBe(false);
    expect(isPaused("2026-11-04", "2026-11-06")).toBe(true);
    expect(isPaused(null, "2026-11-06")).toBe(true);
  });
  it("date helpers", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(daysBetween("2026-11-01", "2026-11-30")).toBe(29);
    expect(shortDate("2026-11-30")).toBe("Mon 30 Nov");
    expect(shortDate("2026-12-01")).toBe("Tue 1 Dec");
  });
  it("best streak clipped to a window", () => {
    const s = [
      { startedAt: "2026-10-25T00:00:00Z", endedAt: "2026-11-03T00:00:00Z" },
      { startedAt: "2026-11-03T00:00:00Z", endedAt: null },
    ];
    const w = seasonWindow("2026-11-01", "2026-11-30", "Europe/London");
    const now = new Date("2026-11-04T12:00:00Z");
    expect(bestStreakMs(s, now) / 86400_000).toBeCloseTo(9, 5);
    expect(bestStreakMs(s, now, w) / 86400_000).toBeCloseTo(2, 5);
  });
});
