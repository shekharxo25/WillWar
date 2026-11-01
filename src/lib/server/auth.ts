import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { fail } from "./http";

export type Authed = { sb: SupabaseClient; userId: string };

/**
 * Resolves the signed-in user for a route handler. Returns a Response to send back when
 * the app runs in device mode (no Supabase env) or nobody is signed in.
 */
export async function requireUser(): Promise<Authed | Response> {
  const sb = await supabaseServer();
  if (!sb) return fail("device_mode", 400);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return fail("not_authenticated", 401);
  return { sb, userId: data.user.id };
}
