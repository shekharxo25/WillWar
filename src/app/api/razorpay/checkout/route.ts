import { z } from "zod";
import { publicEnv } from "@/env";
import { requireServerEnv, serverEnv } from "@/env.server";
import { fail, handleError, ok } from "@/lib/http";
import { createOrder, createSubscription } from "@/lib/payments/razorpay";
import { getRequestUser } from "@/lib/supabase/server";

const body = z.object({ plan: z.enum(["season", "annual"]) });

// Starts Pro checkout. Nothing changes until the verified webhook confirms payment.
export async function POST(request: Request) {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "bad_plan", "Pick a plan.");
    const key = publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) return fail(503, "not_configured", "Payments aren't switched on yet.");
    const creds = { keyId: key, keySecret: requireServerEnv("RAZORPAY_KEY_SECRET") };
    const notes = { kind: parsed.data.plan, user_id: auth.user.id };

    if (parsed.data.plan === "season") {
      const amountMinor = serverEnv().PRICE_SEASON_INR * 100;
      const order = await createOrder(fetch, creds, { amountMinor, currency: "INR", receipt: `season-${Date.now()}`, notes });
      return ok({ key, orderId: order.id, amount: order.amount, currency: order.currency, description: "WillWar Pro season pass" });
    }
    const sub = await createSubscription(fetch, creds, { planId: requireServerEnv("RAZORPAY_ANNUAL_PLAN_ID"), notes });
    return ok({ key, subscriptionId: sub.id, description: "WillWar Pro annual" });
  } catch (e) {
    return handleError("razorpay/checkout", e);
  }
}
