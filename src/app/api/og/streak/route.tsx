import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Share card (Part 2.9): "DAY 17", "of 30", the tally and a strip of the LED housing.
 * Discreet by default: handle and challenge name appear only when passed explicitly.
 * Colors here are literal because Satori can't read CSS variables; they mirror tokens.css.
 */
const C = { bg: "#262422", text: "#ECEAE4", text2: "rgba(236,234,228,0.64)", housing: "#0E0E0E", led: "#FF3B1F", ghost: "rgba(255,59,31,0.10)", go: "#39D353", brass: "#C9A24B", ink: "#141414" };

let fonts: Promise<[Buffer, Buffer]> | null = null;
function loadFonts() {
  const dir = join(process.cwd(), "src/app/api/og/streak/fonts");
  fonts ??= Promise.all([readFile(join(dir, "LeagueGothic.woff")), readFile(join(dir, "DSEG7.woff"))]);
  return fonts;
}

const clampInt = (v: string | null, lo: number, hi: number, d: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const clean = (v: string | null, re: RegExp, max: number) => (v && re.test(v) ? v.slice(0, max) : null);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const square = q.get("format") === "square";
  const of = clampInt(q.get("of"), 1, 365, 30);
  const day = clampInt(q.get("day"), 0, of, 1);
  const strokes = clampInt(q.get("strokes"), 0, 30, Math.min(day, 30));
  const handle = clean(q.get("handle"), /^[a-z0-9_]{3,20}$/, 20);
  const name = clean(q.get("name"), /^[A-Za-z0-9 \-]{2,40}$/, 40);
  const [league, dseg] = await loadFonts();

  const W = 1080;
  const H = square ? 1080 : 1920;
  const groups = Array.from({ length: 6 }, (_, g) => g);

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, color: C.text }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 32 }}>
          <span style={{ fontFamily: "League Gothic", fontSize: square ? 300 : 360, lineHeight: 0.86 }}>{`DAY ${day}`}</span>
          <span style={{ fontSize: 48, color: C.text2, paddingBottom: 24 }}>{`of ${of}`}</span>
        </div>

        <div style={{ display: "flex", gap: 36, marginTop: 72 }}>
          {groups.map((g) => (
            <div key={g} style={{ display: "flex", position: "relative", width: 120, height: 100 }}>
              {[0, 1, 2, 3].map((k) => {
                const idx = g * 5 + k + 1;
                return <div key={k} style={{ position: "absolute", left: 12 + k * 26, top: 6, width: 10, height: 88, borderRadius: 5, background: C.text, opacity: idx <= strokes ? 0.85 : 0.07 }} />;
              })}
              <div style={{ position: "absolute", left: -6, top: 45, width: 136, height: 10, borderRadius: 5, background: C.text, opacity: g * 5 + 5 <= strokes ? 0.85 : 0.07, transform: "rotate(-28deg)" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {[7, 14, 21].filter((m) => strokes >= m).map((m) => (
            <div key={m} style={{ display: "flex", background: C.brass, color: C.ink, borderRadius: 4, padding: "6px 22px", fontFamily: "League Gothic", fontSize: 56 }}>{String(m)}</div>
          ))}
          {strokes >= 30 && <div style={{ display: "flex", background: C.brass, color: C.ink, borderRadius: 4, padding: "6px 28px", fontFamily: "League Gothic", fontSize: 56 }}>30</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 88, background: C.housing, borderRadius: 12, padding: "44px 48px" }}>
          <div style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: C.go }} />
          <div style={{ display: "flex", position: "relative", fontFamily: "DSEG7", fontSize: 120 }}>
            <span style={{ color: C.ghost }}>{"888"}</span>
            <span style={{ position: "absolute", left: 0, top: 0, color: C.led }}>{String(day).padStart(3, "0")}</span>
          </div>
        </div>

        {(handle || name) && (
          <div style={{ display: "flex", marginTop: 56, fontSize: 40, color: C.text2 }}>{[handle, name].filter(Boolean).join(", ")}</div>
        )}
        <div style={{ display: "flex", marginTop: square ? 56 : 120, fontFamily: "League Gothic", fontSize: 64, color: C.text2 }}>WILLWAR</div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "League Gothic", data: league, weight: 400, style: "normal" },
        { name: "DSEG7", data: dseg, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
