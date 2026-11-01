"use client";

import { cloudEnabled, publicEnv } from "@/env";

export type PushSupport = "ok" | "needs-install" | "needs-account" | "unsupported" | "denied";

function base64UrlToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Whether reminders can be switched on here (iOS only allows push in the installed app). */
export function pushSupport(standalone: boolean): PushSupport {
  if (!cloudEnabled || !publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "needs-account";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return ios && !standalone ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

/** Ask permission (from a tap only), subscribe, and register the subscription. */
export async function enableReminders(): Promise<boolean> {
  const key = publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return false;
  if ((await Notification.requestPermission()) !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok;
}
