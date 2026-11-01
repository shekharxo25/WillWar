import { describe, expect, it } from "vitest";
import { TONES } from "@/lib/domain/constants";
import { crisisKind } from "./crisis-terms";
import { FALLBACK_LINES, pickFallbackLine } from "./fallback";
import { bannedTerm, checkCoachText, checkMorningLine, formatProblem, moneyTerm } from "./filters";

describe("output filters", () => {
  it("matches banned stems at the start of words only", () => {
    expect(bannedTerm("Your testosterone rises")).toMatch(/testosteron/);
    expect(bannedTerm("Hormonal changes")).toMatch(/hormon/);
    expect(bannedTerm("A calm, steady evening")).toBeNull();
  });

  it("matches banned words exactly, so 'since' never matches 'sin'", () => {
    expect(bannedTerm("Ever since Monday you've kept going")).toBeNull();
    expect(bannedTerm("It is not a sin")).toMatch(/sin/);
    expect(bannedTerm("You are not weak")).toMatch(/weak/);
  });

  it("allows 'nut' only inside the event's name", () => {
    expect(bannedTerm("Day 3 of No Nut November. Phone out of the bedroom.")).toBeNull();
    expect(bannedTerm("Don't nut tonight")).toMatch(/nut/);
  });

  it("rejects emojis, hashtags, exclamation marks, links and phone numbers", () => {
    expect(formatProblem("Keep going 🌊")).toBe("no emojis");
    expect(formatProblem("Day 4 #discipline")).toBe("no hashtags");
    expect(formatProblem("You've got this!")).toBe("no exclamation marks");
    expect(formatProblem("See https://example.com")).toBe("no URLs");
    expect(formatProblem("Call 1-800-891-4416 now")).toBe("no phone numbers");
  });

  it("keeps money out of morning lines", () => {
    expect(moneyTerm("Your War Chest is safe")).toMatch(/war chest/);
    expect(moneyTerm("Protect your ₹499")).toMatch(/₹/);
    expect(moneyTerm("Stake your evening on a walk")).toMatch(/stake/);
  });

  it("enforces 12 to 40 words", () => {
    expect(checkMorningLine("Day 7. Keep going.")).toEqual({ ok: false, rule: "12 to 40 words (got 4)" });
    expect(checkMorningLine("Day 7. A full week behind you. Put the phone in another room tonight and keep it simple.").ok).toBe(true);
  });

  it("lets the coach talk about the War Chest but not amounts", () => {
    expect(checkCoachText("The War Chest is yours to keep or release.").ok).toBe(true);
    expect(checkCoachText("You'd lose ₹125 if you slip.").ok).toBe(false);
  });
});

describe("curated fallback lines", () => {
  it("every line passes the same rules as model output, for every day it covers", () => {
    for (const line of FALLBACK_LINES) {
      for (const day of [line.from, Math.min(line.to, line.from + 3)]) {
        const text = line.text.replaceAll("{d}", String(day));
        expect(checkMorningLine(text), `${line.tone} ${line.from}-${line.to}: ${text}`).toEqual({ ok: true });
      }
    }
  });

  it("covers every tone for every day from 0 to 60", () => {
    for (const tone of TONES) {
      for (let day = 0; day <= 60; day++) {
        const pool = FALLBACK_LINES.filter((l) => l.tone === tone && day >= l.from && day <= l.to);
        expect(pool.length, `${tone} day ${day}`).toBeGreaterThan(0);
      }
    }
  });

  it("is deterministic for a person and a day", () => {
    const a = pickFallbackLine({ tone: "coach", day: 9, seed: "u1:2026-11-09" });
    expect(pickFallbackLine({ tone: "coach", day: 9, seed: "u1:2026-11-09" })).toBe(a);
    expect(a).toContain("Day 9");
  });
});

describe("crisis pre-screen", () => {
  it.each([
    ["I don't want to be here anymore", "self_harm"],
    ["sometimes I want to end it all", "self_harm"],
    ["I keep wanting to hurt myself", "self_harm"],
    ["I'm 16", "under_18"],
    ["im 15 lol", "under_18"],
    ["I'm 17 years old", "under_18"],
    ["I was abused as a kid", "abuse"],
  ])("flags %j", (input, kind) => {
    expect(crisisKind(input)).toBe(kind);
  });

  it.each(["I'm about to give in", "I'm 12 days in", "I'm 3 weeks into this", "Is this a sin?", "I'm 25"])(
    "doesn't flag %j",
    (input) => {
      expect(crisisKind(input)).toBeNull();
    },
  );
});
