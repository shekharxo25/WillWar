-- Opt-in global season board (social-integrity.md): only people who chose "Everyone",
-- handles and numbers only; top 100 plus the caller's own row.
-- Computed on read for now; move to a pg_cron-refreshed materialized view when traffic needs it.
create or replace function public.season_leaderboard(p_season text, p_metric text)
returns table (rank int, handle text, avatar_seed text, value bigint, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with season as (select s.starts_on, s.ends_on from public.seasons s where s.id = p_season),
  people as (
    select p.id, p.handle, p.avatar_seed, p.timezone
    from public.profiles p
    join public.season_members m on m.user_id = p.id and m.season_id = p_season
    where p.leaderboard_visibility = 'global'
  ),
  scored as (
    select pe.id, pe.handle, pe.avatar_seed,
      case p_metric
        when 'current' then coalesce((select extract(epoch from (now() - st.started_at))::bigint
                                      from public.streaks st where st.user_id = pe.id and st.ended_at is null and st.started_at <= now()), 0)
        when 'best' then coalesce((select max(extract(epoch from (
                                      least(coalesce(st.ended_at, now()), (se.ends_on + 1)::timestamp at time zone pe.timezone)
                                      - greatest(st.started_at, se.starts_on::timestamp at time zone pe.timezone))))::bigint
                                   from public.streaks st, season se
                                   where st.user_id = pe.id
                                     and st.started_at < least(now(), (se.ends_on + 1)::timestamp at time zone pe.timezone)
                                     and coalesce(st.ended_at, now()) > se.starts_on::timestamp at time zone pe.timezone), 0)
        else (select count(*) from public.checkins c, season se
              where c.user_id = pe.id and c.status in ('held','shielded') and c.local_date between se.starts_on and se.ends_on)
      end as value
    from people pe
  ),
  ranked as (
    select (rank() over (order by s.value desc))::int as rank, s.handle, s.avatar_seed, s.value, s.id = (select auth.uid()) as is_me
    from scored s
  )
  select r.rank, r.handle, r.avatar_seed, r.value, r.is_me from ranked r
  where p_metric in ('current','best','days') and (r.rank <= 100 or r.is_me)
  order by r.rank, r.handle;
$$;

revoke execute on function public.season_leaderboard(text, text) from public, anon, authenticated;
grant execute on function public.season_leaderboard(text, text) to authenticated;
