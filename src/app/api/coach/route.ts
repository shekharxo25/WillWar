import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getClaude, logUsage } from "@/lib/ai/client";
import { crisisKind } from "@/lib/ai/crisis-terms";
import { checkCoachText } from "@/lib/ai/filters";
import { COACH_REDIRECT, COACH_SYSTEM, CRISIS_MARKER } from "@/lib/ai/prompts";
import { countryFromTimezone, crisisResourcesFor } from "@/lib/config/crisis-resources";
import { fail, handleError, ok } from "@/lib/http";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";

// "Talk it through" (Pro). The transcript lives only in the browser's memory; the server
// stores no message text and never logs bodies. Crisis input never reaches the model.
const TURNS_PER_DAY = 20;

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(40)
    .refine((m) => m[m.length - 1].role === "user", "last message must be from the user"),
});

export async function POST(request: Request) {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const { supabase, user } = auth;
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "bad_request", "Send a message to continue.");

    const { data: ent } = await supabase.from("entitlements").select("status,current_period_end").maybeSingle();
    const pro = ent?.status === "active" && (!ent.current_period_end || new Date(ent.current_period_end as string) > new Date());
    if (!pro) return fail(403, "pro_required", "Talk it through is part of Pro.");

    const admin = getAdminSupabase();
    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
    const country = countryFromTimezone((profile?.timezone as string) ?? "");

    const crisisResponse = async (kind: string) => {
      await admin.from("events").insert({ user_id: user.id, name: "crisis_card_shown" });
      if (kind === "under_18") {
        // Founder review queue (social-integrity.md): no message text is stored.
        await admin.from("reports").insert({ reporter: null, target_kind: "handle", target_id: user.id, reason: "minor" });
      }
      const { data: chest } = await supabase.from("war_chests").select("id").eq("mode", "stake").eq("status", "active").maybeSingle();
      return ok({ crisis: true, under18: kind === "under_18", resources: crisisResourcesFor(country), warChestRelease: Boolean(chest) });
    };

    const latest = parsed.data.messages[parsed.data.messages.length - 1].content;
    const kind = crisisKind(latest);
    if (kind) return crisisResponse(kind);

    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { count } = await admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("name", "coach_turn")
      .gte("created_at", since);
    if ((count ?? 0) >= TURNS_PER_DAY) return fail(429, "turn_limit", "That's 20 messages today. Ride it out is always here.");
    await admin.from("events").insert({ user_id: user.id, name: "coach_turn" });

    const { client, model } = getClaude();
    const stream = client.messages.stream(
      {
        model,
        max_tokens: 600,
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system: COACH_SYSTEM,
        messages: parsed.data.messages satisfies Anthropic.MessageParam[],
      },
      { timeout: 20_000, maxRetries: 0 },
    );

    const encoder = new TextEncoder();
    const out = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        let sent = 0;
        let decided = false; // whether the reply is the crisis marker
        const flush = (upTo: number) => {
          if (upTo > sent) {
            controller.enqueue(encoder.encode(full.slice(sent, upTo)));
            sent = upTo;
          }
        };
        try {
          for await (const event of stream) {
            if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
            full += event.delta.text;
            if (!decided) {
              if (full.trimStart().length < CRISIS_MARKER.length && CRISIS_MARKER.startsWith(full.trimStart())) continue;
              decided = true;
              if (full.trimStart().startsWith(CRISIS_MARKER)) {
                stream.abort();
                await admin.from("events").insert({ user_id: user.id, name: "crisis_card_shown" });
                controller.enqueue(encoder.encode(CRISIS_MARKER));
                controller.close();
                return;
              }
            }
            if (!checkCoachText(full).ok) {
              stream.abort();
              controller.enqueue(encoder.encode(`${sent > 0 ? "\n\n" : ""}${COACH_REDIRECT}`));
              controller.close();
              return;
            }
            // Hold back the last partial word so a banned stem can't leak mid-word.
            flush(full.lastIndexOf(" ") + 1);
          }
          if (!checkCoachText(full).ok) controller.enqueue(encoder.encode(COACH_REDIRECT));
          else flush(full.length);
          const final = await stream.finalMessage().catch(() => null);
          if (final) logUsage("coach", { input: final.usage.input_tokens, output: final.usage.output_tokens });
          controller.close();
        } catch {
          if (sent === 0) controller.enqueue(encoder.encode(COACH_REDIRECT));
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });
    return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (e) {
    return handleError("coach", e);
  }
}
