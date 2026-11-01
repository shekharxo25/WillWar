"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../GameHost";
import {
  anyFit,
  canPlace,
  fullRows,
  type Hex,
  hexKey,
  hexToPixel,
  pixelToHex,
  placeCells,
  RAFT_RADIUS,
  raftCells,
  randomPiece,
  rng,
} from "../logic";

// A fresh seed per page load, chosen at module load rather than during render.
const SESSION_SEED = Math.floor(Math.random() * 2_147_483_647);
const SIZE = 22; // hex centre-to-corner in SVG units
const TRAY_SIZE = 11;

function hexPoints(cx: number, cy: number, size: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function centre(piece: Hex[], size: number) {
  const pts = piece.map((h) => hexToPixel(h, size));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/** Drift: place hex pieces onto the raft; full rows clear. Never ends in a loss. */
export function Drift({ paused }: GameProps) {
  const next = useMemo(() => rng(SESSION_SEED), []);
  const cells = useMemo(() => raftCells(RAFT_RADIUS), []);
  const [filled, setFilled] = useState<Set<string>>(() => new Set());
  const [tray, setTray] = useState<(Hex[] | null)[]>(() => [randomPiece(next), randomPiece(next), randomPiece(next)]);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; x: number; y: number } | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const extent = SIZE * Math.sqrt(3) * (RAFT_RADIUS + 0.6);
  const view = `${-extent} ${-extent} ${extent * 2} ${extent * 2}`;

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const anchorFor = (index: number, x: number, y: number): Hex | null => {
    const piece = tray[index];
    if (!piece) return null;
    const c = centre(piece, SIZE);
    // The piece floats above the finger so it stays visible; anchor its first cell.
    return pixelToHex(x - c.x, y - c.y - SIZE * 2.2, SIZE);
  };

  const place = (index: number, at: Hex) => {
    const piece = tray[index];
    if (!piece || paused || !canPlace(filled, piece, at)) return false;
    const nextFilled = new Set(filled);
    for (const c of placeCells(piece, at)) nextFilled.add(hexKey(c));
    const clear = fullRows(nextFilled);
    for (const c of clear) nextFilled.delete(hexKey(c));
    if (clear.length) {
      setRows((r) => r + Math.max(1, Math.round(clear.length / (RAFT_RADIUS * 2 + 1))));
      setFlash(new Set(clear.map(hexKey)));
      setTimeout(() => setFlash(new Set()), 450);
    }
    let nextTray = tray.map((p, i) => (i === index ? null : p));
    if (nextTray.every((p) => p === null)) nextTray = [randomPiece(next), randomPiece(next), randomPiece(next)];
    // Calm by design: if nothing fits, the tray refreshes instead of ending the game.
    const remaining = nextTray.filter((p): p is Hex[] => p !== null);
    if (!anyFit(nextFilled, remaining)) nextTray = [randomPiece(next), randomPiece(next), randomPiece(next)];
    if (!anyFit(nextFilled, nextTray.filter((p): p is Hex[] => p !== null))) nextFilled.clear();
    setFilled(nextFilled);
    setTray(nextTray);
    setSelected(null);
    return true;
  };

  // Follow the pointer anywhere on screen while dragging (touch captures to the tray button).
  const dragging = drag !== null;
  const dragIndex = drag?.index ?? -1;
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, ...toSvg(e.clientX, e.clientY) } : d));
    const up = (e: PointerEvent) => {
      const p = toSvg(e.clientX, e.clientY);
      const at = anchorFor(dragIndex, p.x, p.y);
      if (at) place(dragIndex, at);
      setDrag(null);
    };
    const cancel = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- board state is fixed for the length of one drag
  }, [dragging, dragIndex]);

  const preview = drag ? anchorFor(drag.index, drag.x, drag.y) : null;
  const previewPiece = drag ? tray[drag.index] : null;
  const previewOk = Boolean(preview && previewPiece && canPlace(filled, previewPiece, preview));
  const previewKeys = new Set(previewOk && preview && previewPiece ? placeCells(previewPiece, preview).map(hexKey) : []);

  return (
    <div className="flex h-full flex-col px-3 pb-3">
      <p className="mt-2 text-center text-subhead text-white/75" aria-live="polite">
        {rows === 0 ? "Fit the pieces onto the raft. Full rows clear." : `${rows} ${rows === 1 ? "row" : "rows"} cleared`}
      </p>
      <svg
        ref={svgRef}
        viewBox={view}
        className="mx-auto min-h-0 w-full max-w-[440px] flex-1 touch-none"
        role="grid"
        aria-label="Raft"
      >
        {cells.map((h) => {
          const { x, y } = hexToPixel(h, SIZE);
          const key = hexKey(h);
          const isFilled = filled.has(key);
          return (
            <polygon
              key={key}
              points={hexPoints(x, y, SIZE * 0.94)}
              onClick={() => {
                if (selected === null) return;
                const piece = tray[selected];
                if (piece) place(selected, { q: h.q - piece[0].q, r: h.r - piece[0].r });
              }}
              className={`transition-[fill] duration-200 ${
                flash.has(key)
                  ? "fill-white"
                  : isFilled
                    ? "fill-tide stroke-white/30"
                    : previewKeys.has(key)
                      ? "fill-white/45 stroke-white/50"
                      : "fill-white/[0.07] stroke-white/15"
              }`}
              strokeWidth={1}
            />
          );
        })}
        {drag && previewPiece && (
          <g opacity={0.9} pointerEvents="none">
            {previewPiece.map((c) => {
              const ctr = centre(previewPiece, SIZE);
              const p = hexToPixel(c, SIZE);
              return (
                <polygon
                  key={hexKey(c)}
                  points={hexPoints(drag.x - ctr.x + p.x, drag.y - ctr.y + p.y - SIZE * 2.2, SIZE * 0.94)}
                  className={previewOk ? "fill-tide stroke-white/60" : "fill-white/30 stroke-white/50"}
                />
              );
            })}
          </g>
        )}
      </svg>

      <div className="grid grid-cols-3 gap-2" aria-label="Pieces">
        {tray.map((piece, i) => {
          const c = piece ? centre(piece, TRAY_SIZE) : { x: 0, y: 0 };
          return (
            <button
              key={i}
              type="button"
              disabled={!piece}
              aria-pressed={selected === i}
              aria-label={piece ? `Piece of ${piece.length} cells` : "Empty"}
              onClick={() => setSelected(selected === i ? null : i)}
              onPointerDown={(e) => {
                if (!piece || paused) return;
                (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                setDrag({ index: i, ...toSvg(e.clientX, e.clientY) });
              }}
              className={`flex h-24 touch-none items-center justify-center rounded-card ${selected === i ? "bg-white/20 ring-2 ring-white/70" : "bg-white/[0.07]"}`}
            >
              {piece && (
                <svg viewBox="-50 -40 100 80" className="h-20 w-full" aria-hidden>
                  {piece.map((h) => {
                    const p = hexToPixel(h, TRAY_SIZE);
                    return <polygon key={hexKey(h)} points={hexPoints(p.x - c.x, p.y - c.y, TRAY_SIZE * 0.92)} className="fill-tide stroke-white/40" />;
                  })}
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
