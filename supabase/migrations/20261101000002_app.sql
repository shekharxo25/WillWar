-- App additions on top of the reference core migration: the RPCs the PWA calls,
-- "Also required" items from docs/BUILD_PLAN.md section 5, and Phase 7 social tools.
-- Every table has RLS; every security definer function pins search_path = ''.

-- ============ Profile columns ============
alter table public.profiles
  add column if not exists timezone_changed_at timestamptz,
  add column if not exists reminder_time text not null default '21:30'
    check (reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists night_watch boolean not null default false;

grant update (reminder_time, night_watch) on public.profiles to authenticated;

-- ============ Handle filter ============
create table public.blocked_terms (term text primary key check (term = lower(term)));
alter table public.blocked_terms enable row level security;
-- No policies: server-only. Seeded in seed.sql.

create or replace function public.handle_allowed(p_handle text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_handle ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from public.blocked_terms b where position(b.term in p_handle) > 0);
$$;

-- Onboarding check before the account exists: returns only a boolean.
create or replace function public.check_handle_available(p_handle text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.handle_allowed(lower(coalesce(p_handle, '')))
     and not exists (select 1 from public.profiles p where p.handle = lower(p_handle));
$$;

-- ============ Onboarding with an optional avatar seed (the Shuffle button) ============
drop function public.complete_onboarding(text, date, text, text, text[], text, date, timestamptz);

create or replace function public.complete_onboarding(
  p_handle text, p_birth_date date, p_timezone text, p_tone text,
  p_why text[], p_season text, p_ends_on date, p_started_at timestamptz,
  p_avatar_seed text default null)
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
  if not public.handle_allowed(lower(coalesce(p_handle, ''))) then raise exception 'bad_handle'; end if;
  if p_avatar_seed is not null and p_avatar_seed !~ '^[0-9a-f]{12}$' then raise exception 'bad_avatar_seed'; end if;
  if coalesce(array_length(p_why, 1), 0) > 3
     or not (coalesce(p_why, '{}') <@ array['focus','discipline','sleep','less_scrolling','faith','prove_it','friends','other']::text[]) then
    raise exception 'bad_reasons';
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
  if p_started_at > greatest(now(), coalesce(v_season_start, now()))
     or p_started_at < least(now() - interval '48 hours',
                             coalesce(v_season_start, now() - interval '48 hours')) then
    raise exception 'start_out_of_range';
  end if;
  insert into public.profiles (id, handle, avatar_seed, adult_confirmed_at, timezone, tone, why_tags)
  values (v_uid, lower(p_handle), coalesce(p_avatar_seed, encode(extensions.gen_random_bytes(6), 'hex')),
          now(), p_timezone, p_tone, coalesce(p_why, '{}'));
  insert into public.streaks (user_id, started_at) values (v_uid, p_started_at);
  insert into public.goals (user_id, season_id, ends_on) values (v_uid, p_season, v_ends_on);
  if p_season is not null then
    insert into public.season_members (season_id, user_id) values (p_season, v_uid);
  end if;
end $$;

-- ============ Timezone: one change a week, logged ============
create or replace function public.set_timezone(p_timezone text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_last timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'bad_timezone';
  end if;
  select timezone_changed_at into v_last from public.profiles where id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if v_last is not null and v_last > now() - interval '7 days' then raise exception 'timezone_rate_limited'; end if;
  update public.profiles set timezone = p_timezone, timezone_changed_at = now() where id = v_uid;
  insert into public.events (user_id, name) values (v_uid, 'timezone_changed');
end $$;

-- ============ Product events: allowlisted names only, no props ============
create or replace function public.log_event(p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_name not in ('crisis_card_shown','war_chest_offer_shown','install_prompt_shown',
                    'app_installed','pledge_skipped','paywall_shown') then
    raise exception 'bad_event';
  end if;
  insert into public.events (user_id, name) values (v_uid, p_name);
end $$;

-- ============ Pacts: list, leave, invite ============
create or replace function public.my_pacts()
returns table (id uuid, name text, season_id text, member_count int, is_owner boolean,
               invite_code text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select pa.id, pa.name, pa.season_id,
         (select count(*)::int from public.pact_members m where m.pact_id = pa.id),
         pa.owner_id = (select auth.uid()),
         case when pa.owner_id = (select auth.uid()) then pa.invite_code end,
         pa.created_at
  from public.pacts pa
  where exists (select 1 from public.pact_members m where m.pact_id = pa.id and m.user_id = (select auth.uid()))
  order by pa.created_at;
$$;

create or replace function public.leave_pact(p_pact uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_next uuid;
begin
  if not public.is_pact_member(p_pact) then raise exception 'not_member'; end if;
  delete from public.pact_members where pact_id = p_pact and user_id = v_uid;
  if exists (select 1 from public.pacts where id = p_pact and owner_id = v_uid) then
    select user_id into v_next from public.pact_members where pact_id = p_pact order by joined_at limit 1;
    if v_next is null then delete from public.pacts where id = p_pact;
    else update public.pacts set owner_id = v_next where id = p_pact;
    end if;
  end if;
end $$;

create or replace function public.regenerate_invite_code(p_pact uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text := encode(extensions.gen_random_bytes(5), 'hex');
begin
  update public.pacts set invite_code = v_code where id = p_pact and owner_id = (select auth.uid());
  if not found then raise exception 'not_owner'; end if;
  return v_code;
end $$;

-- ============ Mutes (nudges from a muted person stop, silently) ============
create table public.mutes (
  muter uuid not null references public.profiles(id) on delete cascade,
  muted uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter, muted),
  check (muter <> muted)
);
alter table public.mutes enable row level security;
create policy mutes_select_own on public.mutes for select to authenticated using (muter = (select auth.uid()));

create or replace function public.mute_member(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_user = v_uid then raise exception 'self_mute'; end if;
  insert into public.mutes (muter, muted) values (v_uid, p_user) on conflict do nothing;
end $$;

create or replace function public.unmute_member(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.mutes where muter = (select auth.uid()) and muted = p_user;
$$;

-- send_nudge: same rules as the core version, plus the mute check (no error, so the
-- sender can't detect the mute).
create or replace function public.send_nudge(p_pact uuid, p_to uuid, p_message_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not public.is_pact_member(p_pact) then raise exception 'not_member'; end if;
  if p_to = v_uid then raise exception 'self_nudge'; end if;
  if not exists (select 1 from public.pact_members where pact_id = p_pact and user_id = p_to) then
    raise exception 'not_member';
  end if;
  if (select count(*) from public.nudges
      where from_user = v_uid and to_user = p_to and created_at > now() - interval '1 day') >= 3 then
    raise exception 'rate_limited';
  end if;
  if exists (select 1 from public.mutes where muter = p_to and muted = v_uid) then return; end if;
  insert into public.nudges (pact_id, from_user, to_user, message_key)
  values (p_pact, v_uid, p_to, p_message_key);
end $$;

-- ============ Reports (server-only table; founder review queue) ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid references public.profiles(id) on delete set null,
  target_kind text not null check (target_kind in ('handle','pact')),
  target_id text not null check (char_length(target_id) <= 64),
  reason text not null check (reason in ('harassment','real_name','minor','offensive_name','spam','other')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.reports enable row level security;
-- No policies: written through report_content, read with the secret key only.

create or replace function public.report_content(p_target_kind text, p_target_id text, p_reason text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  insert into public.reports (reporter, target_kind, target_id, reason, note)
  values (v_uid, p_target_kind, p_target_id, p_reason, nullif(trim(p_note), ''));
end $$;

-- ============ Shields (server only): rewarded ads capped at 2 per rolling week ============
create or replace function public.grant_shield(p_user uuid, p_source text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_source not in ('rewarded_ad','pro_monthly','referral') then raise exception 'bad_source'; end if;
  if p_source = 'rewarded_ad' and (
    select count(*) from public.shields
    where user_id = p_user and source = 'rewarded_ad' and granted_at > now() - interval '7 days') >= 2 then
    raise exception 'shield_cap';
  end if;
  insert into public.shields (user_id, source) values (p_user, p_source) returning id into v_id;
  return v_id;
end $$;

-- ============ Function permissions (deliberate grants only) ============
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_pact_member(uuid) to authenticated;
grant execute on function public.complete_onboarding(text, date, text, text, text[], text, date, timestamptz, text) to authenticated;
grant execute on function public.check_handle_available(text) to anon, authenticated;
grant execute on function public.start_goal(date, text) to authenticated;
grant execute on function public.sign_pledge() to authenticated;
grant execute on function public.check_in() to authenticated;
grant execute on function public.log_reset(text[]) to authenticated;
grant execute on function public.use_shield(date) to authenticated;
grant execute on function public.create_pact(text, text) to authenticated;
grant execute on function public.join_pact(text) to authenticated;
grant execute on function public.send_nudge(uuid, uuid, text) to authenticated;
grant execute on function public.pact_leaderboard(uuid) to authenticated;
grant execute on function public.war_chest_offer_eligible() to authenticated;
grant execute on function public.mark_war_chest_offered() to authenticated;
grant execute on function public.create_promise_chest(int, text, text, text) to authenticated;
grant execute on function public.cancel_war_chest() to authenticated;
grant execute on function public.set_timezone(text) to authenticated;
grant execute on function public.log_event(text) to authenticated;
grant execute on function public.my_pacts() to authenticated;
grant execute on function public.leave_pact(uuid) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.mute_member(uuid) to authenticated;
grant execute on function public.unmute_member(uuid) to authenticated;
grant execute on function public.report_content(text, text, text, text) to authenticated;
-- Money movement and grants: server only (secret key / service_role).
grant execute on function public.create_stake_chest(uuid, int, text, text, text) to service_role;
grant execute on function public.activate_stake_chest(uuid, text, int, text) to service_role;
grant execute on function public.record_refund(uuid, text, int) to service_role;
grant execute on function public.settle_due_war_chests() to service_role;
grant execute on function public.grant_shield(uuid, text) to service_role;
