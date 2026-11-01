-- Push reminders (Phase 10). The send-reminders Edge Function calls due_reminders() every
-- 15 minutes with the service role and sends discreet copy; nothing here is user-callable.

create or replace function public.due_reminders(p_now timestamptz default now())
returns table (subscription_id uuid, endpoint text, p256dh text, auth text,
               day_number int, discreet boolean, kind text)
language sql stable security definer set search_path = '' as $$
  with local as (
    select p.id, p.discreet_notifications, p.night_watch,
           (p_now at time zone p.timezone) as lt,
           (p_now at time zone p.timezone)::date as ld,
           p.reminder_time::time as rt,
           p.timezone
    from public.profiles p
    where exists (select 1 from public.push_subscriptions s where s.user_id = p.id)
  ),
  due as (
    select l.*,
           case
             -- Night watch: an opt-in gentle check-in at 23:00, the only send in quiet hours.
             when l.night_watch and l.lt::time >= time '23:00' and l.lt::time < time '23:15' then 'night_watch'
             -- Daily reminder at the chosen time, outside quiet hours (23:00-07:00).
             when l.lt::time >= l.rt and l.lt::time < l.rt + interval '15 minutes'
                  and l.rt >= time '07:00' and l.rt < time '23:00' then 'checkin'
           end as kind
    from local l
  )
  select s.id, s.endpoint, s.p256dh, s.auth,
         coalesce((select (d.ld - (st.started_at at time zone d.timezone)::date) + 1
                   from public.streaks st where st.user_id = d.id and st.ended_at is null and st.started_at <= p_now), 0)::int,
         d.discreet_notifications, d.kind
  from due d
  join public.push_subscriptions s on s.user_id = d.id
  where d.kind is not null
    and not exists (select 1 from public.checkins c where c.user_id = d.id and c.local_date = d.ld);
$$;

revoke execute on function public.due_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.due_reminders(timestamptz) to service_role;
