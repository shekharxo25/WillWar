import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let path = "/app/learn";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

describe("AdSlot", async () => {
  const { AdSlot } = await import("./AdSlot");
  const html = (props: Parameters<typeof AdSlot>[0]) => renderToString(createElement(AdSlot, props));

  it("renders a Sponsored house card on an allowlisted route for free users", () => {
    path = "/app/learn";
    expect(html({ placement: "learn_feed" })).toContain("Sponsored");
  });
  it("renders nothing for Pro", () => {
    path = "/app/learn";
    expect(html({ placement: "learn_feed", pro: true })).toBe("");
    path = "/app/round/done";
    expect(html({ placement: "post_round", pro: true })).toBe("");
  });
  it("renders nothing off the allowlist", () => {
    for (const p of ["/app/today", "/app/round", "/", "/app/war-chest", "/app/pro"]) {
      path = p;
      expect(html({ placement: "learn_feed" })).toBe("");
      expect(html({ placement: "rewarded_shield" })).toBe("");
    }
  });
});
