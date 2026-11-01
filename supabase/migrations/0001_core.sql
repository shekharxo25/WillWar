-- WillWar core schema (MASTER_PROMPT Part 5). Applied as written; lines truncated in the
-- PDF extraction were reconstructed from context (see supabase/README.md).
create extension if not exists pgcrypto with schema extensions;

-- ============ Tables ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  avatar_seed text not null default encode(extensions.gen_random_bytes(6), 'hex'),
  adult_confirmed_at timestamptz not null,             -- date of birth is never stored
  timezone text not null default 'Asia/Kolkata',
  tone text not null default 'steady' check (tone in ('steady','stoic','coach','playful')),
  why_tags text[] not null default '{}',
  discreet_notifications boolean not null default true,
  leaderboard_visibility text not null default 'camps'
    check (leaderboard_visibility in ('private','camps','global')),
  show_backed_badge boolean not null default false,    -- War Chest badge on boards (never an amount)
  war_chest_offered_at timestamptz,                    -- the one-time War Chest offer has been shown
  created_at timestamptz not null default now()
);

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint streak_order check (ended_at is null or ended_at >= started_at)
);
create unique index streaks_one_open on public.streaks(user_id) where ended_at is null;
create index streaks_user_started on public.streaks(user_id, started_at desc);

create table public.checkins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('held','reset','shielded')),
  created_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table public.resets (                                -- tags only, never free text
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  tags text[] not null default '{}' check (
    tags <@ array['late_night','bored','stressed','alone','scrolling','drinking','other']::text[])
);

create table public.urge_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  game text not null check (game in ('kitbag','bag','combos')),
  duration_s int not null check (duration_s between 0 and 1800),
  intensity_before smallint check (intensity_before between 1 and 10),
  intensity_after smallint check (intensity_after between 1 and 10),
  completed boolean not null default false
);

create table public.seasons (
  id text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on)
);
insert into public.seasons (id, name, starts_on, ends_on)
values ('nnn-2026', 'No Nut November 2026', '2026-11-01', '2026-11-30');

create table public.season_members (
  season_id text not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

create table public.goals (                                  -- the challenge window: a season or a custom end date
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id text references public.seasons(id),
  ends_on date not null,                                  -- last day, in the profile's timezone
  pledge_signed_at timestamptz,                           -- the free first commitment (foot in the door)
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index goals_one_open on public.goals(user_id) where closed_at is null;

create table public.camps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  season_id text references public.seasons(id),
  invite_code text not null unique default encode(extensions.gen_random_bytes(5), 'hex'),
  max_members int not null default 5 check (max_members between 2 and 50),
  created_at timestamptz not null default now()
);

create table public.camp_members (
  camp_id uuid not null references public.camps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (camp_id, user_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  kind text not null check (kind in ('first_to_days','longest_streak','most_days')),
  target_days int check (target_days between 1 and 365),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  check (ends_at > starts_at)
);

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  message_key text not null check (message_key in
    ('proud_of_you','go_a_round','get_up','almost_there','in_your_corner')),
  created_at timestamptz not null default now()
);

create table public.affirmations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  for_date date not null,
  body text not null check (char_length(body) <= 400),
  source text not null check (source in ('model','fallback')),
  created_at timestamptz not null default now(),
  primary key (user_id, for_date)
);

create table public.entitlements (                          -- written only by the payment webhook
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('season','annual')),
  status text not null check (status in ('active','past_due','canceled','expired')),
  current_period_end timestamptz,
  provider text not null default 'razorpay',
  provider_ref text,
  updated_at timestamptz not null default now()
);

create table public.shields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('rewarded_ad','pro_monthly','referral')),
  granted_at timestamptz not null default now(),
  used_on date
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.waitlist (
  email text primary key check (position('@' in email) > 1),
  source text,
  created_at timestamptz not null default now()
);

create table public.events (                               -- first-party analytics, no sensitive props
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null check (name ~ '^[a-z_]{3,40}$'),
  props jsonb not null default '{}' check (pg_column_size(props) < 2048),
  created_at timestamptz not null default now()
);

create table public.webhook_events (                       -- idempotency for Razorpay
  id text primary key,
  received_at timestamptz not null default now()
);

-- ============ War Chest (optional money commitment) ============
create table public.causes (                                 -- vetted by the founder; never user-submitted
  id text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  country text not null check (country in ('IN','US','GB','GLOBAL')),
  url text not null,
  active boolean not null default true
);

create table public.war_chests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null unique references public.goals(id) on delete cascade,     -- one per challenge
  mode text not null check (mode in ('promise','stake')),
  amount_minor int not null,                              -- paise or cents
  currency text not null check (currency in ('INR','USD')),
  forfeit_rule text not null default 'steady' check (forfeit_rule in ('steady','strict')),
  cause_id text not null references public.causes(id),
  status text not null default 'pending'
    check (status in ('pending','active','settling','settled','cancelled')),
  forfeited_minor int not null default 0,
  provider_payment_ref text,
  refund_ref text,
  funded_at timestamptz,
  cooling_off_until timestamptz,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chest_amount_range check (
    (currency = 'INR' and amount_minor between 4900 and 500000) or
    (currency = 'USD' and amount_minor between 200 and 10000)),
  constraint chest_forfeit_range check (forfeited_minor between 0 and amount_minor)
);

create table public.war_chest_events (
  id uuid primary key default gen_random_uuid(),
  war_chest_id uuid not null references public.war_chests(id) on delete cascade,
  kind text not null check (kind in ('promise_made','funded','forfeit','promise_forfeit',
                                     'cancelled','refund_issued','settled')),
  amount_minor int not null default 0 check (amount_minor >= 0),
  created_at timestamptz not null default now()
);

create table public.money_ledger (                          -- accounting; survives account deletion
  id bigint generated always as identity primary key,
  war_chest_ref uuid not null,                            -- deliberately no foreign key
  kind text not null check (kind in ('funded','refund_issued','forfeit_to_cause','donated')),
  amount_minor int not null check (amount_minor >= 0),
  currency text not null check (currency in ('INR','USD')),
  cause_id text,
  provider_ref text,
  created_at timestamptz not null default now()
);

create table public.donation_batches (                      -- monthly donations per cause, receipts published
  id uuid primary key default gen_random_uuid(),
  cause_id text not null references public.causes(id),
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  currency text not null check (currency in ('INR','USD')),
  amount_minor int not null check (amount_minor >= 0),
  receipt_url text,
  donated_at timestamptz,
  unique (cause_id, period, currency)
);

-- ============ Row Level Security: every table, no exceptions ============
alter table public.profiles enable row level security;
alter table public.streaks enable row level security;
alter table public.checkins enable row level security;
alter table public.resets enable row level security;
alter table public.urge_sessions enable row level security;
alter table public.seasons enable row level security;
alter table public.season_members enable row level security;
alter table public.camps enable row level security;
alter table public.camp_members enable row level security;
alter table public.challenges enable row level security;
alter table public.nudges enable row level security;
alter table public.affirmations enable row level security;
alter table public.entitlements enable row level security;
alter table public.shields enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.waitlist enable row level security;
alter table public.events enable row level security;
alter table public.webhook_events enable row level security;
alter table public.goals enable row level security;
alter table public.causes enable row level security;
alter table public.war_chests enable row level security;
alter table public.war_chest_events enable row level security;
alter table public.money_ledger enable row level security;
alter table public.donation_batches enable row level security;

create or replace function public.is_camp_member(p_camp uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.camp_members m
    where m.camp_id = p_camp and m.user_id = (select auth.uid())
  );
$$;

-- Own rows only
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy streaks_select_own on public.streaks for select to authenticated
  using (user_id = (select auth.uid()));
create policy checkins_select_own on public.checkins for select to authenticated
  using (user_id = (select auth.uid()));
create policy resets_select_own on public.resets for select to authenticated
  using (user_id = (select auth.uid()));
create policy urge_select_own on public.urge_sessions for select to authenticated
  using (user_id = (select auth.uid()));
create policy urge_insert_own on public.urge_sessions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (game <> 'combos' or exists (              -- Combos is Pro-only, enforced here too
      select 1 from public.entitlements e
      where e.user_id = (select auth.uid()) and e.status = 'active'
        and (e.current_period_end is null or e.current_period_end > now())))
  );
create policy season_members_select_own on public.season_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy affirmations_select_own on public.affirmations for select to authenticated
  using (user_id = (select auth.uid()));
create policy entitlements_select_own on public.entitlements for select to authenticated
  using (user_id = (select auth.uid()));
create policy shields_select_own on public.shields for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_select_own on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_delete_own on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));
create policy events_insert_own on public.events for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Shared, membership-scoped
create policy seasons_read on public.seasons for select to anon, authenticated using (true);
create policy camps_select_member on public.camps for select to authenticated
  using (public.is_camp_member(id));
create policy camp_members_select_member on public.camp_members for select to authenticated
  using (public.is_camp_member(camp_id));
create policy challenges_select_member on public.challenges for select to authenticated
  using (public.is_camp_member(camp_id));
create policy nudges_select_party on public.nudges for select to authenticated
  using (to_user = (select auth.uid()) or from_user = (select auth.uid()));
create policy goals_select_own on public.goals for select to authenticated
  using (user_id = (select auth.uid()));
create policy causes_read on public.causes for select to authenticated using (active);
create policy war_chests_select_own on public.war_chests for select to authenticated
  using (user_id = (select auth.uid()));
create policy war_chest_events_select_own on public.war_chest_events for select to authenticated
  using (exists (select 1 from public.war_chests w
                 where w.id = war_chest_id and w.user_id = (select auth.uid())));
-- waitlist, webhook_events, money_ledger, donation_batches: no policies. Server (secret key) only.

-- Column-level limits: users may edit preferences, not identity, age or timezone
-- (timezone changes go through a set_timezone RPC limited to one a week)
revoke update on public.profiles from authenticated;
grant update (tone, why_tags, discreet_notifications, leaderboard_visibility, show_backed_badge)
  on public.profiles to authenticated;

-- Nothing for anonymous users except reading seasons
revoke all on all tables in schema public from anon;
grant select on public.seasons to anon;

-- ============ RPCs (the only write path for sensitive data) ============
create or replace function public.complete_onboarding(
  p_handle text, p_birth_date date, p_timezone text, p_tone text,
  p_why text[], p_season text, p_ends_on date, p_started_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_today date;
  v_season public.seasons%rowtype;
  v_season_start timestamptz;
  v_ends_on date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_birth_date is null or p_birth_date > (current_date - interval '18 years')::date then
    raise exception 'must_be_18';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'bad_timezone';
  end if;
  v_today := (now() at time zone p_timezone)::date;
  if p_season is not null then
    select * into v_season from public.seasons s where s.id = p_season;
    if not found then raise exception 'bad_season'; end if;
    if v_season.ends_on < v_today then raise exception 'season_over'; end if;
    v_season_start := v_season.starts_on::timestamp at time zone p_timezone;
    v_ends_on := v_season.ends_on;
  else
    if p_ends_on is null or p_ends_on <= v_today or p_ends_on > v_today + 365 then
      raise exception 'bad_end_date';
    end if;
    v_ends_on := p_ends_on;
  end if;
  -- Allowed start: back to the season start (honor system) or 48h, up to now;
  -- or the season start itself if the season hasn't begun.
  if p_started_at > greatest(now(), coalesce(v_season_start, now()))
     or p_started_at < least(now() - interval '48 hours',
                             coalesce(v_season_start, now() - interval '48 hours')) then
    raise exception 'start_out_of_range';
  end if;
  insert into public.profiles (id, handle, adult_confirmed_at, timezone, tone, why_tags)
  values (v_uid, lower(p_handle), now(), p_timezone, p_tone, coalesce(p_why, '{}'));
  insert into public.streaks (user_id, started_at) values (v_uid, p_started_at);
  insert into public.goals (user_id, season_id, ends_on) values (v_uid, p_season, v_ends_on);
  if p_season is not null then
    insert into public.season_members (season_id, user_id) values (p_season, v_uid);
  end if;
end $$;

create or replace function public.check_in()
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_tz text; v_today date;
begin
  select timezone into v_tz from public.profiles where id = v_uid;
  if v_tz is null then raise exception 'no_profile'; end if;
  v_today := (now() at time zone v_tz)::date;             -- server decides the date
  if not exists (select 1 from public.streaks
                 where user_id = v_uid and ended_at is null and started_at <= now()) then
    raise exception 'no_open_streak';
  end if;
  insert into public.checkins (user_id, local_date, status) values (v_uid, v_today, 'held')
  on conflict (user_id, local_date) do nothing;
  return 'held';
end $$;

create or replace function public.log_reset(p_tags text[] default '{}')
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_tz text; v_today date;
  v_chest public.war_chests%rowtype; v_forfeit int := 0;
begin
  select timezone into v_tz from public.profiles where id = v_uid;
  if v_tz is null then raise exception 'no_profile'; end if;
  v_today := (now() at time zone v_tz)::date;
  update public.streaks set ended_at = now() where user_id = v_uid and ended_at is null;
  insert into public.resets (user_id, tags) values (v_uid, coalesce(p_tags, '{}'));
  insert into public.checkins (user_id, local_date, status) values (v_uid, v_today, 'reset')
  on conflict (user_id, local_date) do update set status = 'reset';
  insert into public.streaks (user_id, started_at) values (v_uid, now());

  -- War Chest: steady forfeits 25% of the original amount per reset; strict forfeits the rest.
  select w.* into v_chest from public.war_chests w
  join public.goals g on g.id = w.goal_id and g.closed_at is null
  where w.user_id = v_uid and w.status = 'active'
  for update of w;
  if found then
    v_forfeit := case when v_chest.forfeit_rule = 'strict'
                      then v_chest.amount_minor - v_chest.forfeited_minor
                      else least(v_chest.amount_minor / 4, v_chest.amount_minor - v_chest.forfeited_minor)
                 end;
    if v_forfeit > 0 then
      update public.war_chests set forfeited_minor = forfeited_minor + v_forfeit where id = v_chest.id;
      insert into public.war_chest_events (war_chest_id, kind, amount_minor)
      values (v_chest.id, case when v_chest.mode = 'stake' then 'forfeit' else 'promise_forfeit' end, v_forfeit);
      if v_chest.mode = 'stake' then
        insert into public.money_ledger (war_chest_ref, kind, amount_minor, currency, cause_id)
        values (v_chest.id, 'forfeit_to_cause', v_forfeit, v_chest.currency, v_chest.cause_id);
      end if;
    end if;
  end if;
  return v_forfeit;         -- lets the UI say "₹125 goes to [cause]"
end $$;

-- Shields cover a missed check-in inside an unbroken streak. Never a reset.
create or replace function public.use_shield(p_local_date date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_tz text; v_today date; v_shield uuid;
begin
  select timezone into v_tz from public.profiles where id = v_uid;
  if v_tz is null then raise exception 'no_profile'; end if;
  v_today := (now() at time zone v_tz)::date;
  if p_local_date >= v_today or p_local_date < v_today - 3 then raise exception 'shield_window'; end if;
  if exists (select 1 from public.checkins where user_id = v_uid and local_date = p_local_date) then
    raise exception 'already_recorded';
  end if;
  if not exists (select 1 from public.streaks s
                 where s.user_id = v_uid and s.ended_at is null
                   and (s.started_at at time zone v_tz)::date <= p_local_date) then
    raise exception 'not_in_streak';
  end if;
  select id into v_shield from public.shields
  where user_id = v_uid and used_on is null order by granted_at limit 1 for update skip locked;
  if v_shield is null then raise exception 'no_shield'; end if;
  update public.shields set used_on = p_local_date where id = v_shield;
  insert into public.checkins (user_id, local_date, status) values (v_uid, p_local_date, 'shielded');
end $$;

create or replace function public.create_camp(p_name text, p_season text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_is_pro boolean; v_owned int; v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_is_pro := exists (select 1 from public.entitlements e
    where e.user_id = v_uid and e.status = 'active'
      and (e.current_period_end is null or e.current_period_end > now()));
  select count(*) into v_owned from public.camps where owner_id = v_uid;
  if not v_is_pro and v_owned >= 1 then raise exception 'pro_required'; end if;
  insert into public.camps (name, owner_id, season_id, max_members)
  values (p_name, v_uid, p_season, case when v_is_pro then 50 else 5 end)
  returning id into v_id;
  insert into public.camp_members (camp_id, user_id) values (v_id, v_uid);
  return v_id;
end $$;

create or replace function public.join_camp(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_camp public.camps%rowtype; v_count int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_camp from public.camps where invite_code = lower(p_code);
  if not found then raise exception 'invalid_code'; end if;
  select count(*) into v_count from public.camp_members where camp_id = v_camp.id;
  if v_count >= v_camp.max_members then raise exception 'camp_full'; end if;
  insert into public.camp_members (camp_id, user_id) values (v_camp.id, v_uid)
  on conflict do nothing;
  return v_camp.id;
end $$;

create or replace function public.send_nudge(p_camp uuid, p_to uuid, p_message_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not public.is_camp_member(p_camp) then raise exception 'not_member'; end if;
  if p_to = v_uid then raise exception 'self_nudge'; end if;
  if not exists (select 1 from public.camp_members where camp_id = p_camp and user_id = p_to) then
    raise exception 'not_member';
  end if;
  if (select count(*) from public.nudges
      where from_user = v_uid and to_user = p_to and created_at > now() - interval '1 day') >= 3 then
    raise exception 'rate_limited';
  end if;
  insert into public.nudges (camp_id, from_user, to_user, message_key)
  values (p_camp, v_uid, p_to, p_message_key);
end $$;

-- ============ Goals and the pledge ============
create or replace function public.start_goal(p_ends_on date, p_season text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_tz text; v_today date; v_end date; v_id uuid;
begin
  select timezone into v_tz from public.profiles where id = v_uid;
  if v_tz is null then raise exception 'no_profile'; end if;
  v_today := (now() at time zone v_tz)::date;
  if exists (select 1 from public.goals where user_id = v_uid and closed_at is null) then
    raise exception 'goal_open';
  end if;
  if p_season is not null then
    select s.ends_on into v_end from public.seasons s where s.id = p_season and s.ends_on >= v_today;
    if v_end is null then raise exception 'bad_season'; end if;
    insert into public.season_members (season_id, user_id) values (p_season, v_uid) on conflict do nothing;
  else
    if p_ends_on is null or p_ends_on <= v_today or p_ends_on > v_today + 365 then
      raise exception 'bad_end_date';
    end if;
    v_end := p_ends_on;
  end if;
  insert into public.goals (user_id, season_id, ends_on) values (v_uid, p_season, v_end)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.sign_pledge()
returns void language sql security definer set search_path = '' as $$
  update public.goals set pledge_signed_at = now()
  where user_id = (select auth.uid()) and closed_at is null and pledge_signed_at is null;
$$;

-- ============ War Chest ============
-- The one-time offer: only after a signed pledge and a held day, with a week or more left,
-- during waking hours, never within 7 days of a crisis card, and never twice.
create or replace function public.war_chest_offer_eligible()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join public.goals g on g.user_id = p.id and g.closed_at is null
    where p.id = (select auth.uid())
      and p.war_chest_offered_at is null
      and g.pledge_signed_at is not null
      and g.ends_on - (now() at time zone p.timezone)::date >= 7
      and extract(hour from (now() at time zone p.timezone)) between 6 and 22
      and exists (select 1 from public.checkins c where c.user_id = p.id and c.status = 'held')
      and not exists (select 1 from public.war_chests w where w.goal_id = g.id)
      and not exists (select 1 from public.events e
                      where e.user_id = p.id and e.name = 'crisis_card_shown'
                        and e.created_at > now() - interval '7 days')
  );
$$;

create or replace function public.mark_war_chest_offered()
returns void language sql security definer set search_path = '' as $$
  update public.profiles set war_chest_offered_at = now()
  where id = (select auth.uid()) and war_chest_offered_at is null;
$$;

-- Promise mode: no money moves.
create or replace function public.create_promise_chest(
  p_amount_minor int, p_currency text, p_rule text, p_cause text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_goal uuid; v_id uuid;
begin
  select g.id into v_goal from public.goals g where g.user_id = v_uid and g.closed_at is null;
  if v_goal is null then raise exception 'no_open_goal'; end if;
  if not exists (select 1 from public.causes c where c.id = p_cause and c.active) then
    raise exception 'bad_cause';
  end if;
  insert into public.war_chests (user_id, goal_id, mode, amount_minor, currency, forfeit_rule,
                                 cause_id, status, funded_at)
  values (v_uid, v_goal, 'promise', p_amount_minor, p_currency, p_rule, p_cause, 'active', now())
  returning id into v_id;
  insert into public.war_chest_events (war_chest_id, kind, amount_minor)
  values (v_id, 'promise_made', p_amount_minor);
  update public.profiles set war_chest_offered_at = coalesce(war_chest_offered_at, now()) where id = v_uid;
  return v_id;
end $$;

-- Promise: cancel any time. Stake: only inside the 24-hour cooling-off window.
create or replace function public.cancel_war_chest()
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_chest public.war_chests%rowtype;
begin
  select w.* into v_chest from public.war_chests w
  join public.goals g on g.id = w.goal_id and g.closed_at is null
  where w.user_id = v_uid and w.status = 'active'
  for update of w;
  if not found then raise exception 'no_active_chest'; end if;
  if v_chest.mode = 'promise' then
    update public.war_chests set status = 'cancelled' where id = v_chest.id;
    insert into public.war_chest_events (war_chest_id, kind) values (v_chest.id, 'cancelled');
    return 'cancelled';
  end if;
  if now() > v_chest.cooling_off_until then raise exception 'locked_until_goal_end'; end if;
  update public.war_chests set status = 'settling' where id = v_chest.id;      -- refund job picks it up
  insert into public.war_chest_events (war_chest_id, kind) values (v_chest.id, 'cancelled');
  return 'refund_pending';
end $$;

-- Stake mode, server only (secret key): create before Razorpay checkout.
create or replace function public.create_stake_chest(
  p_user uuid, p_amount_minor int, p_currency text, p_rule text, p_cause text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_goal public.goals%rowtype; v_tz text; v_days int; v_id uuid;
begin
  select g.* into v_goal from public.goals g where g.user_id = p_user and g.closed_at is null;
  if not found then raise exception 'no_open_goal'; end if;
  select timezone into v_tz from public.profiles where id = p_user;
  v_days := v_goal.ends_on - (now() at time zone v_tz)::date;
  if v_days < 7 then raise exception 'stake_goal_too_short'; end if;
  if v_days > 90 then raise exception 'stake_goal_too_long'; end if;     -- refunds fail after 6 months
  if not exists (select 1 from public.causes c where c.id = p_cause and c.active) then
    raise exception 'bad_cause';
  end if;
  delete from public.war_chests where goal_id = v_goal.id and status = 'pending';      -- abandoned checkout
  insert into public.war_chests (user_id, goal_id, mode, amount_minor, currency, forfeit_rule, cause_id)
  values (p_user, v_goal.id, 'stake', p_amount_minor, p_currency, p_rule, p_cause)
  returning id into v_id;
  update public.profiles set war_chest_offered_at = coalesce(war_chest_offered_at, now()) where id = p_user;
  return v_id;
end $$;

-- Server only: called from the verified payment.captured webhook.
create or replace function public.activate_stake_chest(
  p_chest uuid, p_payment_ref text, p_amount_minor int, p_currency text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_chest public.war_chests%rowtype;
begin
  select * into v_chest from public.war_chests where id = p_chest for update;
  if not found or v_chest.status <> 'pending' then raise exception 'not_pending'; end if;
  if v_chest.amount_minor <> p_amount_minor or v_chest.currency <> p_currency then
    raise exception 'amount_mismatch';
  end if;
  update public.war_chests
  set status = 'active', provider_payment_ref = p_payment_ref, funded_at = now(),
      cooling_off_until = now() + interval '24 hours'
  where id = p_chest;
  insert into public.war_chest_events (war_chest_id, kind, amount_minor) values (p_chest, 'funded', p_amount_minor);
  insert into public.money_ledger (war_chest_ref, kind, amount_minor, currency, cause_id, provider_ref)
  values (p_chest, 'funded', p_amount_minor, p_currency, v_chest.cause_id, p_payment_ref);
end $$;

-- Server only: called from the verified refund.processed webhook.
create or replace function public.record_refund(p_chest uuid, p_refund_ref text, p_amount_minor int)
returns void language plpgsql security definer set search_path = '' as $$
declare v_chest public.war_chests%rowtype;
begin
  select * into v_chest from public.war_chests where id = p_chest for update;
  if not found or v_chest.status <> 'settling' then raise exception 'not_settling'; end if;
  if p_amount_minor <> v_chest.amount_minor - v_chest.forfeited_minor then raise exception 'amount_mismatch'; end if;
  update public.war_chests set status = 'settled', refund_ref = p_refund_ref, settled_at = now()
  where id = p_chest;
  insert into public.war_chest_events (war_chest_id, kind, amount_minor) values (p_chest, 'refund_issued', p_amount_minor);
  insert into public.money_ledger (war_chest_ref, kind, amount_minor, currency, cause_id, provider_ref)
  values (p_chest, 'refund_issued', p_amount_minor, v_chest.currency, v_chest.cause_id, p_refund_ref);
end $$;

-- Server only, daily: close finished goals, settle promises, and return stakes that need refunds.
create or replace function public.settle_due_war_chests()
returns table (war_chest_id uuid, payment_ref text, refund_minor int, refund_currency text)
language plpgsql security definer set search_path = '' as $$
begin
  update public.goals g set closed_at = now()
  from public.profiles p
  where p.id = g.user_id and g.closed_at is null
    and g.ends_on < (now() at time zone p.timezone)::date;

  with done as (
    update public.war_chests w set status = 'settled', settled_at = now()
    from public.goals g
    where g.id = w.goal_id and g.closed_at is not null and w.status = 'active' and w.mode = 'promise'
    returning w.id
  )
  insert into public.war_chest_events (war_chest_id, kind) select done.id, 'settled' from done;

  update public.war_chests w set status = 'settling'
  from public.goals g
  where g.id = w.goal_id and g.closed_at is not null and w.status = 'active' and w.mode = 'stake';
  -- Fully forfeited stakes have nothing to refund.
  with done as (
    update public.war_chests w set status = 'settled', settled_at = now()
    where w.status = 'settling' and w.forfeited_minor = w.amount_minor
    returning w.id
  )
  insert into public.war_chest_events (war_chest_id, kind) select done.id, 'settled' from done;

  return query
    select w.id, w.provider_payment_ref, w.amount_minor - w.forfeited_minor, w.currency
    from public.war_chests w
    where w.status = 'settling' and w.mode = 'stake' and w.refund_ref is null;
end $$;

-- Camp board: handles and numbers only. Never reset tags, times or notes.
create or replace function public.camp_leaderboard(p_camp uuid)
returns table (member_id uuid, handle text, avatar_seed text,
               current_streak_s bigint, best_streak_s bigint, days_kept int,
               last_checkin date, is_backed boolean, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with camp as (
    select pa.id, se.starts_on, se.ends_on
    from public.camps pa left join public.seasons se on se.id = pa.season_id
    where pa.id = p_camp and public.is_camp_member(p_camp)
  )
  select pr.id, pr.handle, pr.avatar_seed,
         coalesce(extract(epoch from (now() - o.started_at))::bigint, 0),
         coalesce(b.best_s, 0),
         coalesce(d.days, 0),
         l.last_date,
         pr.show_backed_badge and exists (
           select 1 from public.war_chests wc join public.goals g on g.id = wc.goal_id
           where wc.user_id = pm.user_id and wc.status = 'active' and g.closed_at is null),
         pr.id = (select auth.uid())
  from camp
  join public.camp_members pm on pm.camp_id = camp.id
  join public.profiles pr on pr.id = pm.user_id and pr.leaderboard_visibility <> 'private'
  cross join lateral (
    select coalesce(camp.starts_on::timestamp at time zone pr.timezone, '-infinity'::timestamptz) as w_start,
           coalesce((camp.ends_on + 1)::timestamp at time zone pr.timezone, 'infinity'::timestamptz) as w_end
  ) w
  left join lateral (
    select s.started_at from public.streaks s
    where s.user_id = pm.user_id and s.ended_at is null and s.started_at <= now()
  ) o on true
  left join lateral (
    select max(extract(epoch from (least(coalesce(s.ended_at, now()), w.w_end)
                                   - greatest(s.started_at, w.w_start))))::bigint as best_s
    from public.streaks s
    where s.user_id = pm.user_id
      and s.started_at < least(now(), w.w_end)
      and coalesce(s.ended_at, now()) > w.w_start
  ) b on true
  left join lateral (
    select count(*)::int as days from public.checkins c
    where c.user_id = pm.user_id and c.status in ('held','shielded')
      and (camp.starts_on is null or c.local_date between camp.starts_on and camp.ends_on)
  ) d on true
  left join lateral (
    select max(c.local_date) as last_date from public.checkins c where c.user_id = pm.user_id
  ) l on true;
$$;

-- ============ Function permissions ============
-- Supabase grants EXECUTE on new functions to anon and authenticated by default.
-- Revoke everything, then grant each function deliberately.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_camp_member(uuid) to authenticated;
grant execute on function public.complete_onboarding(text, date, text, text, text[], text, date, timestamptz) to authenticated;
grant execute on function public.start_goal(date, text) to authenticated;
grant execute on function public.sign_pledge() to authenticated;
grant execute on function public.check_in() to authenticated;
grant execute on function public.log_reset(text[]) to authenticated;
grant execute on function public.use_shield(date) to authenticated;
grant execute on function public.create_camp(text, text) to authenticated;
grant execute on function public.join_camp(text) to authenticated;
grant execute on function public.send_nudge(uuid, uuid, text) to authenticated;
grant execute on function public.camp_leaderboard(uuid) to authenticated;
grant execute on function public.war_chest_offer_eligible() to authenticated;
grant execute on function public.mark_war_chest_offered() to authenticated;
grant execute on function public.create_promise_chest(int, text, text, text) to authenticated;
grant execute on function public.cancel_war_chest() to authenticated;
-- Money movement: server only (secret key / service_role). Never callable from the browser.
grant execute on function public.create_stake_chest(uuid, int, text, text, text) to service_role;
grant execute on function public.activate_stake_chest(uuid, text, int, text) to service_role;
grant execute on function public.record_refund(uuid, text, int) to service_role;
grant execute on function public.settle_due_war_chests() to service_role;
