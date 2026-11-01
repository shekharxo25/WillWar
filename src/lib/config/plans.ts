export type PlanId = "season" | "annual";

export const PLANS: Record<PlanId, { id: PlanId; name: string; inr: number; usd: number; blurb: string }> = {
  season: { id: "season", name: "Season pass", inr: 149, usd: 3.99, blurb: "Until Mon 30 November" },
  annual: { id: "annual", name: "Annual", inr: 799, usd: 24.99, blurb: "Renews yearly. Cancel anytime in Settings." },
};

export const FREE_FEATURES = [
  "Streak clock",
  "Daily check-in",
  "Corner talk",
  "Kitbag and Bag",
  "One camp of up to five friends",
  "All articles",
  "Includes ads",
];

export const PRO_FEATURES = [
  "Combos",
  "The coach",
  "Unlimited camps up to 50",
  "Custom challenges",
  "Trigger insights",
  "Two streak shields a month",
  "Journal backup",
  "Clock skins",
  "No ads",
];

export const FREE_CAMP_MAX = 5;
export const PRO_CAMP_MAX = 50;
