-- Camp isolation, private users and nudge limits. Seed: camp c001 with a1, a2, a3.
begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000b1', 'outsider@example.com');
insert into public.profiles (id, handle, adult_confirmed_at) values ('00000000-0000-4000-8000-0000000000b1', 'outsider', now());
update public.profiles set leaderboard_visibility = 'private' where id = '00000000-0000-4000-8000-0000000000a3';

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000b1"}';
select is((select count(*)::int from public.camps), 0, 'non-members see no camps');
select is((select count(*)::int from public.camps where invite_code = 'demo000001'), 0, 'not even by invite code');
select is((select count(*)::int from public.camp_members), 0, 'non-members see no members');
select is((select count(*)::int from public.camp_leaderboard('00000000-0000-4000-8000-00000000c001')), 0, 'non-members get an empty board');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1"}';
select is((select count(*)::int from public.camp_leaderboard('00000000-0000-4000-8000-00000000c001')), 2, 'members see the board without private users');
select lives_ok($$ select public.send_nudge('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a2', 'proud_of_you') $$, 'nudge 1');
select lives_ok($$ select public.send_nudge('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a2', 'almost_there');
                  select public.send_nudge('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a2', 'get_up') $$, 'nudges 2 and 3');
select throws_ok($$ select public.send_nudge('00000000-0000-4000-8000-00000000c001', '00000000-0000-4000-8000-0000000000a2', 'go_a_round') $$, 'P0001', 'rate_limited', 'the fourth nudge in a day is refused');

select * from finish();
rollback;
