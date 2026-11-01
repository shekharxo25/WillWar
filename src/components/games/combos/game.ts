import { loop, pointerXY, setupSurface } from "../canvas";
import type { GameFactory } from "../types";

export const START_LEN = 2;
const LIT_MS = 520;
const GAP_MS = 200;
const FLASH_MS = 160;

/** Next sequence length: grows by one on success, shrinks by one on a miss (never below 2). */
export function nextLength(len: number, success: boolean): number {
  return success ? len + 1 : Math.max(START_LEN, len - 1);
}

/** Combos: six focus mitts light up in a sequence; repeat it by tapping. */
export const createCombos: GameFactory = (canvas, { palette: c, onCue }) => {
  let ms = 0;
  let seq: number[] = [];
  let mode: "show" | "input" | "rest" = "rest";
  let modeAt = 0;
  let inputIdx = 0;
  let best = 0;
  let flash: { mitt: number; until: number } | null = null;
  let len = START_LEN;
  const pick = () => Math.floor(Math.random() * 6);

  const newSeq = (extend: boolean) => {
    if (extend && seq.length) seq = [...seq, pick()];
    else seq = Array.from({ length: len }, pick);
    // Avoid the same mitt twice in a row; it reads as one hit.
    for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = (seq[i] + 1 + Math.floor(Math.random() * 5)) % 6;
  };
  const begin = (cue: string) => {
    mode = "rest";
    modeAt = ms;
    onCue(cue);
  };

  const layout = () => {
    const { width: W, height: H } = surface;
    const cols = 3;
    const rows = 2;
    const gap = 14;
    const size = Math.min((W - 32 - gap * (cols - 1)) / cols, (H - 32 - gap * (rows - 1)) / rows, 120);
    const ox = (W - (size * cols + gap * (cols - 1))) / 2;
    const oy = (H - (size * rows + gap * (rows - 1))) / 2;
    return Array.from({ length: 6 }, (_, i) => ({ x: ox + (i % cols) * (size + gap), y: oy + Math.floor(i / cols) * (size + gap), size }));
  };

  const litMitt = (): number | null => {
    if (flash && ms < flash.until) return flash.mitt;
    if (mode !== "show") return null;
    const t = ms - modeAt;
    const step = Math.floor(t / (LIT_MS + GAP_MS));
    if (step >= seq.length) return null;
    return t % (LIT_MS + GAP_MS) < LIT_MS ? seq[step] : null;
  };

  const draw = () => {
    const { ctx, width: W, height: H } = surface;
    ctx.clearRect(0, 0, W, H);
    if (W < 80 || H < 80) return; // not laid out yet
    const lit = litMitt();
    layout().forEach((m, i) => {
      const cx = m.x + m.size / 2;
      const cy = m.y + m.size / 2;
      const r = m.size / 2 - 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.9, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = lit === i ? c.text : c.raised;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = lit === i ? c.text : c.text2;
      ctx.stroke();
      // Target ring
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = lit === i ? c.onText : c.text3;
      ctx.stroke();
      // Punch number, like a trainer calling 1-2-3
      ctx.fillStyle = lit === i ? c.onText : c.text2;
      ctx.font = `${Math.round(r * 0.5)}px ${c.display}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), cx, cy + 1);
    });
    ctx.fillStyle = c.text2;
    ctx.font = "15px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`Combo: ${seq.length}   Longest: ${best}`, W / 2, H - 8);
  };

  const step = () => {
    if (mode === "rest" && ms - modeAt > 700) {
      mode = "show";
      modeAt = ms;
      onCue("Watch");
    } else if (mode === "show" && ms - modeAt > seq.length * (LIT_MS + GAP_MS)) {
      mode = "input";
      inputIdx = 0;
      onCue("Your turn");
    }
  };

  const onDown = (e: PointerEvent) => {
    if (mode !== "input") return;
    const { x, y } = pointerXY(canvas, e);
    const hit = layout().findIndex((m) => Math.hypot(x - (m.x + m.size / 2), y - (m.y + m.size / 2)) < m.size / 2);
    if (hit < 0) return;
    flash = { mitt: hit, until: ms + FLASH_MS };
    if (hit === seq[inputIdx]) {
      inputIdx++;
      if (inputIdx === seq.length) {
        best = Math.max(best, seq.length);
        len = nextLength(seq.length, true);
        newSeq(true);
        begin("Good. Longer one.");
      }
    } else {
      len = nextLength(seq.length, false);
      newSeq(false);
      begin("Again.");
    }
    draw();
  };

  const surface = setupSurface(canvas, () => draw());
  const l = loop((t) => {
    ms = t;
    step();
    draw();
  });
  canvas.addEventListener("pointerdown", onDown);
  canvas.setAttribute("aria-label", "Six focus mitts numbered 1 to 6. Watch the sequence, then tap the mitts in the same order.");
  return {
    start: () => {
      newSeq(false);
      l.start();
      begin("Watch");
    },
    pause: () => l.pause(),
    resume: () => l.resume(),
    dispose: () => {
      l.stop();
      canvas.removeEventListener("pointerdown", onDown);
      surface.dispose();
    },
    summary: () => ({ label: "Longest combo", value: best }),
  };
};
