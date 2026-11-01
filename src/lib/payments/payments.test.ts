import { describe, expect, it, vi, afterEach } from "vitest";
import { hmacSha256Hex, mockPayments, MOCK_WEBHOOK_SECRET, payments, razorpayAdapter, timingSafeEqual, verifySignature } from "@/lib/adapters/payments";
import { handleEvent, seasonPeriodEnd, type RpcClient } from "./handlers";

const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 14900, currency: "INR", notes: { kind: "season", user_id: "u1" } } } } });

describe("webhook signature", () => {
  it("accepts a valid signature", async () => {
    const sig = await hmacSha256Hex("whsec", body);
    expect(await verifySignature("whsec", body, sig)).toBe(true);
  });
  it("rejects an invalid or missing signature", async () => {
    expect(await verifySignature("whsec", body, "00".repeat(32))).toBe(false);
    expect(await verifySignature("whsec", body, null)).toBe(false);
    expect(await verifySignature("", body, "abc")).toBe(false);
  });
  it("rejects a tampered body", async () => {
    const sig = await hmacSha256Hex("whsec", body);
    expect(await verifySignature("whsec", body.replace("14900", "100"), sig)).toBe(false);
  });
  it("constant-time compare", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
  it("known HMAC vector", async () => {
    // RFC 4231-style check against Node's crypto.
    const { createHmac } = await import("node:crypto");
    expect(await hmacSha256Hex("key", "The quick brown fox")).toBe(createHmac("sha256", "key").update("The quick brown fox").digest("hex"));
  });
});

function fakeDb(seen = new Set<string>()) {
  const calls: { fn: string; args?: Record<string, unknown> }[] = [];
  const db: RpcClient = {
    async rpc(fn, args) {
      calls.push({ fn, args });
      if (fn === "record_webhook_event") {
        const id = String(args?.p_id);
        if (seen.has(id)) return { data: false, error: null };
        seen.add(id);
        return { data: true, error: null };
      }
      return { data: null, error: null };
    },
  };
  return { db, calls };
}

describe("webhook handlers", () => {
  const now = new Date("2026-11-05T10:00:00Z");
  it("is idempotent per event id", async () => {
    const { db, calls } = fakeDb();
    const ev = JSON.parse(body);
    expect(await handleEvent(db, "evt_1", ev, now)).toEqual({ ok: true, action: "season_granted" });
    expect(await handleEvent(db, "evt_1", ev, now)).toEqual({ ok: true, action: "duplicate" });
    expect(calls.filter((c) => c.fn === "apply_entitlement")).toHaveLength(1);
  });
  it("season pass runs to the end of the season in the user's zone", async () => {
    const { db, calls } = fakeDb();
    await handleEvent(db, "evt_2", JSON.parse(body), now);
    const ent = calls.find((c) => c.fn === "apply_entitlement")!;
    expect(ent.args?.p_plan).toBe("season");
    expect(ent.args?.p_period_end).toBe("2026-11-30T18:30:00.000Z");
    expect(seasonPeriodEnd(now, "Asia/Kolkata", true).toISOString()).toBe("2026-12-05T10:00:00.000Z");
  });
  it("routes war chest payments to activate_stake_chest with the paid amount", async () => {
    const { db, calls } = fakeDb();
    const ev = { event: "payment.captured", payload: { payment: { entity: { id: "pay_9", amount: 49900, currency: "INR", notes: { kind: "war_chest", war_chest_id: "c1" } } } } };
    expect(await handleEvent(db, "evt_3", ev, now)).toEqual({ ok: true, action: "stake_activated" });
    expect(calls.at(-1)).toEqual({ fn: "activate_stake_chest", args: { p_chest: "c1", p_payment_ref: "pay_9", p_amount_minor: 49900, p_currency: "INR" } });
  });
  it("maps subscription events to entitlement status", async () => {
    const { db, calls } = fakeDb();
    const sub = (event: string, id: string) => handleEvent(db, id, { event, payload: { subscription: { entity: { id: "sub_1", current_end: 1830000000, notes: { user_id: "u1" } } } } }, now);
    await sub("subscription.activated", "a");
    await sub("subscription.halted", "b");
    await sub("subscription.cancelled", "c");
    expect(calls.filter((c) => c.fn === "apply_entitlement").map((c) => c.args?.p_status)).toEqual(["active", "past_due", "canceled"]);
  });
  it("records refunds and tolerates refund failures", async () => {
    const { db, calls } = fakeDb();
    await handleEvent(db, "r1", { event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1", amount: 37425, notes: { war_chest_id: "c1" } } } } }, now);
    expect(calls.at(-1)?.fn).toBe("record_refund");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await handleEvent(db, "r2", { event: "refund.failed", payload: { refund: { entity: { id: "rfnd_2" } } } }, now)).toEqual({ ok: true, action: "refund_failed_logged" });
    warn.mockRestore();
  });
  it("propagates database errors so the webhook returns 500 and Razorpay retries", async () => {
    const db: RpcClient = { rpc: async (fn) => (fn === "record_webhook_event" ? { data: true, error: null } : { data: null, error: { message: "amount_mismatch" } }) };
    const ev = { event: "payment.captured", payload: { payment: { entity: { id: "p", amount: 1, currency: "INR", notes: { kind: "war_chest", war_chest_id: "c" } } } } };
    await expect(handleEvent(db, "x", ev, now)).rejects.toThrow("amount_mismatch");
  });
});

describe("payments adapter", () => {
  it("uses the mock without keys", async () => {
    const p = payments({});
    expect(p.mock).toBe(true);
    const o = await p.createOrder("season", 14900, "INR", { user_id: "u" });
    expect(o).toMatchObject({ amount: 14900, currency: "INR", notes: { kind: "season", user_id: "u" }, mock: true });
    expect(await p.verifyWebhookSignature(body, await hmacSha256Hex(MOCK_WEBHOOK_SECRET, body))).toBe(true);
    expect((await mockPayments().refund("pay_1", 100, "chest-abcdef12")).id).toBe("rfnd_mock_chest-ab");
  });
  it("uses the real adapter with keys and sends the refund idempotency header", async () => {
    expect(payments({ NEXT_PUBLIC_RAZORPAY_KEY_ID: "k", RAZORPAY_KEY_SECRET: "s", RAZORPAY_WEBHOOK_SECRET: "w" }).mock).toBe(false);
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "rfnd_x", amount: 100 }), { status: 200 }));
    const a = razorpayAdapter("k", "s", "w", fetchImpl as unknown as typeof fetch);
    await a.refund("pay_1", 100, "chest-1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.razorpay.com/v1/payments/pay_1/refund");
    expect((init.headers as Record<string, string>)["X-Refund-Idempotency"]).toBe("chest-1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Basic " + btoa("k:s"));
  });
  it("throws on API errors", async () => {
    const a = razorpayAdapter("k", "s", "w", (async () => new Response("{}", { status: 400 })) as unknown as typeof fetch);
    await expect(a.createOrder("season", 1, "INR", {})).rejects.toThrow("razorpay_400");
  });
});

describe("war chest checkout", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  it("refuses unless stake mode is on", async () => {
    vi.doMock("@/lib/supabase/server", () => ({ currentUserId: async () => "u1" }));
    vi.doMock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => null }));
    for (const mode of ["promise", "off", ""]) {
      vi.stubEnv("NEXT_PUBLIC_WAR_CHEST_MODE", mode);
      const { POST } = await import("@/app/api/war-chest/checkout/route");
      const res = await POST(new Request("http://x/api/war-chest/checkout", { method: "POST", body: "{}" }));
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "stake_mode_off" });
    }
    vi.stubEnv("NEXT_PUBLIC_WAR_CHEST_MODE", "stake");
    const { POST } = await import("@/app/api/war-chest/checkout/route");
    const res = await POST(new Request("http://x/api/war-chest/checkout", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503); // stake mode on, but no database configured
  });
});
