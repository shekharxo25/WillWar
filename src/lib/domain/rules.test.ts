import { describe, expect, it } from "vitest";
import { CURRENT_SEASON } from "./constants";
import {
  averageDrop,
  bestStreakMs,
  forfeitFor,
  formatMoney,
  handleError,
  isAdult,
  isPaused,
  resolveGoalEnd,
  RuleError,
  shieldableDays,
  shieldError,
  startWindow,
  validChestAmount,
  warChestOfferEligible,
  type OfferState,
} from "./rules";
import { MS_DAY, MS_HOUR } from "@/lib/time";

describe("age gate", () => {
  it("accepts the 18th birthday and rejects the day before", () => {
    expect(isAdult("2008-11-01", "2026-11-01")).toBe(true);
    expect(isAdult("2008-11-02", "2026-11-01")).toBe(false);
  });
});

describe("handles", () => {
  it("allows 3–20 lowercase letters, numbers and underscores", () => {
    expect(handleError("quiet_mile")).toBeNull();
    expect(handleError("@QuietMile")).toBeNull();
    expect(handleError("ab")).not.toBeNull();
    expect(handleError("has space")).not.toBeNull();
    expect(handleError("a".repeat(21))).not.toBeNull();
  });
});

describe("start window", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  it("allows back to the season start once the season is running", () => {
    const seasonStart = new Date("2026-10-31T18:30:00Z");
    const w = startWindow(now, seasonStart);
    expect(w.min).toEqual(seasonStart);
    expect(w.max).toEqual(now);
  });
  it("allows 48 hours back without a season", () => {
    const w = startWindow(now, null);
    expect(now.getTime() - w.min.getTime()).toBe(48 * MS_HOUR);
  });
  it("allows the future season start before the season", () => {
    const early = new Date("2026-10-31T10:00:00Z");
    const seasonStart = new Date("2026-10-31T18:30:00Z");
    expect(startWindow(early, seasonStart).max).toEqual(seasonStart);
  });
});

describe("goal end", () => {
  it("uses the season end for a season goal", () => {
    expect(resolveGoalEnd({ seasonId: "nnn-2026", endsOn: null }, CURRENT_SEASON, "2026-11-03")).toBe("2026-11-30");
  });
  it("rejects a finished season and bad custom dates", () => {
    expect(() => resolveGoalEnd({ seasonId: "nnn-2026", endsOn: null }, CURRENT_SEASON, "2026-12-01")).toThrow(
      RuleError,
    );
    expect(() => resolveGoalEnd({ seasonId: null, endsOn: "2026-11-03" }, null, "2026-11-03")).toThrow("bad_end_date");
    expect(() => resolveGoalEnd({ seasonId: null, endsOn: "2028-01-01" }, null, "2026-11-03")).toThrow("bad_end_date");
  });
});

describe("War Chest forfeits", () => {
  it("Steady forfeits floor(amount/4) per reset until nothing is left", () => {
    const chest = { forfeitRule: "steady" as const, amountMinor: 49_900, forfeitedMinor: 0 };
    const seq: number[] = [];
    for (let i = 0; i < 6; i++) {
      const f = forfeitFor(chest);
      seq.push(f);
      chest.forfeitedMinor += f;
    }
    expect(seq).toEqual([12_475, 12_475, 12_475, 12_475, 0, 0]);
    expect(chest.forfeitedMinor).toBe(49_900);
  });
  it("Steady takes the remainder when it is smaller than a quarter", () => {
    expect(forfeitFor({ forfeitRule: "steady", amountMinor: 9_901, forfeitedMinor: 7_425 })).toBe(2_475);
    expect(forfeitFor({ forfeitRule: "steady", amountMinor: 9_901, forfeitedMinor: 9_900 })).toBe(1);
  });
  it("Strict forfeits everything on the first reset", () => {
    expect(forfeitFor({ forfeitRule: "strict", amountMinor: 49_900, forfeitedMinor: 0 })).toBe(49_900);
    expect(forfeitFor({ forfeitRule: "strict", amountMinor: 49_900, forfeitedMinor: 49_900 })).toBe(0);
  });
  it("enforces amount caps", () => {
    expect(validChestAmount(4_900, "INR")).toBe(true);
    expect(validChestAmount(4_899, "INR")).toBe(false);
    expect(validChestAmount(500_001, "INR")).toBe(false);
    expect(validChestAmount(10_000, "USD")).toBe(true);
  });
  it("formats money plainly", () => {
    expect(formatMoney(49_900, "INR")).toBe("₹499");
    expect(formatMoney(12_475, "INR")).toBe("₹124.75");
    expect(formatMoney(500, "USD")).toBe("$5");
  });
});

describe("War Chest offer eligibility", () => {
  const base: OfferState = {
    now: new Date("2026-11-02T06:30:00Z"), // 12:00 IST
    timezone: "Asia/Kolkata",
    warChestOfferedAt: null,
    goal: { endsOn: "2026-11-30", pledgeSignedAt: "2026-11-01T00:00:00Z", closedAt: null },
    hasHeldCheckin: true,
    hasChestForGoal: false,
    lastCrisisCardAt: null,
  };
  it("is eligible after a signed pledge and a held day", () => {
    expect(warChestOfferEligible(base)).toBe(true);
  });
  it("is never shown twice", () => {
    expect(warChestOfferEligible({ ...base, warChestOfferedAt: "2026-11-02T00:00:00Z" })).toBe(false);
  });
  it("needs a pledge and a held day", () => {
    expect(warChestOfferEligible({ ...base, goal: { ...base.goal!, pledgeSignedAt: null } })).toBe(false);
    expect(warChestOfferEligible({ ...base, hasHeldCheckin: false })).toBe(false);
  });
  it("needs 7+ days left", () => {
    expect(warChestOfferEligible({ ...base, now: new Date("2026-11-24T06:30:00Z") })).toBe(false);
  });
  it("is quiet between 23:00 and 05:59 local", () => {
    expect(warChestOfferEligible({ ...base, now: new Date("2026-11-02T17:45:00Z") })).toBe(false); // 23:15 IST
    expect(warChestOfferEligible({ ...base, now: new Date("2026-11-02T00:15:00Z") })).toBe(false); // 05:45 IST
    expect(warChestOfferEligible({ ...base, now: new Date("2026-11-02T17:15:00Z") })).toBe(true); // 22:45 IST
  });
  it("waits 7 days after a crisis card", () => {
    expect(
      warChestOfferEligible({ ...base, lastCrisisCardAt: new Date(base.now.getTime() - 6 * MS_DAY) }),
    ).toBe(false);
    expect(
      warChestOfferEligible({ ...base, lastCrisisCardAt: new Date(base.now.getTime() - 8 * MS_DAY) }),
    ).toBe(true);
  });
});

describe("shields", () => {
  const tz = "Asia/Kolkata";
  const streak = { id: "s", startedAt: "2026-10-31T18:30:00Z", endedAt: null };
  it("covers missed days in the last three days inside the open streak", () => {
    const checkins = [{ localDate: "2026-11-09", status: "held" as const }];
    expect(shieldableDays("2026-11-10", streak, checkins, tz)).toEqual(["2026-11-08", "2026-11-07"]);
  });
  it("never covers today, recorded days or days before the streak", () => {
    expect(shieldError("2026-11-10", "2026-11-10", streak, [], tz)).toBe("shield_window");
    expect(shieldError("2026-11-06", "2026-11-10", streak, [], tz)).toBe("shield_window");
    expect(shieldError("2026-10-31", "2026-11-02", streak, [], tz)).toBe("not_in_streak");
    expect(shieldError("2026-11-01", "2026-11-02", null, [], tz)).toBe("not_in_streak");
  });
});

describe("stats", () => {
  const now = new Date("2026-11-20T00:00:00Z");
  it("finds the best streak, clipped to a window", () => {
    const streaks = [
      { id: "a", startedAt: "2026-10-20T00:00:00Z", endedAt: "2026-11-05T00:00:00Z" },
      { id: "b", startedAt: "2026-11-05T00:00:00Z", endedAt: null },
    ];
    expect(bestStreakMs(streaks, now)).toBe(16 * MS_DAY);
    const window = { start: new Date("2026-11-01T00:00:00Z"), end: new Date("2026-12-01T00:00:00Z") };
    expect(bestStreakMs(streaks, now, window)).toBe(15 * MS_DAY);
  });
  it("needs 3 scored sessions for an average drop", () => {
    expect(averageDrop([{ intensityBefore: 8, intensityAfter: 4 }])).toBeNull();
    expect(
      averageDrop([
        { intensityBefore: 8, intensityAfter: 4 },
        { intensityBefore: 6, intensityAfter: 5 },
        { intensityBefore: 7, intensityAfter: null },
        { intensityBefore: 9, intensityAfter: 5 },
      ]),
    ).toBe(3);
  });
  it("pauses after two days without a check-in", () => {
    expect(isPaused("2026-11-08", "2026-11-10", null)).toBe(false);
    expect(isPaused("2026-11-07", "2026-11-10", null)).toBe(true);
  });
});
