import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Secret-key client. Server only: money functions, webhooks, cron, account deletion.
 * Never import from a client component (the "server-only" import enforces this at build).
 */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
