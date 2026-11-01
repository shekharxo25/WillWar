"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export interface TideProps {
  /** Water level, 0 (empty) to 1 (full). */
  level: number;
  /** Freeze the waves into a still waterline (reduced motion, pre-season, after a reset). */
  still?: boolean;
  /** Settle to a still surface after this many ms without touch. Default 20s; 0 disables. */
  settleAfterMs?: number;
  className?: string;
}

const FRONT_CYCLE_MS = 9_000;
const BACK_CYCLE_MS = 13_000;
const LEVEL_STIFFNESS = 120; // spring.tide
const LEVEL_DAMPING = 20;

function cssVar(el: Element, name: string, fallback: string) {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * The Tide: two sine layers drifting at 9s and 13s cycles over a water gradient.
 * Decorative canvas (aria-hidden); callers render the clock and a text equivalent.
 * Pauses when the page is hidden and settles after 20s idle (DESIGN.md section 4).
 */
export function Tide({ level, still = false, settleAfterMs = 20_000, className }: TideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(level);
  const reduced = useReducedMotion();

  useEffect(() => {
    targetRef.current = Math.max(0, Math.min(1, level));
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let current = targetRef.current;
    let velocity = 0;
    let amplitude = still || reduced ? 0 : 1;
    let lastInteraction = performance.now();
    let last = performance.now();
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      // spring.tide toward the target level
      const target = targetRef.current;
      if (reduced) {
        current = target;
        velocity = 0;
      } else {
        const force = LEVEL_STIFFNESS * (target - current) - LEVEL_DAMPING * velocity;
        velocity += force * dt;
        current += velocity * dt;
      }

      const idle = settleAfterMs > 0 && t - lastInteraction > settleAfterMs;
      const wantAmp = still || reduced || idle ? 0 : 1;
      amplitude += (wantAmp - amplitude) * Math.min(1, dt * 1.5);

      const top = cssVar(canvas, "--water-top", "rgba(11,110,127,0.9)");
      const floor = cssVar(canvas, "--water-floor", "#0a3f55");

      ctx.clearRect(0, 0, width, height);
      const waterline = height * (1 - Math.max(0, Math.min(1, current)));
      const amp = Math.min(10, height * 0.03) * amplitude;

      const layer = (cycle: number, phaseOffset: number, alpha: number, ampScale: number, yOffset: number) => {
        const phase = ((t % cycle) / cycle) * Math.PI * 2 + phaseOffset;
        const grad = ctx.createLinearGradient(0, waterline, 0, height);
        grad.addColorStop(0, top);
        grad.addColorStop(1, floor);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const steps = Math.max(24, Math.round(width / 8));
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * width;
          const y = waterline + yOffset + Math.sin((x / width) * Math.PI * 2 + phase) * amp * ampScale;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      };

      if (current > 0.0005) {
        layer(BACK_CYCLE_MS, Math.PI / 2, 0.55, 0.8, -3);
        layer(FRONT_CYCLE_MS, 0, 1, 1, 0);
      }
      ctx.globalAlpha = 1;

      const settled = amplitude < 0.01 && Math.abs(target - current) < 0.0005 && Math.abs(velocity) < 0.0005;
      if (running && !(settled && wantAmp === 0)) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
      }
    };

    const wake = () => {
      lastInteraction = performance.now();
      if (!raf && running) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        running = true;
        wake();
      }
    };

    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    const levelPoll = window.setInterval(() => {
      if (!raf && Math.abs(targetRef.current - current) > 0.0005) wake();
    }, 500);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearInterval(levelPoll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("scroll", wake);
    };
  }, [still, reduced, settleAfterMs]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ width: "100%", height: "100%" }} />;
}
