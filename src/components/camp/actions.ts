"use client";
/**
 * Camp moderation calls that the Store interface doesn't cover. Cloud mode calls RPCs
 * (security definer, membership-checked); device mode has no other people, so these are
 * acknowledged locally.
 *   mute_member(p_camp uuid, p_user uuid)    report_member(p_camp uuid, p_user uuid, p_reason text)
 *   remove_member(p_camp uuid, p_user uuid)  regenerate_invite_code(p_camp uuid) returns text
 *   season_leaderboard(p_season text, p_metric text)
 */
import { supabaseBrowser } from "@/lib/supabase/browser";

export type CampAction = "mute_member" | "report_member" | "remove_member" | "regenerate_invite_code";

export async function campAction(fn: CampAction, args: Record<string, unknown>): Promise<{ device: boolean; data?: unknown; error?: string }> {
  const sb = supabaseBrowser();
  if (!sb) return { device: true };
  const { data, error } = await sb.rpc(fn, args);
  return { device: false, data, error: error?.message };
}

export const REPORT_REASONS = [
  { key: "handle", label: "Offensive handle" },
  { key: "underage", label: "Seems under 18" },
  { key: "harassment", label: "Unwanted nudges" },
  { key: "other", label: "Something else" },
] as const;
