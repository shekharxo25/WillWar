import type { NextConfig } from "next";

// Static shells (Cache Components / PPR) can't carry per-request nonces, so the
// CSP is a static header. 'unsafe-inline' for scripts covers Next's inline RSC
// payload; every other directive is locked down. See docs/adr/0002-csp.md.
const isDev = process.env.NODE_ENV === "development";
// Only upgrade subresources on an HTTPS deployment: Safari applies the upgrade to
// http://localhost too, which breaks local production builds (`next start`, `npm run preview`).
const isHttpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

const SUPABASE = "https://*.supabase.co wss://*.supabase.co";
const TURNSTILE = "https://challenges.cloudflare.com";
const CF_ANALYTICS = "https://static.cloudflareinsights.com https://cloudflareinsights.com";
const RAZORPAY = "https://checkout.razorpay.com https://api.razorpay.com";
// Ad domains are allowed only on the allowlisted ad routes (Learn feed).
const ADS = "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com";

function csp({ ads = false }: { ads?: boolean } = {}) {
  const script = [
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    TURNSTILE,
    CF_ANALYTICS,
    RAZORPAY,
    ads ? ADS : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data:${ads ? " https:" : ""}`,
    "font-src 'self'",
    `connect-src 'self' ${SUPABASE} ${CF_ANALYTICS} ${RAZORPAY}${ads ? " https://*.google.com https://*.doubleclick.net" : ""}`,
    `frame-src ${TURNSTILE} ${RAZORPAY}${ads ? " https://googleads.g.doubleclick.net https://tpc.googlesyndication.com" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isHttpsSite && !isDev ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...baseHeaders, { key: "Content-Security-Policy", value: csp() }] },
      // The only routes allowed to load ad scripts (docs/guardrails/ads-monetization.md).
      { source: "/learn", headers: [{ key: "Content-Security-Policy", value: csp({ ads: true }) }] },
      { source: "/app/learn", headers: [{ key: "Content-Security-Policy", value: csp({ ads: true }) }] },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/app/" },
        ],
      },
    ];
  },
};

export default nextConfig;
