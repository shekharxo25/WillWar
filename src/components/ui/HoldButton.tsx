"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Press and hold: fills with --text over `ms`; releasing early drains it.
 * Keyboard: hold Space or Enter.
 */
export function HoldButton({ ms = 3000, label, doneLabel, onDone, disabled }: { ms?: number; label: string; doneLabel?: string; onDone: () => void; disabled?: boolean }) {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const holding = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);
  const pRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const loop = (t: number) => {
    const dt = last.current ? t - last.current : 16;
    last.current = t;
    const next = Math.min(1, Math.max(0, pRef.current + (holding.current ? dt / ms : -dt / (ms / 2))));
    pRef.current = next;
    setP(next);
    if (next >= 1) {
      setDone(true);
      holding.current = false;
      onDone();
      return;
    }
    if (next > 0 || holding.current) raf.current = requestAnimationFrame(loop);
  };
  const start = () => {
    if (done || disabled) return;
    holding.current = true;
    last.current = 0;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
  };
  const stop = () => {
    holding.current = false;
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      aria-label={done ? doneLabel ?? label : `${label}. Press and hold.`}
      className="no-select relative h-[52px] w-full overflow-hidden rounded-button bg-raised text-[17px] leading-[22px] font-semibold text-text shadow-[inset_0_0_0_1px_var(--hairline)] touch-none"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${p * 100}%` }} />
      <span className="relative" style={{ color: p > 0.5 ? "var(--on-primary)" : undefined }}>
        {done ? doneLabel ?? label : label}
      </span>
    </button>
  );
}
