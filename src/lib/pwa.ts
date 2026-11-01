"use client";
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function platform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

/** App badge when today's check-in is pending (supported on installed PWAs). */
export function setBadge(pending: boolean) {
  const n = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (pending) void n.setAppBadge?.(1);
    else void n.clearAppBadge?.();
  } catch {}
}

/** Ask for persistent storage once installed, so the on-device record isn't evicted. */
export function persistStorage() {
  try {
    if (isStandalone()) void navigator.storage?.persist?.();
  } catch {}
}
