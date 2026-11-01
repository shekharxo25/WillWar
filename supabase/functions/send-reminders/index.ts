/* eslint-disable */
// @ts-nocheck -- Deno Edge Function (jsr: imports, Deno global); type-checked by the Supabase CLI, not the Next.js tsconfig.
// Supabase Edge Function (Deno): send-reminders. Scheduled every 15 minutes by pg_cron + pg_net
// (see supabase/README.md). Reads due_reminders() with the service key and sends discreet Web Push.
//
// Web Push: jsr:@negrel/webpush (Web Crypto, runs on Deno). API written against its README:
// importVapidKeys / ApplicationServer.new / subscribe / pushTextMessage / PushMessageError.isGone().
// NOTE: not executed in this repo's CI (no Deno/Docker here); verify on the first deploy.
//
// Env (function secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided by Supabase)
//   VAPID_KEYS_JSON   exported JWK key pair from @negrel/webpush's generate-vapid-keys script
//   VAPID_SUBJECT     mailto:hello@example.com
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

type Due = {
  kind: "daily" | "nudge";
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  day: number | null;
  discreet: boolean;
  message_key: string | null;
};

// Discreet by default: never mentions the challenge's subject.
const NUDGE_COPY: Record<string, string> = {
  proud_of_you: "Proud of you",
  go_a_round: "Go a round. You've got this.",
  get_up: "Get up. Day one counts.",
  almost_there: "Almost there",
  in_your_corner: "I'm in your corner",
};

function payload(r: Due): { title: string; body: string; url: string; tag: string } {
  if (r.kind === "nudge") {
    return {
      title: "WillWar",
      body: r.discreet ? "Someone in your camp sent a nudge." : `Your camp: ${NUDGE_COPY[r.message_key ?? ""] ?? "A nudge from your camp."}`,
      url: "/app/camp",
      tag: "nudge",
    };
  }
  return { title: "WillWar", body: `WillWar: Day ${r.day ?? 1}. Tap to check in.`, url: "/app/today?source=push", tag: "daily" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const keysJson = Deno.env.get("VAPID_KEYS_JSON");
  if (!keysJson) return Response.json({ error: "push_disabled" }, { status: 503 });

  const vapidKeys = await webpush.importVapidKeys(JSON.parse(keysJson), { extractable: false });
  const appServer = await webpush.ApplicationServer.new({
    contactInformation: Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@example.com",
    vapidKeys,
  });

  const { data, error } = await sb.rpc("due_reminders");
  if (error) return Response.json({ error: "query_failed" }, { status: 500 });

  let sent = 0;
  let removed = 0;
  let failed = 0;
  for (const r of (data ?? []) as Due[]) {
    try {
      const subscriber = appServer.subscribe({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } });
      await subscriber.pushTextMessage(JSON.stringify(payload(r)), { ttl: 3600, urgency: webpush.Urgency.Normal });
      sent++;
    } catch (e) {
      // 404 / 410: the subscription is gone. Remove it.
      if (e instanceof webpush.PushMessageError && e.isGone()) {
        await sb.rpc("remove_push_endpoint", { p_endpoint: r.endpoint });
        removed++;
      } else {
        failed++;
      }
    }
  }
  // Counts only; no endpoints, ids or message text in logs.
  console.log(JSON.stringify({ sent, removed, failed }));
  return Response.json({ sent, removed, failed });
});
