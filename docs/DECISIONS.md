# Decisions

Deviations from `MASTER_PROMPT.md`, and choices it left open. Newest last.

## 2026-11-01 Next.js 16.4.3, not 16.2.x

The spec asks for the newest 16.2.x patch (≥ 16.2.6). `@opennextjs/cloudflare` 1.20 declares `next >=15.5.28 <16 || >=16.4.1`, so 16.2.x can't deploy to Workers with the current adapter. We use 16.4.3 (latest stable on 1 Nov 2026). Cache Components and Partial Prefetching are on (the create-next-app defaults for 16.4).

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

## 2026-11-01 OG image font on Workers

`src/app/opengraph-image.tsx` reads League Gothic from disk at request time. On Workers there's no filesystem at runtime, so it falls back to the default font. Before launch, either inline the font bytes or pre-render the OG image as a static PNG.
