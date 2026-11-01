import { aiAdapter } from "@/lib/adapters/ai";
import { CornerContext } from "@/lib/ai/prompts";
import { clientKey, hit } from "@/lib/ai/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { localDate } from "@/lib/time";

/**
 * POST /api/corner: today's corner talk line.
 * Accepts only the allowed context (strict: extra keys such as handle, email or timezone are rejected).
 * Cloud mode: cached per user per local day in `affirmations` (written with the secret key).
 * Device mode: nothing is stored on the server. Never logs line text. Never returns an error line:
 * failures fall back to curated lines inside the adapter.
 */
export async function POST(req: Request) {
  if (!hit(`corner:${clientKey(req)}`, 30, 60_000).ok) return Response.json({ error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = CornerContext.safeParse(body);
  if (!parsed.success) return Response.json({ error: "bad_context" }, { status: 400 });
  const ctx = parsed.data;

  const sb = await supabaseServer();
  if (sb) {
    const { data: auth } = await sb.auth.getUser();
    const user = auth.user;
    if (!user) return Response.json({ error: "not_authenticated" }, { status: 401 });
    const { data: profile } = await sb.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
    const tz = (profile as { timezone?: string } | null)?.timezone ?? "Asia/Kolkata";
    const forDate = localDate(new Date(), tz);
    const { data: cached } = await sb.from("affirmations").select("body, source").eq("for_date", forDate).maybeSingle();
    if (cached) {
      const c = cached as { body: string; source: "model" | "fallback" };
      return Response.json({ text: c.body, source: c.source, cached: true });
    }
    const line = await aiAdapter().cornerLine(ctx, { seed: `${user.id}|${forDate}` });
    const admin = supabaseAdmin();
    if (admin) {
      await admin
        .from("affirmations")
        .upsert({ user_id: user.id, for_date: forDate, body: line.text, source: line.source }, { onConflict: "user_id,for_date", ignoreDuplicates: true });
    }
    return Response.json({ ...line, cached: false });
  }

  // Device mode: no account on the server, nothing stored.
  const line = await aiAdapter().cornerLine(ctx, { seed: `${ctx.weekday}|${ctx.day}` });
  return Response.json({ ...line, cached: false });
}
