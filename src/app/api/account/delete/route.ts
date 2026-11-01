import { z } from "zod";
import { fail, handleError, ok } from "@/lib/http";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";

const body = z.object({ confirm: z.literal("delete") });

// Deletes the auth user; every personal row cascades. A paid War Chest stake must be
// refunded first (war-chest.md rule 9), so deletion waits while one is active.
export async function POST(request: Request) {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "confirm_required", "Type delete to confirm.");

    const admin = getAdminSupabase();
    const { data: stakes, error } = await admin
      .from("war_chests")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("mode", "stake")
      .in("status", ["active", "settling"]);
    if (error) throw new Error("stake_lookup_failed");
    if ((stakes ?? []).length > 0) {
      return fail(409, "refund_first", "We're returning your War Chest first. Try again in a few minutes.");
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(auth.user.id);
    if (delErr) throw new Error("delete_failed");
    return ok({ deleted: true });
  } catch (e) {
    return handleError("account/delete", e);
  }
}
