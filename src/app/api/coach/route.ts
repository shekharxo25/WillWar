import { aiAdapter } from "@/lib/adapters/ai";
import { runCoach, type CoachEvent } from "@/lib/ai/engine";
import { CoachRequest } from "@/lib/ai/prompts";
import { clientKey, coachTurn, hit } from "@/lib/ai/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/coach (Pro): "Talk it through".
 * Streams newline-delimited JSON CoachEvents. Crisis pre-screen on every user message before
 * the model is called; [[CRISIS]] from the model becomes the static crisis card on the client.
 * Nothing is stored and no message text is logged. 20 turns a day.
 */
export async function POST(req: Request) {
  if (!hit(`coach-ip:${clientKey(req)}`, 30, 60_000).ok) return Response.json({ error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = CoachRequest.safeParse(body);
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const sb = await supabaseServer();
  let userKey: string;
  let logCrisis: () => Promise<void> = async () => {};
  if (sb) {
    const { data: auth } = await sb.auth.getUser();
    const user = auth.user;
    if (!user) return Response.json({ error: "not_authenticated" }, { status: 401 });
    const { data: ent } = await sb.from("entitlements").select("status, current_period_end").eq("user_id", user.id).maybeSingle();
    const e = ent as { status: string; current_period_end: string | null } | null;
    const pro = !!e && e.status === "active" && (!e.current_period_end || new Date(e.current_period_end) > new Date());
    if (!pro) return Response.json({ error: "pro_required" }, { status: 402 });
    userKey = user.id;
    // Only the event name and user id. No text, no other properties.
    logCrisis = async () => {
      await sb.from("events").insert({ user_id: user.id, name: "crisis_card_shown", props: {} });
    };
  } else {
    // Device mode has no server-side entitlement to check: development only.
    if (process.env.NODE_ENV === "production") return Response.json({ error: "pro_required" }, { status: 402 });
    userKey = `device:${clientKey(req)}`;
  }

  const turn = coachTurn(userKey);
  if (!turn.ok) return Response.json({ error: "daily_limit" }, { status: 429 });

  const ai = aiAdapter();
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: CoachEvent) => controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
      try {
        for await (const ev of runCoach(ai, parsed.data.messages, req.signal)) {
          send(ev);
          if (ev.type === "crisis") await logCrisis().catch(() => {});
        }
      } catch {
        send({ type: "redirect", text: "The coach can't be reached right now. Want to start a round instead?" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-turns-remaining": String(turn.remaining) },
  });
}
