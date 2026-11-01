"use client";
import { useEffect } from "react";

/** Registers /sw.js for the /app/ scope in production builds only. Mount once inside the app layout. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/app/" }).catch(() => {
      /* registration failure leaves the app working online */
    });
  }, []);
  return null;
}
