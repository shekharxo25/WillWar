import { fail, handleError, ok } from "@/lib/http";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";

// Grants a streak shield after an opt-in rewarded break. Capped at 2 per week in the database.
export async function POST() {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const { error } = await getAdminSupabase().rpc("grant_shield", { p_user: auth.user.id, p_source: "rewarded_ad" });
    if (error?.message.includes("shield_cap")) return fail(429, "shield_cap", "You've earned two shields this week.");
    if (error) throw new Error("grant_failed");
    return ok({ granted: true });
  } catch (e) {
    return handleError("rewards/shield", e);
  }
}
