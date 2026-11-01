"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during prerender and hydration, true after. Lets client-only reads (storage, clocks) run in render. */
export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
