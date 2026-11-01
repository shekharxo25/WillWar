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

describe("season pass orders (server-only)", () => {
  const S = "00000000-0000-4000-8000-0000000000a2";
  const activate = (order: string, pay: string, amount: number, currency = "INR") =>
    db.query("select public.activate_season_order($1, $2, $3, $4, now() + interval '29 days')", [order, pay, amount, currency]);
  const plan = async () =>
    (await db.query<{ plan: string; provider_ref: string }>("select plan, provider_ref from public.entitlements where user_id = $1", [S])).rows;

  beforeAll(async () => {
    await addUser(db, S);
    await asUser(db, S, (tx) => onboard(tx, "season_buyer"));
    await db.query("select public.create_season_order('order_s1', $1, 14900, 'INR')", [S]);
  });

  it("rejects an unknown order, a short payment or the wrong currency", async () => {
    expect(await raises(activate("order_forged", "pay_f", 14900))).toMatch(/unknown_order/);
    expect(await raises(activate("order_s1", "pay_cheap", 100))).toMatch(/amount_mismatch/);
    expect(await raises(activate("order_s1", "pay_usd", 14900, "USD"))).toMatch(/amount_mismatch/);
    expect(await plan()).toEqual([]);
  });

  it("grants the season pass to the order's owner on the exact amount", async () => {
    await activate("order_s1", "pay_s1", 14900);
    expect(await plan()).toEqual([{ plan: "season", provider_ref: "pay_s1" }]);
    const o = await db.query<{ status: string }>("select status from public.season_orders where order_id = 'order_s1'");
    expect(o.rows[0].status).toBe("paid");
  });

  it("accepts the same payment again but not a second payment on a paid order", async () => {
    await activate("order_s1", "pay_s1", 14900);
    expect(await raises(activate("order_s1", "pay_s2", 14900))).toMatch(/already_paid/);
  });

  it("people read only their own orders and can't write any", async () => {
    const own = await asUser(db, S, (tx) => tx.query("select order_id from public.season_orders"));
    expect(own.rows).toHaveLength(1);
    const other = await asUser(db, P, (tx) => tx.query("select order_id from public.season_orders"));
    expect(other.rows).toHaveLength(0);
    expect(
      await raises(asUser(db, P, (tx) => tx.query("insert into public.season_orders (order_id, user_id, amount_minor, currency) values ('o', $1, 1, 'INR')", [P]))),
    ).toMatch(/permission denied/);
    expect(await raises(asUser(db, P, (tx) => tx.query("select public.create_season_order('o2', $1, 1, 'INR')", [P])))).toMatch(
      /permission denied/,
    );
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
