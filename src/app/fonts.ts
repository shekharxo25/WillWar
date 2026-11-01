import localFont from "next/font/local";

/** League Gothic (OFL, The League of Moveable Type), Latin subset. Display only. */
export const leagueGothic = localFont({
  src: "./fonts/LeagueGothic-Latin.woff2",
  variable: "--font-league",
  display: "swap",
  weight: "400",
  fallback: ["Impact", "Arial Narrow", "sans-serif"],
});

/** DSEG7 Classic (OFL, keshikan). LED digits in the Clock and round timer only. */
export const dseg = localFont({
  src: "./fonts/DSEG7Classic-Bold.woff2",
  variable: "--font-dseg",
  display: "block",
  weight: "700",
  preload: true,
});
