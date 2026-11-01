// Supabase Edge Function (Deno): send daily check-in reminders and Night watch nudges.
// Schedule every 15 minutes with pg_cron + pg_net (see supabase/README.md). Copy is discreet
// by default and never mentions the challenge's subject on a lock screen.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

interface Due {
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  day_number: number;
  discreet: boolean;
  kind: "checkin" | "night_watch";
}

function copy(d: Due) {
  const day = d.day_number > 0 ? `Day ${d.day_number}. ` : "";
  if (d.kind === "night_watch") {
    return { title: "WillWar", body: `${day}Night watch. Tap to check in.`, tag: "night-watch", url: "/app/today" };
  }
  return {
    title: "WillWar",
    body: d.discreet ? `${day}Tap to check in.` : `${day}How did today go? Check in or ride it out.`,
    tag: "checkin",
    url: "/app/today",
  };
}

Deno.serve(async (req) => {
  if (req.headers.get("authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("forbidden", { status: 403 });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

  const { data, error } = await supabase.rpc("due_reminders");
  if (error) return new Response(JSON.stringify({ error: "due_failed" }), { status: 500 });

  let sent = 0;
  let removed = 0;
  for (const d of (data ?? []) as Due[]) {
    try {
      await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, JSON.stringify(copy(d)), {
        TTL: 3600,
        urgency: "normal",
      });
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", d.subscription_id);
        removed++;
      }
    }
  }
  return new Response(JSON.stringify({ sent, removed }), { headers: { "content-type": "application/json" } });
});
