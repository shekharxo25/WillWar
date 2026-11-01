import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { checkHandle, checkCampName } = await import("@/lib/server/names");
const { safeEqual, cronAuthorized } = await import("@/lib/server/cron");
const { rateLimit, _resetRateLimits } = await import("@/lib/server/rate-limit");
const { issueRefunds, mockRefund } = await import("@/lib/server/refunds");

describe("handle screening", () => {
  it("format, reserved and blocked names", () => {
    expect(checkHandle("quiet_one")).toEqual({ ok: true });
    expect(checkHandle("ab")).toEqual({ ok: false, reason: "format" });
    expect(checkHandle("Upper")).toEqual({ ok: false, reason: "format" });
    expect(checkHandle("system")).toEqual({ ok: false, reason: "reserved" });
    expect(checkHandle("p0rn_king")).toEqual({ ok: false, reason: "not_allowed" });
    expect(checkHandle("willwar_team")).toEqual({ ok: false, reason: "not_allowed" });
    expect(checkHandle("spicy_essex")).toEqual({ ok: true }); // no Scunthorpe false positives for these
    expect(checkCampName("Night shift")).toBe(true);
    expect(checkCampName("f u c k camp")).toBe(false);
  });
});

describe("cron auth", () => {
  it("constant-time compare and refusal without a secret", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    const req = (h?: string) => new Request("http://x/api/cron", { method: "POST", headers: h ? { "x-cron-secret": h } : {} });
    vi.stubEnv("CRON_SECRET", "");
    expect(cronAuthorized(req("anything"))).toBe(false);
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(cronAuthorized(req("s3cret"))).toBe(true);
    expect(cronAuthorized(req("wrong"))).toBe(false);
    expect(cronAuthorized(req())).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("rate limit", () => {
  it("allows the limit then refuses until the window resets", () => {
    _resetRateLimits();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, t).ok).toBe(false);
    expect(rateLimit("k", 3, 1000, t + 1001).ok).toBe(true);
  });
});

describe("refunds", () => {
  it("uses the chest id as idempotency key, records successes, keeps failures for retry", async () => {
    const recorded: [string, string, number][] = [];
    const calls: string[] = [];
    const flaky = async (ref: string, amt: number, key: string) => {
      calls.push(key);
      if (key === "bad") throw new Error("boom");
      return mockRefund(ref, amt, key);
    };
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await issueRefunds(
      [
        { war_chest_id: "c1", payment_ref: "pay_1", refund_minor: 37425, refund_currency: "INR" },
        { war_chest_id: "bad", payment_ref: "pay_2", refund_minor: 100, refund_currency: "INR" },
        { war_chest_id: "zero", payment_ref: "pay_3", refund_minor: 0, refund_currency: "INR" },
      ],
      async (c, id, a) => {
        recorded.push([c, id, a]);
      },
      flaky,
    );
    err.mockRestore();
    expect(r).toEqual({ refunded: ["c1"], failed: ["bad"] });
    expect(recorded).toEqual([["c1", "rfnd_mock_c1", 37425]]);
    expect(calls).toEqual(["c1", "bad"]);
  });
});
