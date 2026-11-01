"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameHost";
import { crossingCount, type Graph, knotsLevel, segmentsCross } from "../logic";

// A fresh seed per page load, chosen at module load rather than during render.
const SESSION_SEED = Math.floor(Math.random() * 100_000);

/** Knots (Pro): drag the points until no lines cross. Each level is solvable by construction. */
export function Knots({ paused }: GameProps) {
  const seed = SESSION_SEED;
  const [level, setLevel] = useState(0);
  const [graph, setGraph] = useState<Graph>(() => knotsLevel(0, seed));
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const crossings = crossingCount(graph);
  const solved = crossings === 0;

  // Once untangled, pause on the solved board for a moment, then load the next level.
  useEffect(() => {
    if (!solved) return;
    const t = setTimeout(() => {
      setLevel(level + 1);
      setGraph(knotsLevel(level + 1, seed));
    }, 1200);
    return () => clearTimeout(t);
  }, [solved, level, seed]);

  useEffect(() => {
    if (dragging === null) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current;
      const m = svg?.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      const x = Math.min(0.97, Math.max(0.03, p.x));
      const y = Math.min(0.97, Math.max(0.03, p.y));
      setGraph((g) => ({ ...g, nodes: g.nodes.map((n, i) => (i === dragging ? { x, y } : n)) }));
    };
    const up = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const crossed = new Set<number>();
  graph.edges.forEach(([a, b], i) =>
    graph.edges.forEach(([c, d], j) => {
      if (j <= i || a === c || a === d || b === c || b === d) return;
      if (segmentsCross(graph.nodes[a], graph.nodes[b], graph.nodes[c], graph.nodes[d])) {
        crossed.add(i);
        crossed.add(j);
      }
    }),
  );

  return (
    <div className="flex h-full flex-col px-3 pb-4">
      <p className="mt-2 text-center text-subhead text-white/75" aria-live="polite">
        {solved ? "Untangled." : `Level ${level + 1}. ${crossings} ${crossings === 1 ? "crossing" : "crossings"} left.`}
      </p>
      <svg ref={svgRef} viewBox="0 0 1 1" className="mx-auto aspect-square w-full max-w-[440px] touch-none" role="img" aria-label={`Knots puzzle, ${crossings} crossings left`}>
        {graph.edges.map(([a, b], i) => (
          <line
            key={i}
            x1={graph.nodes[a].x}
            y1={graph.nodes[a].y}
            x2={graph.nodes[b].x}
            y2={graph.nodes[b].y}
            strokeWidth={0.008}
            strokeLinecap="round"
            className={crossed.has(i) ? "stroke-white/45" : "stroke-tide"}
          />
        ))}
        {graph.nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={0.055}
              className="fill-transparent"
              onPointerDown={(e) => {
                if (paused) return;
                e.preventDefault();
                setDragging(i);
              }}
              style={{ cursor: "grab" }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={dragging === i ? 0.032 : 0.026}
              pointerEvents="none"
              className={solved ? "fill-brass" : "fill-white"}
            />
          </g>
        ))}
      </svg>
      <p className="mt-auto text-center text-footnote text-white/60">Drag the points so no lines cross.</p>
    </div>
  );
}
