import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, asUser, createDb } from "./harness";

const A = "00000000-0000-4000-8000-0000000000c1";
const B = "00000000-0000-4000-8000-0000000000c2";
let db: PGlite;

const join = (handle: string) => (tx: Parameters<Parameters<typeof asUser>[2]>[0]) =>
  tx.query(
    `select public.complete_onboarding($1, '1990-01-01', 'Asia/Kolkata', 'steady', array['focus'], 'nnn-2026', null,
       greatest(now() - interval '1 hour', '2026-10-31T18:30:00Z'::timestamptz), null)`,
    [handle],
  );

beforeAll(async () => {
  db = await createDb();
  for (const u of [A, B]) await addUser(db, u);
  await asUser(db, A, join("global_one"));
  await asUser(db, B, join("pacts_only"));
  await asUser(db, A, (tx) => tx.query("update public.profiles set leaderboard_visibility = 'global' where id = $1", [A]));
  await asUser(db, A, (tx) => tx.query("select public.check_in()"));
});

describe("season_leaderboard", () => {
  it("lists only people who opted into Everyone, by handle", async () => {
    const r = await asUser(db, B, (tx) => tx.query<{ handle: string; is_me: boolean }>("select handle, is_me from public.season_leaderboard('nnn-2026', 'current')"));
    expect(r.rows).toEqual([{ handle: "global_one", is_me: false }]);
  });

  it("counts days kept and marks my own row", async () => {
    const r = await asUser(db, A, (tx) => tx.query<{ value: string; is_me: boolean }>("select value::text, is_me from public.season_leaderboard('nnn-2026', 'days')"));
    expect(r.rows).toEqual([{ value: "1", is_me: true }]);
  });

  it("returns nothing for an unknown metric", async () => {
    const r = await asUser(db, A, (tx) => tx.query("select * from public.season_leaderboard('nnn-2026', 'resets')"));
    expect(r.rows).toHaveLength(0);
  });
});
