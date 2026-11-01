import { describe, expect, it } from "vitest";
import { AD_ALLOWLIST, placementAllowed, type Placement } from "./ads";
import { SPONSORS } from "./sponsors";

const ROUTES = [
  "/", "/app/start", "/app/today", "/app/round", "/app/round/kitbag", "/app/round/done", "/app/camp", "/app/camp/abc",
  "/app/learn", "/app/learn/some-article", "/learn", "/learn/some-article", "/app/me", "/app/settings", "/app/pro",
  "/app/war-chest", "/support", "/privacy", "/terms", "/health", "/day/7",
];
const EXPECTED: Record<Placement, string[]> = {
  rewarded_shield: ["/app/round/done", "/app/me"],
  post_round: ["/app/round/done"],
  learn_feed: ["/app/learn", "/learn"],
  learn_article_end: ["/app/learn/some-article", "/learn/some-article"],
};

describe("ad placement allowlist", () => {
  for (const p of Object.keys(AD_ALLOWLIST) as Placement[]) {
    it(`${p} appears only on its routes`, () => {
      expect(ROUTES.filter((r) => placementAllowed(p, r))).toEqual(EXPECTED[p]);
    });
  }
  it("nothing on landing, onboarding, Today, the round before or during a game, Camp, Settings, Pro, War Chest, support or legal", () => {
    const forbidden = ["/", "/app/start", "/app/today", "/app/round", "/app/round/kitbag", "/app/camp", "/app/settings", "/app/pro", "/app/war-chest", "/support", "/privacy", "/terms", "/health"];
    for (const r of forbidden) for (const p of Object.keys(AD_ALLOWLIST) as Placement[]) expect(placementAllowed(p, r)).toBe(false);
  });
  it("house ads never mention money stakes or the War Chest", () => {
    for (const s of SPONSORS) expect(`${s.title} ${s.body}`).not.toMatch(/war chest|stake|₹|\$/i);
  });
});
