"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number; // 0..1 across the width
  born: number;
  strength: number;
}

const LAYERS = [
  { color: "--glacier-deep", alpha: 0.95, amp: 16, speed: 0.00011, len: 1.3, y: 0.38 },
  { color: "--harbor", alpha: 0.9, amp: 20, speed: 0.00017, len: 1.9, y: 0.52 },
  { color: "--harbor-bright", alpha: 0.55, amp: 12, speed: 0.00026, len: 2.6, y: 0.66 },
];

/**
 * The landing hero's living ocean: three wave layers that ripple where the pointer
 * passes. Pauses off-screen and when the tab is hidden; still under reduced motion.
 */
export function Ocean({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ripples: Ripple[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let lastPointer = 0;

    const colors = LAYERS.map((l) => getComputedStyle(canvas).getPropertyValue(l.color).trim() || "#0b6e7f");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ripple = (clientX: number, strength: number) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: (clientX - r.left) / r.width, born: performance.now(), strength });
      if (ripples.length > 12) ripples.shift();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].born > 2600) ripples.splice(i, 1);
      LAYERS.forEach((L, li) => {
        const grad = ctx.createLinearGradient(0, h * L.y - 30, 0, h);
        grad.addColorStop(0, colors[li]);
        grad.addColorStop(1, "rgba(3, 20, 28, 0.95)");
        ctx.globalAlpha = L.alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, h);
        const steps = Math.max(48, Math.round(w / 10));
        for (let s = 0; s <= steps; s++) {
          const x = s / steps;
          let y =
            h * L.y +
            Math.sin(x * Math.PI * 2 * L.len + t * L.speed * (li + 1) * 6) * L.amp +
            Math.sin(x * Math.PI * 2 * L.len * 0.45 - t * L.speed * 4) * L.amp * 0.6;
          for (const rp of ripples) {
            const age = (t - rp.born) / 1000;
            const d = Math.abs(x - rp.x) * w;
            const front = age * 260;
            const env = Math.exp(-((d - front) ** 2) / 1800) * Math.exp(-age * 1.4);
            y -= Math.sin((d - front) / 14) * rp.strength * env * (1 - li * 0.25);
          }
          ctx.lineTo(x * w, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        if (li === LAYERS.length - 1) {
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = "rgba(233, 247, 249, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(draw);
      else raf = 0;
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastPointer < 90) return;
      lastPointer = now;
      ripple(e.clientX, 9);
      if (reduced) draw(now);
    };
    const onDown = (e: PointerEvent) => {
      ripple(e.clientX, 22);
      if (reduced) draw(performance.now());
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    ro.observe(canvas);
    const host = canvas.parentElement ?? canvas;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);
    if (reduced) draw(performance.now());
    else start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
