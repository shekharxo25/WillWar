import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Security headers on every page, and Supabase session refresh for /app/*.
 * CSP note (docs/DECISIONS.md): nonces force dynamic rendering, which would make the
 * landing page and the offline shell uncacheable, so the CSP is a strict allowlist instead.
 */
const AD_ROUTES = [/^\/learn(\/|$)/, /^\/app\/learn(\/|$)/, /^\/app\/round\/done$/, /^\/app\/me$/];

function csp(path: string) {
  const dev = process.env.NODE_ENV !== "production";
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supaWs = supabase.replace(/^https:/, "wss:");
  const ads = process.env.NEXT_PUBLIC_ADS_MODE && process.env.NEXT_PUBLIC_ADS_MODE !== "house" && AD_ROUTES.some((r) => r.test(path));
  const google = ads ? " https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com" : "";
  const turnstile = path === "/" ? " https://challenges.cloudflare.com" : "";
  const razorpay = path.startsWith("/app/pro") || path.startsWith("/app/war-chest") || path.startsWith("/app/start") ? " https://checkout.razorpay.com https://api.razorpay.com" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${turnstile}${razorpay}${google}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:" + google,
    "font-src 'self'",
    `connect-src 'self'${supabase ? ` ${supabase} ${supaWs}` : ""}${razorpay}${google}${dev ? " ws:" : ""}`,
    `frame-src${turnstile || razorpay || google ? `${turnstile}${razorpay}${google}` : " 'none'"}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key && path.startsWith("/app")) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const c of list) request.cookies.set(c.name, c.value);
          response = NextResponse.next({ request });
          for (const c of list) response.cookies.set(c.name, c.value, c.options);
        },
      },
    });
    await supabase.auth.getUser(); // refreshes the session cookie
  }

  const h = response.headers;
  h.set("Content-Security-Policy", csp(path));
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  h.set("X-Frame-Options", "DENY");
  // HSTS switches on after launch week (docs/guardrails/release-checklist.md).
  if (process.env.ENABLE_HSTS === "1") h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|fonts|icons|sw.js|favicon.ico|robots.txt|sitemap.xml|ads.txt).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
