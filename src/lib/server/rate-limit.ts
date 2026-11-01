import "server-only";
import { fail } from "./http";

/**
 * Fixed-window rate limiter, in memory per Worker isolate. It blunts bursts from one client;
 * it is not a global quota (isolates don't share memory). Durable limits that matter
 * (nudges, shields, coach turns) are enforced in the database.
 * Keys are hashed client addresses, never stored or logged.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientKey(req: Request): string {
  const h = req.headers;
  const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  let x = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    x ^= ip.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return (x >>> 0).toString(36);
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterS: number } {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterS: 0 };
  }
  b.count++;
  if (b.count > limit) return { ok: false, retryAfterS: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterS: 0 };
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function limited(req: Request, route: string, limit = 20, windowMs = 60_000): Response | null {
  const r = rateLimit(`${route}:${clientKey(req)}`, limit, windowMs);
  if (r.ok) return null;
  return fail("rate_limited", 429, { retryAfter: r.retryAfterS });
}

/** Test helper. */
export function _resetRateLimits() {
  buckets.clear();
}
