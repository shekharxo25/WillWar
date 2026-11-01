# Supabase

Apply the migrations in order:

| File | What it does |
|---|---|
| `20261101000001_core.sql` | The reference schema from `docs/BUILD_PLAN.md` §5: tables, RLS on every table, the core RPCs, and the War Chest money functions (server-only) |
| `20261101000002_app.sql` | App RPCs: handle check, onboarding with avatar seed, timezone (once a week), event allowlist, my pacts, leave/mute/report, invite regeneration, server-only shields |
| `20261101000003_payments.sql` | Webhook idempotency, entitlements (server-only), monthly Pro shields (pg_cron when available) |
| `20261101000004_push.sql` | `due_reminders()` for the reminder job (server-only) |
| `20261101000005_global_board.sql` | The opt-in global season board |

Then load `seed.sql`, which holds the placeholder causes (replace them before launch) and the handle filter terms.

Without the CLI, run `node scripts/combine-migrations.mjs` and paste the generated `supabase/apply-all.sql` (every migration in order, then the seed; gitignored) into the SQL editor of a fresh project.

## Tests

- `npm run db:test:local` runs the real migrations in PGlite (no Docker), with Supabase-like roles and grants.
- `npm run db:test` runs the pgTAP files in `tests/` through the Supabase CLI, in CI.

## Reminders

1. Generate VAPID keys (`npx web-push generate-vapid-keys`) and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for the app.
2. Deploy the function and set its secrets: `supabase functions deploy send-reminders`, then `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:...`.
3. Schedule it every 15 minutes with pg_cron and pg_net in the SQL editor, reading the service role key from a Vault secret:

```sql
select cron.schedule('willwar-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'))
  );
$$);
```
