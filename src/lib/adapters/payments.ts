/**
 * Payments adapter (Part 6.1, 6.8). Razorpay over plain fetch + Web Crypto so it runs on
 * Cloudflare Workers. A mock is used when keys are missing. Server only.
 */
export type OrderKind = "season" | "war_chest";
export type Order = { id: string; amount: number; currency: string; notes: Record<string, string>; mock: boolean };
export type Subscription = { id: string; planId: string; notes: Record<string, string>; mock: boolean };
export type Refund = { id: string; paymentId: string; amount: number; mock: boolean };

export interface PaymentsAdapter {
  readonly mock: boolean;
  readonly keyId: string | null;
  createOrder(kind: OrderKind, amountMinor: number, currency: "INR" | "USD", notes: Record<string, string>): Promise<Order>;
  createSubscription(planId: string, notes: Record<string, string>): Promise<Subscription>;
  verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean>;
  refund(paymentId: string, amountMinor: number, idempotencyKey: string): Promise<Refund>;
}

const enc = new TextEncoder();

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare (leaks length only). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-SHA256 of the raw body with the webhook secret, compared in constant time. */
export async function verifySignature(secret: string, rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature || !secret) return false;
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(expected, signature.trim().toLowerCase());
}

const API = "https://api.razorpay.com/v1";

export function razorpayAdapter(keyId: string, keySecret: string, webhookSecret: string, fetchImpl: typeof fetch = fetch): PaymentsAdapter {
  const auth = "Basic " + btoa(`${keyId}:${keySecret}`);
  async function call<T>(path: string, body: unknown, extra: Record<string, string> = {}): Promise<T> {
    const res = await fetchImpl(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", ...extra },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`razorpay_${res.status}`);
    return (await res.json()) as T;
  }
  return {
    mock: false,
    keyId,
    async createOrder(kind, amountMinor, currency, notes) {
      const allNotes = { ...notes, kind };
      const o = await call<{ id: string; amount: number; currency: string }>("/orders", {
        amount: amountMinor,
        currency,
        receipt: `${kind}_${Date.now()}`,
        notes: allNotes,
      });
      return { id: o.id, amount: o.amount, currency: o.currency, notes: allNotes, mock: false };
    },
    async createSubscription(planId, notes) {
      const allNotes = { ...notes, kind: "annual" };
      const s = await call<{ id: string }>("/subscriptions", { plan_id: planId, total_count: 10, customer_notify: 1, notes: allNotes });
      return { id: s.id, planId, notes: allNotes, mock: false };
    },
    verifyWebhookSignature: (raw, sig) => verifySignature(webhookSecret, raw, sig),
    async refund(paymentId, amountMinor, idempotencyKey) {
      // Idempotent per War Chest id, so a retried settlement never refunds twice.
      const r = await call<{ id: string; amount: number }>(
        `/payments/${encodeURIComponent(paymentId)}/refund`,
        { amount: amountMinor, speed: "normal" },
        { "X-Refund-Idempotency": idempotencyKey },
      );
      return { id: r.id, paymentId, amount: r.amount, mock: false };
    },
  };
}

/** Mock: no network, generated ids. Webhook signatures use a fixed dev secret. */
export const MOCK_WEBHOOK_SECRET = "mock_webhook_secret";

export function mockPayments(): PaymentsAdapter {
  let n = 0;
  const id = (p: string) => `${p}_mock_${Date.now().toString(36)}${(n++).toString(36)}`;
  return {
    mock: true,
    keyId: null,
    async createOrder(kind, amountMinor, currency, notes) {
      return { id: id("order"), amount: amountMinor, currency, notes: { ...notes, kind }, mock: true };
    },
    async createSubscription(planId, notes) {
      return { id: id("sub"), planId, notes: { ...notes, kind: "annual" }, mock: true };
    },
    verifyWebhookSignature: (raw, sig) => verifySignature(MOCK_WEBHOOK_SECRET, raw, sig),
    async refund(paymentId, amountMinor, idempotencyKey) {
      return { id: `rfnd_mock_${idempotencyKey.slice(0, 8)}`, paymentId, amount: amountMinor, mock: true };
    },
  };
}

export function payments(env: Record<string, string | undefined> = process.env): PaymentsAdapter {
  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = env.RAZORPAY_KEY_SECRET;
  const wh = env.RAZORPAY_WEBHOOK_SECRET;
  if (keyId && secret && wh) return razorpayAdapter(keyId, secret, wh);
  return mockPayments();
}
