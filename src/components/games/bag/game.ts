import { loop, roundRect, setupSurface } from "../canvas";
import type { GameFactory } from "../types";

export const IN_MS = 4000;
export const OUT_MS = 6000;
export const CYCLE_MS = IN_MS + OUT_MS;

/** Breath phase at a point in the cycle: "in" while the bag swings out (4s), "out" as it swings back (6s). */
export function breathAt(ms: number): { phase: "in" | "out"; progress: number; cycles: number } {
  const cycles = Math.floor(ms / CYCLE_MS);
  const t = ms % CYCLE_MS;
  return t < IN_MS ? { phase: "in", progress: t / IN_MS, cycles } : { phase: "out", progress: (t - IN_MS) / OUT_MS, cycles };
}

const ease = (p: number) => 0.5 - Math.cos(Math.PI * p) / 2;

/** Bag: a heavy bag swings slowly on its chain. Breathe in as it swings out, out as it swings back. */
export const createBag: GameFactory = (canvas, { reducedMotion, palette: c, onCue }) => {
  let ms = 0;
  let lastPhase = "";
  const draw = () => {
    const { ctx, width: W, height: H } = surface;
    const b = breathAt(ms);
    ctx.clearRect(0, 0, W, H);
    if (W < 80 || H < 80) return; // not laid out yet
    // Swing angle: 0 at rest, out to ±14° at the top of the breath.
    const amp = 14 * (Math.PI / 180);
    const swing = reducedMotion ? 0 : (b.phase === "in" ? ease(b.progress) : 1 - ease(b.progress)) * amp;
    const ax = W / 2;
    const ay = 8;
    const bagH = Math.min(H * 0.58, 300);
    const bagW = bagH * 0.42;
    const chain = Math.min(H * 0.14, 70);

    // Ceiling beam
    ctx.strokeStyle = c.text2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 60, ay);
    ctx.lineTo(ax + 60, ay);
    ctx.stroke();

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(swing);
    // Chain links
    ctx.strokeStyle = c.text2;
    const links = 6;
    for (let i = 0; i < links; i++) {
      const y = (i / links) * chain;
      ctx.beginPath();
      if (i % 2) ctx.ellipse(0, y + chain / links / 2, 2.5, chain / links / 2, 0, 0, Math.PI * 2);
      else ctx.ellipse(0, y + chain / links / 2, 4.5, chain / links / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Straps
    ctx.beginPath();
    ctx.moveTo(0, chain);
    ctx.lineTo(-bagW * 0.32, chain + 22);
    ctx.moveTo(0, chain);
    ctx.lineTo(bagW * 0.32, chain + 22);
    ctx.stroke();
    // Bag body
    ctx.fillStyle = c.raised;
    ctx.strokeStyle = c.text;
    roundRect(ctx, -bagW / 2, chain + 22, bagW, bagH, bagW * 0.18);
    ctx.fill();
    ctx.stroke();
    // Bands
    ctx.strokeStyle = c.text2;
    for (const f of [0.16, 0.84]) {
      ctx.beginPath();
      ctx.moveTo(-bagW / 2, chain + 22 + bagH * f);
      ctx.lineTo(bagW / 2, chain + 22 + bagH * f);
      ctx.stroke();
    }
    ctx.restore();

    // Floor line and cycle count
    ctx.fillStyle = c.text2;
    ctx.font = "15px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    const baseY = Math.min(H - 16, chain + 22 + bagH + 56);
    ctx.fillText(`Breaths: ${b.cycles}`, W / 2, baseY);

    if (reducedMotion) {
      // Simple progress bar for the current breath.
      const bw = Math.min(W - 64, 240);
      const y = baseY - 30;
      ctx.fillStyle = c.hairline;
      roundRect(ctx, W / 2 - bw / 2, y, bw, 6, 3);
      ctx.fill();
      ctx.fillStyle = c.text;
      roundRect(ctx, W / 2 - bw / 2, y, bw * (b.phase === "in" ? b.progress : 1 - b.progress), 6, 3);
      ctx.fill();
    }

    if (b.phase !== lastPhase) {
      lastPhase = b.phase;
      onCue(b.phase === "in" ? "Breathe in" : "Breathe out");
    }
  };
  const surface = setupSurface(canvas, () => draw());
  const l = loop((t) => {
    ms = t;
    draw();
  });
  canvas.setAttribute("aria-label", "A heavy bag swinging on its chain. Breathe in for four seconds as it swings out, out for six as it swings back.");
  return {
    start: () => l.start(),
    pause: () => l.pause(),
    resume: () => l.resume(),
    dispose: () => {
      l.stop();
      surface.dispose();
    },
    summary: () => ({ label: "Breaths", value: breathAt(ms).cycles }),
  };
};
