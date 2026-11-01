"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { deviceStore } from "@/lib/store/device";
import { cloudStore } from "@/lib/store/cloud";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { drain } from "@/lib/offline/queue";
import type { Snapshot, Store } from "@/lib/store/types";
import { ToastHost, type ToastApi } from "@/components/ui/Toast";

type Ctx = {
  store: Store;
  snap: Snapshot | null;
  loading: boolean;
  online: boolean;
  refresh: () => Promise<void>;
  toast: ToastApi["show"];
};

const AppCtx = createContext<Ctx | null>(null);

function pickStore(): Store {
  const sb = supabaseBrowser();
  return sb ? cloudStore(sb) : deviceStore;
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => pickStore(), []);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const toastRef = useRef<ToastApi | null>(null);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const refresh = useCallback(async () => {
    try {
      setSnap(await store.load());
    } catch {
      /* offline or transient: keep the last snapshot */
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    // Initial load runs once; state updates happen after the awaited store read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Drain the offline queue on load, focus, online and visibilitychange (no Background Sync on iOS).
  useEffect(() => {
    if (store.mode !== "cloud") return;
    const sb = supabaseBrowser();
    if (!sb) return;
    const run = async () => {
      const sent = await drain(async (op) => {
        if (op.kind === "check_in") {
          const { error } = await sb.rpc("check_in");
          if (error && !/no_open_streak/.test(error.message)) throw error;
        } else {
          const { error } = await sb.from("urge_sessions").insert(op.row);
          if (error) throw error;
        }
      });
      if (sent) void refresh();
    };
    void run();
    const vis = () => document.visibilityState === "visible" && run();
    window.addEventListener("focus", run);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("focus", run);
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [store, refresh]);

  const toast = useCallback((msg: string) => toastRef.current?.show(msg), []);
  const value = useMemo(() => ({ store, snap, loading, online, refresh, toast }), [store, snap, loading, online, refresh, toast]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <ToastHost ref={toastRef} />
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

/** A clock that ticks every second, client-only. Returns null during SSR/prerender. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, intervalMs);
    const vis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [intervalMs]);
  return now;
}
