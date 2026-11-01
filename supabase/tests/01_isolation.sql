-- Cross-user isolation and anon denial. Uses the seeded local demo users.
begin;
select plan(12);

-- rohan_k (a1) and dev_s (a2)
insert into public.resets (user_id, tags) values ('00000000-0000-4000-8000-0000000000a2', '{bored}');
insert into public.urge_sessions (user_id, game, duration_s) values ('00000000-0000-4000-8000-0000000000a2', 'bag', 180);
insert into public.affirmations (user_id, for_date, body, source) values ('00000000-0000-4000-8000-0000000000a2', current_date, 'Day 6. Same plan as yesterday.', 'fallback');
insert into public.entitlements (user_id, plan, status) values ('00000000-0000-4000-8000-0000000000a2', 'season', 'active');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1"}';

select is((select count(*)::int from public.streaks where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s streaks');
select is((select count(*)::int from public.checkins where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s check-ins');
select is((select count(*)::int from public.resets where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s resets');
select is((select count(*)::int from public.urge_sessions where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s rounds');
select is((select count(*)::int from public.affirmations where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s corner talk');
select is((select count(*)::int from public.entitlements where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s entitlements');
select is((select count(*)::int from public.war_chests where user_id = '00000000-0000-4000-8000-0000000000a2'), 0, 'A reads none of B''s War Chests');
select is((select count(*)::int from public.profiles), 1, 'A sees only their own profile');
select throws_ok($$ update public.profiles set handle = 'stolen' where id = '00000000-0000-4000-8000-0000000000a1' $$, '42501', null, 'handles are not user-editable');
select throws_ok($$ select public.settle_due_war_chests() $$, '42501', null, 'settlement is server-only');

reset role;
set local role anon;
select throws_ok($$ select 1 from public.profiles $$, '42501', null, 'anon denied on profiles');
select lives_ok($$ select 1 from public.seasons $$, 'anon may read seasons');

select * from finish();
rollback;
