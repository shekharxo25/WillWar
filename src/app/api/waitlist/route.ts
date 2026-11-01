import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Cloudflare's published always-pass test secret, used only when no real secret is configured.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  token: z.string().max(4096).default(""),
  source: z.string().max(40).optional(),
});

// Simple per-isolate rate limit: 5 requests per IP per minute.
const hits = new Map<string, number[]>();
function limited(ip: string, now: number): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || TEST_SECRET;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token || "XXXX.DUMMY.TOKEN.XXXX");
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Without a real secret (local dev, offline) accept; with one, fail closed.
    return !process.env.TURNSTILE_SECRET_KEY;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip, Date.now())) return Response.json({ error: "rate_limited" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_email" }, { status: 400 });

  if (!(await verifyTurnstile(parsed.data.token, ip === "local" ? null : ip))) {
    return Response.json({ error: "verification_failed" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  if (admin) {
    const { error } = await admin
      .from("waitlist")
      .upsert({ email: parsed.data.email, source: parsed.data.source ?? "landing" }, { onConflict: "email", ignoreDuplicates: true });
    if (error) return Response.json({ error: "unavailable" }, { status: 503 });
  }
  // Device mode: accept and store nothing. Never log the email.
  return Response.json({ ok: true });
}
