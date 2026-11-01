import { z } from "zod";
import { publicEnv } from "@/env";
import { requireServerEnv } from "@/env.server";
import { CAUSES, CURRENCIES, FORFEIT_RULES } from "@/lib/domain/constants";
import { validChestAmount } from "@/lib/domain/rules";
import { fail, handleError, ok } from "@/lib/http";
import { createOrder } from "@/lib/payments/razorpay";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";

const body = z.object({
  amountMinor: z.number().int(),
  currency: z.enum(CURRENCIES),
  rule: z.enum(FORFEIT_RULES),
  causeId: z.string().refine((id) => CAUSES.some((c) => c.id === id)),
});

// Stake mode only (docs/guardrails/war-chest.md): off until the legal sign-off checklist is
// complete. The chest is created server-side with the secret key, then a Razorpay order.
export async function POST(request: Request) {
  try {
    if (publicEnv.NEXT_PUBLIC_WAR_CHEST_MODE !== "stake") {
      return fail(403, "stake_off", "Paying into a War Chest isn't switched on.");
    }
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !validChestAmount(parsed.data.amountMinor, parsed.data.currency)) {
      return fail(400, "bad_amount", "Pick an amount inside the limits shown.");
    }
    const key = publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) return fail(503, "not_configured", "Payments aren't switched on yet.");
    const { data: chestId, error } = await getAdminSupabase().rpc("create_stake_chest", {
      p_user: auth.user.id,
      p_amount_minor: parsed.data.amountMinor,
      p_currency: parsed.data.currency,
      p_rule: parsed.data.rule,
      p_cause: parsed.data.causeId,
    });
    if (error || typeof chestId !== "string") {
      return fail(409, "chest_failed", "A War Chest can't be set up for this challenge. It needs 7 to 90 days left.");
    }
    const order = await createOrder(fetch, { keyId: key, keySecret: requireServerEnv("RAZORPAY_KEY_SECRET") }, {
      amountMinor: parsed.data.amountMinor,
      currency: parsed.data.currency,
      receipt: `chest-${chestId.slice(0, 8)}`,
      notes: { kind: "war_chest", war_chest_id: chestId },
    });
    return ok({ key, orderId: order.id, amount: order.amount, currency: order.currency, description: "WillWar War Chest" });
  } catch (e) {
    return handleError("war-chest/checkout", e);
  }
}
