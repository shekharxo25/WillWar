# Guardrail: privacy and security

## Why this is the first guardrail

In 2026, 404 Media reported that Quittr, the best-known app in this category, exposed data on more than 600,000 users through a misconfigured Google Firebase backend: ages, how often they masturbated, their triggers, and written confessions. About 100,000 of those users identified as minors. Several researchers warned the company for months before it was fixed.

Supabase has the same failure mode. The publishable key ships in the browser by design, so any table without Row Level Security is readable by anyone who opens DevTools. WillWar's privacy promise ("Your streak is yours") is also its main difference from competitors. One leak ends the company.

Legal context: India's DPDP Act and Rules (notified November 2025, substantive obligations phased in through May 2027) require notice and consent, security safeguards, breach notification, erasure, and verifiable parental consent for anyone under 18, plus a ban on tracking and targeted advertising aimed at children. For EU and UK users, data about a person's sex life is special-category data under GDPR and needs explicit consent. Launch in India, the US and the UK first; add the EU only after a GDPR review.

## Data inventory

Anything not on this list doesn't get stored. Adding a row needs founder approval and a privacy policy update.

| Data | Where | Why | Retention |
|---|---|---|---|
| Email | Supabase Auth | Sign-in, receipts | Until account deletion |
| Handle, avatar seed, timezone, tone, reason tags, preferences | `profiles` | Product | Until deletion |
| Adult confirmation timestamp | `profiles` | Proof the age gate ran | Until deletion |
| Streak start and end times | `streaks` | Clock, leaderboards | Until deletion |
| Daily check-in status | `checkins` | Days kept, calendar | Until deletion |
| Reset tags (fixed list) | `resets` | Trigger insights (Pro) | 24 months, then deleted |
| Urge sessions (game, duration, intensity) | `urge_sessions` | Personal stats | 24 months |
| Morning lines | `affirmations` | Cache | 90 days |
| Pact membership, challenges, preset nudges | pact tables | Social | Until deletion; nudges 90 days |
| Entitlements, payment references | `entitlements` | Pro access | As tax law requires |
| Push subscription endpoints | `push_subscriptions` | Reminders | Until unsubscribed or 410 |
| Goal end date, pledge timestamp | `goals` | Challenge window, War Chest eligibility | Until deletion |
| War Chest amount, rule, cause, status, payment and refund references, events | `war_chests`, `war_chest_events` | The commitment and its refund | Until deletion (an active stake is refunded first) |
| Money movements without user identity | `money_ledger`, `donation_batches` | Accounting, donation receipts | As tax law requires; survives account deletion by design |
| Product events (allowlisted names, no sensitive props) | `events` | Product decisions | 13 months |
| Waitlist emails | `waitlist` | Launch | 90 days after launch unless converted |

**Never stored on the server:** date of birth, real names, free-text reset reasons, journal entries (on-device unless the user opts into an encrypted backup with a passphrase), coach conversations, photos, contacts, precise location, advertising IDs.

## Database rules

1. `alter table ... enable row level security` in the same migration that creates the table.
2. Default deny. Policies grant the minimum: own rows for personal tables, membership-scoped reads for pact tables, nothing for server-only tables.
3. Use `(select auth.uid())` in policies (evaluated once per query).
4. Sensitive writes go through `security definer` functions that:
   - pin `set search_path = ''` and fully qualify every object,
   - check `auth.uid()` is not null,
   - validate every argument,
   - derive dates and times on the server from the profile's timezone.
5. `revoke execute on all functions in schema public from public, anon;` then grant each function to `authenticated` explicitly.
6. Column-level grants on `profiles`: users can update preferences only, not identity or age fields.
7. Views that expose other people's data are `security_invoker` or replaced by RPCs that return only handle and numbers.
8. `anon` can read only `seasons`.
9. Realtime: private channels with Realtime Authorization; payloads carry no user data (`{"type":"refresh"}`).

## Tests that must exist and pass in CI

- **RLS gate:** zero `public` tables without RLS; zero `security definer` functions without a pinned `search_path` (`supabase/tests/00_rls_gate.sql`).
- **Cross-user:** as user A, every select on user B's personal rows returns zero rows; every RPC that targets B's data raises.
- **Non-member:** pact tables and `pact_leaderboard` return nothing to non-members.
- **REST probe (pre-release):** with only the publishable key, call `/rest/v1/<table>?select=*` for every table and confirm each returns an empty array or a permission error. This is the exact test that would have caught the Quittr exposure.
- **Supabase advisors:** `supabase db lint` and the dashboard security advisor show no errors.

## Keys and secrets

- Browser: Supabase URL and publishable key only.
- Server (Worker secrets): Supabase secret key, Anthropic key, Razorpay secret and webhook secret, VAPID private key, Turnstile secret.
- `lib/supabase/admin.ts` imports `server-only`; a lint rule blocks importing it from client components.
- Secrets never appear in logs, error messages, URLs or the repo. Rotate any key that leaks immediately.

## Transport and headers

HTTPS only (HSTS after launch week). CSP with nonces; third-party script origins only on the routes that need them (Turnstile on forms; ad domains on allowlisted ad routes). `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` denying camera, microphone, geolocation. No personal data in URLs or query strings.

## Third parties (allowlist)

| Vendor | Gets | Never gets |
|---|---|---|
| Supabase | All stored data | — |
| Cloudflare | Traffic, cookieless web analytics on public pages | — |
| Anthropic (Claude API) | The minimal morning-line context; coach messages from Pro users | Email, handle, reset tags. Review the provider's current data-retention terms and disclose them in the privacy policy. |
| Razorpay | Payment details, email, War Chest payment and refund amounts | Any streak or behavior data; notes on payments contain only internal IDs |
| Resend | Email address, sign-in codes | Behavior data |
| Google AdSense / H5 Games Ads | Page context on allowlisted routes | Anything from Today, urge, reset, stats or settings |
| Error monitoring (optional) | Scrubbed stack traces | Request bodies, user text, session replay |

## Logging

Structured logs with request IDs. Never log request or response bodies for `/api/coach`, `/api/affirmation`, reset or auth routes. Redact emails and tokens.

## User rights

- Export: Settings → Export my data produces a JSON of everything in the inventory for that user.
- Delete: Settings → Delete my account first refunds any active War Chest stake, then removes the auth user (cascades to all rows); backups age out on Supabase's schedule; the privacy policy states that window.
- Grievance contact published in the privacy policy and on /support, answered within the timeline the DPDP Rules set.

## Breach response

`docs/runbooks/incident.md` covers: contain (rotate keys, lock tables), assess scope, notify the Data Protection Board of India and affected users as the DPDP Rules require (including the detailed report within 72 hours), notify other regulators where applicable, publish a plain-language account, and fix the root cause with a test that would have caught it. Never deny a reported vulnerability without investigating it, and thank and credit researchers.
