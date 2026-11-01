"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Renders `fallback` in the prerendered static shell and `children` only in the
 * browser. App screens depend on the device clock and local data, so their real
 * content never belongs in the prerender.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return <>{mounted ? children : fallback}</>;
}
