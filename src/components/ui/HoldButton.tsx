"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Hold-to-confirm capsule (pledge signature): holding fills it with Tide over
 * `durationMs`; releasing early drains it. Pointer, touch and Space key.
 */
export function HoldButton({
  label,
  doneLabel,
  durationMs = 3000,
  onComplete,
  icon,
  disabled,
}: {
  label: string;
  doneLabel: string;
  durationMs?: number;
  onComplete: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const holding = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);
  const value = useRef(0);

  const loop = (t: number) => {
    const dt = last.current ? t - last.current : 16;
    last.current = t;
    const dir = holding.current ? 1 : -2.5; // drains faster than it fills
    value.current = Math.min(1, Math.max(0, value.current + (dir * dt) / durationMs));
    setProgress(value.current);
    if (value.current >= 1) {
      holding.current = false;
      setDone(true);
      onComplete();
      return;
    }
    if (holding.current || value.current > 0) raf.current = requestAnimationFrame(loop);
    else last.current = 0;
  };

  const start = () => {
    if (done || disabled) return;
    holding.current = true;
    cancelAnimationFrame(raf.current);
    last.current = 0;
    raf.current = requestAnimationFrame(loop);
  };
  const stop = () => {
    holding.current = false;
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={done ? doneLabel : `${label}. Press and hold for ${durationMs / 1000} seconds.`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      onContextMenu={(e) => e.preventDefault()}
      className="no-callout relative h-16 w-full touch-none overflow-hidden rounded-full border-[0.5px] border-separator bg-surface text-headline font-semibold text-tide disabled:opacity-50"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-tide"
        style={{ width: `${(done ? 1 : progress) * 100}%` }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2" style={{ color: progress > 0.5 || done ? "var(--on-tide)" : undefined }}>
        {icon}
        {done ? doneLabel : label}
      </span>
    </button>
  );
}
