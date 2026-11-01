/**
 * Ad placement allowlist (Part 7.5). Ads appear only on these placements and routes,
 * non-personalized, never for Pro, never between a person and Go a round.
 * Everything else is forbidden: landing, onboarding, Today, the round flow before and during
 * a game, reset, Camp, Me stats, Settings, the paywall, War Chest, support and legal.
 */
export type Placement = "learn_feed" | "learn_article_end" | "post_round" | "rewarded_shield";

export const AD_ALLOWLIST: Record<Placement, { routes: RegExp[]; format: string; cap: string }> = {
  rewarded_shield: { routes: [/^\/app\/round\/done\/?$/, /^\/app\/me\/?$/], format: "Rewarded, opt-in", cap: "3 views a day; 2 shields a week" },
  post_round: { routes: [/^\/app\/round\/done\/?$/], format: "Interstitial at a natural break", cap: "1 per session" },
  learn_feed: { routes: [/^\/learn\/?$/, /^\/app\/learn\/?$/], format: "In-feed card labelled Sponsored, every 6th item", cap: "none" },
  learn_article_end: { routes: [/^\/learn\/[^/]+\/?$/, /^\/app\/learn\/[^/]+\/?$/], format: "In-article unit or house ad", cap: "1 per article" },
};

export const REWARDED_VIEWS_PER_DAY = 3;
export const LEARN_FEED_EVERY = 6;

/** Categories blocked in every ad network console and in house/direct sponsor deals. */
export const BLOCKED_CATEGORIES = [
  "dating",
  "sexual and reproductive health",
  "adult",
  "gambling",
  "alcohol",
  "testosterone boosters and male enhancement",
  "supplements with body claims",
  "get-rich-quick and crypto trading",
  "weight-loss drugs",
] as const;

export function placementAllowed(placement: Placement, pathname: string): boolean {
  return AD_ALLOWLIST[placement].routes.some((r) => r.test(pathname));
}

/** Google script domains, added to the CSP only on allowlisted routes. */
export const AD_SCRIPT_DOMAINS = ["https://pagead2.googlesyndication.com", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"];
