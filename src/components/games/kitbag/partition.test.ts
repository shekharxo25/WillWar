import { describe, expect, it } from "vitest";
import { seeded } from "@/lib/time";
import { anyFits, fits, normalize, partition, rotate, type Cell } from "./partition";

function connected(cells: Cell[]): boolean {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const stack: Cell[] = [cells[0]];
  const reach = new Set([`${cells[0][0]},${cells[0][1]}`]);
  while (stack.length) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (set.has(k) && !reach.has(k)) {
        reach.add(k);
        stack.push([x + dx, y + dy]);
      }
    }
  }
  return reach.size === cells.length;
}

describe("kitbag partition", () => {
  it("always tiles the bag exactly with connected 2-5 cell pieces", () => {
    for (let seed = 0; seed < 300; seed++) {
      const w = 6;
      const h = 5;
      const pieces = partition(w, h, seeded(seed));
      const seen = new Set<string>();
      for (const p of pieces) {
        expect(p.cells.length).toBeGreaterThanOrEqual(2);
        expect(p.cells.length).toBeLessThanOrEqual(5);
        expect(connected(p.cells)).toBe(true);
        for (const [x, y] of p.cells) {
          expect(x >= 0 && x < w && y >= 0 && y < h).toBe(true);
          const k = `${x},${y}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
        }
      }
      expect(seen.size).toBe(w * h);
    }
  });
  it("rotates four times back to the start", () => {
    const L = normalize([[0, 0], [0, 1], [0, 2], [1, 2]]);
    expect(rotate(rotate(rotate(rotate(L))))).toEqual(L);
    expect(rotate(L)).not.toEqual(L);
  });
  it("placement checks bounds and occupancy", () => {
    const occ = new Array(30).fill(false);
    occ[0] = true;
    expect(fits([[0, 0], [1, 0]], 0, 0, occ, 6, 5)).toBe(false);
    expect(fits([[0, 0], [1, 0]], 1, 0, occ, 6, 5)).toBe(true);
    expect(fits([[0, 0], [1, 0]], 5, 0, occ, 6, 5)).toBe(false);
    expect(anyFits([[[0, 0], [1, 0]]], new Array(30).fill(true), 6, 5)).toBe(false);
  });
});
