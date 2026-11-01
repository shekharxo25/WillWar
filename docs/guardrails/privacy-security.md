# Privacy and security

Covers non-negotiables 1–3, 10 and 11, the data inventory, keys, logging, user rights and breach steps.

Context: the best-known app in this category exposed data on 600,000+ users (about 100,000 of them minors) through a misconfigured backend. One leak ends the company.

## Rules

1. **RLS on every table, enforced by CI** (`supabase/tests/`). Sensitive writes only through `security definer` functions with `set search_path = ''`, or server routes using the secret key. The secret key (`SUPABASE_SECRET_KEY`) never reaches the browser; `src/lib/supabase/admin.ts` imports `server-only`.
2. **No free text about sexual behavior on the server.** Reset reasons are fixed tags. The journal lives on the device (IndexedDB); encrypted backup is opt-in with a passphrase. Coach conversations are never stored. Logs and analytics never contain message text.
3. **18+ only.** Age gate before account creation; the date of birth is checked once (`complete_onboarding`) and never stored; nothing is collected from under-18s. India's DPDP Act requires verifiable parental consent for under-18s and bans tracking and targeted ads aimed at them.
4. **Discreet by default.** Notifications, email subjects, the manifest name and in-app titles never mention the challenge's subject unless the user turns discretion off.
5. **No new third-party scripts under `/app`.** No session replay anywhere. Analytics: Cloudflare Web Analytics on public pages plus the first-party `events` table.

## Data inventory (store nothing else)

| Data | Where | Why | Retention |
|---|---|---|---|
| Email | Supabase Auth | Sign-in, receipts | Until account deletion |
| Handle, avatar seed, timezone, tone, reason tags, preferences | `profiles` | Product | Until deletion |
| Adult confirmation timestamp | `profiles` | Proof the age gate ran | Until deletion |
| Streak start and end times | `streaks` | Clock, boards | Until deletion |
| Daily check-in status | `checkins` | Days kept, calendar | Until deletion |
| Reset tags (fixed list) | `resets` | Trigger insights (Pro) | 24 months |
| Urge sessions (game, duration, intensity) | `urge_sessions` | Personal stats | 24 months |
| Corner talk lines | `affirmations` | Cache | 90 days |
| Camp membership, challenges, preset nudges | camp tables | Social | Until deletion; nudges 90 days |
| Entitlements, payment references | `entitlements` | Pro access | As tax law requires |
| Push subscription endpoints | `push_subscriptions` | Reminders | Until unsubscribed or 410 |
| Goal end date, pledge timestamp | `goals` | Challenge window, War Chest eligibility | Until deletion |
| War Chest amount, rule, cause, status, payment and refund refs, events | `war_chests`, `war_chest_events` | The commitment and its refund | Until deletion (an active stake is refunded first) |
| Money movements without user identity | `money_ledger`, `donation_batches` | Accounting, donation receipts | As tax law requires; survives deletion by design |
| Product events (allowlisted names, no sensitive props) | `events` | Product decisions | 13 months |
| Waitlist emails | `waitlist` | Launch | 90 days after launch unless converted |

**Never stored on the server:** date of birth, real names, free-text reset reasons, journal entries, coach conversations, photos, contacts, precise location, advertising IDs.

## Keys

| Key | Where it may live |
|---|---|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser (RLS protects data) |
| `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `VAPID_PRIVATE_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET` | Worker secrets only (`wrangler secret put`), never `NEXT_PUBLIC_*`, never committed |

Rotate any key that appears in a log, a screenshot or a commit.

## Logging

- Never log request bodies from `/api/coach`, `/api/corner`, `/api/waitlist`, or any email address.
- Errors log a code and a route, not user content.
- `crisis_card_shown` is the only event recorded around crisis handling, with no text.

## Security headers

CSP with nonces (set in `src/proxy.ts`), HSTS after launch week, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone and geolocation. Rate limits on every POST route. No personal data in URLs.

## User rights

- Export: Settings → Export my data (`/api/account/export`), JSON of everything stored about the user.
- Delete: Settings → Delete my account. Refunds any War Chest stake first; blocks with "We're returning your War Chest first. Try again in a few minutes." if the refund call fails. Then deletes the auth user (cascades every user table). `money_ledger` keeps unlinked amounts.
- Under-18 indication: suspend and queue for deletion (founder review).

## Breach steps

1. Contain: rotate the exposed key(s), disable the affected route or policy.
2. Assess: which tables, which users, which period. Use Supabase logs; don't copy user data out.
3. Notify: the Data Protection Board of India and affected users as the DPDP Act requires (and other regulators where users are), in plain language.
4. Fix and test: add a regression test (RLS probe, pgTAP) before re-enabling.
5. Write it up in `docs/incidents/` with the timeline.
