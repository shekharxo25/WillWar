"use client";

import { z } from "zod";
import type { NudgeKey } from "@/lib/domain/constants";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { StoreError } from "@/lib/store/types";

const pactRow = z.object({
  id: z.string(),
  name: z.string(),
  season_id: z.string().nullable(),
  member_count: z.number(),
  is_owner: z.boolean(),
  invite_code: z.string().nullable(),
  created_at: z.string(),
});
export type PactSummary = z.infer<typeof pactRow>;

const boardRow = z.object({
  member_id: z.string(),
  handle: z.string(),
  avatar_seed: z.string(),
  current_streak_s: z.coerce.number(),
  best_streak_s: z.coerce.number(),
  days_kept: z.coerce.number(),
  last_checkin: z.string().nullable(),
  is_backed: z.boolean().nullable(),
  is_me: z.boolean(),
});
export type BoardRow = z.infer<typeof boardRow>;

const challengeRow = z.object({
  id: z.string(),
  kind: z.enum(["first_to_days", "longest_streak", "most_days"]),
  target_days: z.number().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
});
export type Challenge = z.infer<typeof challengeRow>;

const CODES = ["pro_required", "invalid_code", "pact_full", "rate_limited", "not_member", "self_nudge", "bad_name"];

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getBrowserSupabase().rpc(name, args);
  if (error) throw new StoreError(CODES.find((c) => error.message.includes(c)) ?? "unknown");
  return data as T;
}

export async function myPacts(): Promise<PactSummary[]> {
  return z.array(pactRow).parse(await rpc("my_pacts"));
}

export async function leaderboard(pactId: string): Promise<BoardRow[]> {
  return z.array(boardRow).parse(await rpc("pact_leaderboard", { p_pact: pactId }));
}

export async function challenges(pactId: string): Promise<Challenge[]> {
  const { data, error } = await getBrowserSupabase()
    .from("challenges")
    .select("id,kind,target_days,starts_at,ends_at")
    .eq("pact_id", pactId)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at");
  if (error) throw new StoreError("unknown");
  return z.array(challengeRow).parse(data ?? []);
}

const seasonRow = z.object({ rank: z.number(), handle: z.string(), avatar_seed: z.string(), value: z.coerce.number(), is_me: z.boolean() });
export type SeasonRow = z.infer<typeof seasonRow>;

/** The opt-in global board: people who chose Everyone, top 100 plus my own rank. */
export async function seasonBoard(seasonId: string, metric: "current" | "best" | "days"): Promise<SeasonRow[]> {
  return z.array(seasonRow).parse(await rpc("season_leaderboard", { p_season: seasonId, p_metric: metric }));
}

export const createPact = (name: string, seasonId: string | null) => rpc<string>("create_pact", { p_name: name, p_season: seasonId });
export const joinPact = (code: string) => rpc<string>("join_pact", { p_code: code.trim().toLowerCase() });
export const sendNudge = (pactId: string, to: string, key: NudgeKey) => rpc<void>("send_nudge", { p_pact: pactId, p_to: to, p_message_key: key });
export const leavePact = (pactId: string) => rpc<void>("leave_pact", { p_pact: pactId });
export const muteMember = (userId: string) => rpc<void>("mute_member", { p_user: userId });
export const reportContent = (kind: "handle" | "pact", id: string, reason: string) =>
  rpc<void>("report_content", { p_target_kind: kind, p_target_id: id, p_reason: reason, p_note: null });
export const regenerateInvite = (pactId: string) => rpc<string>("regenerate_invite_code", { p_pact: pactId });

/** Private broadcast channel per pact; payloads carry no user data, just {"type":"refresh"}. */
export function subscribePact(pactId: string, onRefresh: () => void): () => void {
  const sb = getBrowserSupabase();
  const channel = sb
    .channel(`pact:${pactId}`, { config: { private: true } })
    .on("broadcast", { event: "refresh" }, onRefresh)
    .subscribe();
  return () => void sb.removeChannel(channel);
}

export function inviteUrl(code: string): string {
  return `${window.location.origin}/app/join/${encodeURIComponent(code)}`;
}
