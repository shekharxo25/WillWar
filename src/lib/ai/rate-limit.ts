/**
 * Small in-memory limiter for AI routes. Per isolate on Workers, so it is a
 * best-effort guard, not an accounting system (noted in docs/DECISIONS.md by the parent).
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function hit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; remaining: number } {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, remaining: limit - 1 };
  }
  b.count++;
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count) };
}

export function clientKey(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}

/** Coach turns per user per UTC day (20). In-memory until a counter table exists. */
export const COACH_TURNS_PER_DAY = 20;
export function coachTurn(userKey: string, now = Date.now()): { ok: boolean; remaining: number } {
  const day = new Date(now).toISOString().slice(0, 10);
  const end = Date.parse(`${day}T00:00:00Z`) + 86400_000;
  return hit(`coach:${userKey}:${day}`, COACH_TURNS_PER_DAY, end - now, now);
}
