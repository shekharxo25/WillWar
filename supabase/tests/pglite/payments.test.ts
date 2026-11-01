import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, asUser, createDb, onboard, raises } from "./harness";

const P = "00000000-0000-4000-8000-0000000000a1";
let db: PGlite;

beforeAll(async () => {
  db = await createDb();
  await addUser(db, P);
  await asUser(db, P, (tx) => onboard(tx, "paying_one"));
});

describe("entitlements", () => {
  it("only the server can grant Pro", async () => {
    const msg = await raises(
      asUser(db, P, (tx) => tx.query("select public.upsert_entitlement($1, 'annual', 'active', null, 'x')", [P])),
    );
    expect(msg).toMatch(/permission denied/);
  });

  it("webhook events are idempotent", async () => {
    const a = await db.query<{ ok: boolean }>("select public.record_webhook_event('evt_1') ok");
    const b = await db.query<{ ok: boolean }>("select public.record_webhook_event('evt_1') ok");
    expect([a.rows[0].ok, b.rows[0].ok]).toEqual([true, false]);
  });

  it("an active entitlement unlocks Knots sessions under RLS", async () => {
    const insertKnots = () =>
      asUser(db, P, (tx) =>
        tx.query("insert into public.urge_sessions (user_id, game, duration_s, completed) values ($1, 'knots', 180, true)", [P]),
      );
    expect(await raises(insertKnots())).toMatch(/row-level security/);
    await db.query("select public.upsert_entitlement($1, 'season', 'active', now() + interval '20 days', 'pay_1')", [P]);
    await insertKnots();
    const r = await db.query<{ n: number }>("select count(*)::int n from public.urge_sessions where game = 'knots'");
    expect(r.rows[0].n).toBe(1);
  });

  it("grants two Pro shields once a month", async () => {
    await db.query("select public.grant_pro_monthly_shields()");
    await db.query("select public.grant_pro_monthly_shields()");
    const r = await db.query<{ n: number }>("select count(*)::int n from public.shields where user_id = $1 and source = 'pro_monthly'", [P]);
    expect(r.rows[0].n).toBe(2);
  });
});

describe("War Chest stake (server-only)", () => {
  let chest = "";

  it("creates a pending stake for the open goal", async () => {
    const r = await db.query<{ id: string }>("select public.create_stake_chest($1, 49900, 'INR', 'steady', 'placeholder-in-mental-health') id", [P]);
    chest = r.rows[0].id;
    expect(chest).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects a tampered payment amount", async () => {
    expect(await raises(db.query("select public.activate_stake_chest($1, 'pay_x', 100, 'INR')", [chest]))).toMatch(/amount_mismatch/);
  });

  it("activates on the right amount and writes the ledger", async () => {
    await db.query("select public.activate_stake_chest($1, 'pay_ok', 49900, 'INR')", [chest]);
    const r = await db.query<{ status: string }>("select status from public.war_chests where id = $1", [chest]);
    expect(r.rows[0].status).toBe("active");
    const ledger = await db.query<{ kind: string; amount_minor: number }>("select kind, amount_minor from public.money_ledger where war_chest_ref = $1", [chest]);
    expect(ledger.rows).toEqual([{ kind: "funded", amount_minor: 49900 }]);
  });

  it("a reset sends a quarter to the cause in the ledger", async () => {
    const f = await asUser(db, P, (tx) => tx.query<{ f: number }>("select public.log_reset('{}') f"));
    expect(f.rows[0].f).toBe(12475);
    const ledger = await db.query<{ n: number }>("select count(*)::int n from public.money_ledger where war_chest_ref = $1 and kind = 'forfeit_to_cause'", [chest]);
    expect(ledger.rows[0].n).toBe(1);
  });

  it("cancel inside 24 hours queues the refund; only the exact remainder is accepted", async () => {
    const r = await asUser(db, P, (tx) => tx.query<{ r: string }>("select public.cancel_war_chest() r"));
    expect(r.rows[0].r).toBe("refund_pending");
    expect(await raises(db.query("select public.record_refund($1, 'rfnd_1', 49900)", [chest]))).toMatch(/amount_mismatch/);
    await db.query("select public.record_refund($1, 'rfnd_1', 37425)", [chest]);
    const s = await db.query<{ status: string }>("select status from public.war_chests where id = $1", [chest]);
    expect(s.rows[0].status).toBe("settled");
  });

  it("signed-in people can't call money functions", async () => {
    for (const sql of [
      "select public.create_stake_chest('00000000-0000-4000-8000-0000000000a1', 4900, 'INR', 'steady', 'placeholder-in-mental-health')",
      "select public.settle_due_war_chests()",
      "select public.record_refund('00000000-0000-4000-8000-0000000000a1', 'r', 1)",
    ]) {
      expect(await raises(asUser(db, P, (tx) => tx.query(sql)))).toMatch(/permission denied/);
    }
  });
});
