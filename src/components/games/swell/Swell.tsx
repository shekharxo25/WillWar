"use client";

import type { GameProps } from "../GameHost";
import { breathLevel, breathPhase } from "../logic";

/** Swell: paced breathing, 4 seconds in and 6 out. The wave rises and falls with you. */
export function Swell({ elapsedMs, reducedMotion }: GameProps) {
  const { phase, cycles, secondsLeft } = breathPhase(elapsedMs);
  const level = breathLevel(elapsedMs);
  const scale = reducedMotion ? (phase === "in" ? 1 : 0.72) : 0.62 + level * 0.38;

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Rising and falling water behind the bubble. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 bg-linear-to-t from-tide to-tide/40 transition-[height] duration-100 ease-linear"
        style={{ height: `${reducedMotion ? 35 : 18 + level * 34}%` }}
      >
        <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute -top-[19px] h-5 w-full" aria-hidden>
          <path d="M0 20 Q 50 0 100 10 T 200 10 T 300 10 T 400 10 V20 Z" className="fill-tide/40" />
        </svg>
      </div>

      <div className="relative flex size-[min(72vw,300px)] items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full border border-white/15" />
        <span aria-hidden className="absolute inset-[8%] rounded-full border border-white/10" />
        <span
          aria-hidden
          className="absolute inset-[12%] rounded-full bg-radial from-white/90 via-white/40 to-tide/30 shadow-[0_0_80px_rgb(255_255_255/0.25)]"
          style={{ transform: `scale(${scale})`, transition: reducedMotion ? "transform 150ms" : undefined }}
        />
        <div className="relative text-center text-tide-deep">
          <p className="text-title-2 font-bold">{phase === "in" ? "Breathe in" : "Breathe out slowly"}</p>
          <p className="num mt-1 text-[2rem] font-semibold">{secondsLeft}</p>
        </div>
      </div>

      <p className="relative mt-10 text-subhead text-white/75" aria-live="polite">
        {cycles === 0 ? "Follow the wave. Nothing else to do." : `${cycles} ${cycles === 1 ? "breath" : "breaths"} ridden`}
      </p>
    </div>
  );
}
