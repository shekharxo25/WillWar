import { payments } from "@/lib/adapters/payments";
import { cloudEnabled, isProduction } from "@/lib/config/flags";
import { SEASON_MODE } from "@/lib/config/season";
import { currentUserId } from "@/lib/supabase/server";

/**
 * Starts a Pro purchase. Season pass → Razorpay Order; Annual → Subscription.
 * The client opens Razorpay Checkout; entitlements change only from the verified webhook.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { plan?: string; timezone?: string };
  const plan = body.plan === "season" || body.plan === "annual" ? body.plan : null;
  if (!plan) return Response.json({ error: "bad_plan" }, { status: 400 });

  let userId: string | null = null;
  if (cloudEnabled()) {
    userId = await currentUserId();
    if (!userId) return Response.json({ error: "not_authenticated" }, { status: 401 });
  }

  const adapter = payments();
  if (adapter.mock) {
    if (isProduction()) return Response.json({ error: "payments_unavailable" }, { status: 503 });
    return Response.json({ mock: true, url: `/app/dev/payments?plan=${plan}` });
  }

  const notes: Record<string, string> = { user_id: userId ?? "", timezone: body.timezone ?? "Asia/Kolkata", rolling: SEASON_MODE === "rolling" ? "1" : "0" };
  try {
    if (plan === "season") {
      const amount = Number(process.env.PRICE_SEASON_INR ?? 14900);
      const order = await adapter.createOrder("season", amount, "INR", notes);
      return Response.json({ keyId: adapter.keyId, orderId: order.id, amount: order.amount, currency: order.currency, name: "WillWar", description: "Season pass" });
    }
    const planId = process.env.RAZORPAY_ANNUAL_PLAN_ID;
    if (!planId) return Response.json({ error: "plan_not_configured" }, { status: 503 });
    const sub = await adapter.createSubscription(planId, notes);
    return Response.json({ keyId: adapter.keyId, subscriptionId: sub.id, name: "WillWar", description: "Annual" });
  } catch {
    return Response.json({ error: "checkout_failed" }, { status: 502 });
  }
}
