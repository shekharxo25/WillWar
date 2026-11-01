"use client";

import { useEffect } from "react";

/** Registers /sw.js for the /app/ scope and asks for persistent storage once installed. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !localStorage.getItem("ww-sw-dev")) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/app/" }).catch(() => {
      // Registration failure leaves the app fully usable online.
    });
    if (isStandalone() && navigator.storage?.persist) void navigator.storage.persist();
  }, []);
  return null;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}
