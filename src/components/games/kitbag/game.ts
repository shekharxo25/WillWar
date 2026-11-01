import { pointerXY, roundRect, setupSurface } from "../canvas";
import type { GameFactory, Palette } from "../types";
import { anyFits, bbox, fits, normalize, partition, rotate, type Cell, type GearKind } from "./partition";

export const BAG_W = 6;
export const BAG_H = 5;

type Item = { id: number; kind: GearKind; shape: Cell[]; at: { x: number; y: number } | null };
type Rect = { x: number; y: number; w: number; h: number };

/**
 * Kitbag: drag blocky gear (glove, wraps, bottle, towel) from the tray into the bag
 * until it's full; a new bag follows. Nothing falls. Tap gear to turn it; tap packed
 * gear to take it back out. Reduced motion: tap gear, then tap a bag cell (no drag).
 */
export const createKitbag: GameFactory = (canvas, { reducedMotion, palette: c, onCue }) => {
  let items: Item[] = [];
  let bags = 0;
  let selected: number | null = null;
  let paused = true;
  let celebrateUntil = 0;
  let celebrateTimer: ReturnType<typeof setTimeout> | null = null;
  let drag: { id: number; pid: number; sx: number; sy: number; x: number; y: number; moved: boolean } | null = null;
  let tapBag: { id: number; pid: number } | null = null;
  let raf = 0;

  const newBag = () => {
    items = partition(BAG_W, BAG_H, Math.random).map((p) => {
      let shape = normalize(p.cells);
      const turns = Math.floor(Math.random() * 4);
      for (let i = 0; i < turns; i++) shape = rotate(shape);
      return { id: p.id, kind: p.kind, shape, at: null };
    });
    selected = null;
  };

  const occupied = (except?: number) => {
    const occ = new Array(BAG_W * BAG_H).fill(false);
    for (const it of items) if (it.at && it.id !== except) for (const [x, y] of it.shape) occ[(y + it.at.y) * BAG_W + x + it.at.x] = true;
    return occ;
  };

  // ---------- layout ----------
  const layout = () => {
    const { width: W, height: H } = surface;
    const cs = Math.floor(Math.min((W - 40) / BAG_W, (H * 0.52) / BAG_H, 64));
    const bag: Rect = { x: Math.round((W - cs * BAG_W) / 2), y: Math.round(cs * 0.45) + 16, w: cs * BAG_W, h: cs * BAG_H };
    const trayTop = bag.y + bag.h + 28;
    const loose = items.filter((i) => !i.at);
    let tcs = Math.floor(cs * 0.6);
    let slots: Map<number, Rect> = new Map();
    for (let tries = 0; tries < 8; tries++) {
      slots = new Map();
      let x = 16;
      let y = trayTop;
      let rowH = 0;
      const pad = 10;
      for (const it of loose) {
        const b = bbox(it.shape);
        const w = b.w * tcs + pad * 2;
        const h = b.h * tcs + pad * 2;
        if (x + w > W - 16 && x > 16) {
          x = 16;
          y += rowH + 6;
          rowH = 0;
        }
        slots.set(it.id, { x, y, w, h });
        x += w + 6;
        rowH = Math.max(rowH, h);
      }
      if (y + rowH <= H - 30) break;
      tcs = Math.floor(tcs * 0.88);
    }
    // Centre each tray row.
    const rows = new Map<number, Rect[]>();
    for (const r of slots.values()) rows.set(r.y, [...(rows.get(r.y) ?? []), r]);
    for (const row of rows.values()) {
      const right = Math.max(...row.map((r) => r.x + r.w));
      const shift = Math.floor((W - 16 - right) / 2);
      for (const r of row) r.x += shift;
    }
    return { cs, bag, slots, tcs };
  };

  // ---------- drawing ----------
  const drawPiece = (ctx: CanvasRenderingContext2D, it: Item, ox: number, oy: number, size: number, pal: Palette, emphasis: boolean) => {
    const set = new Set(it.shape.map(([x, y]) => `${x},${y}`));
    ctx.fillStyle = pal.raised;
    for (const [x, y] of it.shape) ctx.fillRect(ox + x * size, oy + y * size, size, size);
    // Faint seams between cells, then the outer outline.
    ctx.strokeStyle = pal.hairline;
    ctx.lineWidth = 1;
    for (const [x, y] of it.shape) ctx.strokeRect(ox + x * size + 0.5, oy + y * size + 0.5, size - 1, size - 1);
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = emphasis ? 3 : 2;
    ctx.lineCap = "square";
    ctx.beginPath();
    for (const [x, y] of it.shape) {
      const px = ox + x * size;
      const py = oy + y * size;
      if (!set.has(`${x},${y - 1}`)) { ctx.moveTo(px, py); ctx.lineTo(px + size, py); }
      if (!set.has(`${x},${y + 1}`)) { ctx.moveTo(px, py + size); ctx.lineTo(px + size, py + size); }
      if (!set.has(`${x - 1},${y}`)) { ctx.moveTo(px, py); ctx.lineTo(px, py + size); }
      if (!set.has(`${x + 1},${y}`)) { ctx.moveTo(px + size, py); ctx.lineTo(px + size, py + size); }
    }
    ctx.stroke();
    // Gear glyph in the cell closest to the centroid.
    const mx = it.shape.reduce((a, s) => a + s[0], 0) / it.shape.length;
    const my = it.shape.reduce((a, s) => a + s[1], 0) / it.shape.length;
    const [gx, gy] = it.shape.reduce((best, s) => (Math.hypot(s[0] - mx, s[1] - my) < Math.hypot(best[0] - mx, best[1] - my) ? s : best));
    glyph(ctx, it.kind, ox + gx * size + size / 2, oy + gy * size + size / 2, size * 0.32, pal);
  };

  const draw = () => {
    raf = 0;
    const { ctx, width: W, height: H } = surface;
    const L = layout();
    ctx.clearRect(0, 0, W, H);
    if (W < 80 || H < 80) return; // not laid out yet
    // Bag: canvas holdall with two handles.
    const celebrating = performance.now() < celebrateUntil;
    ctx.lineWidth = 2;
    ctx.strokeStyle = celebrating ? c.brass : c.text2;
    ctx.beginPath();
    ctx.arc(L.bag.x + L.bag.w * 0.33, L.bag.y, L.cs * 0.45, Math.PI, 0);
    ctx.moveTo(L.bag.x + L.bag.w * 0.67 + L.cs * 0.45, L.bag.y);
    ctx.arc(L.bag.x + L.bag.w * 0.67, L.bag.y, L.cs * 0.45, 0, Math.PI, true);
    ctx.stroke();
    roundRect(ctx, L.bag.x - 6, L.bag.y - 6, L.bag.w + 12, L.bag.h + 12, 12);
    ctx.stroke();
    // Empty cells
    ctx.fillStyle = c.hairline;
    for (let y = 0; y < BAG_H; y++)
      for (let x = 0; x < BAG_W; x++) ctx.fillRect(L.bag.x + x * L.cs + L.cs / 2 - 1.5, L.bag.y + y * L.cs + L.cs / 2 - 1.5, 3, 3);
    // Packed gear
    for (const it of items) if (it.at && drag?.id !== it.id) drawPiece(ctx, it, L.bag.x + it.at.x * L.cs, L.bag.y + it.at.y * L.cs, L.cs, c, false);
    // Tray
    for (const it of items) {
      if (it.at || drag?.id === it.id) continue;
      const r = L.slots.get(it.id);
      if (!r) continue;
      if (selected === it.id) {
        ctx.fillStyle = c.hairline;
        roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();
      }
      drawPiece(ctx, it, r.x + 10, r.y + 10, L.tcs, c, selected === it.id);
    }
    // Dragged piece follows the finger, lifted one cell above it so the finger doesn't hide it.
    if (drag && drag.moved) {
      const it = items.find((i) => i.id === drag!.id)!;
      const b = bbox(it.shape);
      const left = drag.x - (b.w * L.cs) / 2;
      const top = drag.y - L.cs - (b.h * L.cs) / 2;
      const gx = Math.round((left - L.bag.x) / L.cs);
      const gy = Math.round((top - L.bag.y) / L.cs);
      if (fits(it.shape, gx, gy, occupied(it.id), BAG_W, BAG_H)) {
        ctx.strokeStyle = c.text2;
        ctx.setLineDash([4, 4]);
        for (const [x, y] of it.shape) ctx.strokeRect(L.bag.x + (gx + x) * L.cs + 2, L.bag.y + (gy + y) * L.cs + 2, L.cs - 4, L.cs - 4);
        ctx.setLineDash([]);
      }
      drawPiece(ctx, it, left, top, L.cs, c, true);
    }
    ctx.fillStyle = c.text2;
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textAlign = "right";
    ctx.fillText(`Bags packed: ${bags}`, W - 16, H - 8);
  };
  const redraw = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  // ---------- rules ----------
  const place = (id: number, gx: number, gy: number): boolean => {
    const it = items.find((i) => i.id === id);
    if (!it || !fits(it.shape, gx, gy, occupied(id), BAG_W, BAG_H)) return false;
    it.at = { x: gx, y: gy };
    selected = null;
    afterMove();
    return true;
  };
  const afterMove = () => {
    if (items.every((i) => i.at)) {
      bags++;
      onCue("Bag packed. Next bag.");
      const wait = reducedMotion ? 0 : 450;
      celebrateUntil = performance.now() + wait;
      if (celebrateTimer) clearTimeout(celebrateTimer);
      celebrateTimer = setTimeout(() => {
        newBag();
        redraw();
      }, wait);
      return;
    }
    const loose = items.filter((i) => !i.at).map((i) => i.shape);
    if (!anyFits(loose, occupied(), BAG_W, BAG_H)) onCue("No room left. Tap packed gear to take it out.");
  };
  const rotateItem = (id: number) => {
    const it = items.find((i) => i.id === id);
    if (it) it.shape = rotate(it.shape);
  };

  // ---------- input ----------
  const hitTray = (x: number, y: number) => {
    const L = layout();
    for (const it of items) {
      if (it.at) continue;
      const r = L.slots.get(it.id);
      if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return it.id;
    }
    return null;
  };
  const bagCell = (x: number, y: number) => {
    const L = layout();
    const gx = Math.floor((x - L.bag.x) / L.cs);
    const gy = Math.floor((y - L.bag.y) / L.cs);
    return gx >= 0 && gy >= 0 && gx < BAG_W && gy < BAG_H ? { gx, gy } : null;
  };
  const itemAtCell = (gx: number, gy: number) =>
    items.find((i) => i.at && i.shape.some(([x, y]) => x + i.at!.x === gx && y + i.at!.y === gy));

  const onDown = (e: PointerEvent) => {
    if (paused || drag) return;
    const { x, y } = pointerXY(canvas, e);
    const t = hitTray(x, y);
    if (t !== null) {
      drag = { id: t, pid: e.pointerId, sx: x, sy: y, x, y, moved: false };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    const cell = bagCell(x, y);
    if (!cell) return;
    const packed = itemAtCell(cell.gx, cell.gy);
    if (packed) {
      tapBag = { id: packed.id, pid: e.pointerId };
      return;
    }
    if (selected !== null) {
      const it = items.find((i) => i.id === selected)!;
      // Try the tapped cell as the top-left, then as the first cell of the shape.
      const [fx, fy] = it.shape[0];
      if (!place(selected, cell.gx, cell.gy)) place(selected, cell.gx - fx, cell.gy - fy);
      redraw();
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const { x, y } = pointerXY(canvas, e);
    drag.x = x;
    drag.y = y;
    if (!reducedMotion && !drag.moved && Math.hypot(x - drag.sx, y - drag.sy) > 8) drag.moved = true;
    if (drag.moved) redraw();
  };
  const onUp = (e: PointerEvent) => {
    if (tapBag && e.pointerId === tapBag.pid) {
      const it = items.find((i) => i.id === tapBag!.id);
      if (it) it.at = null;
      tapBag = null;
      redraw();
      return;
    }
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      const L = layout();
      const it = items.find((i) => i.id === d.id)!;
      const b = bbox(it.shape);
      const left = d.x - (b.w * L.cs) / 2;
      const top = d.y - L.cs - (b.h * L.cs) / 2;
      place(d.id, Math.round((left - L.bag.x) / L.cs), Math.round((top - L.bag.y) / L.cs));
    } else if (selected === d.id) {
      rotateItem(d.id);
    } else {
      selected = d.id;
    }
    redraw();
  };
  const onCancel = () => {
    drag = null;
    tapBag = null;
    redraw();
  };

  const surface = setupSurface(canvas, redraw);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.setAttribute(
    "aria-label",
    "Kitbag. Pack the gear from the tray into the bag until it's full. Tap a piece to select it, tap again to turn it, then tap a spot in the bag or drag it there.",
  );
  newBag();

  return {
    start: () => {
      paused = false;
      onCue(reducedMotion ? "Tap gear, then tap the bag. Tap again to turn it." : "Drag gear into the bag. Tap to turn it.");
      redraw();
    },
    pause: () => {
      paused = true;
      drag = null;
    },
    resume: () => {
      paused = false;
      redraw();
    },
    dispose: () => {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      if (celebrateTimer) clearTimeout(celebrateTimer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      surface.dispose();
    },
    summary: () => ({ label: "Bags packed", value: bags }),
  };
};

/** Simple line glyphs for each piece of gear. */
function glyph(ctx: CanvasRenderingContext2D, kind: GearKind, cx: number, cy: number, r: number, c: Palette) {
  ctx.save();
  ctx.strokeStyle = c.text2;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (kind === "bottle") {
    roundRect(ctx, cx - r * 0.45, cy - r * 0.55, r * 0.9, r * 1.5, r * 0.25);
    ctx.moveTo(cx - r * 0.2, cy - r * 0.55);
    ctx.lineTo(cx - r * 0.2, cy - r * 0.95);
    ctx.lineTo(cx + r * 0.2, cy - r * 0.95);
    ctx.lineTo(cx + r * 0.2, cy - r * 0.55);
  } else if (kind === "wraps") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.moveTo(cx + r * 0.4, cy);
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  } else if (kind === "glove") {
    roundRect(ctx, cx - r * 0.6, cy - r, r * 1.3, r * 1.5, r * 0.6);
    ctx.moveTo(cx - r * 0.6, cy - r * 0.1);
    ctx.quadraticCurveTo(cx - r * 1.05, cy - r * 0.1, cx - r * 0.85, cy + r * 0.35);
    ctx.moveTo(cx - r * 0.45, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.45, cy + r);
    ctx.lineTo(cx + r * 0.55, cy + r);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.5);
  } else {
    roundRect(ctx, cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.15);
    ctx.moveTo(cx - r, cy - r * 0.25);
    ctx.lineTo(cx + r, cy - r * 0.25);
    ctx.moveTo(cx - r, cy + r * 0.25);
    ctx.lineTo(cx + r, cy + r * 0.25);
  }
  ctx.stroke();
  ctx.restore();
}
