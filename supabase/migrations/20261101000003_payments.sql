-- Payments: entitlements change only through the verified Razorpay webhook (server-only).

-- Idempotency: true the first time an event id is seen, false for a redelivery.
create or replace function public.record_webhook_event(p_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or char_length(p_id) not between 1 and 128 then raise exception 'bad_event_id'; end if;
  insert into public.webhook_events (id) values (p_id) on conflict do nothing;
  return found;
end $$;

create or replace function public.upsert_entitlement(
  p_user uuid, p_plan text, p_status text, p_period_end timestamptz, p_provider_ref text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_plan not in ('season','annual') then raise exception 'bad_plan'; end if;
  if p_status not in ('active','past_due','canceled','expired') then raise exception 'bad_status'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'no_profile'; end if;
  insert into public.entitlements (user_id, plan, status, current_period_end, provider, provider_ref, updated_at)
  values (p_user, p_plan, p_status, p_period_end, 'razorpay', p_provider_ref, now())
  on conflict (user_id) do update
    set plan = excluded.plan, status = excluded.status, current_period_end = excluded.current_period_end,
        provider_ref = excluded.provider_ref, updated_at = now();
end $$;

-- Pro includes two shields a month; idempotent per user per calendar month.
create or replace function public.grant_pro_monthly_shields()
returns int language plpgsql security definer set search_path = '' as $$
declare v_count int := 0; v_user uuid;
begin
  for v_user in
    select e.user_id from public.entitlements e
    where e.status = 'active' and (e.current_period_end is null or e.current_period_end > now())
      and not exists (select 1 from public.shields s where s.user_id = e.user_id and s.source = 'pro_monthly'
                      and s.granted_at >= date_trunc('month', now()))
  loop
    insert into public.shields (user_id, source) values (v_user, 'pro_monthly'), (v_user, 'pro_monthly');
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke execute on function public.record_webhook_event(text) from public, anon, authenticated;
revoke execute on function public.upsert_entitlement(uuid, text, text, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.grant_pro_monthly_shields() from public, anon, authenticated;
grant execute on function public.record_webhook_event(text) to service_role;
grant execute on function public.upsert_entitlement(uuid, text, text, timestamptz, text) to service_role;
grant execute on function public.grant_pro_monthly_shields() to service_role;

-- Run the monthly shield grant daily where pg_cron exists (it is idempotent per month).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('willwar-pro-shields', '15 0 * * *', 'select public.grant_pro_monthly_shields()');
  end if;
end $$;
