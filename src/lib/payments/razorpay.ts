// Razorpay over plain fetch + Web Crypto, so it runs on Cloudflare Workers.
// Pure functions with an injected fetch for tests. Notes carry only internal ids.

const API = "https://api.razorpay.com/v1";

export interface RazorpayCreds {
  keyId: string;
  keySecret: string;
}

type Fetch = typeof fetch;

function authHeader(c: RazorpayCreds) {
  return `Basic ${btoa(`${c.keyId}:${c.keySecret}`)}`;
}

async function call<T>(f: Fetch, c: RazorpayCreds, path: string, body: unknown, extra: Record<string, string> = {}): Promise<T> {
  const res = await f(`${API}${path}`, {
    method: "POST",
    headers: { authorization: authHeader(c), "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new RazorpayError(res.status, path);
  return (await res.json()) as T;
}

export class RazorpayError extends Error {
  constructor(
    public readonly status: number,
    path: string,
  ) {
    super(`razorpay_${status}:${path}`);
    this.name = "RazorpayError";
  }
}

export function createOrder(
  f: Fetch,
  c: RazorpayCreds,
  o: { amountMinor: number; currency: "INR" | "USD"; receipt: string; notes: Record<string, string> },
) {
  return call<{ id: string; amount: number; currency: string }>(f, c, "/orders", {
    amount: o.amountMinor,
    currency: o.currency,
    receipt: o.receipt.slice(0, 40),
    notes: o.notes,
  });
}

export function createSubscription(f: Fetch, c: RazorpayCreds, s: { planId: string; notes: Record<string, string> }) {
  return call<{ id: string }>(f, c, "/subscriptions", { plan_id: s.planId, total_count: 10, customer_notify: 1, notes: s.notes });
}

/** Partial refund of a captured payment; the idempotency key makes retries safe. */
export function createRefund(
  f: Fetch,
  c: RazorpayCreds,
  r: { paymentId: string; amountMinor: number; idempotencyKey: string; notes: Record<string, string> },
) {
  return call<{ id: string; status: string }>(
    f,
    c,
    `/payments/${encodeURIComponent(r.paymentId)}/refund`,
    { amount: r.amountMinor, speed: "normal", notes: r.notes },
    { "X-Refund-Idempotency": r.idempotencyKey },
  );
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison of two hex strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** X-Razorpay-Signature = HMAC-SHA256(raw body, webhook secret), hex. */
export async function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  return safeEqual(await hmacHex(secret, rawBody), signature.toLowerCase());
}

/** Constant-time compare for shared secrets such as CRON_SECRET. */
export async function secretMatches(given: string | null, expected: string): Promise<boolean> {
  if (!given) return false;
  const [a, b] = await Promise.all([hmacHex("willwar-compare", given), hmacHex("willwar-compare", expected)]);
  return safeEqual(a, b);
}
