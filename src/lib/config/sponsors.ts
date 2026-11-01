/**
 * House ads and direct sponsors. Every entry must stay clear of the blocked categories in
 * src/lib/config/ads.ts. House cards promote WillWar's own features only.
 */
export type Sponsor = { id: string; title: string; body: string; cta: string; href: string; house: boolean };

export const SPONSORS: Sponsor[] = [
  { id: "house-pro", title: "Get Pro: no ads, Combos and the coach", body: "Two streak shields a month and trigger insights too.", cta: "See Pro", href: "/app/pro", house: true },
  { id: "house-camp", title: "Invite your camp", body: "A few friends who check in beat a hundred who don't.", cta: "Start a camp", href: "/app/camp", house: true },
  { id: "house-round", title: "Three minutes, any time", body: "Go a round is free, always. Kitbag and Bag never sit behind a paywall.", cta: "Go a round", href: "/app/round", house: true },
];

/** Deterministic pick so the same slot shows the same card on a render. */
export function sponsorFor(slotKey: string): Sponsor {
  let h = 0;
  for (let i = 0; i < slotKey.length; i++) h = (h * 31 + slotKey.charCodeAt(i)) >>> 0;
  return SPONSORS[h % SPONSORS.length];
}
