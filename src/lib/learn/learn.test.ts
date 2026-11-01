import { describe, expect, it } from "vitest";
import { ArticleMeta, isDraft, showDrafts } from "./schema";
import { DAY_TIPS, nextMilestone } from "./days";
import { bannedTerm } from "@/lib/ai/filters";

const valid = {
  title: "If-then plans: the simplest tool",
  slug: "if-then-plans",
  summary: "Deciding in advance what you will do in a risky moment.",
  evidence: "strong",
  readMinutes: 3,
  supports: "A meta-analysis of 94 studies found a medium-to-large effect.",
  doesnt: "Effects vary by goal and person, and plans must be specific.",
  reviewed_by: "",
  reviewed_on: "",
  sources: [{ label: "Gollwitzer and Sheeran, 2006, Adv Exp Soc Psychol.", url: "https://scholar.google.com/" }],
};

describe("article schema", () => {
  it("accepts a valid draft", () => {
    expect(ArticleMeta.safeParse(valid).success).toBe(true);
    expect(isDraft(valid)).toBe(true);
  });
  it("fails without sources or grade", () => {
    expect(ArticleMeta.safeParse({ ...valid, sources: [] }).success).toBe(false);
    const { evidence: _e, ...noGrade } = valid;
    void _e;
    expect(ArticleMeta.safeParse(noGrade).success).toBe(false);
    expect(ArticleMeta.safeParse({ ...valid, evidence: "great" }).success).toBe(false);
  });
  it("requires a review date when a reviewer is named", () => {
    expect(ArticleMeta.safeParse({ ...valid, reviewed_by: "Dr A" }).success).toBe(false);
    expect(ArticleMeta.safeParse({ ...valid, reviewed_by: "Dr A", reviewed_on: "2026-11-20" }).success).toBe(true);
  });
  it("drafts are hidden in production unless previews are on", () => {
    expect(showDrafts({ NODE_ENV: "production" })).toBe(false);
    expect(showDrafts({ NODE_ENV: "production", NEXT_PUBLIC_SHOW_DRAFTS: "1" })).toBe(true);
    expect(showDrafts({ NODE_ENV: "development" })).toBe(true);
    expect(showDrafts({ NODE_ENV: "development", NEXT_PUBLIC_SHOW_DRAFTS: "0" })).toBe(false);
  });
});

describe("day pages", () => {
  it("30 tips with no banned terms", () => {
    expect(DAY_TIPS).toHaveLength(30);
    for (const t of DAY_TIPS) expect(bannedTerm(t)).toBeNull();
  });
  it("next milestone", () => {
    expect(nextMilestone(1)).toBe(7);
    expect(nextMilestone(7)).toBe(14);
    expect(nextMilestone(29)).toBe(30);
    expect(nextMilestone(30)).toBeNull();
  });
});
