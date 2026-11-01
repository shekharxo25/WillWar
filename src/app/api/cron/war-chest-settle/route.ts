import { cronAuthorized } from "@/lib/server/cron";
import { fail, json } from "@/lib/server/http";
import { limited } from "@/lib/server/rate-limit";
import { issueRefunds, type DueRefund } from "@/lib/server/refunds";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/cron/war-chest-settle (Cloudflare Cron Trigger, daily 02:00 UTC, header
 * x-cron-secret). Closes finished goals, settles promises, refunds stakes (stake minus
 * forfeits) with X-Refund-Idempotency = war_chest_id, and refreshes this month's donation
 * batches. Failed refunds stay 'settling' and retry next run.
 */
export async function POST(req: Request) {
  const tooMany = limited(req, "cron", 10);
  if (tooMany) return tooMany;
  if (!cronAuthorized(req)) return fail("forbidden", 403);
  const admin = supabaseAdmin();
  if (!admin) return fail("server_not_configured", 503);

  const { data: due, error } = await admin.rpc("settle_due_war_chests");
  if (error) return fail("settle_failed", 500);
  const result = await issueRefunds((due ?? []) as DueRefund[], async (chestId, refundId, amount) => {
    const r = await admin.rpc("record_refund", { p_chest: chestId, p_refund_ref: refundId, p_amount_minor: amount });
    if (r.error) throw new Error(r.error.message);
  });

  const period = new Date().toISOString().slice(0, 7);
  const batches = await admin.rpc("monthly_donation_batches", { p_period: period });
  if (result.failed.length) console.error("war_chest_settle_failures", result.failed.length);
  return json(
    { due: (due ?? []).length, refunded: result.refunded.length, failed: result.failed, batches: batches.error ? "failed" : batches.data },
    { status: result.failed.length ? 207 : 200 },
  );
}
