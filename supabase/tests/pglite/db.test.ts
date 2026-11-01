import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, asAnon, asUser, createDb, onboard, raises } from "./harness";

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const C = "00000000-0000-4000-8000-00000000000c";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
  for (const u of [A, B, C]) await addUser(db, u);
  await asUser(db, A, (tx) => onboard(tx, "quietmile"));
  await asUser(db, B, (tx) => onboard(tx, "rohan_k"));
});

describe("RLS gate", () => {
  it("every public table has RLS enabled", async () => {
    const r = await db.query<{ n: number }>(
      `select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(r.rows[0].n).toBe(0);
  });

  it("every security definer function pins search_path", async () => {
    const r = await db.query<{ proname: string }>(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef
         and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')`,
    );
    expect(r.rows).toEqual([]);
  });

  it("money and grant functions are server-only", async () => {
    const r = await db.query<{ sig: string }>(
      `select f.sig from (values
         ('public.create_stake_chest(uuid,int,text,text,text)'),
         ('public.activate_stake_chest(uuid,text,int,text)'),
         ('public.record_refund(uuid,text,int)'),
         ('public.settle_due_war_chests()'),
         ('public.create_season_order(text,uuid,int,text)'),
         ('public.activate_season_order(text,text,int,text,timestamptz)'),
         ('public.grant_shield(uuid,text)')) f(sig)
       where has_function_privilege('authenticated', f.sig, 'execute')
          or has_function_privilege('anon', f.sig, 'execute')`,
    );
    expect(r.rows).toEqual([]);
  });

  it("anon can't read personal tables or run user RPCs, but can check a handle", async () => {
    expect(await raises(asAnon(db, (tx) => tx.query("select * from public.profiles")))).toMatch(/permission denied/);
    expect(await raises(asAnon(db, (tx) => tx.query("select public.check_in()")))).toMatch(/permission denied/);
    const seasons = await asAnon(db, (tx) => tx.query("select id from public.seasons"));
    expect(seasons.rows).toHaveLength(1);
    const free = await asAnon(db, (tx) => tx.query<{ ok: boolean }>("select public.check_handle_available('newperson') ok"));
    expect(free.rows[0].ok).toBe(true);
  });
});

describe("onboarding", () => {
  it("refuses under-18s and stores nothing", async () => {
    const msg = await raises(asUser(db, C, (tx) => onboard(tx, "young_one", "2010-01-01")));
    expect(msg).toMatch(/must_be_18/);
    const r = await db.query("select 1 from public.profiles where id = $1", [C]);
    expect(r.rows).toHaveLength(0);
  });

  it("rejects blocked handles and reports taken ones", async () => {
    expect(await raises(asUser(db, C, (tx) => onboard(tx, "willwar_admin")))).toMatch(/bad_handle/);
    const taken = await asUser(db, C, (tx) => tx.query<{ ok: boolean }>("select public.check_handle_available('quietmile') ok"));
    expect(taken.rows[0].ok).toBe(false);
  });

  it("never stores a date of birth", async () => {
    const cols = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and column_name ilike '%birth%'",
    );
    expect(cols.rows).toEqual([]);
  });
});

describe("cross-user isolation", () => {
  it("user B sees none of user A's rows", async () => {
    await asUser(db, A, (tx) => tx.query("select public.check_in()"));
    for (const table of ["profiles", "streaks", "checkins", "resets", "urge_sessions", "goals", "shields"]) {
      const r = await asUser(db, B, (tx) => tx.query(`select * from public.${table} where ${table === "profiles" ? "id" : "user_id"} = $1`, [A]));
      expect(r.rows, table).toHaveLength(0);
    }
  });

  it("users can't edit identity fields on their own profile", async () => {
    const msg = await raises(asUser(db, A, (tx) => tx.query("update public.profiles set handle = 'hacker' where id = $1", [A])));
    expect(msg).toMatch(/permission denied/);
  });
});

describe("check-ins, resets and the War Chest (promise mode)", () => {
  it("check-in is idempotent per local day", async () => {
    await asUser(db, A, (tx) => tx.query("select public.check_in()"));
    await asUser(db, A, (tx) => tx.query("select public.check_in()"));
    const r = await db.query<{ n: number }>("select count(*)::int n from public.checkins where user_id = $1", [A]);
    expect(r.rows[0].n).toBe(1);
  });

  it("Steady forfeits a quarter per reset and keeps history", async () => {
    await asUser(db, A, (tx) => tx.query("select public.sign_pledge()"));
    await asUser(db, A, (tx) =>
      tx.query("select public.create_promise_chest(49900, 'INR', 'steady', 'placeholder-global-water')"),
    );
    const f1 = await asUser(db, A, (tx) => tx.query<{ f: number }>("select public.log_reset(array['bored']) f"));
    const f2 = await asUser(db, A, (tx) => tx.query<{ f: number }>("select public.log_reset('{}') f"));
    expect([f1.rows[0].f, f2.rows[0].f]).toEqual([12475, 12475]);
    const streaks = await db.query<{ open: number; closed: number }>(
      `select count(*) filter (where ended_at is null)::int open, count(*) filter (where ended_at is not null)::int closed
       from public.streaks where user_id = $1`,
      [A],
    );
    expect(streaks.rows[0]).toEqual({ open: 1, closed: 2 });
  });

  it("reset tags outside the fixed list are rejected", async () => {
    expect(await raises(asUser(db, A, (tx) => tx.query("select public.log_reset(array['free text'])")))).toMatch(/check/i);
  });

  it("the War Chest offer is never eligible twice", async () => {
    const r = await asUser(db, A, (tx) => tx.query<{ ok: boolean }>("select public.war_chest_offer_eligible() ok"));
    expect(r.rows[0].ok).toBe(false);
  });
});

describe("pacts", () => {
  let pact = "";
  beforeAll(async () => {
    const r = await asUser(db, A, (tx) => tx.query<{ id: string }>("select public.create_pact('Dawn Crew', null) id"));
    pact = r.rows[0].id;
    const code = await db.query<{ invite_code: string }>("select invite_code from public.pacts where id = $1", [pact]);
    await asUser(db, B, (tx) => tx.query("select public.join_pact($1)", [code.rows[0].invite_code]));
  });

  it("members see the board with handles and numbers; non-members see nothing", async () => {
    const board = await asUser(db, B, (tx) => tx.query<{ handle: string }>("select handle from public.pact_leaderboard($1)", [pact]));
    expect(board.rows.map((r) => r.handle).sort()).toEqual(["quietmile", "rohan_k"]);
    await addUser(db, "00000000-0000-4000-8000-00000000000d");
    const outsider = await asUser(db, "00000000-0000-4000-8000-00000000000d", (tx) =>
      tx.query("select * from public.pact_leaderboard($1)", [pact]),
    );
    expect(outsider.rows).toHaveLength(0);
  });

  it("only the owner sees the invite code in my_pacts", async () => {
    const owner = await asUser(db, A, (tx) => tx.query<{ invite_code: string | null }>("select invite_code from public.my_pacts()"));
    const member = await asUser(db, B, (tx) => tx.query<{ invite_code: string | null }>("select invite_code from public.my_pacts()"));
    expect(owner.rows[0].invite_code).toMatch(/^[0-9a-f]{10}$/);
    expect(member.rows[0].invite_code).toBeNull();
  });

  it("private people never appear on boards", async () => {
    await asUser(db, B, (tx) => tx.query("update public.profiles set leaderboard_visibility = 'private' where id = $1", [B]));
    const board = await asUser(db, A, (tx) => tx.query<{ handle: string }>("select handle from public.pact_leaderboard($1)", [pact]));
    expect(board.rows.map((r) => r.handle)).toEqual(["quietmile"]);
    await asUser(db, B, (tx) => tx.query("update public.profiles set leaderboard_visibility = 'pacts' where id = $1", [B]));
  });

  it("muted senders' nudges are dropped silently; the rate limit is 3 a day", async () => {
    await asUser(db, B, (tx) => tx.query("select public.mute_member($1)", [A]));
    await asUser(db, A, (tx) => tx.query("select public.send_nudge($1, $2, 'proud_of_you')", [pact, B]));
    const muted = await db.query<{ n: number }>("select count(*)::int n from public.nudges where from_user = $1", [A]);
    expect(muted.rows[0].n).toBe(0);
    for (let i = 0; i < 3; i++) await asUser(db, B, (tx) => tx.query("select public.send_nudge($1, $2, 'with_you')", [pact, A]));
    expect(await raises(asUser(db, B, (tx) => tx.query("select public.send_nudge($1, $2, 'with_you')", [pact, A])))).toMatch(
      /rate_limited/,
    );
  });

  it("nobody else can read reset tags", async () => {
    const r = await asUser(db, B, (tx) => tx.query("select * from public.resets"));
    expect(r.rows).toHaveLength(0);
  });
});

describe("server-only shields", () => {
  it("caps rewarded shields at two a week", async () => {
    await db.query("select public.grant_shield($1, 'rewarded_ad')", [B]);
    await db.query("select public.grant_shield($1, 'rewarded_ad')", [B]);
    expect(await raises(db.query("select public.grant_shield($1, 'rewarded_ad')", [B]))).toMatch(/shield_cap/);
  });

  // PGlite has one connection, so two grants can't actually race here. This guards the lock
  // that makes the cap hold under concurrent requests on a real Postgres.
  it("takes a per-user lock before counting toward the cap", async () => {
    const r = await db.query<{ src: string }>("select prosrc src from pg_proc where oid = 'public.grant_shield(uuid,text)'::regprocedure");
    const src = r.rows[0].src;
    expect(src).toMatch(/pg_advisory_xact_lock\(.*p_user/);
    expect(src.indexOf("pg_advisory_xact_lock")).toBeLessThan(src.indexOf("count(*)"));
  });
});
