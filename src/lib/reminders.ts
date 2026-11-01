"use client";
/** Reminder preferences + push subscription from a user tap. iOS: installed app only. */
export type ReminderPrefs = { time: string; nightWatch: boolean; bell: boolean };
const KEY = "ww.reminders";

export function loadReminderPrefs(): ReminderPrefs {
  try {
    return { time: "21:30", nightWatch: false, bell: false, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { time: "21:30", nightWatch: false, bell: false };
  }
}
export function saveReminderPrefs(p: Partial<ReminderPrefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadReminderPrefs(), ...p }));
    if (p.bell !== undefined) localStorage.setItem("ww.bell", p.bell ? "1" : "0");
  } catch {}
}

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export function pushAvailable(): { ok: boolean; reason?: string } {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return { ok: false, reason: "Reminders aren't configured on this server yet." };
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, reason: "This browser can't show reminders. On iPhone, add WillWar to your Home Screen first." };
  return { ok: true };
}

export async function subscribePush(): Promise<"subscribed" | "denied" | "disabled"> {
  if (!pushAvailable().ok) return "disabled";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
  const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  return res.ok ? "subscribed" : "disabled";
}
