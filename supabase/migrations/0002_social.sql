-- WillWar 0002: global season board, timezone changes, mutes, reports, camp challenges,
-- camp membership management and Realtime authorization.
-- Every security definer function pins search_path. New functions are revoked from
-- public/anon/authenticated one by one (a blanket revoke would undo 0001's grants).

-- ============ Timezone changes: validated, one a week ============
alter table public.profiles add column timezone_changed_at timestamptz;

create or replace function public.set_timezone(p_timezone text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_last timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'bad_timezone';
  end if;
  select timezone_changed_at into v_last from public.profiles where id = v_uid;
  if not found then raise exception 'no_profile'; end if;
  if v_last is not null and v_last > now() - interval '7 days' then
    raise exception 'timezone_rate_limited';
  end if;
  update public.profiles set timezone = p_timezone, timezone_changed_at = now() where id = v_uid;
end $$;

-- ============ Opt-in global season board ============
-- Same metrics as camp_leaderboard, only for leaderboard_visibility = 'global'.
-- Refreshed every five minutes by pg_cron; read only through season_leaderboard().
create materialized view public.season_board_mv as
select se.id as season_id,
       pr.id as user_id,
       pr.handle,
       pr.avatar_seed,
       coalesce(extract(epoch from (now() - o.started_at))::bigint, 0) as current_s,
       coalesce(b.best_s, 0) as best_s,
       coalesce(d.days, 0) as days_kept,
       l.last_date as last_checkin,
       now() as refreshed_at
from public.seasons se
join public.season_members sm on sm.season_id = se.id
join public.profiles pr on pr.id = sm.user_id and pr.leaderboard_visibility = 'global'
cross join lateral (
  select se.starts_on::timestamp at time zone pr.timezone as w_start,
         (se.ends_on + 1)::timestamp at time zone pr.timezone as w_end
) w
left join lateral (
  select s.started_at from public.streaks s
  where s.user_id = pr.id and s.ended_at is null and s.started_at <= now()
) o on true
left join lateral (
  select max(extract(epoch from (least(coalesce(s.ended_at, now()), w.w_end)
                                 - greatest(s.started_at, w.w_start))))::bigint as best_s
  from public.streaks s
  where s.user_id = pr.id
    and s.started_at < least(now(), w.w_end)
    and coalesce(s.ended_at, now()) > w.w_start
) b on true
left join lateral (
  select count(*)::int as days from public.checkins c
  where c.user_id = pr.id and c.status in ('held','shielded')
    and c.local_date between se.starts_on and se.ends_on
) d on true
left join lateral (
  select max(c.local_date) as last_date from public.checkins c where c.user_id = pr.id
) l on true;

create unique index season_board_mv_key on public.season_board_mv (season_id, user_id);
revoke all on public.season_board_mv from public, anon, authenticated;

create or replace function public.refresh_season_board()
returns void language plpgsql security definer set search_path = '' as $$
begin
  refresh materialized view public.season_board_mv;
end $$;

create or replace function public.season_leaderboard(p_season text, p_metric text)
returns table (rank int, member_id uuid, handle text, avatar_seed text,
               current_streak_s bigint, best_streak_s bigint, days_kept int,
               last_checkin date, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_metric not in ('current','best','days') then raise exception 'bad_metric'; end if;
  return query
    with r as (
      select (pg_catalog.rank() over (
                order by case p_metric when 'current' then m.current_s
                                       when 'best' then m.best_s
                                       else m.days_kept::bigint end desc, m.handle))::int as rk,
             m.*
      from public.season_board_mv m
      where m.season_id = p_season
    )
    select r.rk, r.user_id, r.handle, r.avatar_seed, r.current_s, r.best_s, r.days_kept,
           r.last_checkin, r.user_id = v_uid
    from r
    where r.rk <= 100 or r.user_id = v_uid
    order by r.rk;
end $$;

do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    execute $c$select cron.schedule('season-board-refresh', '*/5 * * * *',
                                    'select public.refresh_season_board()')$c$;
  end if;
end $$;

-- ============ Mutes: own rows only ============
create table public.mutes (
  muter uuid not null references public.profiles(id) on delete cascade,
  muted uuid not null references public.profiles(id) on delete cascade,
  camp_id uuid not null references public.camps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter, muted, camp_id),
  check (muter <> muted)
);
alter table public.mutes enable row level security;
create policy mutes_select_own on public.mutes for select to authenticated
  using (muter = (select auth.uid()));
revoke all on public.mutes from anon;
revoke insert, update, delete on public.mutes from authenticated;

create or replace function public.mute_member(p_camp uuid, p_member uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not public.is_camp_member(p_camp) then raise exception 'not_member'; end if;
  if p_member = v_uid then raise exception 'self_mute'; end if;
  if not exists (select 1 from public.camp_members where camp_id = p_camp and user_id = p_member) then
    raise exception 'not_member';
  end if;
  insert into public.mutes (muter, muted, camp_id) values (v_uid, p_member, p_camp)
  on conflict do nothing;
end $$;

create or replace function public.unmute_member(p_camp uuid, p_member uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.mutes where muter = (select auth.uid()) and muted = p_member and camp_id = p_camp;
$$;

-- Nudges from someone you muted are dropped silently (the sender isn't told).
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
  if exists (select 1 from public.mutes m where m.muter = p_to and m.muted = v_uid and m.camp_id = p_camp) then
    return;
  end if;
  insert into public.nudges (camp_id, from_user, to_user, message_key)
  values (p_camp, v_uid, p_to, p_message_key);
end $$;

-- ============ Reports: server-only table, fixed reasons ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid references public.camps(id) on delete set null,
  reporter uuid references public.profiles(id) on delete set null,
  reported uuid references public.profiles(id) on delete cascade,
  reason_key text not null check (reason_key in ('under_18','harassment','offensive_handle','spam','other')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.reports enable row level security;   -- no policies: secret key only
revoke all on public.reports from anon, authenticated;

create or replace function public.report_member(p_camp uuid, p_member uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not public.is_camp_member(p_camp) then raise exception 'not_member'; end if;
  if p_member = v_uid then raise exception 'self_report'; end if;
  if not exists (select 1 from public.camp_members where camp_id = p_camp and user_id = p_member) then
    raise exception 'not_member';
  end if;
  if p_reason not in ('under_18','harassment','offensive_handle','spam','other') then
    raise exception 'bad_reason';
  end if;
  if (select count(*) from public.reports where reporter = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into public.reports (camp_id, reporter, reported, reason_key)
  values (p_camp, v_uid, p_member, p_reason);
end $$;

-- ============ Camp challenges (Pro) and membership ============
create or replace function public.create_challenge(
  p_camp uuid, p_kind text, p_target_days int, p_starts_at timestamptz, p_ends_at timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.is_camp_member(p_camp) then raise exception 'not_member'; end if;
  if not exists (select 1 from public.entitlements e
                 where e.user_id = v_uid and e.status = 'active'
                   and (e.current_period_end is null or e.current_period_end > now())) then
    raise exception 'pro_required';
  end if;
  if p_kind not in ('first_to_days','longest_streak','most_days') then raise exception 'bad_kind'; end if;
  if p_kind = 'first_to_days' and (p_target_days is null or p_target_days not between 1 and 365) then
    raise exception 'bad_target';
  end if;
  if p_ends_at is null or p_starts_at is null or p_ends_at <= p_starts_at
     or p_ends_at > p_starts_at + interval '366 days' then
    raise exception 'bad_dates';
  end if;
  insert into public.challenges (camp_id, kind, target_days, starts_at, ends_at, created_by)
  values (p_camp, p_kind, case when p_kind = 'first_to_days' then p_target_days end, p_starts_at, p_ends_at, v_uid)
  returning id into v_id;
  return v_id;
end $$;

-- Leaving: the owner's camp passes to the longest-standing member, or closes if empty.
create or replace function public.leave_camp(p_camp uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_next uuid;
begin
  if not public.is_camp_member(p_camp) then raise exception 'not_member'; end if;
  delete from public.camp_members where camp_id = p_camp and user_id = v_uid;
  delete from public.mutes where camp_id = p_camp and muter = v_uid;
  if exists (select 1 from public.camps where id = p_camp and owner_id = v_uid) then
    select user_id into v_next from public.camp_members where camp_id = p_camp order by joined_at limit 1;
    if v_next is null then
      delete from public.camps where id = p_camp;
    else
      update public.camps set owner_id = v_next where id = p_camp;
    end if;
  end if;
end $$;

create or replace function public.remove_member(p_camp uuid, p_member uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.camps where id = p_camp and owner_id = v_uid) then
    raise exception 'owner_only';
  end if;
  if p_member = v_uid then raise exception 'self_remove'; end if;
  delete from public.camp_members where camp_id = p_camp and user_id = p_member;
end $$;

create or replace function public.regenerate_invite_code(p_camp uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_code text;
begin
  if not exists (select 1 from public.camps where id = p_camp and owner_id = v_uid) then
    raise exception 'owner_only';
  end if;
  v_code := encode(extensions.gen_random_bytes(5), 'hex');
  update public.camps set invite_code = v_code where id = p_camp;
  return v_code;
end $$;

-- ============ Realtime: private broadcast channel per camp ("camp:<uuid>") ============
-- Payload is only {"type":"refresh"}; clients refetch through RLS-checked RPCs.
create or replace function public.camp_topic_member(p_topic text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if p_topic is null or p_topic !~ '^camp:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_camp_member(substring(p_topic from 6)::uuid);
end $$;

do $$
begin
  if exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'realtime' and c.relname = 'messages') then
    execute $p$create policy camp_broadcast_read on realtime.messages for select to authenticated
      using (realtime.messages.extension = 'broadcast' and public.camp_topic_member((select realtime.topic())))$p$;
    execute $p$create policy camp_broadcast_write on realtime.messages for insert to authenticated
      with check (realtime.messages.extension = 'broadcast' and public.camp_topic_member((select realtime.topic())))$p$;
  end if;
end $$;

-- ============ Change the end date of a custom challenge ============
-- Only the caller's open, non-season goal; never while a stake is live (it would change the refund date).
create or replace function public.change_goal_end(p_ends_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_tz text; v_today date; v_goal public.goals%rowtype;
begin
  select timezone into v_tz from public.profiles where id = v_uid;
  if v_tz is null then raise exception 'no_profile'; end if;
  v_today := (now() at time zone v_tz)::date;
  select * into v_goal from public.goals where user_id = v_uid and closed_at is null for update;
  if not found then raise exception 'no_open_goal'; end if;
  if v_goal.season_id is not null then raise exception 'season_goal'; end if;
  if exists (select 1 from public.war_chests w
             where w.goal_id = v_goal.id and w.mode = 'stake' and w.status in ('pending','active','settling')) then
    raise exception 'stake_active';
  end if;
  if p_ends_on is null or p_ends_on <= v_today or p_ends_on > v_today + 365 then
    raise exception 'bad_end_date';
  end if;
  update public.goals set ends_on = p_ends_on where id = v_goal.id;
end $$;

-- ============ Function permissions ============
revoke execute on function public.change_goal_end(date) from public, anon, authenticated;
grant execute on function public.change_goal_end(date) to authenticated;
revoke execute on function public.set_timezone(text) from public, anon, authenticated;
revoke execute on function public.refresh_season_board() from public, anon, authenticated;
revoke execute on function public.season_leaderboard(text, text) from public, anon, authenticated;
revoke execute on function public.mute_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.unmute_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.send_nudge(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.report_member(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.create_challenge(uuid, text, int, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.leave_camp(uuid) from public, anon, authenticated;
revoke execute on function public.remove_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.regenerate_invite_code(uuid) from public, anon, authenticated;
revoke execute on function public.camp_topic_member(text) from public, anon, authenticated;

grant execute on function public.set_timezone(text) to authenticated;
grant execute on function public.season_leaderboard(text, text) to authenticated;
grant execute on function public.mute_member(uuid, uuid) to authenticated;
grant execute on function public.unmute_member(uuid, uuid) to authenticated;
grant execute on function public.send_nudge(uuid, uuid, text) to authenticated;
grant execute on function public.report_member(uuid, uuid, text) to authenticated;
grant execute on function public.create_challenge(uuid, text, int, timestamptz, timestamptz) to authenticated;
grant execute on function public.leave_camp(uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.camp_topic_member(text) to authenticated;
grant execute on function public.refresh_season_board() to service_role;
