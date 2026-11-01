"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cloudEnabled, publicEnv } from "@/env";

let client: SupabaseClient | null = null;

/** Browser client with the publishable key only. RLS limits it to the signed-in user's rows. */
export function getBrowserSupabase(): SupabaseClient {
  if (!cloudEnabled) throw new Error("cloud_disabled");
  if (!client) {
    client = createBrowserClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL as string,
      publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    );
  }
  return client;
}
