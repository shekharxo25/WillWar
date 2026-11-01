-- Rewarded-ad shields are granted one at a time per user, so simultaneous requests can't each
-- see "under the cap" and all insert (from the post-push security review).
create or replace function public.grant_shield(p_user uuid, p_source text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_source not in ('rewarded_ad','pro_monthly','referral') then raise exception 'bad_source'; end if;
  -- Held until commit: a second grant for the same user waits here, then counts the first one.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('willwar.grant_shield'), pg_catalog.hashtext(p_user::text));
  if p_source = 'rewarded_ad' and (
    select count(*) from public.shields
    where user_id = p_user and source = 'rewarded_ad' and granted_at > now() - interval '7 days') >= 2 then
    raise exception 'shield_cap';
  end if;
  insert into public.shields (user_id, source) values (p_user, p_source) returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.grant_shield(uuid, text) from public, anon, authenticated;
grant execute on function public.grant_shield(uuid, text) to service_role;
