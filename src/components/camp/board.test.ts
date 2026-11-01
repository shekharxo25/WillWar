import { describe, expect, it } from "vitest";
import type { BoardRow } from "@/lib/store/types";
import { challengeLabel, formatMetric, rankBoard } from "./board";

const row = (handle: string, cur: number, best: number, days: number, last: string | null, isMe = false): BoardRow => ({
  memberId: handle, handle, avatarSeed: handle, currentStreakS: cur, bestStreakS: best, daysKept: days, lastCheckin: last, isBacked: false, isMe,
});

describe("board", () => {
  const rows = [row("a", 3 * 86400, 9 * 86400, 10, "2026-11-10"), row("b", 12 * 86400, 12 * 86400, 12, "2026-11-08"), row("me", 3 * 86400, 5 * 86400, 4, "2026-11-11", true)];
  it("ranks by metric with shared ranks for ties", () => {
    const r = rankBoard(rows, "current", "2026-11-11");
    expect(r.map((x) => [x.handle, x.rank])).toEqual([["b", 1], ["a", 2], ["me", 2]]);
    expect(rankBoard(rows, "days", "2026-11-11")[0].handle).toBe("b");
  });
  it("marks rows paused after two days without a check-in", () => {
    const r = rankBoard(rows, "best", "2026-11-11");
    expect(r.find((x) => x.handle === "b")!.paused).toBe(true);
    expect(r.find((x) => x.handle === "a")!.paused).toBe(false);
  });
  it("formats values as days, hours under a day", () => {
    expect(formatMetric(row("x", 5 * 3600, 0, 0, null), "current")).toEqual({ value: "5", unit: "h" });
    expect(formatMetric(row("x", 12 * 86400 + 100, 0, 0, null), "current")).toEqual({ value: "12", unit: "d" });
    expect(formatMetric(row("x", 0, 0, 7, null), "days")).toEqual({ value: "7", unit: "d" });
  });
  it("labels challenges", () => {
    expect(challengeLabel({ id: "c", campId: "x", kind: "first_to_days", targetDays: 14, startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-11-20T12:00:00Z" }, "Asia/Kolkata")).toBe("First to 14 days, ends Fri 20 Nov");
  });
});
