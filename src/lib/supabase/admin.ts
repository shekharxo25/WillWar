import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/env";
import { requireServerEnv } from "@/env.server";

let admin: SupabaseClient | null = null;

/**
 * Secret-key client. Bypasses RLS: use only for server-only work (webhooks,
 * money functions, waitlist inserts, cron). Never import from client code;
 * the `server-only` import above makes that a build error.
 */
export function getAdminSupabase(): SupabaseClient {
  if (!admin) {
    const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) throw new Error("missing_config:NEXT_PUBLIC_SUPABASE_URL");
    admin = createClient(url, requireServerEnv("SUPABASE_SECRET_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
