import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// OAuth (Google) lands here inside the PWA scope. Only same-origin /app paths are
// accepted for `next`, so the callback can't be used as an open redirect.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/app/today";
  const next = /^\/app(\/[a-z0-9/_-]*)?$/i.test(nextParam) ? nextParam : "/app/today";

  const supabase = await getServerSupabase();
  if (!supabase || !code) return NextResponse.redirect(new URL("/app/sign-in", url.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/app/sign-in", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
