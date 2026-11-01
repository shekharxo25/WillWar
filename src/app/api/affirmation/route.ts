import { claudeConfigured, getClaude, logUsage } from "@/lib/ai/client";
import { pickFallbackLine } from "@/lib/ai/fallback";
import { generateMorningLine } from "@/lib/ai/morning";
import { CURRENT_SEASON, TONES, type Tone, WHY_TAGS, type WhyTag } from "@/lib/domain/constants";
import { fail, handleError, ok } from "@/lib/http";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";
import { addDays, diffDays, localDate, streakDayNumber, zonedTimeToUtc } from "@/lib/time";

// Today's morning line, cached per local day (one model call per user per day). Only the
// allowed context reaches the model: never email, handle, ids, timezone or reset data.
export async function POST() {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const { supabase, user } = auth;
    const { data: profile } = await supabase.from("profiles").select("timezone,tone,why_tags").eq("id", user.id).maybeSingle();
    if (!profile) return fail(404, "no_profile", "Finish setting up first.");
    const tz = profile.timezone as string;
    const now = new Date();
    const today = localDate(now, tz);

    const cached = await supabase.from("affirmations").select("body,source").eq("for_date", today).maybeSingle();
    if (cached.data) return ok({ text: cached.data.body, source: cached.data.source });

    const weekAgo = addDays(today, -6);
    const [streak, goal, checkins, waves] = await Promise.all([
      supabase.from("streaks").select("started_at").is("ended_at", null).maybeSingle(),
      supabase.from("goals").select("ends_on,season_id").is("closed_at", null).maybeSingle(),
      supabase.from("checkins").select("local_date", { count: "exact", head: true }).gte("local_date", weekAgo).in("status", ["held", "shielded"]),
      supabase
        .from("urge_sessions")
        .select("id", { count: "exact", head: true })
        .eq("completed", true)
        .gte("started_at", zonedTimeToUtc(weekAgo, tz).toISOString()),
    ]);
    const startedAt = streak.data ? new Date(streak.data.started_at as string) : null;
    const day = startedAt ? streakDayNumber(startedAt, now, tz) : 0;
    const tone: Tone = (TONES as readonly string[]).includes(profile.tone as string) ? (profile.tone as Tone) : "steady";
    const reasons = ((profile.why_tags as string[]) ?? []).filter((t): t is WhyTag => (WHY_TAGS as readonly string[]).includes(t));
    const seed = `${user.id}:${today}`;

    let text: string;
    let source: "model" | "fallback" = "fallback";
    if (claudeConfigured()) {
      const { client, model } = getClaude();
      const goalDays =
        startedAt && goal.data ? Math.max(1, diffDays(localDate(startedAt, tz), goal.data.ends_on as string) + 1) : 30;
      const result = await generateMorningLine(client, model, {
        day,
        goalDays,
        seasonName: goal.data?.season_id === CURRENT_SEASON.id ? CURRENT_SEASON.name : null,
        tone,
        reasons,
        checkins7: checkins.count ?? 0,
        waves7: waves.count ?? 0,
        weekday: new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: tz }).format(now),
      }, seed);
      if (result.usage) logUsage("morning_line", result.usage, result.source);
      text = result.text;
      source = result.source;
    } else {
      text = pickFallbackLine({ tone, day, seed });
    }

    await getAdminSupabase()
      .from("affirmations")
      .upsert({ user_id: user.id, for_date: today, body: text, source }, { onConflict: "user_id,for_date", ignoreDuplicates: true });
    return ok({ text, source });
  } catch (e) {
    return handleError("affirmation", e);
  }
}
