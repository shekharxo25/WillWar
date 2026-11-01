import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { StoreError } from "./types";

const NOW = new Date("2026-11-01T06:00:00Z"); // 11:30 in Kolkata
const base = (over: Partial<Parameters<typeof E.completeOnboarding>[0]> = {}) =>
  E.completeOnboarding(
    { handle: "quiet_one", birthDate: "1995-05-05", timezone: "Asia/Kolkata", tone: "steady", why: ["focus"], seasonId: "nnn-2026", endsOn: null, startedAt: NOW.toISOString(), pledgeSigned: true, ...over },
    NOW,
  );
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as StoreError).code;
  }
  return "ok";
};
const later = (h: number) => new Date(NOW.getTime() + h * 3600_000);

describe("onboarding", () => {
  it("blocks under-18 and stores no birth date", () => {
    expect(code(() => base({ birthDate: "2010-01-01" }))).toBe("must_be_18");
    expect(JSON.stringify(base())).not.toContain("1995-05-05");
  });
  it("validates the start range (48h back)", () => {
    expect(code(() => base({ startedAt: later(-49).toISOString(), seasonId: null, endsOn: "2026-12-01" }))).toBe("start_out_of_range");
    expect(code(() => base({ startedAt: later(1).toISOString(), seasonId: null, endsOn: "2026-12-01" }))).toBe("start_out_of_range");
  });
  it("rejects bad end dates", () => {
    expect(code(() => base({ seasonId: null, endsOn: "2026-11-01" }))).toBe("bad_end_date");
    expect(code(() => base({ seasonId: null, endsOn: "2028-01-01" }))).toBe("bad_end_date");
  });
});

describe("check-in and reset", () => {
  it("check-in is idempotent per local day", () => {
    let s = base();
    s = E.checkIn(s, later(1));
    s = E.checkIn(s, later(2));
    expect(s.checkins).toHaveLength(1);
    s = E.checkIn(s, later(24));
    expect(s.checkins).toHaveLength(2);
  });
  it("reset keeps best streak and tally strokes", () => {
    let s = base();
    s = E.checkIn(s, later(1));
    s = E.checkIn(s, later(25));
    const r = E.logReset(s, ["bored"], later(50));
    expect(r.state.streaks).toHaveLength(2);
    expect(r.state.streaks[0].endedAt).not.toBeNull();
    expect(r.state.checkins.filter((c) => c.status === "held")).toHaveLength(2);
    expect(r.state.resets[0].tags).toEqual(["bored"]);
  });
  it("rejects free-text reset tags", () => {
    expect(code(() => E.logReset(base(), ["i did x" as never], NOW))).toBe("bad_tags");
  });
});

describe("shields", () => {
  it("cover a missed day only, never a reset day", () => {
    let s = E.grantShield(base(), "pro_monthly", NOW);
    expect(code(() => E.spendShield(s, "2026-11-01", NOW))).toBe("shield_window");
    s = E.spendShield(s, "2026-11-01", later(24));
    expect(s.checkins[0].status).toBe("shielded");
    expect(code(() => E.spendShield(s, "2026-11-01", later(24)))).toBe("already_recorded");
  });
  it("rewarded shields cap at 2 a week", () => {
    let s = E.grantShield(base(), "rewarded_ad", NOW);
    s = E.grantShield(s, "rewarded_ad", NOW);
    expect(code(() => E.grantShield(s, "rewarded_ad", NOW))).toBe("shield_cap");
  });
});

describe("rounds", () => {
  it("free users can't record Combos", () => {
    const u = { startedAt: NOW.toISOString(), game: "combos" as const, durationS: 180, intensityBefore: 8, intensityAfter: 4, completed: true };
    expect(code(() => E.saveUrgeSession(base(), u, NOW))).toBe("pro_required");
    const pro = { ...base(), entitlement: { plan: "season" as const, status: "active" as const, currentPeriodEnd: later(100).toISOString() } };
    expect(E.saveUrgeSession(pro, u, NOW).urgeSessions).toHaveLength(1);
  });
});

describe("War Chest", () => {
  it("offer only after a held day, once", () => {
    let s = base();
    expect(E.warChestOfferEligible(s, later(1))).toBe(false);
    s = E.checkIn(s, later(1));
    expect(E.warChestOfferEligible(s, later(1))).toBe(true);
    s = E.markWarChestOffered(s, later(1));
    expect(E.warChestOfferEligible(s, later(1))).toBe(false);
  });
  it("never between 23:00 and 06:00 local, never without a pledge", () => {
    let s = E.checkIn(base(), later(1));
    expect(E.warChestOfferEligible(s, new Date("2026-11-01T18:00:00Z"))).toBe(false); // 23:30 IST
    s = E.checkIn(base({ pledgeSigned: false }), later(1));
    expect(E.warChestOfferEligible(s, later(1))).toBe(false);
  });
  it("not within 7 days of a crisis card", () => {
    let s = E.checkIn(base(), later(1));
    s = E.logEvent(s, "crisis_card_shown", later(1));
    expect(E.warChestOfferEligible(s, later(2))).toBe(false);
  });
  it("steady forfeits 25% per reset, never more than the amount", () => {
    let s = E.createPromiseChest(base(), 49900, "INR", "steady", "placeholder-in", NOW);
    const forfeits: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = E.logReset(s, [], later(i + 1));
      forfeits.push(r.forfeit);
      s = r.state;
    }
    expect(forfeits).toEqual([12475, 12475, 12475, 12475, 0, 0]);
    expect(s.warChest!.forfeitedMinor).toBe(49900);
  });
  it("strict forfeits everything on the first reset", () => {
    const s = E.createPromiseChest(base(), 49900, "INR", "strict", "placeholder-in", NOW);
    expect(E.logReset(s, [], later(1)).forfeit).toBe(49900);
  });
  it("amount caps", () => {
    expect(code(() => E.createPromiseChest(base(), 4800, "INR", "steady", "placeholder-in", NOW))).toBe("chest_amount_range");
    expect(code(() => E.createPromiseChest(base(), 10100, "USD", "steady", "placeholder-in", NOW))).toBe("chest_amount_range");
    expect(code(() => E.createPromiseChest(base(), 4900, "INR", "steady", "nope", NOW))).toBe("bad_cause");
  });
  it("promise cancels any time; stake only in 24h", () => {
    const s = E.createPromiseChest(base(), 49900, "INR", "steady", "placeholder-in", NOW);
    expect(E.cancelWarChest(s, later(100)).result).toBe("cancelled");
    const stake = { ...s, warChest: { ...s.warChest!, mode: "stake" as const, coolingOffUntil: later(24).toISOString() } };
    expect(E.cancelWarChest(stake, later(23)).result).toBe("refund_pending");
    expect(code(() => E.cancelWarChest(stake, later(25)))).toBe("locked_until_goal_end");
  });
  it("promise chests settle when the goal ends", () => {
    const s = E.createPromiseChest(base(), 49900, "INR", "steady", "placeholder-in", NOW);
    const after = E.closeFinishedGoal(s, new Date("2026-12-01T00:00:00Z"));
    expect(after.goal!.closedAt).not.toBeNull();
    expect(after.warChest!.status).toBe("settled");
  });
});

describe("camps", () => {
  it("free users own one camp; nudges cap at 3 a day", () => {
    const r = E.createCamp(base(), "Night shift", "nnn-2026", NOW);
    expect(code(() => E.createCamp(r.state, "Second", null, NOW))).toBe("pro_required");
    let s = r.state;
    for (let i = 0; i < 3; i++) s = E.sendNudge(s, r.id, "demo-dev", "proud_of_you", NOW);
    expect(code(() => E.sendNudge(s, r.id, "demo-dev", "proud_of_you", NOW))).toBe("rate_limited");
    expect(code(() => E.sendNudge(s, r.id, s.profile.id, "proud_of_you", NOW))).toBe("self_nudge");
  });
  it("private users never appear on boards", () => {
    const r = E.createCamp(base(), "Night shift", null, NOW);
    expect(E.campLeaderboard(r.state, r.id, NOW).some((x) => x.isMe)).toBe(true);
    const p = E.updatePreferences(r.state, { leaderboardVisibility: "private" });
    expect(E.campLeaderboard(p, r.id, NOW).some((x) => x.isMe)).toBe(false);
  });
  it("rejects slurs in camp names", () => {
    expect(code(() => E.createCamp(base(), "porn club", null, NOW))).toBe("name_not_allowed");
  });
});
