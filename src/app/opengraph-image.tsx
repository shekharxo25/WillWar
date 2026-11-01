import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "WillWar presents YOU vs. THE URGE. 30 days.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literal colors: the OG image renders outside the page and can't read CSS tokens.
const WALL = "#262422";
const PAPER = "#ECEAE4";
const INK = "#141414";
const TAPE = "#D9D4C3";

export default async function Image() {
  const league = await readFile(join(process.cwd(), "src/app/fonts/LeagueGothic-Latin.woff2")).catch(() => null);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: WALL, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", display: "flex", width: 1000, height: 540 }}>
          <div style={{ position: "absolute", left: -18, top: -14, width: 130, height: 34, background: TAPE, transform: "rotate(-8deg)" }} />
          <div style={{ position: "absolute", right: -18, top: -14, width: 130, height: 34, background: TAPE, transform: "rotate(7deg)" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              background: PAPER,
              color: INK,
              padding: "44px 64px",
              borderRadius: 2,
            }}
          >
            <div style={{ fontSize: 28, fontFamily: "sans-serif" }}>WillWar presents</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 36, marginTop: 8 }}>
              <div style={{ fontFamily: "League Gothic", fontSize: 260, lineHeight: 0.86 }}>YOU</div>
              <div style={{ fontFamily: "League Gothic", fontSize: 64, lineHeight: 1, paddingBottom: 24 }}>vs.</div>
            </div>
            <div style={{ fontFamily: "League Gothic", fontSize: 180, lineHeight: 0.86 }}>THE URGE</div>
            <div style={{ fontSize: 34, marginTop: 26, fontFamily: "sans-serif" }}>30 days</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: league ? [{ name: "League Gothic", data: league, style: "normal", weight: 400 }] : [] },
  );
}
