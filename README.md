# WillWar

An 18+ progressive web app for No Nut November and rolling 30-day challenges, styled as an old boxing gym at night ("Fight Night"). The landing page is at `/`; the app lives at `/app` and installs to the home screen.

Read `AGENTS.md` first. The original spec is `MASTER_PROMPT.md` (PDF in `docs/`). Design rules: `docs/design/DESIGN.md`. Product rules: `docs/guardrails/`. What's left for the founder: `docs/HANDOFF.md`.

## Run it

```bash
npm ci
cp .env.example .env.local   # optional; leave Supabase empty for device mode
npm run dev                  # http://localhost:3000
```

With no Supabase values the app runs in **device mode**: the record stays on the phone and every outside service uses a mock. Set the Supabase values for cloud accounts (6-digit email codes or Google) with RLS-protected data.

## Commands

```bash
npm run dev           # dev server
npm run build         # production build
npm run typecheck     # next typegen + tsc
npm run lint          # ESLint
npm test              # Vitest: unit + database (PGlite, no Docker)
npm run db:test:local # database tests only
npm run db:test       # pgTAP via the Supabase CLI (needs Docker)
npm run test:e2e      # Playwright, iPhone 15 + Pixel 8 profiles
npm run content:check # banned health claims, War Chest loss language
npm run eval:ai       # the 18 AI safety cases (mock without ANTHROPIC_API_KEY)
npm run icons         # regenerate PWA icons and iOS launch images
npm run preview       # OpenNext build + local workerd
npm run deploy        # OpenNext build + deploy to Cloudflare
```

## What's in it

- **Landing:** fight-poster hero with a live LED, the chalked 30-day scroll, a hold-to-last demo round, camps, War Chest, corner talk, privacy, Learn, pricing, FAQ.
- **Onboarding:** age gate (date of birth never stored), challenge, reasons, hold-to-sign pledge, tone, handle, account, install coach, reminders, paywall with a visible free path.
- **Today:** the Clock (gym interval timer in DSEG7 digits, lamps, chalk tally, brass plates), check-in, corner talk, reset ("Down isn't out."), shields, the one-time War Chest offer.
- **Go a round:** a 3-minute round with Kitbag, Bag or Combos (Pro), intensity before and after.
- **Camps:** boards (Current / Best / Days), invites, preset nudges, challenges, global board, mute/report.
- **Learn:** 12 evidence-graded draft articles, day pages 1–30.
- **Me and Settings:** stats, calendar, trigger insights, history, privacy, export, delete, appearance.
- **War Chest:** promise mode on; stake mode built behind a flag pending legal sign-off.
- **Pro and ads:** Razorpay (fetch-based, Workers-ready) with a verified, idempotent webhook as the only writer of entitlements; house ads on allowlisted placements only.
- **AI:** corner talk lines and the Pro coach via Claude, with schema checks, output filters, fallbacks, and a crisis pre-screen whose numbers come from config.
- **Database:** 3 migrations, RLS on every table, money functions callable by the server only, 58 in-process database tests.
