import { payments } from "@/lib/adapters/payments";
import { isProduction, warChestMode } from "@/lib/config/flags";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";

/**
 * War Chest stake checkout. Refuses unless NEXT_PUBLIC_WAR_CHEST_MODE=stake (legal sign-off).
 * create_stake_chest runs with the secret key; the webhook activates the chest.
 */
export async function POST(req: Request) {
  if (warChestMode() !== "stake") return Response.json({ error: "stake_mode_off" }, { status: 403 });

  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "not_authenticated" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "no_database" }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as { amountMinor?: number; currency?: string; rule?: string; causeId?: string };
  const currency = b.currency === "USD" ? "USD" : b.currency === "INR" ? "INR" : null;
  const rule = b.rule === "strict" ? "strict" : b.rule === "steady" ? "steady" : null;
  if (!currency || !rule || !Number.isInteger(b.amountMinor) || !b.causeId) return Response.json({ error: "bad_request" }, { status: 400 });

  const { data: chestId, error } = await db.rpc("create_stake_chest", {
    p_user: userId, p_amount_minor: b.amountMinor, p_currency: currency, p_rule: rule, p_cause: b.causeId,
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const adapter = payments();
  if (adapter.mock && isProduction()) return Response.json({ error: "payments_unavailable" }, { status: 503 });
  const order = await adapter.createOrder("war_chest", b.amountMinor!, currency, { war_chest_id: String(chestId) });
  if (adapter.mock) return Response.json({ mock: true, url: `/app/dev/payments?chest=${chestId}&amount=${b.amountMinor}&currency=${currency}` });
  return Response.json({ keyId: adapter.keyId, orderId: order.id, amount: order.amount, currency: order.currency, name: "WillWar", description: "War Chest" });
}
