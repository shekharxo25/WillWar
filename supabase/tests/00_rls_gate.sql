-- Required RLS gate (MASTER_PROMPT Part 5). CI runs this with `supabase test db`.
begin;
select plan(3);
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'every public table has RLS enabled');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
                      where cfg like 'search_path=%')),
  0, 'every security definer function pins search_path');

select is(
  (select count(*)::int from (values
      ('public.create_stake_chest(uuid,int,text,text,text)'),
      ('public.activate_stake_chest(uuid,text,int,text)'),
      ('public.record_refund(uuid,text,int)'),
      ('public.settle_due_war_chests()')) f(sig)
    where has_function_privilege('authenticated', f.sig, 'execute')
       or has_function_privilege('anon', f.sig, 'execute')),
  0, 'money-moving functions are server-only');

select * from finish();
rollback;
