"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Game } from "@/lib/domain/constants";

export interface UrgeFlowState {
  before: number | null;
  game: Game | null;
  playedS: number;
  completed: boolean;
  after: number | null;
  saved: boolean;
}

interface UrgeFlow extends UrgeFlowState {
  set: (patch: Partial<UrgeFlowState>) => void;
  reset: () => void;
}

const initial: UrgeFlowState = { before: null, game: null, playedS: 0, completed: false, after: null, saved: false };
const Ctx = createContext<UrgeFlow | null>(null);

/** Holds the urge flow in memory only. Intensities never go in the URL. */
export function UrgeFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UrgeFlowState>(initial);
  const value = useMemo<UrgeFlow>(
    () => ({ ...state, set: (patch) => setState((s) => ({ ...s, ...patch })), reset: () => setState(initial) }),
    [state],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUrgeFlow(): UrgeFlow {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUrgeFlow must be used inside <UrgeFlowProvider>");
  return ctx;
}

export const GAME_INFO: Record<Game, { name: string; line: string; detail: string }> = {
  drift: { name: "Drift", line: "Fit the pieces onto the raft.", detail: "A calm spatial puzzle" },
  swell: { name: "Swell", line: "Breathe with the wave.", detail: "Paced breathing, 4 in and 6 out" },
  knots: { name: "Knots", line: "Untangle the lines.", detail: "Drag the points until nothing crosses" },
};
