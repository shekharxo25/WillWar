import "server-only";

/** Constant-time string compare (no early exit on the first differing byte). */
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

/** Cron routes require the x-cron-secret header to equal CRON_SECRET. No secret set: always refused. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("x-cron-secret");
  if (!secret || !got) return false;
  return safeEqual(got, secret);
}
