# Changelog

## 2026-11-01

### Added
- **The app behind the landing page:**
  - onboarding with account creation (device account, or email code and Google with Supabase)
  - Today with the Tide clock, check-in, reset, shields and the one-time War Chest offer
  - Ride it out with Drift, Swell and Knots
  - Me, Settings, the Pro paywall, the War Chest (promise mode), Pacts, Learn, sign-in, and offline and coach screens
- **Device mode:** the full app works with no backend. Data stays in IndexedDB and uses the same rules as the database.
- **Database:** the core migration from the build plan, plus app RPCs:
  - handle check, avatar seed, and timezone changes once a week
  - event allowlist and the user's own pacts list
  - leave, mute and report
  - server-only shields capped at two a week
- **Database tests:** run the real migrations in PGlite (`npm run db:test:local`).
- **API routes:** account export and delete, rewarded shield, and the morning line (curated lines).
- **PWA:** manifest, generated icons and iOS launch images, and the service worker (shell precache; `/api/*` never cached).
- **Pages:** legal and support.

- **AI:**
  - Claude morning lines: schema check, safety filters, retry, curated fallback.
  - The streaming Pro coach with the crisis protocol.
  - The 18-case eval suite (`npm run eval:ai`).
- **Payments:**
  - Razorpay checkout, and the verified, idempotent webhook.
  - War Chest stake checkout (off by flag) and settlement refunds.
  - Monthly Pro shields.
- **Push reminders:** the subscription route, the reminder schedule in SQL, and the `send-reminders` Edge Function.
- **Also added:**
  - the global season board
  - the remaining eight Learn drafts
  - the Learn sponsored house card
  - `npm run content:check`
  - `scripts/combine-migrations.mjs`, which writes one SQL file for the Supabase SQL editor
  - `npm run eval:ai` reads `ANTHROPIC_API_KEY` from `.env.local`

### Fixed
- Onboarding no longer skips the install, reminders and paywall steps right after the account is created.
- The Tide clock fits beside the milestone ticks at 375px.
- Curated morning lines now meet the 12–40 word rule.
- The CSP sends `upgrade-insecure-requests` only on HTTPS sites. Safari applied it to http://localhost, which broke local production builds.
- Article pages read their slug inside a Suspense boundary, so in-app navigation stays instant.

### Changed
- **Landing page redesigned** as a night-to-dawn scroll journey:
  - a living, pointer-reactive ocean hero
  - the 30-day signature, with a brass medal at each milestone
  - playable wave, pact and War Chest demos
  - colours from the brand's own water themes (Harbor, Glacier, Dawn) and brass
- **Every CTA** now leads into `/app/start`; "Sign in" goes to `/app/sign-in`.

### Decisions
- **CSP:** a static header without nonces, because Cache Components' static shells can't carry per-request nonces.
- **Service worker:** hand-written `public/sw.js` (the build plan's documented fallback) instead of Serwist under OpenNext.
- **Learn:** drafts are excluded from production builds until a reviewer is set (content guardrail).
