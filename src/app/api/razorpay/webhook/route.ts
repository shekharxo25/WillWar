import { payments } from "@/lib/adapters/payments";
import { handleEvent, type RazorpayEvent } from "@/lib/payments/handlers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Razorpay webhook: the only writer of entitlements. Verifies HMAC-SHA256 of the RAW body,
 * then hands off to the shared handlers (idempotent through webhook_events).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  const adapter = payments();
  if (!(await adapter.verifyWebhookSignature(raw, sig))) {
    return Response.json({ error: "bad_signature" }, { status: 401 });
  }
  let ev: RazorpayEvent;
  try {
    ev = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "no_database" }, { status: 503 });
  const eventId = req.headers.get("x-razorpay-event-id") ?? `body:${await digest(raw)}`;
  try {
    const result = await handleEvent(db, eventId, ev);
    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    // 500 makes Razorpay retry. Forget the idempotency row so the retry is processed.
    await db.from("webhook_events").delete().eq("id", eventId);
    console.error("webhook_failed", { event: ev.event, reason: (e as Error).message });
    return Response.json({ error: "handler_failed" }, { status: 500 });
  }
}

async function digest(s: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return Array.from(h.slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}
