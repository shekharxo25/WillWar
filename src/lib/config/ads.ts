// Ads (docs/guardrails/ads-monetization.md). Allowed placements only; Pro sees none.
// This build serves house ads for WillWar's own features: no third-party scripts, no
// personal data. AdSense / H5 Games Ads plug in here once those reviews are approved.

export type Placement = "learn_feed" | "post_game" | "rewarded_shield";

export interface HouseAd {
  id: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}

export const HOUSE_ADS: HouseAd[] = [
  { id: "invite-ally", title: "Invite your ally.", body: "Pacts are small groups of friends who see each other's streaks. Free for up to five.", cta: "Start a pact", href: "/app/pact" },
  { id: "try-swell", title: "Three minutes of breathing.", body: "Swell paces you at four seconds in and six out. It's free and works offline.", cta: "Try Swell", href: "/app/urge" },
  { id: "install", title: "Keep WillWar on your Home Screen.", body: "Installed, it opens like an app and keeps working without a connection.", cta: "See how", href: "/support#install" },
];

/** Feed index after which a sponsored card appears (every sixth article). */
export const LEARN_FEED_EVERY = 6;

export function houseAdFor(slot: number): HouseAd {
  return HOUSE_ADS[slot % HOUSE_ADS.length];
}
