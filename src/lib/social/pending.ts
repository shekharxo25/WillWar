"use client";

import { cloudEnabled } from "@/env";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const KEY = "ww-pending-join";

/** Stash an invite code opened before sign-in (no personal data, just the code). */
export function stashPendingJoin(code: string) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // storage unavailable: the person can re-open the invite link
  }
}

/** After onboarding/sign-in: join the stashed pact. Returns its id, or null. */
export async function consumePendingJoin(): Promise<string | null> {
  if (!cloudEnabled) return null;
  let code: string | null = null;
  try {
    code = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    return null;
  }
  if (!code || !/^[a-z0-9]{6,20}$/i.test(code)) return null;
  const { data, error } = await getBrowserSupabase().rpc("join_pact", { p_code: code });
  if (error || typeof data !== "string") return null;
  return data;
}
