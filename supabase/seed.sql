-- WillWar seed. Runs after the migrations (supabase db reset).
-- The season row is created by 0001_core.sql; repeated here idempotently.
insert into public.seasons (id, name, starts_on, ends_on)
values ('nnn-2026', 'No Nut November 2026', '2026-11-01', '2026-11-30')
on conflict (id) do nothing;

-- Placeholder causes. INACTIVE until the founder vets real charities (docs/HANDOFF.md).
-- Promise chests can't be created against inactive causes, so War Chest setup stays off
-- in cloud mode until real causes replace these.
insert into public.causes (id, name, country, url, active) values
  ('placeholder-in', 'Placeholder cause (India)', 'IN', 'https://example.org/cause-in', false),
  ('placeholder-global', 'Placeholder cause (global)', 'GLOBAL', 'https://example.org/cause-global', false)
on conflict (id) do nothing;

-- ===================================================================================
-- LOCAL TESTING ONLY. Demo users for the local Supabase stack. Never run against
-- production: these accounts have fixed ids and no passwords.
-- ===================================================================================
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rohan.demo@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev.demo@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quietmile.demo@example.com', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, handle, avatar_seed, adult_confirmed_at, timezone, tone, why_tags, leaderboard_visibility)
values
  ('00000000-0000-4000-8000-0000000000a1', 'rohan_k', 'a1b2c3', now(), 'Asia/Kolkata', 'coach', '{focus}', 'global'),
  ('00000000-0000-4000-8000-0000000000a2', 'dev_s', 'd4e5f6', now(), 'Asia/Kolkata', 'steady', '{discipline}', 'camps'),
  ('00000000-0000-4000-8000-0000000000a3', 'quietmile', '778899', now(), 'Europe/London', 'stoic', '{sleep}', 'camps')
on conflict (id) do nothing;

insert into public.streaks (user_id, started_at, ended_at) values
  ('00000000-0000-4000-8000-0000000000a1', now() - interval '14 days 5 hours', null),
  ('00000000-0000-4000-8000-0000000000a2', now() - interval '16 days', now() - interval '7 days'),
  ('00000000-0000-4000-8000-0000000000a2', now() - interval '6 days 2 hours', null),
  ('00000000-0000-4000-8000-0000000000a3', now() - interval '3 days', null);

insert into public.goals (user_id, season_id, ends_on, pledge_signed_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'nnn-2026', '2026-11-30', now()),
  ('00000000-0000-4000-8000-0000000000a2', 'nnn-2026', '2026-11-30', now()),
  ('00000000-0000-4000-8000-0000000000a3', 'nnn-2026', '2026-11-30', null);

insert into public.season_members (season_id, user_id) values
  ('nnn-2026', '00000000-0000-4000-8000-0000000000a1'),
  ('nnn-2026', '00000000-0000-4000-8000-0000000000a2'),
  ('nnn-2026', '00000000-0000-4000-8000-0000000000a3')
on conflict do nothing;

insert into public.checkins (user_id, local_date, status)
select '00000000-0000-4000-8000-0000000000a1', d::date, 'held'
from generate_series(current_date - 13, current_date, interval '1 day') d
on conflict do nothing;

insert into public.camps (id, name, owner_id, season_id, invite_code, max_members) values
  ('00000000-0000-4000-8000-00000000c001', 'Night shift', '00000000-0000-4000-8000-0000000000a1', 'nnn-2026', 'demo000001', 5)
on conflict (id) do nothing;

insert into public.camp_members (camp_id, user_id) values
  ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a2'),
  ('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a3')
on conflict do nothing;
