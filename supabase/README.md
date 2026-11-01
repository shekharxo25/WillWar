# WillWar database

Postgres on Supabase. Every table has RLS; sensitive writes go only through `security definer`
functions with `set search_path = ''`; money functions are `service_role` only.

## Files

| Path | What |
|---|---|
| `migrations/0001_core.sql` | Part 5 of the master prompt: tables, RLS, core RPCs, War Chest, camp board |
| `migrations/0002_social.sql` | Global season board (materialized view + `season_leaderboard`), `set_timezone`, mutes, reports, `create_challenge`, `leave_camp`, `remove_member`, `regenerate_invite_code`, `change_goal_end`, Realtime authorization for `camp:<id>` |
| `migrations/0003_money_ops.sql` | `apply_entitlement`, `record_webhook_event`, shields, donation batches, export/delete, retention purge, `due_reminders` |
| `seed.sql` | The season, two **inactive** placeholder causes, and demo users (local only) |
| `tests/*.sql` | pgTAP, run by `supabase test db` in CI |
| `tests/*.test.ts` | The same checks and more, in-process with PGlite (`npm run db:test:local`, no Docker) |
| `functions/send-reminders/` | Edge Function: daily reminders and camp nudges over Web Push |

## Local stack (needs Docker)

```bash
supabase start            # API :54321, DB :54322, Studio :54323, mail catcher :54324
supabase db reset         # applies migrations/* in order, then seed.sql
supabase test db          # pgTAP files in tests/
```

Copy the printed API URL and publishable key into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and the secret key into `SUPABASE_SECRET_KEY`.
Sign-in codes appear in the mail catcher at http://localhost:54324.

Demo users (local only, no passwords): `rohan_k` (global board), `dev_s`, `quietmile`, in camp
"Night shift" with invite code `demo000001`.

## Without Docker

```bash
npm run db:test:local     # PGlite + Supabase-style roles, auth.uid(), default grants
```

This applies every migration and the seed, then runs the RLS gate, cross-user isolation, anon
denial, camp isolation, board math across Asia/Kolkata, America/New_York (1 Nov 2026 DST change)
and Europe/London, nudge limits, Combos-is-Pro, War Chest eligibility, Steady/Strict forfeits,
the 24-hour cancel window, settlement math, ledger balance and server-only money functions.
It also runs the pgTAP files through a small pgTAP shim.

## Production project

1. Create the project. Auth > Providers > Email: enable, **OTP length 6**, confirm email off
   (the code is the confirmation). Auth > URL configuration: site URL `https://<domain>`, redirect
   `https://<domain>/app/auth/callback`. Auth > SMTP: Resend (see `src/lib/adapters/email.ts`).
2. Apply migrations: `supabase link --project-ref <ref>` then `supabase db push`.
   Run only the first block of `seed.sql` (season + causes). **Never the demo users.**
3. Replace the placeholder causes with vetted ones (`active = true`) before turning on the War Chest.
4. Extensions: enable `pg_cron` and `pg_net` (Database > Extensions), then re-run the scheduling
   blocks (they skip silently when pg_cron is missing):

```sql
select cron.schedule('season-board-refresh', '*/5 * * * *', 'select public.refresh_season_board()');
select cron.schedule('purge-expired', '17 3 * * *', 'select public.purge_expired()');
select cron.schedule('pro-monthly-shields', '23 0 1 * *', 'select public.grant_pro_monthly_shields()');
```

### Reminders (Edge Function)

```bash
npx jsr:@negrel/webpush/generate-vapid-keys > vapid.json     # or the library's documented generator
supabase secrets set VAPID_KEYS_JSON="$(cat vapid.json)" VAPID_SUBJECT=mailto:hello@<domain>
supabase functions deploy send-reminders
```

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (base64url public key) and `VAPID_PRIVATE_KEY` in the app so
`/api/push/subscribe` accepts subscriptions. Schedule every 15 minutes:

```sql
select cron.schedule('send-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb)
$$);
```

(Store the key in Vault and read it with `vault.decrypted_secrets` rather than inlining it.)
The function deletes subscriptions that return 404/410 and respects quiet hours 23:00–07:00
local unless the user turned on Night watch. Copy is discreet by default.

### War Chest settlement

A Cloudflare Cron Trigger calls `POST /api/cron/war-chest-settle` daily at 02:00 UTC with header
`x-cron-secret: $CRON_SECRET`. It runs `settle_due_war_chests()`, refunds each stake (stake minus
forfeits) with `X-Refund-Idempotency = war_chest_id`, records it with `record_refund`, and
refreshes this month's `donation_batches`. Failures stay `settling` and retry next run.

## Reconstructed lines

The master prompt was extracted from a PDF that cut long lines at the right margin. These were
completed from context in `0001_core.sql`: the `resets.tags` check array cast and closing; table
trailing comments; the `war_chest_events` policy role (`to authenticated`); the profiles column
grant list; the `log_reset` forfeit expression, update, event and ledger inserts; `use_shield`
error code, `for update skip locked` and the shielded insert; the `send_nudge` limit (`>= 3`, i.e.
three a day); `start_goal`'s season filter and `on conflict do nothing`; the eligibility `held`
filter; the column lists in `create_promise_chest`, `create_stake_chest`, `activate_stake_chest`,
`record_refund`; `settle_due_war_chests` mode filters; the board window lateral; and the
`complete_onboarding` / money-function grant signatures.
