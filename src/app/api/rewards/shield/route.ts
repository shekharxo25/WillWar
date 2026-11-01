import { cloudEnabled } from "@/lib/config/flags";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";

/**
 * Grants a streak shield after the rewarded-ad callback. The database caps rewarded
 * shields at 2 a week (grant_rewarded_shield raises shield_cap).
 */
export async function POST() {
  if (!cloudEnabled()) return Response.json({ device: true });
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "not_authenticated" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "no_database" }, { status: 503 });
  const { error } = await db.rpc("grant_rewarded_shield", { p_user: userId });
  if (error) {
    const code = /shield_cap/.test(error.message) ? "shield_cap" : "shield_failed";
    return Response.json({ error: code }, { status: code === "shield_cap" ? 429 : 500 });
  }
  return Response.json({ ok: true });
}
