"use client";

import { useCallback, useState } from "react";
import { useHud } from "@/components/ui/Hud";
import { useWillWar } from "./provider";
import { errorMessage } from "./types";

/**
 * Runs a store action, refreshes the snapshot, and reports failures in plain words.
 * Returns the action's result, or undefined when it failed.
 */
export function useAction() {
  const { refresh } = useWillWar();
  const hud = useHud();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(fn: () => Promise<T>, opts: { success?: string; quiet?: boolean } = {}): Promise<T | undefined> => {
      setBusy(true);
      setError(null);
      try {
        const result = await fn();
        await refresh();
        if (opts.success) hud(opts.success);
        return result;
      } catch (e) {
        const msg = errorMessage(e);
        setError(msg);
        if (!opts.quiet) hud(msg);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [refresh, hud],
  );

  return { run, busy, error, setError };
}
