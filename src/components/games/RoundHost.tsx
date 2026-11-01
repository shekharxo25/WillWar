"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Housing } from "@/components/clock/Housing";
import { Lamps } from "@/components/clock/Lamps";
import { LedReadout } from "@/components/clock/LedReadout";
import { pad2 } from "@/lib/time";
import type { Game } from "@/lib/store/types";
import { activeMs, display, pauseClock, phaseOf, remainingMs, resumeClock, startClock, ROUND_MS, type RoundClock, type RoundPhase } from "./countdown";
import { readPalette } from "./canvas";
import { loadGame, type GameInstance } from "./types";
import { bellOn, bumpSessionRounds, patchRound, readRound } from "./roundState";
import { IntensityStep } from "./IntensityStep";

type Shown = { m: number; s: number; phase: RoundPhase };

/**
 * R3 + R4. Owns the 3:00 countdown (timestamps + pause offsets), lamps (green on,
 * amber at 0:30, red off), the end blink and optional bell, Screen Wake Lock, and
 * pause on visibilitychange. The game draws on its own canvas with its own rAF loop;
 * React only re-renders when the shown second changes.
 */
export function RoundHost({ game }: { game: Game }) {
  const { store, snap, refresh, toast } = useApp();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<RoundClock | null>(null);
  const gameRef = useRef<GameInstance | null>(null);
  const startedAtRef = useRef<string>("");
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const endedRef = useRef(false);
  const [shown, setShown] = useState<Shown>({ m: 3, s: 0, phase: "on" });
  const [paused, setPaused] = useState(false);
  const [blink, setBlink] = useState(false);
  const [step, setStep] = useState<"play" | "after">("play");
  const [cue, setCue] = useState("");

  const finishRound = useCallback(
    (completed: boolean) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const c = clockRef.current;
      const now = Date.now();
      const durationS = c ? Math.round(activeMs(c, now) / 1000) : 0;
      gameRef.current?.pause();
      patchRound({ game, startedAt: startedAtRef.current, durationS: Math.min(1800, durationS), completed, summary: gameRef.current?.summary() });
      if (completed) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduced) setBlink(true);
        toast("You went the distance.");
        if (bellRef.current) void bellRef.current.play().catch(() => undefined);
        if ("vibrate" in navigator) navigator.vibrate?.([120, 80, 120]);
        setTimeout(() => setStep("after"), reduced ? 300 : 700);
      } else {
        setStep("after");
      }
    },
    [game, toast],
  );

  // Clock + game lifecycle.
  useEffect(() => {
    const fast = process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("dev_fast");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    clockRef.current = startClock(Date.now(), fast ? 10_000 : ROUND_MS);
    startedAtRef.current = new Date().toISOString();
    if (bellOn()) {
      const a = new Audio("/sounds/bell.mp3");
      a.preload = "auto";
      a.addEventListener("error", () => (bellRef.current = null));
      bellRef.current = a;
    }
    let disposed = false;
    void loadGame(game).then((factory) => {
      if (disposed || !canvasRef.current) return;
      const inst = factory(canvasRef.current, { reducedMotion: reduced, palette: readPalette(), onCue: setCue });
      gameRef.current = inst;
      inst.start();
      if (clockRef.current?.pausedAt !== null) inst.pause();
    });
    const id = setInterval(() => {
      const c = clockRef.current;
      if (!c || endedRef.current) return;
      const rem = remainingMs(c, Date.now());
      const d = display(rem);
      const phase = phaseOf(rem);
      setShown((prev) => (prev.m === d.m && prev.s === d.s && prev.phase === phase ? prev : { ...d, phase }));
      if (phase === "done") finishRound(true);
    }, 200);
    return () => {
      disposed = true;
      clearInterval(id);
      gameRef.current?.dispose();
      gameRef.current = null;
    };
  }, [game, finishRound]);

  const setPause = useCallback((p: boolean) => {
    const c = clockRef.current;
    if (!c || endedRef.current) return;
    clockRef.current = p ? pauseClock(c, Date.now()) : resumeClock(c, Date.now());
    if (p) gameRef.current?.pause();
    else gameRef.current?.resume();
    setPaused(p);
  }, []);

  // Pause when the app goes to the background; keep the screen awake while playing.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen");
      } catch {
        /* not supported or denied: the round still runs */
      }
    };
    const vis = () => {
      if (document.visibilityState === "hidden") setPause(true);
      else void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      void lock?.release().catch(() => undefined);
    };
  }, [setPause]);

  const after = async (n: number | null) => {
    const r = readRound();
    patchRound({ after: n });
    if (r?.completed) bumpSessionRounds();
    if (snap && r?.startedAt && !r.saved) {
      try {
        await store.saveUrgeSession({
          startedAt: r.startedAt,
          game,
          durationS: r.durationS ?? 0,
          intensityBefore: r.before ?? null,
          intensityAfter: n,
          completed: !!r.completed,
        });
        patchRound({ saved: true });
        await refresh();
      } catch {
        /* the summary still shows; saving is best effort */
      }
    }
    router.push("/app/round/done");
  };

  if (step === "after") return <IntensityStep title="HOW STRONG IS IT NOW?" onPick={after} />;

  return (
    <div className="pt-safe pb-safe fixed inset-0 z-10 mx-auto flex max-w-[480px] flex-col bg-bg">
      <div className="flex h-11 items-center justify-between px-4 min-[414px]:px-5">
        <span className="display text-[28px] leading-[30px]">ROUND</span>
        <div className="-mr-3 flex">
          <button type="button" className="press min-h-[44px] px-3 text-[17px]" onClick={() => setPause(!paused)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" className="press min-h-[44px] px-3 text-[17px]" onClick={() => finishRound(false)}>
            End
          </button>
        </div>
      </div>
      <div className="px-4 pt-3 min-[414px]:px-5">
        <Housing className="mx-auto flex max-w-[320px] items-center gap-5 px-5 pb-4 pt-6" style={{ viewTransitionName: "round-housing" }}>
          <Lamps go={shown.phase === "on"} warn={shown.phase === "warn"} red={false} />
          <div className="flex-1">
            <LedReadout
              groups={[String(shown.m), pad2(shown.s)]}
              size={72}
              blink={blink}
              ariaLabel={`${shown.m} minutes ${shown.s} seconds left${paused ? ", paused" : ""}`}
            />
          </div>
        </Housing>
        <p aria-live="polite" className="mt-3 min-h-[22px] text-center text-[17px] leading-[22px] text-text-2">
          {paused ? "Paused. The round waits for you." : cue}
        </p>
      </div>
      <div className="relative min-h-0 flex-1 px-2 pb-2">
        <canvas ref={canvasRef} role="img" className="no-select block h-full w-full touch-none" />
      </div>
    </div>
  );
}
