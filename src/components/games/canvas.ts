import type { Palette } from "./types";

/** Reads Fight Night tokens from CSS so canvases never hold raw color values. */
export function readPalette(el: Element = document.documentElement): Palette {
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    bg: v("--bg"),
    raised: v("--bg-raised"),
    text: v("--text"),
    text2: v("--text-2"),
    text3: v("--text-3"),
    hairline: v("--hairline"),
    brass: v("--brass"),
    ink: v("--ink"),
    onText: v("--on-primary"),
    display: [v("--font-league"), '"League Gothic"', "Impact", "sans-serif"].filter(Boolean).join(", "),
  };
}

export type Surface = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dispose(): void;
};

/**
 * devicePixelRatio-scaled canvas that tracks its CSS size. Drawing uses CSS pixels.
 * `onResize` fires after each size change so the game can relayout and redraw.
 */
export function setupSurface(canvas: HTMLCanvasElement, onResize: () => void): Surface {
  const ctx = canvas.getContext("2d")!;
  const s: Surface = {
    ctx,
    width: 0,
    height: 0,
    dispose: () => ro.disconnect(),
  };
  const fit = (notify = true) => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    s.width = Math.max(1, r.width);
    s.height = Math.max(1, r.height);
    canvas.width = Math.round(s.width * dpr);
    canvas.height = Math.round(s.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (notify) onResize();
  };
  // Size now (the caller's surface isn't assigned yet); the observer's first callback triggers the first draw.
  const ro = new ResizeObserver(() => fit());
  ro.observe(canvas);
  fit(false);
  return s;
}

/** Pointer position in canvas CSS pixels. */
export function pointerXY(canvas: HTMLCanvasElement, e: PointerEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A rAF loop with pause support. `frame` gets elapsed active ms since start. */
export function loop(frame: (activeMs: number) => void) {
  let raf = 0;
  let running = false;
  let base = 0;
  let pausedAt: number | null = null;
  let pausedTotal = 0;
  const tick = (t: number) => {
    if (!running) return;
    frame(t - base - pausedTotal);
    raf = requestAnimationFrame(tick);
  };
  return {
    start() {
      base = performance.now();
      pausedTotal = 0;
      running = true;
      raf = requestAnimationFrame(tick);
    },
    pause() {
      if (!running) return;
      running = false;
      pausedAt = performance.now();
      cancelAnimationFrame(raf);
    },
    resume() {
      if (running) return;
      if (pausedAt !== null) pausedTotal += performance.now() - pausedAt;
      pausedAt = null;
      running = true;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
  };
}
