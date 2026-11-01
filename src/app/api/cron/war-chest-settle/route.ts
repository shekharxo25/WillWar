import { z } from "zod";
import { publicEnv } from "@/env";
import { requireServerEnv } from "@/env.server";
import { fail, handleError, ok } from "@/lib/http";
import { createRefund, secretMatches } from "@/lib/payments/razorpay";
import { getAdminSupabase } from "@/lib/supabase/admin";

const row = z.object({
  war_chest_id: z.string(),
  payment_ref: z.string().nullable(),
  refund_minor: z.number(),
  refund_currency: z.string(),
});

// Daily (Cloudflare Cron Trigger, 02:00 UTC): close finished goals, settle promises, and
// refund what's left of each stake; refund.processed then calls record_refund. Failed
// refunds are logged per chest and retried on the next run. None is dropped silently.
export async function POST(request: Request) {
  try {
    if (!(await secretMatches(request.headers.get("x-cron-secret"), requireServerEnv("CRON_SECRET")))) {
      return fail(401, "bad_secret", "Not allowed.");
    }
    const admin = getAdminSupabase();
    const { data, error } = await admin.rpc("settle_due_war_chests");
    if (error) throw new Error("settle_failed");
    const due = z.array(row).parse(data ?? []);
    const key = publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let refunded = 0;
    const failed: string[] = [];
    for (const r of due) {
      if (!key || !r.payment_ref || r.refund_minor <= 0) {
        failed.push(r.war_chest_id);
        continue;
      }
      try {
        await createRefund(fetch, { keyId: key, keySecret: requireServerEnv("RAZORPAY_KEY_SECRET") }, {
          paymentId: r.payment_ref,
          amountMinor: r.refund_minor,
          idempotencyKey: r.war_chest_id,
          notes: { war_chest_id: r.war_chest_id },
        });
        refunded++;
      } catch {
        failed.push(r.war_chest_id);
      }
    }
    if (failed.length) {
      console.error(JSON.stringify({ route: "cron/war-chest-settle", alert: "refunds_pending", chests: failed }));
    }
    return ok({ due: due.length, refunded, failed: failed.length });
  } catch (e) {
    return handleError("cron/war-chest-settle", e);
  }
}
