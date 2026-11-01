import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The webhook against a fake admin client: proves the season pass is granted only through a
// stored order, whatever the payment's notes claim.
vi.mock("server-only", () => ({}));

const SECRET = "whsec_route_test";
const OWNER = "00000000-0000-4000-8000-0000000000c1";
const ATTACKER = "00000000-0000-4000-8000-0000000000c2";

const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
const storedOrders: Record<string, { user_id: string }> = {};

vi.mock("@/lib/supabase/admin", () => ({
  getAdminSupabase: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return { data: name === "record_webhook_event" ? true : null, error: null };
    },
    from: (table: string) => ({
      select: () => ({
        eq: (_col: string, value: string) => ({
          maybeSingle: async () => ({
            data: table === "season_orders" ? (storedOrders[value] ?? null) : { timezone: "Asia/Kolkata" },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", SECRET);
const { POST } = await import("./route");

let eventSeq = 0;
function captured(entity: Record<string, unknown>) {
  const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity } } });
  return new Request("https://willwar.test/api/razorpay/webhook", {
    method: "POST",
    body: raw,
    headers: {
      "x-razorpay-signature": createHmac("sha256", SECRET).update(raw).digest("hex"),
      "x-razorpay-event-id": `evt_route_${++eventSeq}`,
    },
  });
}

const grants = () => rpcCalls.filter((c) => c.name === "activate_season_order" || c.name === "upsert_entitlement");

beforeEach(() => {
  rpcCalls.length = 0;
  for (const k of Object.keys(storedOrders)) delete storedOrders[k];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("payment.captured for the season pass", () => {
  it("ignores notes that name a user when the order isn't one checkout stored", async () => {
    const res = await POST(
      captured({ id: "pay_forged", order_id: "order_unknown", amount: 100, currency: "INR", notes: { kind: "season", user_id: ATTACKER } }),
    );
    expect(await res.json()).toEqual({ ignored: "season_rejected" });
    expect(grants()).toEqual([]);
  });

  it("ignores a season payment with no order at all", async () => {
    const res = await POST(captured({ id: "pay_no_order", amount: 100, currency: "INR", notes: { kind: "season", user_id: ATTACKER } }));
    expect(await res.json()).toEqual({ ignored: "season_rejected" });
    expect(grants()).toEqual([]);
  });

  it("activates through the stored order, passing the paid amount for the database to check", async () => {
    storedOrders.order_real = { user_id: OWNER };
    const res = await POST(
      captured({ id: "pay_real", order_id: "order_real", amount: 14900, currency: "INR", notes: { kind: "season", user_id: ATTACKER } }),
    );
    expect(await res.json()).toEqual({ ok: true });
    expect(grants()).toHaveLength(1);
    expect(grants()[0].name).toBe("activate_season_order");
    expect(grants()[0].args).toMatchObject({ p_order: "order_real", p_payment_ref: "pay_real", p_amount_minor: 14900, p_currency: "INR" });
    expect(JSON.stringify(grants()[0].args)).not.toContain(ATTACKER);
  });

  it("finds the stored order even when the payment carries no notes", async () => {
    storedOrders.order_plain = { user_id: OWNER };
    const res = await POST(captured({ id: "pay_plain", order_id: "order_plain", amount: 14900, currency: "INR" }));
    expect(await res.json()).toEqual({ ok: true });
    expect(grants().map((c) => c.name)).toEqual(["activate_season_order"]);
  });
});
