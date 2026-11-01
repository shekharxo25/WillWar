-- WillWar 0003: entitlements, shields, webhook idempotency, donations, export/delete,
-- retention and reminder scheduling. Server-only functions are granted to service_role only.

-- ============ Reminder preferences ============
alter table public.profiles add column reminder_time time not null default '21:30';
alter table public.profiles add column night_watch boolean not null default false;
grant update (reminder_time, night_watch) on public.profiles to authenticated;

-- ============ Payments webhook: the only writer of entitlements ============
create or replace function public.record_webhook_event(p_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or length(p_id) = 0 then raise exception 'bad_event_id'; end if;
  insert into public.webhook_events (id) values (p_id) on conflict (id) do nothing;
  return found;                     -- false: already processed, skip
end $$;

create or replace function public.apply_entitlement(
  p_user uuid, p_plan text, p_status text, p_period_end timestamptz, p_ref text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'no_profile'; end if;
  insert into public.entitlements (user_id, plan, status, current_period_end, provider_ref, updated_at)
  values (p_user, p_plan, p_status, p_period_end, p_ref, now())
  on conflict (user_id) do update
    set plan = excluded.plan, status = excluded.status,
        current_period_end = excluded.current_period_end,
        provider_ref = coalesce(excluded.provider_ref, public.entitlements.provider_ref),
        updated_at = now();
end $$;

-- ============ Shields ============
-- Pro members get two shields a month. Idempotent: running twice in a month grants nothing more.
create or replace function public.grant_pro_monthly_shields()
returns int language plpgsql security definer set search_path = '' as $$
declare v_count int := 0; r record; v_have int;
begin
  for r in
    select e.user_id from public.entitlements e
    where e.status = 'active' and (e.current_period_end is null or e.current_period_end > now())
  loop
    select count(*) into v_have from public.shields s
    where s.user_id = r.user_id and s.source = 'pro_monthly'
      and date_trunc('month', s.granted_at) = date_trunc('month', now());
    while v_have < 2 loop
      insert into public.shields (user_id, source) values (r.user_id, 'pro_monthly');
      v_have := v_have + 1;
      v_count := v_count + 1;
    end loop;
  end loop;
  return v_count;
end $$;

-- Rewarded-ad shields: capped at 2 per 7 days, called by /api/rewards/shield after the ad callback.
create or replace function public.grant_rewarded_shield(p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_user::text));
  if (select count(*) from public.shields
      where user_id = p_user and source = 'rewarded_ad' and granted_at > now() - interval '7 days') >= 2 then
    raise exception 'shield_cap';
  end if;
  insert into public.shields (user_id, source) values (p_user, 'rewarded_ad') returning id into v_id;
  return v_id;
end $$;

-- ============ Donations ============
-- Monthly: sum forfeit_to_cause ledger rows into one batch per cause and currency.
-- Batches already marked donated are never changed.
create or replace function public.monthly_donation_batches(p_period text)
returns int language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if p_period !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'bad_period'; end if;
  insert into public.donation_batches (cause_id, period, currency, amount_minor)
  select l.cause_id, p_period, l.currency, sum(l.amount_minor)::int
  from public.money_ledger l
  where l.kind = 'forfeit_to_cause' and l.cause_id is not null
    and to_char(l.created_at at time zone 'UTC', 'YYYY-MM') = p_period
  group by l.cause_id, l.currency
  on conflict (cause_id, period, currency) do update
    set amount_minor = excluded.amount_minor
    where public.donation_batches.donated_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ============ Export and deletion ============
create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) as id)
  select case when (select id from me) is null then null else jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = (select id from me)),
    'streaks', coalesce((select jsonb_agg(to_jsonb(s) order by s.started_at) from public.streaks s where s.user_id = (select id from me)), '[]'),
    'checkins', coalesce((select jsonb_agg(to_jsonb(c) order by c.local_date) from public.checkins c where c.user_id = (select id from me)), '[]'),
    'resets', coalesce((select jsonb_agg(to_jsonb(r) order by r.occurred_at) from public.resets r where r.user_id = (select id from me)), '[]'),
    'urge_sessions', coalesce((select jsonb_agg(to_jsonb(u) order by u.started_at) from public.urge_sessions u where u.user_id = (select id from me)), '[]'),
    'goals', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at) from public.goals g where g.user_id = (select id from me)), '[]'),
    'corner_talk', coalesce((select jsonb_agg(to_jsonb(a) order by a.for_date) from public.affirmations a where a.user_id = (select id from me)), '[]'),
    'shields', coalesce((select jsonb_agg(to_jsonb(sh) order by sh.granted_at) from public.shields sh where sh.user_id = (select id from me)), '[]'),
    'entitlement', (select to_jsonb(e) from public.entitlements e where e.user_id = (select id from me)),
    'war_chests', coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at) from public.war_chests w where w.user_id = (select id from me)), '[]'),
    'war_chest_events', coalesce((select jsonb_agg(to_jsonb(we) order by we.created_at) from public.war_chest_events we
                                  join public.war_chests w on w.id = we.war_chest_id where w.user_id = (select id from me)), '[]'),
    'camps', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'joined_at', m.joined_at, 'owner', c.owner_id = (select id from me)))
                       from public.camp_members m join public.camps c on c.id = m.camp_id where m.user_id = (select id from me)), '[]'),
    'nudges_sent', coalesce((select jsonb_agg(jsonb_build_object('message_key', n.message_key, 'created_at', n.created_at))
                             from public.nudges n where n.from_user = (select id from me)), '[]'),
    'nudges_received', coalesce((select jsonb_agg(jsonb_build_object('message_key', n.message_key, 'created_at', n.created_at))
                                 from public.nudges n where n.to_user = (select id from me)), '[]'),
    'push_devices', (select count(*) from public.push_subscriptions ps where ps.user_id = (select id from me))
  ) end;
$$;

-- Client-side check before showing the final delete step.
create or replace function public.delete_my_account_check()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if exists (select 1 from public.war_chests w
             where w.user_id = (select auth.uid()) and w.mode = 'stake' and w.status in ('active','settling')) then
    raise exception 'refund_first';
  end if;
end $$;

-- Server only: before deleting an account, move any live stake to settling and return what
-- must be refunded (stake minus forfeits). The route refunds, calls record_refund, then deletes.
create or replace function public.prepare_account_deletion(p_user uuid)
returns table (war_chest_id uuid, payment_ref text, refund_minor int, refund_currency text)
language plpgsql security definer set search_path = '' as $$
begin
  update public.war_chests w set status = 'settling'
  where w.user_id = p_user and w.mode = 'stake' and w.status = 'active';
  update public.war_chests w set status = 'settled', settled_at = now()
  where w.user_id = p_user and w.status = 'settling' and w.forfeited_minor = w.amount_minor;
  update public.war_chests w set status = 'cancelled'
  where w.user_id = p_user and w.status = 'pending';
  return query
    select w.id, w.provider_payment_ref, w.amount_minor - w.forfeited_minor, w.currency
    from public.war_chests w
    where w.user_id = p_user and w.mode = 'stake' and w.status = 'settling' and w.refund_ref is null;
end $$;

-- ============ Retention (Part 7.1) ============
create or replace function public.purge_expired()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.resets where occurred_at < now() - interval '24 months';
  delete from public.urge_sessions where started_at < now() - interval '24 months';
  delete from public.affirmations where created_at < now() - interval '90 days';
  delete from public.nudges where created_at < now() - interval '90 days';
  delete from public.events where created_at < now() - interval '13 months';
end $$;

do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    execute $c$select cron.schedule('purge-expired', '17 3 * * *', 'select public.purge_expired()')$c$;
    execute $c$select cron.schedule('pro-monthly-shields', '23 0 1 * *', 'select public.grant_pro_monthly_shields()')$c$;
  end if;
end $$;

-- ============ Reminders (read by the send-reminders Edge Function every 15 minutes) ============
-- Daily reminders at each user's local reminder_time when today isn't checked in yet, plus camp
-- nudges from the last 15 minutes. Quiet hours 23:00-07:00 local unless Night watch is on.
create or replace function public.due_reminders()
returns table (kind text, user_id uuid, endpoint text, p256dh text, auth text,
               day int, discreet boolean, message_key text)
language sql stable security definer set search_path = '' as $$
  with local as (
    select p.id, p.discreet_notifications, p.night_watch, p.reminder_time,
           (now() at time zone p.timezone) as local_ts
    from public.profiles p
  ), awake as (
    select l.* from local l
    where l.night_watch or extract(hour from l.local_ts) between 7 and 22
  )
  select 'daily'::text, a.id, ps.endpoint, ps.p256dh, ps.auth,
         (floor(extract(epoch from (now() - s.started_at)) / 86400) + 1)::int,
         a.discreet_notifications, null::text
  from awake a
  join public.push_subscriptions ps on ps.user_id = a.id
  join public.streaks s on s.user_id = a.id and s.ended_at is null and s.started_at <= now()
  where a.local_ts::time >= a.reminder_time
    and a.local_ts::time < a.reminder_time + interval '15 minutes'
    and not exists (select 1 from public.checkins c where c.user_id = a.id and c.local_date = a.local_ts::date)
  union all
  select 'nudge'::text, a.id, ps.endpoint, ps.p256dh, ps.auth, null::int, a.discreet_notifications, n.message_key
  from public.nudges n
  join awake a on a.id = n.to_user
  join public.push_subscriptions ps on ps.user_id = a.id
  where n.created_at > now() - interval '15 minutes';
$$;

-- Server only: remove a dead push endpoint after a 404/410.
create or replace function public.remove_push_endpoint(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

-- Saves this device's push subscription for the signed-in user.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then raise exception 'bad_endpoint'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (v_uid, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

-- ============ Function permissions ============
revoke execute on function public.record_webhook_event(text) from public, anon, authenticated;
revoke execute on function public.apply_entitlement(uuid, text, text, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.grant_pro_monthly_shields() from public, anon, authenticated;
revoke execute on function public.grant_rewarded_shield(uuid) from public, anon, authenticated;
revoke execute on function public.monthly_donation_batches(text) from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon, authenticated;
revoke execute on function public.delete_my_account_check() from public, anon, authenticated;
revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
revoke execute on function public.purge_expired() from public, anon, authenticated;
revoke execute on function public.due_reminders() from public, anon, authenticated;
revoke execute on function public.remove_push_endpoint(text) from public, anon, authenticated;
revoke execute on function public.save_push_subscription(text, text, text) from public, anon, authenticated;

grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account_check() to authenticated;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

grant execute on function public.record_webhook_event(text) to service_role;
grant execute on function public.apply_entitlement(uuid, text, text, timestamptz, text) to service_role;
grant execute on function public.grant_pro_monthly_shields() to service_role;
grant execute on function public.grant_rewarded_shield(uuid) to service_role;
grant execute on function public.monthly_donation_batches(text) to service_role;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
grant execute on function public.purge_expired() to service_role;
grant execute on function public.due_reminders() to service_role;
grant execute on function public.remove_push_endpoint(text) to service_role;
