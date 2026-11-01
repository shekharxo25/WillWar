/**
 * Internal payment handlers. The verified Razorpay webhook is the only production caller;
 * the dev-only mock checkout calls the same functions. Entitlements change only here.
 *
 * Database functions used (server only, secret key):
 *   record_webhook_event(p_id text) returns boolean      -- false if already seen
 *   apply_entitlement(p_user uuid, p_plan text, p_status text, p_period_end timestamptz, p_ref text)
 *   activate_stake_chest(p_chest uuid, p_payment_ref text, p_amount_minor int, p_currency text)
 *   record_refund(p_chest uuid, p_refund_ref text, p_amount_minor int)
 */
import { SEASON } from "@/lib/config/season";
import { goalEndInstant } from "@/lib/time";

export type RpcClient = {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

type Entity = Record<string, unknown> & { notes?: Record<string, string> };
export type RazorpayEvent = {
  event: string;
  payload: {
    payment?: { entity: Entity };
    subscription?: { entity: Entity };
    refund?: { entity: Entity };
  };
};

export type HandleResult = { ok: true; action: string } | { ok: false; error: string };

async function call(db: RpcClient, fn: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

/** Season pass: active until the season's last local day, or 30 days for rolling users. */
export function seasonPeriodEnd(now: Date, timezone = "Asia/Kolkata", rolling = false): Date {
  const seasonEnd = goalEndInstant(SEASON.endsOn, timezone);
  if (rolling || seasonEnd <= now) return new Date(now.getTime() + 30 * 86400_000);
  return seasonEnd;
}

const SUB_STATUS: Record<string, "active" | "past_due" | "canceled" | "expired"> = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.halted": "past_due",
  "subscription.cancelled": "canceled",
  "subscription.completed": "expired",
};

/** Handles one verified event. Idempotent through webhook_events. */
export async function handleEvent(db: RpcClient, eventId: string, ev: RazorpayEvent, now = new Date()): Promise<HandleResult> {
  const fresh = await call(db, "record_webhook_event", { p_id: eventId });
  if (fresh === false) return { ok: true, action: "duplicate" };

  if (ev.event === "payment.captured") {
    const p = ev.payload.payment?.entity;
    if (!p) return { ok: false, error: "no_payment" };
    const notes = p.notes ?? {};
    if (notes.kind === "season") {
      if (!notes.user_id) return { ok: false, error: "no_user" };
      const end = seasonPeriodEnd(now, notes.timezone || "Asia/Kolkata", notes.rolling === "1");
      await call(db, "apply_entitlement", {
        p_user: notes.user_id, p_plan: "season", p_status: "active", p_period_end: end.toISOString(), p_ref: String(p.id),
      });
      return { ok: true, action: "season_granted" };
    }
    if (notes.kind === "war_chest") {
      if (!notes.war_chest_id) return { ok: false, error: "no_chest" };
      await call(db, "activate_stake_chest", {
        p_chest: notes.war_chest_id, p_payment_ref: String(p.id), p_amount_minor: Number(p.amount), p_currency: String(p.currency),
      });
      return { ok: true, action: "stake_activated" };
    }
    return { ok: true, action: "ignored" };
  }

  if (ev.event in SUB_STATUS) {
    const s = ev.payload.subscription?.entity;
    const user = s?.notes?.user_id;
    if (!s || !user) return { ok: false, error: "no_subscription" };
    const endSec = Number(s.current_end ?? 0);
    await call(db, "apply_entitlement", {
      p_user: user,
      p_plan: "annual",
      p_status: SUB_STATUS[ev.event],
      p_period_end: endSec ? new Date(endSec * 1000).toISOString() : null,
      p_ref: String(s.id),
    });
    return { ok: true, action: `subscription_${SUB_STATUS[ev.event]}` };
  }

  if (ev.event === "refund.processed") {
    const r = ev.payload.refund?.entity;
    const chest = r?.notes?.war_chest_id;
    if (!r || !chest) return { ok: true, action: "ignored" };
    try {
      await call(db, "record_refund", { p_chest: chest, p_refund_ref: String(r.id), p_amount_minor: Number(r.amount) });
    } catch (e) {
      // The settlement job or account deletion records the refund when it's created; a later webhook is a no-op.
      if (e instanceof Error && /not_settling/.test(e.message)) return { ok: true, action: "refund_already_recorded" };
      throw e;
    }
    return { ok: true, action: "refund_recorded" };
  }

  if (ev.event === "refund.failed") {
    // Alert without personal data; the daily settlement job retries with the same idempotency key.
    console.warn("refund_failed", { id: ev.payload.refund?.entity?.id });
    return { ok: true, action: "refund_failed_logged" };
  }

  return { ok: true, action: "ignored" };
}
