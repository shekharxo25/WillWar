# Guardrail: release checklist

Every production release ticks every item, with a link to proof (test output, screenshot or PR). Items marked ★ block release even for hotfixes.

## Security and privacy

- [ ] ★ `npm run db:test` green, including the RLS gate and cross-user tests
- [ ] ★ REST probe with only the publishable key returns empty results or permission errors for every table
- [ ] ★ No secret key, API key or token in the client bundle (search the build output)
- [ ] `supabase db lint` and the Supabase security advisor show no errors
- [ ] Dependency audit: no high or critical advisories without a documented exception
- [ ] Next.js on the latest 16.x security patch
- [ ] CSP enforced (not report-only); third-party origins only on their allowlisted routes
- [ ] Rate limits on every POST route; Turnstile on the pledge form and auth
- [ ] Logs contain no request bodies for coach, affirmation, reset or auth routes
- [ ] Data inventory in `privacy-security.md` matches the schema and the privacy policy
- [ ] Export and delete tested end-to-end on a real account

## Content and AI

- [ ] ★ `npm run content:check` green; every published article has a grade, sources and a reviewer
- [ ] ★ `npm run eval:ai` passes every must-pass case
- [ ] Morning-line fallback works with the model unreachable
- [ ] Crisis card shows correct resources for India, the US and the UK; every tel: link dials correctly on a phone

## Ads and payments

- [ ] ★ Playwright ad-placement crawl: no ad scripts or iframes outside the allowlist; zero ads for Pro
- [ ] Razorpay webhook signature verification and idempotency tested with replayed and forged payloads
- [ ] Cancellation, expiry and failed renewal downgrade correctly
- [ ] Paywall shows "Continue with Free" with equal clarity; prices include taxes; cancel path works in two taps

## War Chest

- [ ] ★ pgTAP War Chest tests green, including "money-moving functions are server-only"
- [ ] ★ Stake mode is `off` or `promise` in production unless the legal sign-off in `war-chest.md` is complete and confirmed in writing
- [ ] Offer appears once after the first held day, never in Ride it out, at night, after a crisis card, or near ads or the paywall (Playwright)
- [ ] Settlement dry-run: every due chest refunded or settled; per chest, funded = refunded + forfeited
- [ ] Monthly donation batches created and receipts published at `/war-chest/report`
- [ ] Account deletion with an active stake refunds first

## PWA and quality

- [ ] Installed and smoke-tested on the device matrix in `pwa-native-feel.md`
- [ ] Offline: clock runs, check-in queues and syncs once
- [ ] Push received on an installed iPhone and Android; discreet copy by default
- [ ] Lighthouse mobile on `/`: Performance ≥ 90, Accessibility ≥ 95; app routes Accessibility ≥ 95
- [ ] Games hold 60fps on a mid-range Android phone
- [ ] Reduced motion, dark mode, 375×667 and 393×852 checked on every changed screen
- [ ] Timezone tests pass (Asia/Kolkata, America/New_York including the 1 Nov DST change, Europe/London)

## Legal and operations

- [ ] Privacy policy, terms, health disclaimer and grievance contact published and current
- [ ] 18+ statement on landing, onboarding and terms
- [ ] Supabase backups enabled; restore tested once
- [ ] Error monitoring scrubs PII; no session replay
- [ ] `docs/runbooks/incident.md` current, with the DPDP breach-notification steps
- [ ] `docs/CHANGELOG.md` updated
