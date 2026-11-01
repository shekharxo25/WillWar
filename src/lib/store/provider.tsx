"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cloudEnabled } from "@/env";
import type { Snapshot } from "@/lib/domain/types";
import { CloudStore } from "./cloud-store";
import { DeviceStore } from "./device-store";
import { isPro as snapshotIsPro } from "./snapshot";
import type { LoadResult, WillWarStore } from "./types";

export type AppStatus = "loading" | LoadResult["status"] | "error";

interface WillWarContextValue {
  status: AppStatus;
  snapshot: Snapshot | null;
  store: WillWarStore;
  online: boolean;
  isPro: boolean;
  refresh: () => Promise<void>;
}

const WillWarContext = createContext<WillWarContextValue | null>(null);

let singleton: WillWarStore | null = null;
export function getStore(): WillWarStore {
  singleton ??= cloudEnabled ? new CloudStore() : new DeviceStore();
  return singleton;
}

export function WillWarProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => getStore(), []);
  const [status, setStatus] = useState<AppStatus>("loading");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    inflight.current ??= (async () => {
      try {
        const result = await store.load();
        setStatus(result.status);
        setSnapshot(result.status === "ready" ? result.snapshot : null);
      } catch {
        setStatus((s) => (s === "ready" ? s : "error"));
      } finally {
        inflight.current = null;
      }
    })();
    return inflight.current;
  }, [store]);

  useEffect(() => {
    void refresh();
    // iOS has no Background Sync: sync on load, focus, online and visibility changes.
    const resync = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void store.sync().then((n) => (n > 0 ? refresh() : undefined));
    };
    const onVisible = () => {
      if (!document.hidden) {
        resync();
        void refresh();
      }
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", resync);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", resync);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, store]);

  const value = useMemo<WillWarContextValue>(
    () => ({ status, snapshot, store, online, isPro: snapshot ? snapshotIsPro(snapshot) : false, refresh }),
    [status, snapshot, store, online, refresh],
  );

  return <WillWarContext.Provider value={value}>{children}</WillWarContext.Provider>;
}

export function useWillWar(): WillWarContextValue {
  const ctx = useContext(WillWarContext);
  if (!ctx) throw new Error("useWillWar must be used inside <WillWarProvider>");
  return ctx;
}

/** A clock that re-renders every `intervalMs`, aligned to the wall clock second. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    };
    timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    const onVisible = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
