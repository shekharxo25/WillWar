import { describe, expect, it } from "vitest";
import { DeviceEngine, emptyState } from "./device-engine";
import type { OnboardingInput } from "@/lib/domain/types";

function engineAt(iso: string) {
  let now = new Date(iso);
  let n = 0;
  const engine = new DeviceEngine(emptyState(), { now: () => now, id: () => `id-${++n}` });
  return { engine, setNow: (s: string) => (now = new Date(s)) };
}

const onboarding = (over: Partial<OnboardingInput> = {}): OnboardingInput => ({
  handle: "QuietMile",
  birthDate: "2001-11-14",
  timezone: "Asia/Kolkata",
  tone: "steady",
  whyTags: ["focus"],
  seasonId: "nnn-2026",
  endsOn: null,
  startedAt: "2026-10-31T18:30:00.000Z", // 1 Nov 00:00 IST
  ...over,
});

describe("device onboarding", () => {
  it("creates a profile, open streak and season goal without storing the birth date", () => {
    const { engine } = engineAt("2026-11-01T06:00:00Z");
    engine.completeOnboarding(onboarding());
    const snap = engine.snapshot()!;
    expect(snap.profile.handle).toBe("quietmile");
    expect(snap.goal?.endsOn).toBe("2026-11-30");
    expect(snap.openStreak?.startedAt).toBe("2026-10-31T18:30:00.000Z");
    expect(JSON.stringify(engine.state)).not.toContain("2001-11-14");
  });

  it("refuses under-18s and stores nothing", () => {
    const { engine } = engineAt("2026-11-01T06:00:00Z");
    expect(() => engine.completeOnboarding(onboarding({ birthDate: "2009-01-01" }))).toThrow("must_be_18");
    expect(engine.state.profile).toBeNull();
    expect(engine.state.streaks).toHaveLength(0);
  });

  it("rejects starts outside the honor-system window", () => {
    const { engine } = engineAt("2026-11-10T06:00:00Z");
    expect(() =>
      engine.completeOnboarding(onboarding({ seasonId: null, endsOn: "2026-12-10", startedAt: "2026-11-01T00:00:00Z" })),
    ).toThrow("start_out_of_range");
  });
});

describe("device check-ins and resets", () => {
  it("is idempotent per local day and derives the date from the profile timezone", () => {
    const { engine } = engineAt("2026-11-01T19:00:00Z"); // 2 Nov 00:30 IST
    engine.completeOnboarding(onboarding());
    const a = engine.checkIn();
    const b = engine.checkIn();
    expect(a.localDate).toBe("2026-11-02");
    expect(b).toBe(a);
    expect(engine.state.checkins).toHaveLength(1);
  });

  it("refuses to check in before the clock starts", () => {
    const { engine } = engineAt("2026-10-31T10:00:00Z");
    engine.completeOnboarding(onboarding());
    expect(() => engine.checkIn()).toThrow("no_open_streak");
  });

  it("reset closes the streak, starts a new one and keeps history", () => {
    const { engine, setNow } = engineAt("2026-11-01T06:00:00Z");
    engine.completeOnboarding(onboarding());
    setNow("2026-11-05T06:00:00Z");
    expect(engine.logReset(["bored", "bored", "nonsense" as never])).toBe(0);
    const snap = engine.snapshot()!;
    expect(snap.streaks).toHaveLength(2);
    expect(snap.streaks[1].endedAt).toBe("2026-11-05T06:00:00.000Z");
    expect(snap.openStreak?.startedAt).toBe("2026-11-05T06:00:00.000Z");
    expect(engine.state.resets[0].tags).toEqual(["bored"]);
    expect(snap.checkins[0]).toEqual({ localDate: "2026-11-05", status: "reset" });
  });
});

describe("device War Chest (promise mode)", () => {
  function withChest(rule: "steady" | "strict") {
    const ctx = engineAt("2026-11-01T06:00:00Z");
    ctx.engine.completeOnboarding(onboarding());
    ctx.engine.signPledge();
    ctx.engine.checkIn();
    expect(ctx.engine.warChestOfferEligible()).toBe(true);
    ctx.engine.createPromiseChest({
      amountMinor: 49_900,
      currency: "INR",
      forfeitRule: rule,
      causeId: "placeholder-global-water",
    });
    return ctx;
  }

  it("Steady forfeits a quarter per reset and logs promise_forfeit", () => {
    const { engine } = withChest("steady");
    expect(engine.logReset([])).toBe(12_475);
    expect(engine.logReset([])).toBe(12_475);
    const snap = engine.snapshot()!;
    expect(snap.warChest?.forfeitedMinor).toBe(24_950);
    expect(snap.warChestEvents.map((e) => e.kind)).toEqual(["promise_forfeit", "promise_forfeit", "promise_made"]);
  });

  it("Strict forfeits everything on the first reset", () => {
    const { engine } = withChest("strict");
    expect(engine.logReset([])).toBe(49_900);
    expect(engine.logReset([])).toBe(0);
  });

  it("the offer is never eligible twice", () => {
    const { engine } = withChest("steady");
    expect(engine.warChestOfferEligible()).toBe(false);
  });

  it("settles a promise the day after the goal ends", () => {
    const { engine, setNow } = withChest("steady");
    setNow("2026-12-01T06:00:00Z");
    engine.settleDue();
    expect(engine.state.warChests[0].status).toBe("settled");
    expect(engine.snapshot()!.goal).toBeNull();
  });
});

describe("device shields", () => {
  it("caps rewarded shields at two a week and spends the oldest first", () => {
    const { engine, setNow } = engineAt("2026-11-01T06:00:00Z");
    engine.completeOnboarding(onboarding());
    engine.grantRewardedShield();
    engine.grantRewardedShield();
    expect(() => engine.grantRewardedShield()).toThrow("shield_cap");
    setNow("2026-11-04T06:00:00Z");
    engine.useShield("2026-11-02");
    expect(engine.state.shields.filter((s) => s.usedOn)).toHaveLength(1);
    expect(engine.state.checkins.find((c) => c.localDate === "2026-11-02")?.status).toBe("shielded");
  });
});
