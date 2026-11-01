# WillWar handoff

Written 1 November 2026 at the end of the one-session build. Every "works" below was run in this session; anything not run says so.

## 1. What works now, and how to see it

```bash
npm ci
npm run dev            # http://localhost:3000
```

- `/` landing page → "Start my 30 days" → `/app/start` onboarding → `/app/today`.
- With no Supabase env values the app runs in **device mode**: the record lives in the phone's `localStorage` (`ww.device.v1`) and nothing leaves the device. Everything works except real friends in camps, Pro payments, the live coach model, push and cross-device sync.
- Dev-only mock checkout: `/app/dev/payments` (404 in production) has "Simulate payment success" / "Simulate refund processed".
- Demo accounts: device mode needs none (onboard in 30 seconds). In cloud mode, `supabase/seed.sql` adds local-only demo users `rohan_k`, `dev_s`, `quietmile` and a demo camp.

**On your phone over Wi-Fi:** run `npm run build && npx next start -H 0.0.0.0 -p 3000`, then open `http://<your-computer's-LAN-IP>:3000` on the phone. Installing (Add to Home Screen) and the service worker need HTTPS, so for the install test use a tunnel (`npx cloudflared tunnel --url http://localhost:3000`) or deploy a preview.

### Verified in this session

- [x] `npx tsc --noEmit`, `npm run lint`: clean
- [x] `npm test`: 179 tests (time maths across Kolkata/New York DST/London, device engine, 58 PGlite database tests incl. RLS gate, cross-user isolation, camp isolation, board maths, War Chest money rules, payments/webhooks, ads allowlist, AI filters and crisis terms, Learn schema, games countdown and Kitbag partition)
- [x] `npm run eval:ai`: 18/18 against the mock adapter
- [x] `npm run content:check`: passes
- [x] `npx next build`: 106 routes
- [x] `npx playwright test`: 6/6 on iPhone 15 and Pixel 8 profiles (under-18 blocked with nothing stored; full onboarding; check-in idempotent; ad crawl finds no ads outside the allowlist)
- [x] Screenshots of every main screen in `docs/screenshots/`

### Not verified

- [x] OpenNext build + local workerd (`wrangler dev`): every page, the OG image and the share card return 200; Playwright 6/6 against it
- [ ] A real Cloudflare deploy (blocked: this environment's network policy denies `api.cloudflare.com`)
- [ ] Lighthouse scores (target: performance ≥ 90, accessibility ≥ 95, CLS < 0.05)
- [ ] pgTAP files under real pgTAP (`supabase test db`); they ran through a PGlite shim only
- [ ] 60fps on a mid-range Android, with a performance trace
- [ ] Real push delivery; the Edge Function was written against `@negrel/webpush`'s documented API without fetching it
- [ ] Any real Razorpay, Anthropic, Supabase or Google call

## 2. What's mocked, and the env vars that switch it to real

| Service | Mock today | Switch to real |
|---|---|---|
| Accounts and data | Device mode | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |
| Corner talk and coach | Curated lines and a scripted coach | `ANTHROPIC_API_KEY` (model `ANTHROPIC_MODEL`, default `claude-haiku-5-5`) |
| Payments and refunds | Mock adapter plus `/app/dev/payments` | `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_ANNUAL_PLAN_ID` |
| Ads | House ads | `NEXT_PUBLIC_ADS_MODE=adsense` or `h5` plus `NEXT_PUBLIC_ADSENSE_CLIENT`, only after Google approval |
| Push | Off, with a note in Settings | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`; Edge Function secret `VAPID_KEYS_JSON` |
| Bot check | Cloudflare test keys | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Email codes | Supabase local mail catcher (Inbucket) | Resend as custom SMTP in Supabase Auth |
| War Chest | Promise mode, no money moves | `NEXT_PUBLIC_WAR_CHEST_MODE=stake` **only after legal sign-off (section 5)** |
| Cron | n/a | `CRON_SECRET` for `/api/cron/war-chest-settle` |

## 3. Accounts and keys to create

- [ ] **Cloudflare**: account, Workers, Turnstile widget, Web Analytics (public pages only)
- [ ] **Supabase**: create a project, apply `supabase/migrations/*` in order, then `seed.sql` without the demo users (see `supabase/README.md`). In Auth: enable email OTP with 6 digits, site URL, and the redirect `https://<domain>/app/auth/callback`. Set up custom SMTP (Resend) with plain subject lines. Enable pg_cron and pg_net.
- [ ] **Anthropic API** key, then `npm run eval:ai` until all 18 cases pass against the real model
- [ ] **Razorpay**: test mode first, then live. Webhook to `https://<domain>/api/razorpay/webhook` for: payment.captured, subscription.activated, subscription.charged, subscription.halted, subscription.cancelled, subscription.completed, refund.processed, refund.failed. Create the annual plan (₹799) and set `RAZORPAY_ANNUAL_PLAN_ID`.
- [ ] **Resend** domain verification
- [ ] **Google OAuth** client (Supabase Auth → Google). Test sign-in inside the installed app.
- [ ] **AdSense** application, and separately the **H5 Games Ads** beta. House ads run until both are approved.
- [ ] **VAPID keys**: `npx web-push generate-vapid-keys`, or the JWK pair the Edge Function expects

## 4. Domain (Hostinger → Cloudflare)

- [ ] Cloudflare → Add site → copy the two nameservers
- [ ] Hostinger hPanel → turn off DNSSEC if it's on → change the nameservers → wait for Cloudflare to show Active → re-enable DNSSEC in Cloudflare
- [ ] SSL/TLS mode Full (strict)
- [ ] `npm run deploy`, then add Worker custom domains for the apex and `www`, with a redirect from `www` to the apex
- [ ] Cron Trigger daily at 02:00 UTC calling `POST /api/cron/war-chest-settle` with the `x-cron-secret` header (already in `wrangler.jsonc`; check that it fires)
- [ ] Set every server secret with `wrangler secret put`
- [ ] After launch week: `ENABLE_HSTS=1`

## 5. Approvals and reviews

- [ ] **War Chest stake mode legal sign-off.** The full checklist is in `docs/guardrails/war-chest.md`: Indian counsel on the Online Gaming Act 2025, BUDS Act 2019, RBI escrow and payment-aggregator rules, state laws, e-commerce disclosures, and GST/tax; Razorpay's written approval; charity agreements; the War Chest terms; refund operations tested end to end. Until then, keep `NEXT_PUBLIC_WAR_CHEST_MODE=promise`.
- [ ] **Vet real causes.** Replace the two placeholders in `src/lib/config/causes.ts` and `supabase/seed.sql`; the seeded rows are `active = false`.
- [ ] **Review the 12 Learn articles** (founder, ideally a clinician too). Check every citation and fill in `reviewed_by` and `reviewed_on` in each `content/learn/*.mdx`. Drafts stay hidden in production until then.
- [ ] **Review the 120 corner-talk fallback lines** in `content/corner-talk.json`
- [ ] **Counsel review** of `/privacy`, `/terms` and `/health` (currently marked as drafts)
- [ ] **Trademark search for "WillWar".** Web results for "will war" include gambling spam pages; keep the one-word spelling everywhere.
- [ ] **A licensed bell sample** at `public/sounds/bell.mp3`. It's missing, and the round bell fails silently without it.
- [ ] **Dependency approvals:** a QR library (invites share a link and code today) and, optionally, Serwist

## 6. Device checks only you can do

- [ ] Install on an iPhone (Safari → Share → Add to Home Screen) and on an Android phone (Chrome → Install)
- [ ] Sign in with an email code *inside the installed app*; also Google
- [ ] Turn on reminders from Settings in the installed app, then receive one
- [ ] Airplane mode: the Clock keeps running, `/app/offline` loads, a check-in syncs once you're back online
- [ ] A Kitbag, Bag and Combos round each feel smooth (60fps) on a mid-range Android
- [ ] Dark and light mode, the app badge, the wake lock during a round

## 7. Known gaps and decisions

Decisions with reasons are in `docs/DECISIONS.md`. Known gaps:

- **CSP:** a strict per-route allowlist instead of nonces, because nonces would make static pages dynamic. `script-src` still allows `'unsafe-inline'`.
- **Rate limits** run in memory per Worker isolate, so they only stop bursts. The coach's 20-turns-a-day counter is also in memory. The limits that matter (nudges, shields, money) are enforced in the database.
- **Offline cloud check-ins** are dated by the server when they sync, so a check-in made offline at 23:50 and synced after midnight counts for the next day.
- **Device-mode camps** contain labelled demo members. Mute, report and remove only show a toast, and joining another person's code can't work without the cloud.
- **The View Transitions shared-element expand** from the Go a round button into the round housing isn't wired. The round opens as a normal page change.
- **The corner-talk API trusts client-sent context**, limited to the allowed fields. A stricter version would build it on the server in cloud mode.
- **The Edge Function** expects `VAPID_KEYS_JSON`, a JWK pair, rather than `VAPID_PRIVATE_KEY`.
- **The paywall shows INR prices only**, and the dev mock grants a season pass for 30 days.
- **Ending a round early** shows "YOU SHOWED UP." (copy not in the spec); review it.
- **The old README described an earlier ocean-themed build** that wasn't in the repo. It has been replaced.
