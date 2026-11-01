-- War Chest forfeits, cancel window and settlement math. dev_s (a2) is the test user.
begin;
select plan(9);

update public.causes set active = true where id = 'placeholder-in';
update public.goals set season_id = null, ends_on = current_date + 20 where user_id = '00000000-0000-4000-8000-0000000000a2';

-- Stake created and activated by the server.
select lives_ok($$ select public.create_stake_chest('00000000-0000-4000-8000-0000000000a2', 49900, 'INR', 'steady', 'placeholder-in') $$, 'server creates a stake');
select throws_ok($$ select public.activate_stake_chest((select id from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2'), 'pay_t', 1, 'INR') $$,
                 'P0001', 'amount_mismatch', 'tampered amounts are rejected');
select lives_ok($$ select public.activate_stake_chest((select id from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2'), 'pay_t', 49900, 'INR') $$, 'webhook activates');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a2"}';
select is(public.log_reset('{}'), 12475, 'Steady forfeits 25%');
select is(public.log_reset('{}'), 12475, 'again 25% of the original');
select is(public.cancel_war_chest(), 'refund_pending', 'cancel inside 24 hours returns what is left');
reset role;

select throws_ok($$ select public.record_refund((select id from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2'), 'rfnd_t', 49900) $$,
                 'P0001', 'amount_mismatch', 'refund must equal stake minus forfeits');
select lives_ok($$ select public.record_refund((select id from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2'), 'rfnd_t', 24950) $$, 'refund recorded');
select is((select sum(case when kind = 'funded' then amount_minor else -amount_minor end)::int
           from public.money_ledger where war_chest_ref = (select id from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2')),
          0, 'ledger balances: funded = forfeits + refund');

select * from finish();
rollback;
