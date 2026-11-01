"use client";
/**
 * Web Push, client side. Rules (Part 6.3, 6.11):
 *  - subscribe only from a user tap (call these from a click handler, never on load);
 *  - iOS supports Web Push only for installed (home screen) apps;
 *  - with no VAPID public key the feature is disabled and Settings shows why.
 * Mock path: when disabled, nothing is requested and `status()` explains it.
 */
export type PushStatus =
  | { enabled: true }
  | { enabled: false; reason: "not_configured" | "unsupported" | "ios_not_installed" | "denied" };

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const PUSH_DISABLED_COPY: Record<Exclude<PushStatus, { enabled: true }>["reason"], string> = {
  not_configured: "Reminders aren't switched on for this server yet.",
  unsupported: "This browser can't show reminders.",
  ios_not_installed: "On iPhone, add WillWar to your Home Screen first, then turn on reminders from the installed app.",
  denied: "Notifications are blocked for WillWar in your browser settings.",
};

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function pushStatus(): PushStatus {
  if (!VAPID) return { enabled: false, reason: "not_configured" };
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    if (typeof window !== "undefined" && isIos() && !isStandalone()) return { enabled: false, reason: "ios_not_installed" };
    return { enabled: false, reason: "unsupported" };
  }
  if (isIos() && !isStandalone()) return { enabled: false, reason: "ios_not_installed" };
  if (Notification.permission === "denied") return { enabled: false, reason: "denied" };
  return { enabled: true };
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Call from a tap. Asks permission, subscribes, saves on the server. */
export async function subscribeFromTap(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const st = pushStatus();
  if (!st.enabled) return { ok: false, reason: st.reason };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) return { ok: false, reason: ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "save_failed" };
  return { ok: true };
}

export async function unsubscribe(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined);
  await sub.unsubscribe();
}

/** Preview copy shown in onboarding and Settings. */
export function reminderPreview(day: number, discreet = true): string {
  return discreet ? `WillWar: Day ${day}. Tap to check in.` : `WillWar: Day ${day} of your challenge. Tap to check in.`;
}
