import { fail, handleError } from "@/lib/http";
import { getRequestUser } from "@/lib/supabase/server";

// Everything in the data inventory for the signed-in person, read through RLS so it can
// only ever contain their own rows.
const OWN_TABLES = [
  ["profiles", "id"],
  ["streaks", "user_id"],
  ["checkins", "user_id"],
  ["resets", "user_id"],
  ["urge_sessions", "user_id"],
  ["goals", "user_id"],
  ["shields", "user_id"],
  ["affirmations", "user_id"],
  ["entitlements", "user_id"],
  ["war_chests", "user_id"],
  ["season_members", "user_id"],
  ["push_subscriptions", "user_id"],
] as const;

export async function POST() {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), email: auth.user.email ?? null };
    for (const [table, col] of OWN_TABLES) {
      const { data, error } = await auth.supabase.from(table).select("*").eq(col, auth.user.id);
      out[table] = error ? { error: "unavailable" } : data;
    }
    return new Response(JSON.stringify(out, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="willwar-export.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return handleError("account/export", e);
  }
}
