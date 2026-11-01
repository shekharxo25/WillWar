# Build plan (Part 9)

Each phase ends with typecheck, lint, unit tests, database tests, a production build, and a commit. Don't move on with failures.

| # | Phase | Done when |
|---|---|---|
| 0 | Foundation: Next 16 (TS strict, `src/`, Tailwind v4), OpenNext Cloudflare config (`wrangler.jsonc` with `nodejs_compat`; scripts `preview`, `deploy`, `cf-typegen`), Zod env, tokens and fonts, Supabase migration + seed + tests, security headers, GitHub Actions CI, adapters with mocks, project memory files. Delete older kit files. | `npm run preview` serves in local workerd; CI config present; the RLS gate fails if RLS is disabled on any table. |
| 1 | Landing page with the poster, live LED, chalk scroll, hold-to-last demo, pricing, FAQ, legal placeholders, OG image, sitemap, robots, `/ads.txt`, pledge-list form with Turnstile. | Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility; CLS < 0.05; core content renders without JS; the demo works with touch, mouse and keyboard. |
| 2 | PWA shell: manifest, iOS tags, service worker, AppShell (titles, smoked-glass tab bar, Go a round button, safe areas, View Transitions), install coach, offline page. | Installable on Android Chrome and iOS Safari (documented manual steps); offline shell loads; no `/api` responses cached. |
| 3 | Auth and onboarding: `@supabase/ssr`, `proxy.ts` for `/app/*`, email codes, Google, pledge, `complete_onboarding`, `sign_pledge`, join-code stash. | Under-18 blocked with nothing stored; full onboarding passes in Playwright on both profiles. |
| 4 | Today, the Clock, check-ins, reset, shields, offline queue, Me. | Clock correct after sleep; check-in idempotent; offline check-in syncs once; reset keeps best streak and tally. |
| 5 | Go a round with Kitbag, Bag and Combos. | 60fps on a mid-range Android profile (trace saved); one-handed; free users can't record Combos. |
| 6 | Corner talk and coach. | All eval cases pass; model unreachable still yields a fallback within 9 seconds; no message text in logs or events. |
| 7 | Camps: screens, boards, challenges, nudges, realtime refresh, global board, share card, report, mute. | Database tests for camp isolation and board math pass; nudge limit enforced on the server. |
| 8 | Learn and SEO: MDX pipeline, content check, 12 drafts, day pages, Sponsored slot. | Build fails on a published article without sources or grade; content check passes. |
| 9 | Pro and ads: plans, Razorpay checkout and webhook, paywall, entitlements, AdSlot with house ads, rewarded shields. | Entitlements change only through the verified webhook; ad-placement crawl passes; Pro sees zero ads. |
| 10 | War Chest: promise mode on, stake mode built behind the flag and tested with the payment mock. | Offer appears once after the first held day and never on `/app/round`, `/app/pro` or between 23:00 and 06:00; mock end-to-end pay → reset → cancel → refund → ledger balances; forged calls can't move money; with the flag off nothing renders. |
| 11 | Push and retention. | Mock push path tested; real push documented for the founder to verify on devices. |
| 12 | Hardening: REST probe of every table with only the publishable key, dependency audit, CSP enforced, rate limits, export and delete end-to-end, War Chest settlement dry run, incident runbook, `docs/HANDOFF.md`. | Every item has proof listed in the handoff (`docs/guardrails/release-checklist.md`). |
