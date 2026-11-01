/**
 * Database tests against the real migrations, in-process (PGlite). Mirrors the pgTAP files
 * in this folder so they run anywhere with `npm run db:test:local` (no Docker).
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { zonedMidnight } from "@/lib/time";
import { addDays, asAnon, asService, asUser, authUser, daytimeZone, errorOf, freshDb, localToday, onboard } from "./harness";

let db: PGlite;
beforeAll(async () => {
  db = await freshDb();
  // Tests need an active cause; the seed ships both placeholders inactive.
  await db.exec(`update public.causes set active = true where id = 'placeholder-in'`);
});

const one = async <T>(p: Promise<{ rows: T[] }>) => (await p).rows[0];
const count = async (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  (await tx.query<{ n: number }>(`select count(*)::int as n from (${sql}) q`, params)).rows[0].n;

describe("RLS gate (Part 5 required checks)", () => {
  it("every public table has RLS enabled", async () => {
    const r = await one(db.query<{ n: number }>(`select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`));
    expect(r.n).toBe(0);
  });
  it("every security definer function pins search_path", async () => {
    const r = await one(db.query<{ n: number }>(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')`));
    expect(r.n).toBe(0);
  });
  it("money-moving functions are server-only", async () => {
    const r = await one(db.query<{ n: number }>(`select count(*)::int n from (values
        ('public.create_stake_chest(uuid,int,text,text,text)'),
        ('public.activate_stake_chest(uuid,text,int,text)'),
        ('public.record_refund(uuid,text,int)'),
        ('public.settle_due_war_chests()'),
        ('public.apply_entitlement(uuid,text,text,timestamptz,text)'),
        ('public.record_webhook_event(text)'),
        ('public.grant_rewarded_shield(uuid)'),
        ('public.grant_pro_monthly_shields()'),
        ('public.monthly_donation_batches(text)'),
        ('public.prepare_account_deletion(uuid)'),
        ('public.due_reminders()'),
        ('public.purge_expired()')) f(sig)
      where has_function_privilege('authenticated', f.sig, 'execute') or has_function_privilege('anon', f.sig, 'execute')`));
    expect(r.n).toBe(0);
  });
  it("the gate fails when RLS is disabled on any table", async () => {
    await db.exec(`begin; alter table public.streaks disable row level security;`);
    const r = await one(db.query<{ n: number }>(`select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`));
    await db.exec(`rollback;`);
    expect(r.n).toBe(1);
  });
});

describe("onboarding and the age gate", () => {
  it("blocks under-18 sign-ups and stores nothing", async () => {
    const id = await authUser(db);
    const dob = addDays(localToday("UTC"), -(17 * 365));
    const err = await errorOf(asUser(db, id, (tx) =>
      tx.query(`select public.complete_onboarding('young_one', $1, 'Asia/Kolkata', 'steady', '{}', null, $2, now())`, [dob, addDays(localToday("Asia/Kolkata"), 10)])));
    expect(err).toContain("must_be_18");
    expect((await db.query(`select 1 from public.profiles where id = $1`, [id])).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.streaks where user_id = $1`, [id])).rows).toHaveLength(0);
  });
  it("rejects bad timezones and out-of-range starts", async () => {
    const id = await authUser(db);
    const end = addDays(localToday("Asia/Kolkata"), 10);
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.complete_onboarding('tz_test', '1990-01-01', 'Mars/Base', 'steady', '{}', null, $1, now())`, [end])))).toContain("bad_timezone");
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.complete_onboarding('tz_test', '1990-01-01', 'Asia/Kolkata', 'steady', '{}', null, $1, now() - interval '49 hours')`, [end])))).toContain("start_out_of_range");
  });
  it("users can edit preferences but not identity or timezone", async () => {
    const id = await onboard(db, { handle: "prefs_user" });
    await asUser(db, id, (tx) => tx.query(`update public.profiles set tone = 'stoic', reminder_time = '22:00' where id = $1`, [id]));
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`update public.profiles set handle = 'renamed' where id = $1`, [id])))).toContain("permission denied");
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`update public.profiles set timezone = 'UTC' where id = $1`, [id])))).toContain("permission denied");
  });
  it("set_timezone allows one change a week", async () => {
    const id = await onboard(db, { handle: "tz_mover" });
    await asUser(db, id, (tx) => tx.query(`select public.set_timezone('Europe/London')`));
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.set_timezone('Asia/Tokyo')`)))).toContain("timezone_rate_limited");
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.set_timezone('Nope/Nope')`)))).toContain("bad_timezone");
  });
});

describe("check-ins, resets and shields", () => {
  it("check-in is idempotent and server-dated", async () => {
    const id = await onboard(db, { handle: "checker" });
    await asUser(db, id, async (tx) => {
      await tx.query(`select public.check_in()`);
      await tx.query(`select public.check_in()`);
    });
    const rows = (await db.query<{ local_date: Date }>(`select local_date from public.checkins where user_id = $1`, [id])).rows;
    expect(rows).toHaveLength(1);
  });
  it("reset keeps history and only fixed tags are allowed", async () => {
    const id = await onboard(db, { handle: "resetter" });
    await asUser(db, id, (tx) => tx.query(`select public.log_reset('{bored,late_night}')`));
    expect((await db.query(`select 1 from public.streaks where user_id = $1`, [id])).rows).toHaveLength(2);
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.log_reset('{"free text about it"}')`)))).toContain("check constraint");
  });
  it("shields cover missed days only and never a recorded day", async () => {
    const id = await onboard(db, { handle: "shielded" });
    const tz = "Asia/Kolkata";
    await db.query(`update public.streaks set started_at = now() - interval '3 days' where user_id = $1`, [id]);
    await db.query(`insert into public.shields (user_id, source) values ($1, 'pro_monthly')`, [id]);
    const yesterday = addDays(localToday(tz), -1);
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.use_shield($1)`, [localToday(tz)])))).toContain("shield_window");
    await asUser(db, id, (tx) => tx.query(`select public.use_shield($1)`, [yesterday]));
    expect(await errorOf(asUser(db, id, (tx) => tx.query(`select public.use_shield($1)`, [yesterday])))).toContain("already_recorded");
  });
});

describe("cross-user isolation", () => {
  let a: string, b: string;
  beforeAll(async () => {
    a = await onboard(db, { handle: "user_a" });
    b = await onboard(db, { handle: "user_b", pledge: true });
    await asUser(db, b, async (tx) => {
      await tx.query(`select public.check_in()`);
      await tx.query(`insert into public.urge_sessions (user_id, game, duration_s, intensity_before, intensity_after, completed) values ($1, 'kitbag', 180, 8, 4, true)`, [b]);
      await tx.query(`select public.create_promise_chest(19900, 'INR', 'steady', 'placeholder-in')`);
      await tx.query(`select public.log_reset('{stressed}')`);
    });
    await db.query(`insert into public.affirmations (user_id, for_date, body, source) values ($1, current_date, 'Day 1. Keep it simple.', 'fallback')`, [b]);
    await db.query(`insert into public.entitlements (user_id, plan, status) values ($1, 'season', 'active')`, [b]);
  });

  const tables: [string, string][] = [
    ["streaks", "user_id"], ["checkins", "user_id"], ["resets", "user_id"], ["urge_sessions", "user_id"],
    ["affirmations", "user_id"], ["entitlements", "user_id"], ["war_chests", "user_id"], ["goals", "user_id"],
    ["shields", "user_id"], ["season_members", "user_id"], ["profiles", "id"],
  ];
  for (const [t, col] of tables) {
    it(`user A reads zero rows of user B's ${t}`, async () => {
      const n = await asUser(db, a, (tx) => count(tx, `select 1 from public.${t} where ${col} = $1`, [b]));
      expect(n).toBe(0);
      const own = await asUser(db, b, (tx) => count(tx, `select 1 from public.${t} where ${col} = $1`, [b]));
      if (["streaks", "checkins", "resets", "urge_sessions", "affirmations", "entitlements", "war_chests", "goals", "profiles"].includes(t)) expect(own).toBeGreaterThan(0);
    });
  }
  it("user A can't see B's War Chest events", async () => {
    expect(await asUser(db, a, (tx) => count(tx, `select 1 from public.war_chest_events`))).toBe(0);
    expect(await asUser(db, b, (tx) => count(tx, `select 1 from public.war_chest_events`))).toBeGreaterThan(0);
  });
  it("export_my_data returns only the caller's rows", async () => {
    const r = await asUser(db, a, (tx) => tx.query<{ d: Record<string, unknown> }>(`select public.export_my_data() d`));
    const d = r.rows[0].d as { profile: { handle: string }; resets: unknown[]; war_chests: unknown[] };
    expect(d.profile.handle).toBe("user_a");
    expect(d.resets).toHaveLength(0);
    expect(d.war_chests).toHaveLength(0);
    expect(JSON.stringify(d)).not.toContain("user_b");
  });
  it("users can't write entitlements, shields or check-ins directly", async () => {
    expect(await errorOf(asUser(db, a, (tx) => tx.query(`insert into public.entitlements (user_id, plan, status) values ($1, 'annual', 'active')`, [a])))).toMatch(/row-level security|permission denied/);
    expect(await errorOf(asUser(db, a, (tx) => tx.query(`insert into public.shields (user_id, source) values ($1, 'referral')`, [a])))).toMatch(/row-level security|permission denied/);
    expect(await errorOf(asUser(db, a, (tx) => tx.query(`insert into public.checkins (user_id, local_date, status) values ($1, current_date - 5, 'held')`, [a])))).toMatch(/row-level security|permission denied/);
    expect(await errorOf(asUser(db, a, (tx) => tx.query(`insert into public.streaks (user_id, started_at) values ($1, now() - interval '90 days')`, [a])))).toMatch(/row-level security|permission denied/);
  });
});

describe("anonymous access", () => {
  it("anon is denied on every table except seasons", async () => {
    const tables = (await db.query<{ t: string }>(`select c.relname t from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','m')`)).rows.map((r) => r.t);
    expect(tables.length).toBeGreaterThan(20);
    for (const t of tables) {
      const err = await errorOf(asAnon(db, (tx) => tx.query(`select 1 from public.${t} limit 1`)));
      if (t === "seasons") expect(err).toBe("ok");
      else expect(err, t).toContain("permission denied");
    }
  });
  it("anon can't call RPCs", async () => {
    for (const sql of [`select public.check_in()`, `select public.join_camp('demo000001')`, `select public.camp_leaderboard('00000000-0000-4000-8000-00000000c001')`, `select public.season_leaderboard('nnn-2026','days')`]) {
      expect(await errorOf(asAnon(db, (tx) => tx.query(sql)))).toContain("permission denied");
    }
  });
});

describe("Combos is Pro-only in the database", () => {
  it("rejects Combos rows from free users, accepts from Pro", async () => {
    const free = await onboard(db, { handle: "free_puncher" });
    const ins = (uid: string, game: string) =>
      asUser(db, uid, (tx) => tx.query(`insert into public.urge_sessions (user_id, game, duration_s, completed) values ($1, $2, 180, true)`, [uid, game]));
    expect(await errorOf(ins(free, "combos"))).toContain("row-level security");
    expect(await errorOf(ins(free, "kitbag"))).toBe("ok");
    await db.query(`insert into public.entitlements (user_id, plan, status, current_period_end) values ($1, 'season', 'active', now() + interval '10 days')`, [free]);
    expect(await errorOf(ins(free, "combos"))).toBe("ok");
    await db.query(`update public.entitlements set current_period_end = now() - interval '1 day' where user_id = $1`, [free]);
    expect(await errorOf(ins(free, "combos"))).toContain("row-level security");
  });
});

describe("camps", () => {
  let owner: string, member: string, outsider: string, campId: string, code: string;
  beforeAll(async () => {
    owner = await onboard(db, { handle: "camp_owner" });
    member = await onboard(db, { handle: "camp_member" });
    outsider = await onboard(db, { handle: "outsider" });
    campId = (await asUser(db, owner, (tx) => tx.query<{ id: string }>(`select public.create_camp('Night shift') id`))).rows[0].id;
    code = (await asUser(db, owner, (tx) => tx.query<{ invite_code: string }>(`select invite_code from public.camps where id = $1`, [campId]))).rows[0].invite_code;
    await asUser(db, member, (tx) => tx.query(`select public.join_camp($1)`, [code]));
  });

  it("non-members get nothing from camp tables or the board, not even invite codes", async () => {
    await asUser(db, outsider, async (tx) => {
      expect(await count(tx, `select 1 from public.camps`)).toBe(0);
      expect(await count(tx, `select 1 from public.camps where invite_code = $1`, [code])).toBe(0);
      expect(await count(tx, `select 1 from public.camp_members where camp_id = $1`, [campId])).toBe(0);
      expect(await count(tx, `select 1 from public.challenges where camp_id = $1`, [campId])).toBe(0);
      expect(await count(tx, `select * from public.camp_leaderboard($1)`, [campId])).toBe(0);
    });
  });
  it("members see the camp and board", async () => {
    expect(await asUser(db, member, (tx) => count(tx, `select * from public.camp_leaderboard($1)`, [campId]))).toBe(2);
  });
  it("free users own one camp; Pro can own more", async () => {
    expect(await errorOf(asUser(db, owner, (tx) => tx.query(`select public.create_camp('Second camp')`)))).toContain("pro_required");
  });
  it("camps are capped at max_members", async () => {
    const extra: string[] = [];
    for (let i = 0; i < 3; i++) extra.push(await onboard(db, { handle: `filler_${i}` }));
    for (const u of extra) await asUser(db, u, (tx) => tx.query(`select public.join_camp($1)`, [code]));
    const late = await onboard(db, { handle: "too_late" });
    expect(await errorOf(asUser(db, late, (tx) => tx.query(`select public.join_camp($1)`, [code])))).toContain("camp_full");
  });
  it("nudges: presets only, 3 per sender per recipient per day", async () => {
    for (let i = 0; i < 3; i++) await asUser(db, owner, (tx) => tx.query(`select public.send_nudge($1, $2, 'proud_of_you')`, [campId, member]));
    expect(await errorOf(asUser(db, owner, (tx) => tx.query(`select public.send_nudge($1, $2, 'proud_of_you')`, [campId, member])))).toContain("rate_limited");
    expect(await errorOf(asUser(db, member, (tx) => tx.query(`select public.send_nudge($1, $2, 'free text')`, [campId, owner])))).toContain("check constraint");
    expect(await errorOf(asUser(db, member, (tx) => tx.query(`select public.send_nudge($1, $2, 'proud_of_you')`, [campId, member])))).toContain("self_nudge");
    expect(await errorOf(asUser(db, outsider, (tx) => tx.query(`select public.send_nudge($1, $2, 'proud_of_you')`, [campId, member])))).toContain("not_member");
  });
  it("muted senders' nudges are dropped silently", async () => {
    await asUser(db, member, (tx) => tx.query(`select public.mute_member($1, $2)`, [campId, owner]));
    const before = (await db.query<{ n: number }>(`select count(*)::int n from public.nudges where to_user = $1`, [owner])).rows[0].n;
    await asUser(db, member, (tx) => tx.query(`select public.unmute_member($1, $2)`, [campId, owner]));
    await asUser(db, owner, (tx) => tx.query(`select public.mute_member($1, $2)`, [campId, member]));
    await asUser(db, member, (tx) => tx.query(`select public.send_nudge($1, $2, 'in_your_corner')`, [campId, owner]));
    const after = (await db.query<{ n: number }>(`select count(*)::int n from public.nudges where to_user = $1`, [owner])).rows[0].n;
    expect(after).toBe(before);
  });
  it("reports go to a server-only table", async () => {
    await asUser(db, member, (tx) => tx.query(`select public.report_member($1, $2, 'spam')`, [campId, owner]));
    expect(await errorOf(asUser(db, member, (tx) => tx.query(`select * from public.reports`)))).toContain("permission denied");
    expect((await db.query(`select 1 from public.reports where reported = $1`, [owner])).rows).toHaveLength(1);
  });
  it("challenges need Pro and membership", async () => {
    const sql = `select public.create_challenge($1, 'first_to_days', 14, now(), now() + interval '20 days')`;
    expect(await errorOf(asUser(db, owner, (tx) => tx.query(sql, [campId])))).toContain("pro_required");
    await db.query(`insert into public.entitlements (user_id, plan, status) values ($1, 'annual', 'active')`, [owner]);
    expect(await errorOf(asUser(db, owner, (tx) => tx.query(sql, [campId])))).toBe("ok");
    expect(await errorOf(asUser(db, outsider, (tx) => tx.query(sql, [campId])))).toContain("not_member");
    expect(await asUser(db, member, (tx) => count(tx, `select 1 from public.challenges where camp_id = $1`, [campId]))).toBe(1);
  });
  it("owner-only actions and leaving", async () => {
    expect(await errorOf(asUser(db, member, (tx) => tx.query(`select public.regenerate_invite_code($1)`, [campId])))).toContain("owner_only");
    const newCode = (await asUser(db, owner, (tx) => tx.query<{ c: string }>(`select public.regenerate_invite_code($1) c`, [campId]))).rows[0].c;
    expect(newCode).not.toBe(code);
    expect(await errorOf(asUser(db, outsider, (tx) => tx.query(`select public.join_camp($1)`, [code])))).toContain("invalid_code");
    await asUser(db, owner, (tx) => tx.query(`select public.remove_member($1, $2)`, [campId, member]));
    expect(await asUser(db, member, (tx) => count(tx, `select 1 from public.camps where id = $1`, [campId]))).toBe(0);
  });
});

describe("board math across season windows and timezones", () => {
  // Fixture season spanning the UK clock change (25 Oct 2026) and ending just before the US one (1 Nov 2026).
  const zones = ["Asia/Kolkata", "America/New_York", "Europe/London"] as const;
  const users: Record<string, string> = {};
  let camp: string;
  let dstCamp: string;
  const S1 = ["2026-10-20T00:00:00Z", "2026-10-28T12:00:00Z"];
  const S2 = ["2026-10-28T12:00:00Z", "2026-11-01T06:30:00Z"];
  const S3 = "2026-11-01T06:30:00Z";

  function expectedBest(tz: string, startsOn: string, endsOn: string, streaks: [string, string | null][]): number {
    const ws = zonedMidnight(startsOn, tz).getTime();
    const we = zonedMidnight(addDays(endsOn, 1), tz).getTime();
    const now = Date.now();
    let best = 0;
    for (const [s, e] of streaks) {
      const a = new Date(s).getTime();
      const b = e ? new Date(e).getTime() : now;
      if (!(a < Math.min(now, we) && b > ws)) continue;
      best = Math.max(best, Math.floor((Math.min(b, we) - Math.max(a, ws)) / 1000));
    }
    return best;
  }

  beforeAll(async () => {
    await db.exec(`insert into public.seasons (id, name, starts_on, ends_on) values ('test-oct', 'Test October', '2026-10-25', '2026-10-31')`);
    const owner = await authUser(db);
    await db.query(`insert into public.profiles (id, handle, adult_confirmed_at, timezone) values ($1, 'board_owner', now(), 'UTC')`, [owner]);
    camp = (await db.query<{ id: string }>(`insert into public.camps (name, owner_id, season_id, max_members) values ('Board camp', $1, 'test-oct', 50) returning id`, [owner])).rows[0].id;
    dstCamp = (await db.query<{ id: string }>(`insert into public.camps (name, owner_id, season_id, max_members) values ('DST camp', $1, 'nnn-2026', 50) returning id`, [owner])).rows[0].id;
    await db.query(`insert into public.camp_members (camp_id, user_id) values ($1, $3), ($2, $3)`, [camp, dstCamp, owner]);
    users.owner = owner;
    for (const tz of zones) {
      const id = await authUser(db);
      users[tz] = id;
      await db.query(`insert into public.profiles (id, handle, adult_confirmed_at, timezone) values ($1, $2, now(), $3)`, [id, `b_${tz.split("/")[1].toLowerCase()}`.slice(0, 20), tz]);
      await db.query(`insert into public.streaks (user_id, started_at, ended_at) values ($1, $2, $3), ($1, $4, $5), ($1, $6, null)`, [id, ...S1, ...S2, S3]);
      await db.query(`insert into public.checkins (user_id, local_date, status) values
        ($1, '2026-10-24', 'held'), ($1, '2026-10-25', 'held'), ($1, '2026-10-26', 'held'), ($1, '2026-10-27', 'shielded'),
        ($1, '2026-10-28', 'reset'), ($1, '2026-10-31', 'held'), ($1, '2026-11-01', 'held')`, [id]);
      await db.query(`insert into public.camp_members (camp_id, user_id) values ($1, $2)`, [camp, id]);
      // DST-day user: one closed streak across the New York midnight of 1 Nov.
      const d = await authUser(db);
      users[`dst_${tz}`] = d;
      await db.query(`insert into public.profiles (id, handle, adult_confirmed_at, timezone) values ($1, $2, now(), $3)`, [d, `d_${tz.split("/")[1].toLowerCase()}`.slice(0, 20), tz]);
      await db.query(`insert into public.streaks (user_id, started_at, ended_at) values ($1, '2026-11-01T03:00:00Z', '2026-11-01T06:30:00Z')`, [d]);
      await db.query(`insert into public.camp_members (camp_id, user_id) values ($1, $2)`, [dstCamp, d]);
    }
    const priv = await authUser(db);
    users.private = priv;
    await db.query(`insert into public.profiles (id, handle, adult_confirmed_at, leaderboard_visibility) values ($1, 'hidden_one', now(), 'private')`, [priv]);
    await db.query(`insert into public.streaks (user_id, started_at) values ($1, now() - interval '20 days')`, [priv]);
    await db.query(`insert into public.camp_members (camp_id, user_id) values ($1, $2)`, [camp, priv]);
  });

  it("hand-computed fixtures match (best streak inside the window)", () => {
    expect(expectedBest("Asia/Kolkata", "2026-10-25", "2026-10-31", [S1 as [string, string], S2 as [string, string]])).toBe(322200);
    expect(expectedBest("America/New_York", "2026-10-25", "2026-10-31", [S1 as [string, string], S2 as [string, string]])).toBe(316800);
    expect(expectedBest("Europe/London", "2026-10-25", "2026-10-31", [S1 as [string, string], S2 as [string, string]])).toBe(306000);
  });

  it("camp_leaderboard matches per timezone: best, days kept, current", async () => {
    const rows = (await asUser(db, users.owner, (tx) =>
      tx.query<{ member_id: string; best_streak_s: string; days_kept: number; current_streak_s: string; is_me: boolean }>(`select * from public.camp_leaderboard($1)`, [camp]))).rows;
    expect(rows.find((r) => r.member_id === users.private)).toBeUndefined();
    for (const tz of zones) {
      const r = rows.find((x) => x.member_id === users[tz])!;
      expect(Number(r.best_streak_s), tz).toBe(expectedBest(tz, "2026-10-25", "2026-10-31", [[S1[0], S1[1]], [S2[0], S2[1]], [S3, null]]));
      expect(r.days_kept, tz).toBe(4);
      const cur = Math.floor((Date.now() - new Date(S3).getTime()) / 1000);
      expect(Math.abs(Number(r.current_streak_s) - cur), tz).toBeLessThan(10);
      expect(r.is_me).toBe(false);
    }
  });

  it("season windows respect the 1 Nov 2026 New York DST change", async () => {
    const rows = (await asUser(db, users.owner, (tx) =>
      tx.query<{ member_id: string; best_streak_s: string; current_streak_s: string }>(`select * from public.camp_leaderboard($1)`, [dstCamp]))).rows;
    const best = (tz: string) => Number(rows.find((r) => r.member_id === users[`dst_${tz}`])!.best_streak_s);
    expect(best("America/New_York")).toBe(9000); // window opens 04:00Z (EDT midnight)
    expect(best("Europe/London")).toBe(12600); // window opens 00:00Z
    expect(best("Asia/Kolkata")).toBe(12600); // window opened 31 Oct 18:30Z
    for (const tz of zones) expect(best(tz)).toBe(expectedBest(tz, "2026-11-01", "2026-11-30", [["2026-11-01T03:00:00Z", "2026-11-01T06:30:00Z"]]));
    expect(Number(rows.find((r) => r.member_id === users["dst_America/New_York"])!.current_streak_s)).toBe(0);
  });

  it("private users never appear on boards", async () => {
    for (const c of [camp, dstCamp]) {
      const rows = (await asUser(db, users.owner, (tx) => tx.query<{ handle: string }>(`select handle from public.camp_leaderboard($1)`, [c]))).rows;
      expect(rows.map((r) => r.handle)).not.toContain("hidden_one");
    }
  });
});

describe("global season board", () => {
  it("lists only global users, top 100 plus the caller", async () => {
    const g = await onboard(db, { handle: "global_one", visibility: "global" });
    await db.query(`insert into public.season_members (season_id, user_id) values ('nnn-2026', $1) on conflict do nothing`, [g]);
    const c = await onboard(db, { handle: "camps_only" });
    await db.query(`insert into public.season_members (season_id, user_id) values ('nnn-2026', $1) on conflict do nothing`, [c]);
    await asService(db, (tx) => tx.query(`select public.refresh_season_board()`));
    const rows = (await asUser(db, g, (tx) => tx.query<{ handle: string; is_me: boolean }>(`select * from public.season_leaderboard('nnn-2026', 'days')`))).rows;
    const handles = rows.map((r) => r.handle);
    expect(handles).toContain("global_one");
    expect(handles).toContain("rohan_k"); // seeded global demo user
    expect(handles).not.toContain("camps_only");
    expect(handles).not.toContain("dev_s");
    expect(rows.find((r) => r.handle === "global_one")!.is_me).toBe(true);
    expect(Object.keys(rows[0]).sort()).toEqual(
      ["avatar_seed", "best_streak_s", "current_streak_s", "days_kept", "handle", "is_me", "last_checkin", "member_id", "rank"].sort(),
    );
    const rohan = rows.find((r) => r.handle === "rohan_k") as unknown as { days_kept: number; rank: number };
    expect(rohan.days_kept).toBeGreaterThan(0);
    expect(rohan.rank).toBe(1);
    expect(await errorOf(asUser(db, g, (tx) => tx.query(`select * from public.season_board_mv`)))).toContain("permission denied");
    expect(await errorOf(asUser(db, g, (tx) => tx.query(`select * from public.season_leaderboard('nnn-2026', 'drop table')`)))).toContain("bad_metric");
  });
});

describe("change_goal_end", () => {
  it("moves a custom end date, validates it, refuses season goals and live stakes", async () => {
    const tz = "Asia/Kolkata";
    const u = await onboard(db, { handle: "goal_mover", tz });
    const to = addDays(localToday(tz), 40);
    await asUser(db, u, (tx) => tx.query(`select public.change_goal_end($1)`, [to]));
    const g = (await db.query<{ e: string }>(`select ends_on::text e from public.goals where user_id = $1 and closed_at is null`, [u])).rows[0];
    expect(g.e).toBe(to);
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.change_goal_end($1)`, [localToday(tz)])))).toContain("bad_end_date");
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.change_goal_end($1)`, [addDays(localToday(tz), 400)])))).toContain("bad_end_date");
    const chest = (await asService(db, (tx) => tx.query<{ id: string }>(`select public.create_stake_chest($1, 19900, 'INR', 'steady', 'placeholder-in') id`, [u]))).rows[0].id;
    expect(chest).toBeTruthy();
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.change_goal_end($1)`, [addDays(localToday(tz), 30)])))).toContain("stake_active");
    // Seeded rohan_k is on the season goal.
    expect(await errorOf(asUser(db, "00000000-0000-4000-8000-0000000000a1", (tx) => tx.query(`select public.change_goal_end($1)`, [addDays(localToday(tz), 30)])))).toContain("season_goal");
  });
});

describe("War Chest", () => {
  const tz = daytimeZone();

  it("offer: only after a signed pledge and a held day, and only once", async () => {
    const u = await onboard(db, { handle: "offer_user", tz, pledge: true });
    const eligible = async () => (await asUser(db, u, (tx) => tx.query<{ e: boolean }>(`select public.war_chest_offer_eligible() e`))).rows[0].e;
    expect(await eligible()).toBe(false);
    await asUser(db, u, (tx) => tx.query(`select public.check_in()`));
    expect(await eligible()).toBe(true);
    await asUser(db, u, (tx) => tx.query(`select public.mark_war_chest_offered()`));
    expect(await eligible()).toBe(false);

    const noPledge = await onboard(db, { handle: "no_pledge", tz });
    await asUser(db, noPledge, (tx) => tx.query(`select public.check_in()`));
    expect((await asUser(db, noPledge, (tx) => tx.query<{ e: boolean }>(`select public.war_chest_offer_eligible() e`))).rows[0].e).toBe(false);

    const crisis = await onboard(db, { handle: "crisis_user", tz, pledge: true });
    await asUser(db, crisis, async (tx) => {
      await tx.query(`select public.check_in()`);
      await tx.query(`insert into public.events (user_id, name) values ($1, 'crisis_card_shown')`, [crisis]);
    });
    expect((await asUser(db, crisis, (tx) => tx.query<{ e: boolean }>(`select public.war_chest_offer_eligible() e`))).rows[0].e).toBe(false);

    const short = await onboard(db, { handle: "short_goal", tz, pledge: true, endsInDays: 5 });
    await asUser(db, short, (tx) => tx.query(`select public.check_in()`));
    expect((await asUser(db, short, (tx) => tx.query<{ e: boolean }>(`select public.war_chest_offer_eligible() e`))).rows[0].e).toBe(false);
  });

  it("Steady forfeits 25% per reset and never more than the amount", async () => {
    const u = await onboard(db, { handle: "steady_user", tz });
    await asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(49900, 'INR', 'steady', 'placeholder-in')`));
    const forfeits: number[] = [];
    for (let i = 0; i < 5; i++) forfeits.push((await asUser(db, u, (tx) => tx.query<{ f: number }>(`select public.log_reset('{}') f`))).rows[0].f);
    expect(forfeits).toEqual([12475, 12475, 12475, 12475, 0]);
    const w = (await db.query<{ forfeited_minor: number }>(`select forfeited_minor from public.war_chests where user_id = $1`, [u])).rows[0];
    expect(w.forfeited_minor).toBe(49900);
    // Promise mode moves no money.
    expect((await db.query(`select 1 from public.money_ledger m join public.war_chests w on w.id = m.war_chest_ref where w.user_id = $1`, [u])).rows).toHaveLength(0);
  });

  it("Strict forfeits everything on the first reset", async () => {
    const u = await onboard(db, { handle: "strict_user", tz });
    await asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(49900, 'INR', 'strict', 'placeholder-in')`));
    expect((await asUser(db, u, (tx) => tx.query<{ f: number }>(`select public.log_reset('{}') f`))).rows[0].f).toBe(49900);
    expect((await asUser(db, u, (tx) => tx.query<{ f: number }>(`select public.log_reset('{}') f`))).rows[0].f).toBe(0);
  });

  it("rejects amounts outside the caps, inactive causes and a second chest", async () => {
    const u = await onboard(db, { handle: "caps_user", tz });
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(4800, 'INR', 'steady', 'placeholder-in')`)))).toContain("chest_amount_range");
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(10100, 'USD', 'steady', 'placeholder-in')`)))).toContain("chest_amount_range");
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(4900, 'INR', 'steady', 'placeholder-global')`)))).toContain("bad_cause");
    await asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(4900, 'INR', 'steady', 'placeholder-in')`));
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.create_promise_chest(4900, 'INR', 'steady', 'placeholder-in')`)))).toContain("duplicate key");
  });

  it("stake: tampered amounts rejected; cancel within 24h; refund = stake − forfeits; ledger balances", async () => {
    const u = await onboard(db, { handle: "stake_user", tz });
    const chest = (await asService(db, (tx) => tx.query<{ id: string }>(`select public.create_stake_chest($1, 49900, 'INR', 'steady', 'placeholder-in') id`, [u]))).rows[0].id;
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_1', 50000, 'INR')`, [chest])))).toContain("amount_mismatch");
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_1', 49900, 'USD')`, [chest])))).toContain("amount_mismatch");
    await asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_1', 49900, 'INR')`, [chest]));
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_1', 49900, 'INR')`, [chest])))).toContain("not_pending");

    expect((await asUser(db, u, (tx) => tx.query<{ f: number }>(`select public.log_reset('{}') f`))).rows[0].f).toBe(12475);
    expect((await asUser(db, u, (tx) => tx.query<{ r: string }>(`select public.cancel_war_chest() r`))).rows[0].r).toBe("refund_pending");
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.record_refund($1, 'rfnd_1', 49900)`, [chest])))).toContain("amount_mismatch");
    await asService(db, (tx) => tx.query(`select public.record_refund($1, 'rfnd_1', 37425)`, [chest]));

    const led = (await db.query<{ kind: string; s: number }>(`select kind, sum(amount_minor)::int s from public.money_ledger where war_chest_ref = $1 group by kind`, [chest])).rows;
    const by = Object.fromEntries(led.map((r) => [r.kind, r.s]));
    expect(by).toEqual({ funded: 49900, forfeit_to_cause: 12475, refund_issued: 37425 });
    expect(by.funded).toBe(by.forfeit_to_cause + by.refund_issued);
    expect((await db.query<{ status: string }>(`select status from public.war_chests where id = $1`, [chest])).rows[0].status).toBe("settled");
  });

  it("stake cancel is locked after the 24-hour window", async () => {
    const u = await onboard(db, { handle: "locked_user", tz });
    const chest = (await asService(db, (tx) => tx.query<{ id: string }>(`select public.create_stake_chest($1, 19900, 'INR', 'steady', 'placeholder-in') id`, [u]))).rows[0].id;
    await asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_2', 19900, 'INR')`, [chest]));
    await db.query(`update public.war_chests set cooling_off_until = now() - interval '1 hour' where id = $1`, [chest]);
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.cancel_war_chest()`)))).toContain("locked_until_goal_end");
  });

  it("stake length must be 7 to 90 days", async () => {
    const short = await onboard(db, { handle: "stake_short", tz, endsInDays: 5 });
    const long = await onboard(db, { handle: "stake_long", tz, endsInDays: 120 });
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.create_stake_chest($1, 19900, 'INR', 'steady', 'placeholder-in')`, [short])))).toContain("stake_goal_too_short");
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.create_stake_chest($1, 19900, 'INR', 'steady', 'placeholder-in')`, [long])))).toContain("stake_goal_too_long");
  });

  it("daily settlement closes finished goals, settles promises and returns stake refunds", async () => {
    const s = await onboard(db, { handle: "settle_stake", tz });
    const chest = (await asService(db, (tx) => tx.query<{ id: string }>(`select public.create_stake_chest($1, 49900, 'INR', 'steady', 'placeholder-in') id`, [s]))).rows[0].id;
    await asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_3', 49900, 'INR')`, [chest]));
    await asUser(db, s, (tx) => tx.query(`select public.log_reset('{}')`));
    const p = await onboard(db, { handle: "settle_promise", tz });
    await asUser(db, p, (tx) => tx.query(`select public.create_promise_chest(9900, 'INR', 'steady', 'placeholder-in')`));
    await db.query(`update public.goals set ends_on = current_date - 3 where user_id in ($1, $2)`, [s, p]);

    const due = (await asService(db, (tx) => tx.query<{ war_chest_id: string; payment_ref: string; refund_minor: number; refund_currency: string }>(`select * from public.settle_due_war_chests()`))).rows;
    const mine = due.find((r) => r.war_chest_id === chest)!;
    expect(mine).toMatchObject({ payment_ref: "pay_3", refund_minor: 49900 - 12475, refund_currency: "INR" });
    expect((await db.query<{ status: string }>(`select w.status from public.war_chests w where w.user_id = $1`, [p])).rows[0].status).toBe("settled");
    expect((await db.query(`select 1 from public.goals where user_id = $1 and closed_at is not null`, [s])).rows).toHaveLength(1);

    await asService(db, (tx) => tx.query(`select public.record_refund($1, 'rfnd_3', $2)`, [chest, 37425]));
    const again = (await asService(db, (tx) => tx.query<{ war_chest_id: string }>(`select * from public.settle_due_war_chests()`))).rows;
    expect(again.find((r) => r.war_chest_id === chest)).toBeUndefined();

    const period = new Date().toISOString().slice(0, 7);
    await asService(db, (tx) => tx.query(`select public.monthly_donation_batches($1)`, [period]));
    const batch = (await db.query<{ amount_minor: number }>(`select amount_minor from public.donation_batches where cause_id = 'placeholder-in' and period = $1 and currency = 'INR'`, [period])).rows[0];
    const ledger = (await db.query<{ s: number }>(`select sum(amount_minor)::int s from public.money_ledger where kind = 'forfeit_to_cause' and cause_id = 'placeholder-in'`)).rows[0];
    expect(batch.amount_minor).toBe(ledger.s);
  });

  it("account deletion refunds a live stake first", async () => {
    const u = await onboard(db, { handle: "deleter", tz });
    const chest = (await asService(db, (tx) => tx.query<{ id: string }>(`select public.create_stake_chest($1, 19900, 'INR', 'steady', 'placeholder-in') id`, [u]))).rows[0].id;
    await asService(db, (tx) => tx.query(`select public.activate_stake_chest($1, 'pay_4', 19900, 'INR')`, [chest]));
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.delete_my_account_check()`)))).toContain("refund_first");
    const due = (await asService(db, (tx) => tx.query<{ war_chest_id: string; refund_minor: number }>(`select * from public.prepare_account_deletion($1)`, [u]))).rows;
    expect(due).toEqual([expect.objectContaining({ war_chest_id: chest, refund_minor: 19900 })]);
    await asService(db, (tx) => tx.query(`select public.record_refund($1, 'rfnd_4', 19900)`, [chest]));
    expect(await errorOf(asUser(db, u, (tx) => tx.query(`select public.delete_my_account_check()`)))).toBe("ok");
    await db.query(`delete from auth.users where id = $1`, [u]);
    expect((await db.query(`select 1 from public.profiles where id = $1`, [u])).rows).toHaveLength(0);
    // The money ledger survives deletion by design (no foreign key).
    expect((await db.query(`select 1 from public.money_ledger where war_chest_ref = $1`, [chest])).rows.length).toBeGreaterThan(0);
  });

  it("forged calls can't move money: signed-in users can't execute server-only functions", async () => {
    const u = await onboard(db, { handle: "forger", tz });
    const calls = [
      `select public.create_stake_chest('${u}', 49900, 'INR', 'steady', 'placeholder-in')`,
      `select public.activate_stake_chest(gen_random_uuid(), 'pay_x', 49900, 'INR')`,
      `select public.record_refund(gen_random_uuid(), 'rfnd_x', 100)`,
      `select * from public.settle_due_war_chests()`,
      `select public.apply_entitlement('${u}', 'annual', 'active', null, 'forged')`,
      `select public.record_webhook_event('evt_forged')`,
      `select public.grant_rewarded_shield('${u}')`,
      `select public.grant_pro_monthly_shields()`,
      `select public.monthly_donation_batches('2026-11')`,
      `select * from public.prepare_account_deletion('${u}')`,
      `select * from public.due_reminders()`,
      `select public.purge_expired()`,
      `insert into public.money_ledger (war_chest_ref, kind, amount_minor, currency) values (gen_random_uuid(), 'funded', 1, 'INR')`,
      `update public.war_chests set forfeited_minor = 0`,
    ];
    for (const sql of calls) {
      const err = await errorOf(asUser(db, u, (tx) => tx.query(sql)));
      if (sql.startsWith("update")) expect(["ok"]).toContain(err); // RLS: updates affect zero rows (no update policy)
      else expect(err, sql).toMatch(/permission denied|row-level security/);
    }
    expect((await db.query(`select 1 from public.entitlements where user_id = $1`, [u])).rows).toHaveLength(0);
  });
});

describe("server-only operations", () => {
  it("webhook events are idempotent", async () => {
    const first = (await asService(db, (tx) => tx.query<{ r: boolean }>(`select public.record_webhook_event('evt_1') r`))).rows[0].r;
    const second = (await asService(db, (tx) => tx.query<{ r: boolean }>(`select public.record_webhook_event('evt_1') r`))).rows[0].r;
    expect([first, second]).toEqual([true, false]);
  });
  it("apply_entitlement upserts", async () => {
    const u = await onboard(db, { handle: "pro_buyer" });
    await asService(db, (tx) => tx.query(`select public.apply_entitlement($1, 'season', 'active', now() + interval '30 days', 'order_1')`, [u]));
    await asService(db, (tx) => tx.query(`select public.apply_entitlement($1, 'annual', 'active', now() + interval '365 days', null)`, [u]));
    const e = (await asUser(db, u, (tx) => tx.query<{ plan: string; provider_ref: string }>(`select plan, provider_ref from public.entitlements`))).rows[0];
    expect(e).toEqual({ plan: "annual", provider_ref: "order_1" });
  });
  it("rewarded shields cap at 2 a week", async () => {
    const u = await onboard(db, { handle: "ad_watcher" });
    await asService(db, (tx) => tx.query(`select public.grant_rewarded_shield($1)`, [u]));
    await asService(db, (tx) => tx.query(`select public.grant_rewarded_shield($1)`, [u]));
    expect(await errorOf(asService(db, (tx) => tx.query(`select public.grant_rewarded_shield($1)`, [u])))).toContain("shield_cap");
  });
  it("Pro monthly shields are idempotent per month", async () => {
    const u = await onboard(db, { handle: "monthly_pro" });
    await db.query(`insert into public.entitlements (user_id, plan, status) values ($1, 'annual', 'active')`, [u]);
    await asService(db, (tx) => tx.query(`select public.grant_pro_monthly_shields()`));
    await asService(db, (tx) => tx.query(`select public.grant_pro_monthly_shields()`));
    expect((await db.query(`select 1 from public.shields where user_id = $1 and source = 'pro_monthly'`, [u])).rows).toHaveLength(2);
  });
  it("due_reminders respects reminder time and skips checked-in users", async () => {
    const u = await onboard(db, { handle: "remind_me", tz: "UTC" });
    await db.query(`update public.profiles set reminder_time = (now() at time zone 'UTC')::time - interval '1 minute', night_watch = true where id = $1`, [u]);
    await asUser(db, u, (tx) => tx.query(`select public.save_push_subscription('https://push.example/abc', 'p256', 'authkey')`));
    const due = async () => (await asService(db, (tx) => tx.query<{ user_id: string; kind: string }>(`select * from public.due_reminders()`))).rows.filter((r) => r.user_id === u);
    expect(await due()).toEqual([expect.objectContaining({ kind: "daily" })]);
    await asUser(db, u, (tx) => tx.query(`select public.check_in()`));
    expect(await due()).toHaveLength(0);
    await asService(db, (tx) => tx.query(`select public.remove_push_endpoint('https://push.example/abc')`));
    expect((await db.query(`select 1 from public.push_subscriptions where user_id = $1`, [u])).rows).toHaveLength(0);
  });
  it("purge_expired removes old rows only", async () => {
    const u = await onboard(db, { handle: "old_timer" });
    await db.query(`insert into public.resets (user_id, occurred_at) values ($1, now() - interval '25 months'), ($1, now())`, [u]);
    await asService(db, (tx) => tx.query(`select public.purge_expired()`));
    expect((await db.query(`select 1 from public.resets where user_id = $1`, [u])).rows).toHaveLength(1);
  });
});
