import { checkHandle } from "@/lib/server/names";
import { fail, json } from "@/lib/server/http";
import { limited } from "@/lib/server/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET /api/handle?h=quiet_one -> { available, reason? }. Live availability during onboarding. */
export async function GET(req: Request) {
  const tooMany = limited(req, "handle", 60);
  if (tooMany) return tooMany;
  const h = (new URL(req.url).searchParams.get("h") ?? "").toLowerCase();
  const check = checkHandle(h);
  if (!check.ok) return json({ available: false, reason: check.reason });
  const admin = supabaseAdmin();
  if (!admin) return json({ available: true }); // device mode: handles are local
  const { data, error } = await admin.from("profiles").select("id").eq("handle", h).maybeSingle();
  if (error) return fail("server_error", 500);
  return json({ available: !data, reason: data ? "taken" : undefined });
}
