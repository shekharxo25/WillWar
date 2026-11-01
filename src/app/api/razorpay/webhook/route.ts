import { z } from "zod";
import { requireServerEnv } from "@/env.server";
import { seasonPassEnd } from "@/lib/config/plans";
import { fail, handleError, ok } from "@/lib/http";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { getAdminSupabase } from "@/lib/supabase/admin";

// The only path that changes entitlements or activates/refunds a War Chest stake.
// Signature verified over the raw body; idempotent by event id; amounts are re-checked by
// the database against the stored chest, never trusted from the client.
const notes = z.record(z.string(), z.unknown()).optional().default({});
const event = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({ entity: z.object({ id: z.string(), amount: z.number(), currency: z.string(), notes }) }).optional(),
    subscription: z.object({ entity: z.object({ id: z.string(), current_end: z.number().nullish(), notes }) }).optional(),
    refund: z.object({ entity: z.object({ id: z.string(), amount: z.number(), notes }) }).optional(),
  }),
});

const uuid = z.uuid();
const SUB_STATUS: Record<string, "active" | "past_due" | "canceled" | "expired"> = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.halted": "past_due",
  "subscription.cancelled": "canceled",
  "subscription.completed": "expired",
};

function log(name: string, outcome: string) {
  console.log(JSON.stringify({ route: "razorpay/webhook", event: name, outcome }));
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const valid = await verifyWebhookSignature(
      raw,
      request.headers.get("x-razorpay-signature"),
      requireServerEnv("RAZORPAY_WEBHOOK_SECRET"),
    );
    if (!valid) return fail(401, "bad_signature", "Signature check failed.");
    const parsed = event.safeParse(JSON.parse(raw));
    if (!parsed.success) return ok({ ignored: "shape" });

    const admin = getAdminSupabase();
    const eventId = request.headers.get("x-razorpay-event-id");
    if (!eventId) return ok({ ignored: "no_event_id" });
    const { data: fresh, error: idemErr } = await admin.rpc("record_webhook_event", { p_id: eventId });
    if (idemErr) throw new Error("idempotency_failed");
    if (fresh === false) return ok({ duplicate: true });

    const { event: name, payload } = parsed.data;

    if (name === "payment.captured" && payload.payment) {
      const p = payload.payment.entity;
      if (p.notes.kind === "season") {
        const user = uuid.safeParse(p.notes.user_id);
        if (!user.success) return log(name, "bad_user"), ok({ ignored: "user" });
        const { data: prof } = await admin.from("profiles").select("timezone").eq("id", user.data).maybeSingle();
        const end = seasonPassEnd(new Date(), (prof?.timezone as string | undefined) ?? "Asia/Kolkata");
        const { error } = await admin.rpc("upsert_entitlement", {
          p_user: user.data,
          p_plan: "season",
          p_status: "active",
          p_period_end: end.toISOString(),
          p_provider_ref: p.id,
        });
        if (error) throw new Error("entitlement_failed");
        return log(name, "season_active"), ok({ ok: true });
      }
      if (p.notes.kind === "war_chest") {
        const chest = uuid.safeParse(p.notes.war_chest_id);
        if (!chest.success) return log(name, "bad_chest"), ok({ ignored: "chest" });
        const { error } = await admin.rpc("activate_stake_chest", {
          p_chest: chest.data,
          p_payment_ref: p.id,
          p_amount_minor: p.amount,
          p_currency: p.currency,
        });
        // A mismatch is logged and alerted, never trusted; 200 stops Razorpay retrying.
        if (error) {
          console.error(JSON.stringify({ route: "razorpay/webhook", alert: "chest_rejected", chest: chest.data }));
          return ok({ ignored: "chest_rejected" });
        }
        return log(name, "chest_active"), ok({ ok: true });
      }
      return log(name, "unknown_kind"), ok({ ignored: "kind" });
    }

    if (name in SUB_STATUS && payload.subscription) {
      const s = payload.subscription.entity;
      const user = uuid.safeParse(s.notes.user_id);
      if (!user.success) return log(name, "bad_user"), ok({ ignored: "user" });
      const { error } = await admin.rpc("upsert_entitlement", {
        p_user: user.data,
        p_plan: "annual",
        p_status: SUB_STATUS[name],
        p_period_end: s.current_end ? new Date(s.current_end * 1000).toISOString() : null,
        p_provider_ref: s.id,
      });
      if (error) throw new Error("entitlement_failed");
      return log(name, SUB_STATUS[name]), ok({ ok: true });
    }

    if (name === "refund.processed" && payload.refund) {
      const r = payload.refund.entity;
      const chest = uuid.safeParse(r.notes.war_chest_id);
      if (!chest.success) return log(name, "not_chest"), ok({ ignored: "refund" });
      const { error } = await admin.rpc("record_refund", { p_chest: chest.data, p_refund_ref: r.id, p_amount_minor: r.amount });
      if (error) {
        console.error(JSON.stringify({ route: "razorpay/webhook", alert: "refund_rejected", chest: chest.data }));
        return ok({ ignored: "refund_rejected" });
      }
      return log(name, "refund_recorded"), ok({ ok: true });
    }

    if (name === "refund.failed") {
      console.error(JSON.stringify({ route: "razorpay/webhook", alert: "refund_failed", refund: payload.refund?.entity.id }));
      return ok({ ok: true });
    }
    return ok({ ignored: name });
  } catch (e) {
    return handleError("razorpay/webhook", e);
  }
}
