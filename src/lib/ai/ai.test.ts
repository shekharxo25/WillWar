import { describe, expect, it } from "vitest";
import { bannedTerm, checkCornerLine, formatProblem, moneyTerm } from "./filters";
import { screenCrisis } from "./crisis-terms";
import { CORNER_LINES, fallbackLine } from "./fallback";
import { cornerFlow, mockAI, parseCornerDraft, runCoach, type AIAdapter, type CoachEvent } from "./engine";
import { CornerContext } from "./prompts";

const ctx = (over: Partial<CornerContext> = {}): CornerContext => ({
  day: 9, goalDays: 30, seasonName: "No Nut November 2026", tone: "steady", why: ["focus"], checkins7: 6, rounds7: 3, weekday: "Monday", ...over,
});
const collect = async (it: AsyncIterable<CoachEvent>) => {
  const out: CoachEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
};
const fakeAI = (chunks: string[]): AIAdapter => ({
  kind: "mock",
  cornerLine: async () => ({ text: "", source: "fallback" }),
  async *coachStream() {
    for (const c of chunks) yield c;
  },
});

describe("filters", () => {
  it('"since" never matches "sin"; whole words only', () => {
    expect(bannedTerm("Ever since day one you have kept going.")).toBeNull();
    expect(bannedTerm("Is this a sin?")).toBe("sin");
    expect(bannedTerm("Weakness passes.")).toBeNull();
    expect(bannedTerm("You are not weak.")).toBe("weak");
  });
  it("stems match at the start of a word", () => {
    expect(bannedTerm("No hormonal change.")).toBe("hormon");
    expect(bannedTerm("Testosterone talk.")).toBe("testosteron");
    expect(bannedTerm("A stimulating arousal")).toBe("arous");
    expect(bannedTerm("Phormone")).toBeNull();
  });
  it('"nut" only inside "No Nut November"', () => {
    expect(bannedTerm("Day 3 of No Nut November. Keep going.")).toBeNull();
    expect(bannedTerm("Don't nut today.")).toBe("nut");
  });
  it("rejects emoji, hashtags, exclamation marks, URLs and phone numbers", () => {
    expect(formatProblem("Keep going 💪")).toBe("no emojis");
    expect(formatProblem("Keep going #day9")).toBe("no hashtags");
    expect(formatProblem("Keep going!")).toBe("no exclamation marks");
    expect(formatProblem("See willwar.app for more")).toBe("no URLs");
    expect(formatProblem("Call 1800 891 4416")).toBe("no phone numbers");
    expect(formatProblem("Day 12. Phone out of the bedroom tonight.")).toBeNull();
  });
  it("money is off limits", () => {
    expect(moneyTerm("Think of your War Chest.")).not.toBeNull();
    expect(moneyTerm("Your ₹499 is safe")).not.toBeNull();
    expect(moneyTerm("Phone out of the bedroom.")).toBeNull();
  });
  it("12 to 40 words", () => {
    expect(checkCornerLine("Too short.").ok).toBe(false);
    expect(checkCornerLine("Day 9. You've handled nine evenings like this one. Handle tonight the same way.").ok).toBe(true);
  });
});

describe("crisis pre-screen", () => {
  it.each([
    "I want to kill myself",
    "I don't want to be here anymore",
    "thinking about ending it all, end it all",
    "I keep wanting to hurt myself",
    "I cut myself last night",
  ])("flags %s", (t) => expect(screenCrisis(t)).toEqual({ crisis: true, under18: false }));
  it.each(["I'm 15", "im 16", "I am 17 years old", "I'm only 14 and", "i'm 16."])("flags under-18: %s", (t) =>
    expect(screenCrisis(t)).toEqual({ crisis: true, under18: true }),
  );
  it.each([
    "I'm 16 days in and it's hard",
    "I'm 25",
    "I am 19 years old",
    "I'm 7 rounds deep today",
    "this urge will kill me lol, it's at an 8",
    "I'm about to give in",
    "I'm 3 days in",
  ])("doesn't flag %s", (t) => expect(screenCrisis(t).crisis).toBe(false));
});

describe("fallback lines", () => {
  it("has 120 lines, 30 per tone, all passing the filters", () => {
    expect(CORNER_LINES).toHaveLength(120);
    for (const tone of ["steady", "stoic", "coach", "playful"]) expect(CORNER_LINES.filter((l) => l.tone === tone)).toHaveLength(30);
    for (const l of CORNER_LINES) {
      for (const day of [l.minDay, Math.min(l.maxDay, 60)]) {
        const r = checkCornerLine(l.text.replaceAll("{day}", String(day)));
        expect(r, `${l.id}: ${l.text}`).toEqual({ ok: true });
      }
    }
  });
  it("covers every tone for every day 1..40", () => {
    for (const tone of ["steady", "stoic", "coach", "playful"] as const)
      for (let d = 1; d <= 40; d++) expect(CORNER_LINES.some((l) => l.tone === tone && d >= l.minDay && d <= l.maxDay)).toBe(true);
  });
  it("is deterministic per seed", () => {
    expect(fallbackLine(ctx(), "u1|2026-11-09")).toBe(fallbackLine(ctx(), "u1|2026-11-09"));
    expect(fallbackLine(ctx({ day: 1 }), "x")).toMatch(/Day 1/);
  });
});

describe("corner flow", () => {
  const good = JSON.stringify({ text: "Day 9. You've handled nine evenings like this one. Handle tonight the same way." });
  it("accepts a valid draft", async () => {
    const r = await cornerFlow(async () => good, ctx());
    expect(r.source).toBe("model");
  });
  it("retries once with the broken rule, then falls back", async () => {
    const seen: string[] = [];
    const r = await cornerFlow(async (user) => {
      seen.push(user);
      return JSON.stringify({ text: "Stay strong, you are not weak at all, keep going today and every day after that!" });
    }, ctx());
    expect(seen).toHaveLength(2);
    expect(seen[1]).toMatch(/Your last draft broke rule/);
    expect(r.source).toBe("fallback");
  });
  it("falls back on bad JSON and on the deadline", async () => {
    expect((await cornerFlow(async () => "no json here", ctx())).source).toBe("fallback");
    const t0 = Date.now();
    const r = await cornerFlow(() => new Promise<string>(() => {}), ctx(), { deadlineMs: 50 });
    expect(r.source).toBe("fallback");
    expect(Date.now() - t0).toBeLessThan(1000);
  });
  it("parses JSON wrapped in prose", () => {
    expect(parseCornerDraft(`Here: ${good}`).ok).toBe(true);
  });
  it("context schema rejects extra keys", () => {
    expect(CornerContext.safeParse({ ...ctx(), handle: "x" }).success).toBe(false);
    expect(CornerContext.safeParse({ ...ctx(), timezone: "Asia/Kolkata" }).success).toBe(false);
  });
});

describe("coach pipeline", () => {
  it("pre-screens crisis before calling the model", async () => {
    let called = false;
    const ai: AIAdapter = { ...fakeAI([]), async *coachStream() { called = true; yield "x"; } };
    const ev = await collect(runCoach(ai, [{ role: "user", content: "I don't want to be here anymore" }]));
    expect(ev).toEqual([{ type: "crisis", under18: false }]);
    expect(called).toBe(false);
  });
  it("turns [[CRISIS]] from the model into the crisis card", async () => {
    const ev = await collect(runCoach(fakeAI(["[[CRI", "SIS]]"]), [{ role: "user", content: "hello" }]));
    expect(ev).toEqual([{ type: "crisis", under18: false }]);
  });
  it("stops and redirects when a banned term appears, even split across chunks", async () => {
    const ev = await collect(runCoach(fakeAI(["Sure, here is some po", "rn talk"]), [{ role: "user", content: "hello" }]));
    expect(ev.at(-1)).toEqual({ type: "redirect", text: "Let's get you through the next few minutes. Want to start a round?" });
    expect(ev.filter((e) => e.type === "text").map((e) => (e as { text: string }).text).join("")).not.toMatch(/po/);
  });
  it("mock coach follows the rules", async () => {
    const ev = await collect(runCoach(mockAI(), [{ role: "user", content: "Are you a real person?" }]));
    const text = ev.map((e) => (e.type === "text" ? e.text : "")).join("");
    expect(text).toMatch(/AI/);
  });
});
