import { z } from "zod";
import { fail, handleError, ok } from "@/lib/http";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/server";

const subscription = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

// Stores this device's Web Push subscription for the signed-in person (insert needs the
// secret key: push_subscriptions has no insert policy). DELETE removes it.
export async function POST(request: Request) {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const parsed = subscription.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "bad_subscription", "This browser's push details weren't valid.");
    const { error } = await getAdminSupabase()
      .from("push_subscriptions")
      .upsert(
        { user_id: auth.user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error("subscribe_failed");
    return ok({ subscribed: true });
  } catch (e) {
    return handleError("push/subscribe", e);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getRequestUser();
    if (!auth) return fail(401, "not_authenticated", "Sign in to continue.");
    const parsed = z.object({ endpoint: z.url() }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "bad_request", "Missing endpoint.");
    await auth.supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
    return ok({ removed: true });
  } catch (e) {
    return handleError("push/subscribe", e);
  }
}
