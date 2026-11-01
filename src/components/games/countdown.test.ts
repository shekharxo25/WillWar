import { describe, expect, it } from "vitest";
import { activeMs, display, pauseClock, phaseOf, remainingMs, resumeClock, startClock, ROUND_MS } from "./countdown";

describe("round countdown", () => {
  it("starts at 3:00", () => {
    const c = startClock(1000);
    expect(display(remainingMs(c, 1000))).toEqual({ m: 3, s: 0 });
    expect(display(remainingMs(c, 1001))).toEqual({ m: 3, s: 0 });
    expect(display(remainingMs(c, 2000))).toEqual({ m: 2, s: 59 });
  });
  it("pause freezes time; resume continues where it stopped", () => {
    let c = startClock(0);
    c = pauseClock(c, 10_000);
    expect(activeMs(c, 60_000)).toBe(10_000);
    c = pauseClock(c, 20_000); // second pause is a no-op
    c = resumeClock(c, 70_000);
    expect(activeMs(c, 75_000)).toBe(15_000);
    c = resumeClock(c, 80_000); // resume while running is a no-op
    expect(remainingMs(c, 80_000)).toBe(ROUND_MS - 20_000);
  });
  it("amber in the last 30 seconds", () => {
    const c = startClock(0);
    expect(phaseOf(remainingMs(c, 149_999))).toBe("on");
    expect(phaseOf(remainingMs(c, 150_000))).toBe("warn");
    expect(phaseOf(remainingMs(c, 179_999))).toBe("warn");
  });
  it("completes at 0:00 and never goes negative", () => {
    const c = startClock(0);
    expect(phaseOf(remainingMs(c, ROUND_MS))).toBe("done");
    expect(remainingMs(c, ROUND_MS * 3)).toBe(0);
    expect(display(remainingMs(c, ROUND_MS + 5000))).toEqual({ m: 0, s: 0 });
  });
  it("is right after a long sleep (computed from timestamps)", () => {
    const c = startClock(0);
    expect(remainingMs(c, 100_000)).toBe(80_000);
  });
});
