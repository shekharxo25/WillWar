// Fixed vocabularies shared by UI, device store, database checks and the AI context.
// Changing a key here means changing the matching CHECK constraint in supabase/migrations.

export const RESET_TAGS = ["late_night", "bored", "stressed", "alone", "scrolling", "drinking", "other"] as const;
export type ResetTag = (typeof RESET_TAGS)[number];

export const RESET_TAG_LABELS: Record<ResetTag, string> = {
  late_night: "Late night",
  bored: "Bored",
  stressed: "Stressed",
  alone: "Alone",
  scrolling: "Scrolling",
  drinking: "Drinking",
  other: "Something else",
};

export const WHY_TAGS = [
  "focus",
  "discipline",
  "sleep",
  "less_scrolling",
  "faith",
  "prove_it",
  "friends",
  "other",
] as const;
export type WhyTag = (typeof WHY_TAGS)[number];

export const WHY_TAG_LABELS: Record<WhyTag, string> = {
  focus: "Focus",
  discipline: "Discipline",
  sleep: "Better sleep",
  less_scrolling: "Less scrolling",
  faith: "Faith or values",
  prove_it: "Prove it to myself",
  friends: "My friends challenged me",
  other: "Something else",
};

/** The pledge's closing clause: "I'm doing it {phrase}." */
export const WHY_TAG_PLEDGE: Record<WhyTag, string> = {
  focus: "for focus",
  discipline: "for discipline",
  sleep: "for better sleep",
  less_scrolling: "to scroll less",
  faith: "for my faith and values",
  prove_it: "to prove it to myself",
  friends: "because my friends challenged me",
  other: "for my own reasons",
};

export const MAX_WHY_TAGS = 3;

export const TONES = ["steady", "stoic", "coach", "playful"] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  steady: "Steady",
  stoic: "Stoic",
  coach: "Coach",
  playful: "Playful",
};

/** Sample lines from Brief A. Used in onboarding and on the landing page. */
export const TONE_SAMPLES: Record<Tone, string> = {
  steady: "Day 9. You've already handled nine evenings like this one. Handle tonight the same way.",
  stoic: "Day 9. The urge asks for your attention. Give it three minutes of breathing instead.",
  coach: "Day 9. Phone out of the bedroom tonight. That's the whole plan.",
  playful: "Day 9. Single digits for one more day. Make tomorrow a double.",
};

export const LEADERBOARD_VISIBILITY = ["private", "pacts", "global"] as const;
export type LeaderboardVisibility = (typeof LEADERBOARD_VISIBILITY)[number];

export const NUDGE_KEYS = ["proud_of_you", "ride_it_out", "day_one_counts", "almost_there", "with_you"] as const;
export type NudgeKey = (typeof NUDGE_KEYS)[number];

export const NUDGE_LABELS: Record<NudgeKey, string> = {
  proud_of_you: "Proud of you",
  ride_it_out: "Ride it out, you've got this",
  day_one_counts: "Day one counts",
  almost_there: "Almost there",
  with_you: "I'm with you",
};

export const GAMES = ["drift", "swell", "knots"] as const;
export type Game = (typeof GAMES)[number];
export const PRO_GAMES: readonly Game[] = ["knots"];

export const MILESTONES = [7, 14, 21, 30] as const;

export const SHIELD_WINDOW_DAYS = 3;
export const BACKDATE_HOURS = 48;
export const MAX_CUSTOM_GOAL_DAYS = 365;

export interface Season {
  id: string;
  name: string;
  startsOn: string; // YYYY-MM-DD, local to each user
  endsOn: string;
}

export const CURRENT_SEASON: Season = {
  id: "nnn-2026",
  name: "No Nut November 2026",
  startsOn: "2026-11-01",
  endsOn: "2026-11-30",
};

// War Chest (docs/guardrails/war-chest.md)
export const CURRENCIES = ["INR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CHEST_LIMITS: Record<Currency, { min: number; max: number; presets: number[]; symbol: string }> = {
  INR: { min: 4900, max: 500000, presets: [9900, 19900, 49900, 99900], symbol: "₹" },
  USD: { min: 200, max: 10000, presets: [200, 500, 1000, 2000], symbol: "$" },
};

export const FORFEIT_RULES = ["steady", "strict"] as const;
export type ForfeitRule = (typeof FORFEIT_RULES)[number];

export const STAKE_MIN_DAYS = 7;
export const STAKE_MAX_DAYS = 90;
export const OFFER_MIN_DAYS_LEFT = 7;
export const OFFER_HOURS = { from: 6, to: 22 } as const; // inclusive local hours
export const CRISIS_COOLDOWN_DAYS = 7;
export const COOLING_OFF_HOURS = 24;

/** Vetted causes (founder-maintained; mirrors supabase seed). */
export interface Cause {
  id: string;
  name: string;
  description: string;
  country: "IN" | "US" | "GB" | "GLOBAL";
  url: string;
}

export const CAUSES: Cause[] = [
  {
    id: "placeholder-in-mental-health",
    name: "[Cause name pending founder review]",
    description: "Mental health support in India. Replace with a vetted cause before launch.",
    country: "IN",
    url: "https://example.org/",
  },
  {
    id: "placeholder-global-water",
    name: "[Cause name pending founder review]",
    description: "Clean water and ocean cleanup. Replace with a vetted cause before launch.",
    country: "GLOBAL",
    url: "https://example.org/",
  },
];

export const WAR_CHEST_EVENT_KINDS = [
  "promise_made",
  "funded",
  "forfeit",
  "promise_forfeit",
  "cancelled",
  "refund_issued",
  "settled",
] as const;
export type WarChestEventKind = (typeof WAR_CHEST_EVENT_KINDS)[number];
