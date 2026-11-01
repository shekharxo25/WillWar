import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { fail, json, readJson } from "@/lib/server/http";
import { limited } from "@/lib/server/rate-limit";

const pushEnabled = () => Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

const Sub = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(16).max(200), auth: z.string().min(8).max(100) }),
});

/** POST /api/push/subscribe: save this device's Web Push subscription for the signed-in user. */
export async function POST(req: Request) {
  const tooMany = limited(req, "push", 10);
  if (tooMany) return tooMany;
  if (!pushEnabled()) return fail("push_disabled", 503, { disabled: true });
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const parsed = Sub.safeParse(await readJson(req));
  if (!parsed.success) return fail("bad_subscription", 400);
  const { endpoint, keys } = parsed.data;
  const { error } = await auth.sb.rpc("save_push_subscription", { p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth });
  if (error) return fail("save_failed", 500);
  return json({ saved: true });
}

/** DELETE /api/push/subscribe { endpoint }: remove it (RLS: own rows only). */
export async function DELETE(req: Request) {
  const tooMany = limited(req, "push", 10);
  if (tooMany) return tooMany;
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const body = await readJson<{ endpoint?: string }>(req);
  if (!body?.endpoint) return fail("bad_subscription", 400);
  const { error } = await auth.sb.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  if (error) return fail("delete_failed", 500);
  return json({ removed: true });
}
