# Decisions

Deviations from `MASTER_PROMPT.md`, and choices it left open. Newest last.

## 2026-11-01 Next.js 16.4.3, not 16.2.x

The spec asks for the newest 16.2.x patch (≥ 16.2.6). `@opennextjs/cloudflare` 1.20 declares `next >=15.5.28 <16 || >=16.4.1`, so 16.2.x can't deploy to Workers with the current adapter. We use 16.4.3 (latest stable on 1 Nov 2026). Cache Components and Partial Prefetching started on (the create-next-app defaults for 16.4) and were later turned off; see "Cache Components off for Workers".

## 2026-11-01 Fonts in `src/app/fonts/`, loaded with `next/font/local`

The spec says self-host in `/public/fonts`. `next/font/local` resolves font files relative to the calling module and self-hosts them with hashed URLs and preload hints, so the files live in `src/app/fonts/`. They are still self-hosted OFL fonts; licenses are in `docs/licenses/`. League Gothic is the Latin subset from `@fontsource/league-gothic` 5.3.0; DSEG7 Classic Bold from `dseg` 0.46.0.

## 2026-11-01 Hand-written service worker instead of Serwist

`@serwist/turbopack` isn't installed and adding it needs approval (non-negotiable 12). The spec allows a fallback: `public/sw.js`, hand-written, implementing the same strategies (precache shell + `/app/offline`, NetworkFirst for app pages, StaleWhileRevalidate for Learn and static assets, never `/api/*`). The cache version is stamped with `node scripts/stamp-sw.mjs`.

## 2026-11-01 PGlite for local database tests

Docker isn't available in the build environment, so the local Supabase stack can't run. Database tests run in-process against PGlite (Postgres compiled to WASM) with Supabase-style `auth` stubs and default grants (`npm run db:test:local`, part of `npm test`). CI also runs the pgTAP suite with the Supabase CLI (`supabase test db`).

## 2026-11-01 "DAY N" is the streak day

The Clock's "DAY 12" is the streak day: Day 1 starts at the moment the streak starts or resets (`streakDay()` = whole days elapsed + 1). This matches "Down isn't out. Day 1 starts now." The LED shows elapsed time, so DAY 12 sits over an LED reading 11 days and some hours.

## 2026-11-01 Device mode when Supabase env is empty

With no `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the app keeps the record on the phone (`src/lib/store/device.ts`) using a device engine that applies the same rules as the SQL functions and is unit tested against them. Both modes share one `Store` interface. Device-mode camps are local and may include clearly labelled demo members.

## 2026-11-01 FAQ uses native `<details>`, not Radix Accordion

Phase 1 requires core content to render without JavaScript. Radix Accordion keeps closed panels out of the server HTML, so FAQ answers would be missing without JS. Native `<details>/<summary>` is accessible, keyboard-operable and renders every answer in the HTML.

## 2026-11-01 Landing poster paper uses the constant `--knob` tape-white

The poster is a physical object and keeps the same paper color in dark and light modes (`--knob`, `#ECEAE4`) with `--ink` text. In light mode a hairline edge separates it from the chalk wall.

## 2026-11-01 Turnstile test keys by default

Without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, the pledge-list form uses Cloudflare's published always-pass test keys. If Turnstile's verify endpoint is unreachable and no real secret is set, the route accepts (local dev); with a real secret it fails closed.

## 2026-11-01 OG image font on Workers (superseded: see "OG fonts load through the ASSETS binding")

`src/app/opengraph-image.tsx` reads League Gothic from disk at request time. On Workers there's no filesystem at runtime, so it falls back to the default font. Before launch, either inline the font bytes or pre-render the OG image as a static PNG.

## 2026-11-01 CSP is a strict allowlist, not nonces

Nonces force dynamic rendering, which would make the landing page and the offline shell uncacheable and break the Lighthouse target. `src/proxy.ts` sends a per-route allowlist CSP (Turnstile only on `/`, Razorpay only on Pro/War Chest/onboarding, Google ad domains only on allowlisted ad routes when `NEXT_PUBLIC_ADS_MODE` isn't `house`) plus nosniff, Referrer-Policy, Permissions-Policy and frame-ancestors none. `script-src` still allows `'unsafe-inline'` for Next's inline bootstrap. Revisit with Next's SRI support before launch. HSTS turns on with `ENABLE_HSTS=1` after launch week.

## 2026-11-01 Forfeit amounts are exact

`log_reset` forfeits `amount_minor / 4` (integer paise/cents), so ₹499 Steady forfeits ₹124.75, leaving ₹374.25. The spec's mockups round this to ₹125/₹375; the UI shows the exact figures the database stores.

## 2026-11-01 Rewarded and interstitial ad flows live in `AdSlot`

The round screens and Me render `AdSlot` directly; the 5-second house rewarded card and the once-per-session post-round sheet are implemented once in `src/components/ads/AdSlot.tsx`.

## 2026-11-01 Learn drafts hidden in production

All 12 articles are drafts (empty `reviewed_by`). Production builds hide them ("Articles are with our reviewers") unless `NEXT_PUBLIC_SHOW_DRAFTS=1`; development shows them with a draft note.

## 2026-11-01 `eval:ai` runs through Vitest

Node's type stripping can't resolve the `@/` alias or JSON imports, so `npm run eval:ai` runs `scripts/eval-ai.ts` through Vitest with its own config. Without `ANTHROPIC_API_KEY` it runs against the mock adapter; judgement cases use keyword heuristics and are labelled as needing a real run.

## 2026-11-01 Onboarding draft in sessionStorage during Google sign-in

The Google redirect leaves the page, so the onboarding draft (including the date of birth needed by `complete_onboarding`'s server-side age check) is kept in `sessionStorage` for that tab and removed as soon as onboarding completes. Nothing is written to `localStorage` or the server.

## 2026-11-01 Cache Components off for Workers

On the Workers runtime (`wrangler dev`, workerd) every page render hung until the runtime cancelled it, while route handlers and static assets worked. The worker log said: "Next.js cannot guarantee that Cache Components will run as expected due to the current runtime's implementation of `setTimeout()`." Turning off Partial Prefetching alone didn't help; turning off `cacheComponents` did, and all pages, the OG image and the share card then served on workerd and the Playwright suite passed against it. Revisit when OpenNext documents Cache Components support on Workers.

## 2026-11-01 OG fonts load through the ASSETS binding on Workers

`next/og` images need font bytes, and Workers have no filesystem. `src/lib/server/og-fonts.ts` reads `public/og/*.woff` from disk under Node and falls back to the static `ASSETS` binding (`getCloudflareContext()`) on Workers. Satori can't read `.woff2`, so the OG fonts are `.woff` copies.
