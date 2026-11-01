import { requireUser } from "@/lib/server/auth";
import { fail, json } from "@/lib/server/http";
import { limited } from "@/lib/server/rate-limit";
import { issueRefunds, type DueRefund } from "@/lib/server/refunds";
import { supabaseAdmin } from "@/lib/supabase/admin";

const REFUND_FIRST = "We're returning your War Chest first. Try again in a few minutes.";

/**
 * POST /api/account/delete. Refunds any live War Chest stake first (what's left after
 * forfeits), then deletes the auth user; every user table cascades. The money ledger
 * survives by design (no user identity in it).
 */
export async function POST(req: Request) {
  const tooMany = limited(req, "delete", 5);
  if (tooMany) return tooMany;
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const admin = supabaseAdmin();
  if (!admin) return fail("server_not_configured", 503);

  const { data: due, error } = await admin.rpc("prepare_account_deletion", { p_user: auth.userId });
  if (error) return fail("delete_failed", 500);
  const { failed } = await issueRefunds((due ?? []) as DueRefund[], async (chestId, refundId, amount) => {
    const r = await admin.rpc("record_refund", { p_chest: chestId, p_refund_ref: refundId, p_amount_minor: amount });
    if (r.error) throw new Error(r.error.message);
  });
  if (failed.length) return fail("refund_pending", 409, { message: REFUND_FIRST });

  const del = await admin.auth.admin.deleteUser(auth.userId);
  if (del.error) return fail("delete_failed", 500);
  await auth.sb.auth.signOut().catch(() => undefined);
  return json({ deleted: true });
}
