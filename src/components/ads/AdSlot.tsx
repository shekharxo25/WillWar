"use client";
/**
 * Ad placement contract (Part 6.9, 7.5). Allowlisted placements only; Pro renders nothing.
 * STUB: the monetization workstream replaces the body with house ads and providers.
 */
export type Placement = "learn_feed" | "learn_article_end" | "post_round" | "rewarded_shield";

export function AdSlot(props: { placement: Placement; pro?: boolean; onReward?: () => void; onClose?: () => void }) {
  if (props.pro) return null;
  return null;
}
