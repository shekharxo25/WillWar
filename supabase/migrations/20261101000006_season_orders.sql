-- The season pass is checked against the order the server created at checkout (from the
-- post-push security review). The user, amount and currency come from that stored order,
-- never from the payment's notes, which the browser can set.

-- ============ Season pass orders (server writes only) ============
create table public.season_orders (                   -- written only by checkout and the payment webhook
  order_id text primary key check (char_length(order_id) between 1 and 64),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_minor int not null check (amount_minor > 0),
  currency text not null check (currency in ('INR')),
  status text not null default 'created' check (status in ('created','paid')),
  payment_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index season_orders_user_idx on public.season_orders (user_id);

alter table public.season_orders enable row level security;
-- Own rows are readable for data export; there are no write policies.
create policy season_orders_select_own on public.season_orders for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.season_orders from anon;
revoke insert, update, delete on public.season_orders from authenticated;

-- Server only: record the order before the browser opens Razorpay checkout.
create or replace function public.create_season_order(
  p_order text, p_user uuid, p_amount_minor int, p_currency text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_order is null or char_length(p_order) not between 1 and 64 then raise exception 'bad_order'; end if;
  if p_amount_minor is null or p_amount_minor <= 0 then raise exception 'bad_amount'; end if;
  if p_currency is distinct from 'INR' then raise exception 'bad_currency'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'no_profile'; end if;
  insert into public.season_orders (order_id, user_id, amount_minor, currency)
  values (p_order, p_user, p_amount_minor, p_currency);
end $$;

-- Server only: called from the verified payment.captured webhook. Marks the order paid and
-- grants the season pass in one transaction, only for the exact stored amount and currency.
create or replace function public.activate_season_order(
  p_order text, p_payment_ref text, p_amount_minor int, p_currency text, p_period_end timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order public.season_orders%rowtype;
begin
  if p_payment_ref is null or char_length(p_payment_ref) not between 1 and 64 then raise exception 'bad_payment_ref'; end if;
  select * into v_order from public.season_orders where order_id = p_order for update;
  if not found then raise exception 'unknown_order'; end if;
  if v_order.status = 'paid' then
    if v_order.payment_ref = p_payment_ref then return; end if;   -- the same payment, redelivered
    raise exception 'already_paid';
  end if;
  if v_order.amount_minor <> p_amount_minor or v_order.currency <> p_currency then
    raise exception 'amount_mismatch';
  end if;
  update public.season_orders set status = 'paid', payment_ref = p_payment_ref, paid_at = now()
  where order_id = p_order;
  perform public.upsert_entitlement(v_order.user_id, 'season', 'active', p_period_end, p_payment_ref);
end $$;

revoke execute on function public.create_season_order(text, uuid, int, text) from public, anon, authenticated;
revoke execute on function public.activate_season_order(text, text, int, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_season_order(text, uuid, int, text) to service_role;
grant execute on function public.activate_season_order(text, text, int, text, timestamptz) to service_role;
