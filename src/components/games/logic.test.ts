import { describe, expect, it } from "vitest";
import {
  anyFit,
  BREATH_CYCLE_MS,
  breathLevel,
  breathPhase,
  canPlace,
  crossingCount,
  fullRows,
  generatePlanar,
  hexKey,
  hexToPixel,
  knotsLevel,
  pixelToHex,
  raftCells,
  rng,
  rotate,
  SHAPES,
  segmentsCross,
} from "./logic";

describe("seeded rng", () => {
  it("is deterministic per seed", () => {
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(rng(1)()).not.toBe(rng(2)());
  });
});

describe("Swell breathing", () => {
  it("is 4 seconds in, 6 seconds out", () => {
    expect(breathPhase(0).phase).toBe("in");
    expect(breathPhase(3999).phase).toBe("in");
    expect(breathPhase(4000).phase).toBe("out");
    expect(breathPhase(9999).phase).toBe("out");
    expect(breathPhase(BREATH_CYCLE_MS).phase).toBe("in");
    expect(breathPhase(BREATH_CYCLE_MS * 3 + 10).cycles).toBe(3);
  });
  it("rises on the in-breath and falls on the out-breath", () => {
    expect(breathLevel(0)).toBeCloseTo(0, 5);
    expect(breathLevel(4000)).toBeCloseTo(1, 5);
    expect(breathLevel(10_000)).toBeCloseTo(0, 5);
    expect(breathLevel(2000)).toBeGreaterThan(breathLevel(1000));
  });
});

describe("Drift raft", () => {
  it("has 37 cells at radius 3", () => {
    expect(raftCells(3)).toHaveLength(37);
  });
  it("rotates six times back to the start", () => {
    for (const s of SHAPES) expect(rotate(s, 6)).toEqual(s);
  });
  it("only places pieces on empty raft cells", () => {
    const filled = new Set<string>([hexKey({ q: 0, r: 0 })]);
    const line = SHAPES[0];
    expect(canPlace(filled, line, { q: 0, r: 0 })).toBe(false);
    expect(canPlace(filled, line, { q: -3, r: 1 })).toBe(true);
    expect(canPlace(filled, line, { q: 2, r: 0 })).toBe(false); // off the raft
  });
  it("clears full rows along every axis", () => {
    const row = raftCells(3).filter((h) => h.r === 0);
    const filled = new Set(row.map(hexKey));
    const cleared = fullRows(filled);
    expect(cleared).toHaveLength(7);
    expect(fullRows(new Set([...filled].slice(1)))).toHaveLength(0);
  });
  it("knows when nothing fits", () => {
    const full = new Set(raftCells(3).map(hexKey));
    expect(anyFit(full, [SHAPES[0]])).toBe(false);
    expect(anyFit(new Set(), [SHAPES[8]])).toBe(true);
  });
  it("round-trips hex and pixel coordinates", () => {
    for (const h of raftCells(3)) {
      const p = hexToPixel(h, 20);
      expect(pixelToHex(p.x + 3, p.y - 2, 20)).toEqual(h);
    }
  });
});

describe("Knots planarity", () => {
  it("detects proper crossings but not shared endpoints", () => {
    const p = (x: number, y: number) => ({ x, y });
    expect(segmentsCross(p(0, 0), p(1, 1), p(0, 1), p(1, 0))).toBe(true);
    expect(segmentsCross(p(0, 0), p(1, 1), p(1, 1), p(2, 0))).toBe(false);
    expect(segmentsCross(p(0, 0), p(1, 0), p(0, 1), p(1, 1))).toBe(false);
  });
  it("generates solvable levels: the source layout has zero crossings", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const g = generatePlanar(5, seed);
      expect(g.nodes).toHaveLength(10);
      expect(crossingCount(g)).toBe(0);
    }
  });
  it("scrambles levels into a tangle within 6–14 nodes", () => {
    for (let level = 0; level < 4; level++) {
      const g = knotsLevel(level, 1234);
      expect(g.nodes.length).toBeGreaterThanOrEqual(6);
      expect(g.nodes.length).toBeLessThanOrEqual(14);
      expect(crossingCount(g)).toBeGreaterThan(0);
    }
  });
});
