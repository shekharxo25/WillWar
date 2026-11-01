import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** OAuth (Google) return. Exchanges the code for a session, then continues onboarding or opens Today. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/app/today";
  const next = nextParam.startsWith("/app/") ? nextParam : "/app/today";
  const sb = await supabaseServer();
  if (sb && code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/app/sign-in?error=1", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
