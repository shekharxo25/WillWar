export type Season = { id: string; name: string; startsOn: string; endsOn: string };

/** Mirrors the seasons row seeded in supabase/migrations/0001_core.sql. */
export const SEASON: Season = {
  id: "nnn-2026",
  name: "No Nut November 2026",
  startsOn: "2026-11-01",
  endsOn: "2026-11-30",
};

/** Discreet label for places the challenge subject must not appear (titles, notifications). */
export const SEASON_DISCREET_NAME = "November 2026";

export const SEASON_MODE: "nnn" | "rolling" =
  process.env.NEXT_PUBLIC_SEASON_MODE === "rolling" ? "rolling" : "nnn";
