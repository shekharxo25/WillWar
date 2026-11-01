import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createRefund, RazorpayError, safeEqual, secretMatches, verifyWebhookSignature } from "./razorpay";

const secret = "whsec_test_123";
const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 14900 } } } });
const sign = (b: string, s = secret) => createHmac("sha256", s).update(b).digest("hex");

describe("webhook signatures", () => {
  it("accepts a correctly signed body", async () => {
    expect(await verifyWebhookSignature(body, sign(body), secret)).toBe(true);
  });
  it("rejects a tampered body, a wrong secret and a missing header", async () => {
    expect(await verifyWebhookSignature(body.replace("14900", "1"), sign(body), secret)).toBe(false);
    expect(await verifyWebhookSignature(body, sign(body, "other"), secret)).toBe(false);
    expect(await verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(await verifyWebhookSignature(body, "not-hex", secret)).toBe(false);
  });
  it("compares in constant time and checks shared secrets", async () => {
    expect(safeEqual("abcd", "abcd")).toBe(true);
    expect(safeEqual("abcd", "abce")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(await secretMatches("a-long-cron-secret", "a-long-cron-secret")).toBe(true);
    expect(await secretMatches("guess", "a-long-cron-secret")).toBe(false);
    expect(await secretMatches(null, "a-long-cron-secret")).toBe(false);
  });
});

describe("refunds", () => {
  it("sends the amount, idempotency key and basic auth", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ id: "rfnd_1", status: "processed" }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await createRefund(fakeFetch, { keyId: "rzp_test", keySecret: "s" }, { paymentId: "pay_1", amountMinor: 37425, idempotencyKey: "chest-1", notes: { war_chest_id: "chest-1" } });
    expect(r.id).toBe("rfnd_1");
    const s = seen as unknown as { url: string; init: RequestInit };
    expect(s.url).toBe("https://api.razorpay.com/v1/payments/pay_1/refund");
    const headers = s.init.headers as Record<string, string>;
    expect(headers["X-Refund-Idempotency"]).toBe("chest-1");
    expect(headers.authorization).toBe(`Basic ${btoa("rzp_test:s")}`);
    expect(JSON.parse(String(s.init.body))).toMatchObject({ amount: 37425 });
  });
  it("throws a typed error on failure", async () => {
    const failing = (async () => new Response("{}", { status: 400 })) as unknown as typeof fetch;
    await expect(createRefund(failing, { keyId: "k", keySecret: "s" }, { paymentId: "p", amountMinor: 1, idempotencyKey: "i", notes: {} })).rejects.toBeInstanceOf(RazorpayError);
  });
});
