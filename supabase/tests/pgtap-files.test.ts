/**
 * Runs the pgTAP files in this folder against PGlite with a tiny pgTAP shim (plan, is,
 * throws_ok, lives_ok, finish), so the SQL that CI runs with `supabase test db` is also
 * exercised locally without Docker.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { freshDb } from "./harness";

const SHIM = `
create table public._tap (n serial, ok boolean, description text);
alter table public._tap enable row level security;
create policy tap_all on public._tap for all to public using (true) with check (true);
grant all on public._tap to anon, authenticated;
grant all on sequence public._tap_n_seq to anon, authenticated;
create function public.plan(int) returns text language sql as $$ select 'plan ' || $1 $$;
create function public.is(anyelement, anyelement, text) returns text language plpgsql as $$
begin
  insert into public._tap (ok, description) values ($1 is not distinct from $2, $3);
  if $1 is distinct from $2 then raise exception 'not ok: % (got %, want %)', $3, $1, $2; end if;
  return 'ok ' || $3;
end $$;
create function public.lives_ok(text, text) returns text language plpgsql as $$
begin
  execute $1;
  insert into public._tap (ok, description) values (true, $2);
  return 'ok ' || $2;
end $$;
create function public.throws_ok(text, text, text, text) returns text language plpgsql as $$
begin
  begin
    execute $1;
  exception when others then
    if ($2 is null or sqlstate = $2) and ($3 is null or sqlerrm = $3) then
      insert into public._tap (ok, description) values (true, $4);
      return 'ok ' || $4;
    end if;
    raise exception 'not ok: % (got % %)', $4, sqlstate, sqlerrm;
  end;
  raise exception 'not ok: % (no error)', $4;
end $$;
create function public.finish() returns setof text language sql as $$ select 'done'::text $$;
`;

const files = readdirSync(__dirname).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();

describe("pgTAP files (shimmed)", () => {
  for (const f of files) {
    it(f, async () => {
      const db = await freshDb();
      await db.exec(SHIM);
      const sql = readFileSync(path.join(__dirname, f), "utf8").replace(/\brollback;\s*$/m, "commit;");
      await db.exec(sql);
      const planned = Number(sql.match(/select plan\((\d+)\)/)?.[1]);
      const ran = (await db.query<{ n: number }>(`select count(*)::int n from public._tap where ok`)).rows[0].n;
      expect(ran).toBe(planned);
      await db.close();
    });
  }
});
