import { isProduction } from "@/lib/config/flags";
import { handleEvent, type RazorpayEvent } from "@/lib/payments/handlers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";

/**
 * Dev-only mock checkout backend (Part 6.1). Builds the same event shape Razorpay sends and
 * calls the same handler the verified webhook calls. 404 in production.
 */
export async function POST(req: Request) {
  if (isProduction()) return new Response("Not found", { status: 404 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ device: true });
  const b = (await req.json().catch(() => ({}))) as { action?: string; plan?: string; chest?: string; amount?: number; currency?: string };
  const id = `sim_${Date.now().toString(36)}`;
  let ev: RazorpayEvent;
  if (b.action === "refund" && b.chest) {
    ev = { event: "refund.processed", payload: { refund: { entity: { id: `rfnd_${id}`, amount: Number(b.amount), notes: { war_chest_id: b.chest } } } } };
  } else if (b.chest) {
    ev = { event: "payment.captured", payload: { payment: { entity: { id: `pay_${id}`, amount: Number(b.amount), currency: b.currency ?? "INR", notes: { kind: "war_chest", war_chest_id: b.chest } } } } };
  } else {
    const user = await currentUserId();
    if (!user) return Response.json({ error: "not_authenticated" }, { status: 401 });
    ev =
      b.plan === "annual"
        ? { event: "subscription.activated", payload: { subscription: { entity: { id: `sub_${id}`, current_end: Math.floor(Date.now() / 1000) + 365 * 86400, notes: { user_id: user } } } } }
        : { event: "payment.captured", payload: { payment: { entity: { id: `pay_${id}`, amount: 14900, currency: "INR", notes: { kind: "season", user_id: user } } } } };
  }
  try {
    return Response.json(await handleEvent(db, id, ev));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
