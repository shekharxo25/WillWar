// Pure game logic for Ride it out. No DOM; unit tested in logic.test.ts.

/** Seeded PRNG (mulberry32): same seed, same levels and pieces. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- Swell
export const BREATH_IN_MS = 4000;
export const BREATH_OUT_MS = 6000;
export const BREATH_CYCLE_MS = BREATH_IN_MS + BREATH_OUT_MS;

/** Phase of paced breathing at `elapsedMs`: progress 0→1 within the phase, and cycles completed. */
export function breathPhase(elapsedMs: number) {
  const t = Math.max(0, elapsedMs) % BREATH_CYCLE_MS;
  const cycles = Math.floor(Math.max(0, elapsedMs) / BREATH_CYCLE_MS);
  if (t < BREATH_IN_MS) return { phase: "in" as const, progress: t / BREATH_IN_MS, cycles, secondsLeft: Math.ceil((BREATH_IN_MS - t) / 1000) };
  return {
    phase: "out" as const,
    progress: (t - BREATH_IN_MS) / BREATH_OUT_MS,
    cycles,
    secondsLeft: Math.ceil((BREATH_CYCLE_MS - t) / 1000),
  };
}

/** Wave height 0..1 across a breath: rises on the in-breath, falls on the out-breath (eased). */
export function breathLevel(elapsedMs: number): number {
  const { phase, progress } = breathPhase(elapsedMs);
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  return phase === "in" ? ease(progress) : 1 - ease(progress);
}

// ---------------------------------------------------------------- Drift (hex raft)
export interface Hex {
  q: number;
  r: number;
}
export const hexKey = (h: Hex) => `${h.q},${h.r}`;

export const RAFT_RADIUS = 3;

/** All cells of a hexagonal raft of the given radius (axial coordinates). */
export function raftCells(radius = RAFT_RADIUS): Hex[] {
  const out: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push({ q, r });
  }
  return out;
}

/** Piece shapes (3–5 cells) as axial offsets. Organic hex clusters, not tetrominoes. */
export const SHAPES: Hex[][] = [
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: 1, r: -1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: -1 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: 1 }, { q: 2, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }, { q: 1, r: -1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 1, r: 1 }, { q: 1, r: -1 }],
];

/** Rotate a shape by 60° steps around its first cell. */
export function rotate(shape: Hex[], turns: number): Hex[] {
  let out = shape;
  for (let i = 0; i < ((turns % 6) + 6) % 6; i++) out = out.map(({ q, r }) => ({ q: -r, r: q + r }));
  return out;
}

export function randomPiece(next: () => number): Hex[] {
  const shape = SHAPES[Math.floor(next() * SHAPES.length)];
  return rotate(shape, Math.floor(next() * 6));
}

export function onRaft(h: Hex, radius = RAFT_RADIUS) {
  return Math.abs(h.q) <= radius && Math.abs(h.r) <= radius && Math.abs(-h.q - h.r) <= radius;
}

export function placeCells(piece: Hex[], at: Hex): Hex[] {
  return piece.map((c) => ({ q: c.q + at.q, r: c.r + at.r }));
}

export function canPlace(filled: Set<string>, piece: Hex[], at: Hex, radius = RAFT_RADIUS): boolean {
  return placeCells(piece, at).every((c) => onRaft(c, radius) && !filled.has(hexKey(c)));
}

/** All full rows (along the three hex axes) after placing; returns the cells to clear. */
export function fullRows(filled: Set<string>, radius = RAFT_RADIUS): Hex[] {
  const clear = new Map<string, Hex>();
  const cells = raftCells(radius);
  const axes: ((h: Hex) => number)[] = [(h) => h.q, (h) => h.r, (h) => -h.q - h.r];
  for (const axis of axes) {
    for (let v = -radius; v <= radius; v++) {
      const row = cells.filter((h) => axis(h) === v);
      if (row.every((h) => filled.has(hexKey(h)))) for (const h of row) clear.set(hexKey(h), h);
    }
  }
  return [...clear.values()];
}

export function anyFit(filled: Set<string>, pieces: Hex[][], radius = RAFT_RADIUS): boolean {
  const cells = raftCells(radius);
  return pieces.some((p) => cells.some((at) => canPlace(filled, p, at, radius)));
}

/** Pointy-top hex ↔ pixel (size = centre-to-corner). */
export function hexToPixel(h: Hex, size: number) {
  return { x: size * Math.sqrt(3) * (h.q + h.r / 2), y: size * 1.5 * h.r };
}

export function pixelToHex(x: number, y: number, size: number): Hex {
  const qf = ((Math.sqrt(3) / 3) * x - y / 3) / size;
  const rf = ((2 / 3) * y) / size;
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q: q === 0 ? 0 : q, r: r === 0 ? 0 : r };
}

// ---------------------------------------------------------------- Knots (planarity)
export interface Point {
  x: number;
  y: number;
}
export interface Graph {
  nodes: Point[];
  edges: [number, number][];
}

/** True when segments ab and cd cross at a point that isn't a shared endpoint. */
export function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const cross = (o: Point, p: Point, q: Point) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function crossingCount(g: Graph): number {
  let n = 0;
  for (let i = 0; i < g.edges.length; i++) {
    for (let j = i + 1; j < g.edges.length; j++) {
      const [a, b] = g.edges[i];
      const [c, d] = g.edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsCross(g.nodes[a], g.nodes[b], g.nodes[c], g.nodes[d])) n++;
    }
  }
  return n;
}

/**
 * Planar puzzle from `lines` random lines in general position (Tantalo's method):
 * vertices are the pairwise intersections, edges join consecutive intersections on
 * each line. The intersection layout itself has zero crossings, so every level is
 * solvable. Returns that solved layout; `scramble` then shuffles it.
 */
export function generatePlanar(lines: number, seed: number): Graph {
  const next = rng(seed);
  const ls = Array.from({ length: lines }, () => {
    const angle = next() * Math.PI;
    const offset = (next() - 0.5) * 0.6;
    return { a: Math.cos(angle), b: Math.sin(angle), c: offset }; // a·x + b·y = c
  });
  const nodes: Point[] = [];
  const onLine: { node: number; t: number }[][] = ls.map(() => []);
  for (let i = 0; i < lines; i++) {
    for (let j = i + 1; j < lines; j++) {
      const L1 = ls[i];
      const L2 = ls[j];
      const det = L1.a * L2.b - L2.a * L1.b;
      const x = (L1.c * L2.b - L2.c * L1.b) / det;
      const y = (L1.a * L2.c - L2.a * L1.c) / det;
      const id = nodes.push({ x, y }) - 1;
      onLine[i].push({ node: id, t: -L1.b * x + L1.a * y });
      onLine[j].push({ node: id, t: -L2.b * x + L2.a * y });
    }
  }
  const edges: [number, number][] = [];
  for (const pts of onLine) {
    pts.sort((p, q) => p.t - q.t);
    for (let k = 0; k + 1 < pts.length; k++) edges.push([pts[k].node, pts[k + 1].node]);
  }
  return { nodes: normalise(nodes), edges };
}

function normalise(nodes: Point[]): Point[] {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  return nodes.map((n) => ({ x: 0.1 + ((n.x - minX) / span) * 0.8, y: 0.1 + ((n.y - minY) / span) * 0.8 }));
}

/** Place nodes on a circle in a shuffled order; reshuffles until at least one crossing exists. */
export function scramble(g: Graph, seed: number): Graph {
  const next = rng(seed ^ 0x9e3779b9);
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = g.nodes.map((_, i) => i).sort(() => next() - 0.5);
    const nodes = g.nodes.map(() => ({ x: 0, y: 0 }));
    order.forEach((node, k) => {
      const a = (k / order.length) * Math.PI * 2 - Math.PI / 2;
      nodes[node] = { x: 0.5 + Math.cos(a) * 0.4, y: 0.5 + Math.sin(a) * 0.4 };
    });
    const out = { nodes, edges: g.edges };
    if (crossingCount(out) > 0) return out;
  }
  return { nodes: g.nodes, edges: g.edges };
}

/** Level n (0-based): 4 lines (6 nodes), then 5 lines (10 nodes). */
export function knotsLevel(level: number, seed: number): Graph {
  const lines = level === 0 ? 4 : 5;
  return scramble(generatePlanar(lines, seed + level * 7919), seed + level);
}
