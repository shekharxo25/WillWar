/**
 * Kitbag bag generation: partition a W×H grid into polyominoes of 2-5 cells.
 * The tray is built from this partition, so every bag is solvable.
 */
export type Cell = [x: number, y: number];
export type GearKind = "bottle" | "wraps" | "glove" | "towel";
export type Piece = { id: number; cells: Cell[]; kind: GearKind };

const KIND_BY_SIZE: Record<number, GearKind> = { 2: "bottle", 3: "wraps", 4: "glove", 5: "towel" };

export function partition(w: number, h: number, rnd: () => number, minSize = 2, maxSize = 5): Piece[] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const res = tryPartition(w, h, rnd, minSize, maxSize);
    if (res) return res;
  }
  // Deterministic fallback: horizontal dominoes (valid when w is even, as for our bags).
  const pieces: Piece[] = [];
  let id = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x + 1 < w; x += 2) pieces.push({ id: id++, cells: [[x, y], [x + 1, y]], kind: "bottle" });
  return pieces;
}

function tryPartition(w: number, h: number, rnd: () => number, minSize: number, maxSize: number): Piece[] | null {
  const owner: number[] = new Array(w * h).fill(-1);
  const groups: number[][] = [];
  const nb = (i: number) => {
    const x = i % w;
    const y = Math.floor(i / w);
    const out: number[] = [];
    if (x > 0) out.push(i - 1);
    if (x < w - 1) out.push(i + 1);
    if (y > 0) out.push(i - w);
    if (y < h - 1) out.push(i + w);
    return out;
  };
  for (let i = 0; i < w * h; i++) {
    if (owner[i] !== -1) continue;
    const gid = groups.length;
    const target = minSize + Math.floor(rnd() * (maxSize - minSize + 1));
    const g = [i];
    owner[i] = gid;
    while (g.length < target) {
      const frontier = [...new Set(g.flatMap(nb))].filter((j) => owner[j] === -1);
      if (!frontier.length) break;
      const pick = frontier[Math.floor(rnd() * frontier.length)];
      owner[pick] = gid;
      g.push(pick);
    }
    groups.push(g);
  }
  // Merge undersized groups into a neighbour that has room.
  for (let gid = 0; gid < groups.length; gid++) {
    const g = groups[gid];
    if (g.length === 0 || g.length >= minSize) continue;
    const neighbours = [...new Set(g.flatMap(nb).map((j) => owner[j]))].filter(
      (o) => o !== gid && groups[o].length + g.length <= maxSize,
    );
    if (!neighbours.length) return null;
    const into = neighbours[Math.floor(rnd() * neighbours.length)];
    for (const c of g) owner[c] = into;
    groups[into].push(...g);
    groups[gid] = [];
  }
  const pieces = groups
    .filter((g) => g.length)
    .map((g, id) => ({
      id,
      cells: g.map((i) => [i % w, Math.floor(i / w)] as Cell),
      kind: KIND_BY_SIZE[g.length] ?? "towel",
    }));
  return pieces.every((p) => p.cells.length >= minSize && p.cells.length <= maxSize) ? pieces : null;
}

/** Shift cells so the bounding box starts at 0,0. */
export function normalize(cells: Cell[]): Cell[] {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** Rotate 90° clockwise, normalized. */
export function rotate(cells: Cell[]): Cell[] {
  const h = Math.max(...cells.map((c) => c[1]));
  return normalize(cells.map(([x, y]) => [h - y, x] as Cell));
}

export function bbox(cells: Cell[]): { w: number; h: number } {
  return { w: Math.max(...cells.map((c) => c[0])) + 1, h: Math.max(...cells.map((c) => c[1])) + 1 };
}

/** Can `cells` (normalized) be placed with its origin at (ox, oy) given occupied flags? */
export function fits(cells: Cell[], ox: number, oy: number, occupied: boolean[], w: number, h: number): boolean {
  return cells.every(([x, y]) => {
    const gx = x + ox;
    const gy = y + oy;
    return gx >= 0 && gy >= 0 && gx < w && gy < h && !occupied[gy * w + gx];
  });
}

/** True when some rotation of some piece fits somewhere. */
export function anyFits(pieces: Cell[][], occupied: boolean[], w: number, h: number): boolean {
  for (const p of pieces) {
    let r = p;
    for (let k = 0; k < 4; k++) {
      for (let oy = 0; oy < h; oy++) for (let ox = 0; ox < w; ox++) if (fits(r, ox, oy, occupied, w, h)) return true;
      r = rotate(r);
    }
  }
  return false;
}
