# Release checklist (Phase 12 hardening)

Every item needs proof (test output or a screenshot path) recorded in `docs/HANDOFF.md`.

- [ ] REST probe of every table with only the publishable key returns nothing it shouldn't (anon and a fresh authenticated user)
- [ ] `supabase test db` passes: RLS on every table, security definer functions pin `search_path`, money functions server-only
- [ ] Cross-user tests pass (streaks, check-ins, resets, rounds, corner talk, entitlements, War Chests); non-members get nothing from camp tables
- [ ] Dependency audit (`npm audit --omit=dev`) reviewed; no high or critical issues in runtime deps
- [ ] CSP enforced (not report-only) with nonces; HSTS on after launch week
- [ ] Rate limits on every POST route
- [ ] Export and delete work end to end, including a War Chest refund before deletion
- [ ] War Chest settlement dry run: pay → reset → cancel → refund → ledger balances (payment mock)
- [ ] Ad-placement crawl passes as a free user; Pro sees zero ads
- [ ] `npm run content:check` passes
- [ ] `npm run eval:ai` passes all 18 cases with the real model
- [ ] Lighthouse mobile on `/`: performance ≥ 90, accessibility ≥ 95, CLS < 0.05
- [ ] Installed on an iPhone and an Android phone; offline shell loads; no `/api` responses cached
- [ ] Push reminder received on both devices from a tap-initiated subscription
- [ ] Sign-in by code inside the installed iOS app
- [ ] Rounds hold 60fps on a mid-range Android (performance trace saved)
- [ ] `NEXT_PUBLIC_WAR_CHEST_MODE` is `promise` (or `off`) unless the legal sign-off is complete
- [ ] Incident runbook written (`docs/guardrails/privacy-security.md`, Breach steps)
- [ ] `docs/HANDOFF.md` updated
