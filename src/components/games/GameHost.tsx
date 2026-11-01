"use client";

import { Pause, Play, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/domain/constants";
import { GAME_INFO, useUrgeFlow } from "./UrgeFlow";

export const GAME_MS = 180_000;
const MIN_COUNTED_MS = 30_000;

export interface GameProps {
  /** Elapsed play time (pauses excluded). */
  elapsedMs: number;
  paused: boolean;
  reducedMotion: boolean;
}

const games: Record<Game, React.ComponentType<GameProps>> = {
  swell: dynamic(() => import("./swell/Swell").then((m) => m.Swell), { ssr: false }),
  drift: dynamic(() => import("./drift/Drift").then((m) => m.Drift), { ssr: false }),
  knots: dynamic(() => import("./knots/Knots").then((m) => m.Knots), { ssr: false }),
};

/** U3: a 3:00 game with Pause and End. No tab bar, no pill, no ads. */
export function GameHost({ game }: { game: Game }) {
  const router = useRouter();
  const flow = useUrgeFlow();
  const [elapsed, setElapsed] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const last = useRef<number | null>(null);
  const done = useRef(false);
  const paused = userPaused || hidden;

  const finish = useCallback(
    (playedMs: number, completed: boolean) => {
      if (done.current) return;
      done.current = true;
      flow.set({ game, playedS: Math.round(playedMs / 1000), completed, saved: false });
      router.replace("/app/urge/done");
    },
    [flow, game, router],
  );

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Screen Wake Lock so the screen doesn't dim mid-game.
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    let lock: Sentinel | null = null;
    if (!paused && nav.wakeLock) {
      nav.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    }
    return () => void lock?.release().catch(() => undefined);
  }, [paused]);

  // Clock: rAF while playing, at most one state update per 100ms.
  useEffect(() => {
    if (paused) {
      last.current = null;
      return;
    }
    let raf = 0;
    let acc = 0;
    const tick = (t: number) => {
      if (last.current !== null) acc += t - last.current;
      last.current = t;
      if (acc >= 100) {
        const step = acc;
        acc = 0;
        setElapsed((e) => {
          const next = e + step;
          if (next >= GAME_MS) setTimeout(() => finish(GAME_MS, true), 0);
          return Math.min(GAME_MS, next);
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, finish]);

  const Game = games[game];
  const remaining = Math.max(0, GAME_MS - elapsed);
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <main className="no-callout fixed inset-0 mx-auto flex max-w-[480px] flex-col pt-[calc(env(safe-area-inset-top)+8px)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-11 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          className="pressable flex min-h-11 items-center gap-1.5 rounded-full px-3 text-subhead"
          aria-pressed={userPaused}
        >
          {userPaused ? <Play size={16} weight="fill" aria-hidden /> : <Pause size={16} weight="fill" aria-hidden />}
          {userPaused ? "Resume" : "Pause"}
        </button>
        <span className="num text-headline" aria-label={`${mm} minutes ${ss} seconds left`}>
          {mm}:{String(ss).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => finish(elapsed, elapsed >= MIN_COUNTED_MS)}
          className="pressable flex min-h-11 items-center gap-1.5 rounded-full px-3 text-subhead"
        >
          End <X size={16} aria-hidden />
        </button>
      </div>
      {/* The wave progress line from 3:00 to 0:00. */}
      <svg viewBox="0 0 300 12" preserveAspectRatio="none" className="mx-4 h-3" aria-hidden>
        <path d="M0 6 Q 7.5 0 15 6 T 30 6 T 45 6 T 60 6 T 75 6 T 90 6 T 105 6 T 120 6 T 135 6 T 150 6 T 165 6 T 180 6 T 195 6 T 210 6 T 225 6 T 240 6 T 255 6 T 270 6 T 285 6 T 300 6" fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="2" />
        <path
          d="M0 6 Q 7.5 0 15 6 T 30 6 T 45 6 T 60 6 T 75 6 T 90 6 T 105 6 T 120 6 T 135 6 T 150 6 T 165 6 T 180 6 T 195 6 T 210 6 T 225 6 T 240 6 T 255 6 T 270 6 T 285 6 T 300 6"
          fill="none"
          stroke="white"
          strokeWidth="2"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={elapsed / GAME_MS}
          style={{ transform: "scaleX(-1)", transformOrigin: "center" }}
        />
      </svg>
      <p className="sr-only" aria-live="polite">
        {GAME_INFO[game].name}. {paused ? "Paused." : ""}
      </p>
      <div className="relative min-h-0 flex-1">
        <Game elapsedMs={elapsed} paused={paused} reducedMotion={reduced} />
        {userPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button type="button" onClick={() => setUserPaused(false)} className="pressable rounded-full bg-white px-6 py-3 text-headline text-tide-deep">
              Resume
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
