"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Housing } from "@/components/clock/Housing";
import { Lamps } from "@/components/clock/Lamps";
import { LedReadout } from "@/components/clock/LedReadout";
import { pad2 } from "@/lib/time";

const LENGTH_MS = 10_000;

/**
 * Hold to last a 10-second round. While held it counts down with the green lamp,
 * amber at 0:03, then the LED blinks twice and shows "You went the distance."
 * Releasing pauses it. Works with touch, mouse and the Space key.
 */
export function HoldDemo() {
  const [left, setLeft] = useState(LENGTH_MS);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const leftRef = useRef(LENGTH_MS);

  const stop = useCallback(() => setHolding(false), []);
  const start = useCallback(() => {
    if (!done) setHolding(true);
  }, [done]);

  // The countdown runs only while held; elapsed time comes from frame timestamps.
  useEffect(() => {
    if (!holding) return;
    let last: number | null = null;
    let raf = 0;
    const frame = (t: number) => {
      if (last !== null) {
        leftRef.current = Math.max(0, leftRef.current - (t - last));
        setLeft(leftRef.current);
      }
      last = t;
      if (leftRef.current <= 0) {
        setHolding(false);
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [holding]);

  const again = () => {
    leftRef.current = LENGTH_MS;
    setLeft(LENGTH_MS);
    setDone(false);
  };

  const secs = Math.ceil(left / 1000);
  const warn = holding && secs <= 3;
  return (
    <div className="mt-10 flex flex-col items-start gap-5">
      <Housing className="flex items-center gap-4 px-5 pb-4 pt-6">
        <Lamps go={holding && !warn} warn={warn} />
        <LedReadout groups={[String(Math.floor(secs / 60)), pad2(secs % 60)]} size={52} blink={done} ariaLabel={`${secs} seconds left`} />
      </Housing>
      <p aria-live="polite" className="min-h-[22px] text-[17px] leading-[22px] font-semibold">
        {done ? "You went the distance." : ""}
      </p>
      {done ? (
        <button type="button" onClick={again} className="press min-h-[52px] rounded-button bg-raised px-5 text-[17px] leading-[22px] font-semibold">
          Go again
        </button>
      ) : (
        <button
          type="button"
          aria-pressed={holding}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start();
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") stop();
          }}
          onBlur={stop}
          onContextMenu={(e) => e.preventDefault()}
          className="press no-select min-h-[52px] touch-none rounded-button bg-primary px-5 text-[17px] leading-[22px] font-semibold text-on-primary"
        >
          Hold to last a 10-second round
        </button>
      )}
    </div>
  );
}
