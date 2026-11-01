import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cloudEnabled, publicEnv } from "@/env";

/**
 * Per-request server client acting as the signed-in user (publishable key + session
 * cookie), so RLS and auth.uid() apply exactly as in the browser.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!cloudEnabled) return null;
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL as string,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component render: proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}

/** The verified user for this request (validated with the auth server), or null. */
export async function getRequestUser(): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}
