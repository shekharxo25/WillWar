import { seeded } from "@/lib/time";

/**
 * The chalk tally: 30 slots in groups of five (four verticals, one diagonal strike),
 * 3px chalk strokes in --text at 85%, deterministic hand-drawn jitter per stroke.
 * Milestone brass plates after strokes 7, 14 and 21; the belt plate at 30.
 */
export function Tally({
  strokes,
  seed = "willwar",
  animateFrom,
  beltName,
  reducedMotion = false,
  className = "",
}: {
  strokes: number;
  seed?: string;
  /** Stroke index (1-based) to draw with the 260ms chalk animation; earlier ones render still. */
  animateFrom?: number;
  beltName?: string;
  reducedMotion?: boolean;
  className?: string;
}) {
  const rnd = seeded(seed);
  const groupW = 34;
  const gap = 10;
  const h = 30;
  const groups = 6;
  const width = groups * groupW + (groups - 1) * gap;
  const lines: { d: string; idx: number; len: number }[] = [];
  for (let g = 0; g < groups; g++) {
    const x0 = g * (groupW + gap);
    for (let k = 0; k < 4; k++) {
      const idx = g * 5 + k + 1;
      const x = x0 + 4 + k * 7 + (rnd() - 0.5) * 2;
      const tilt = (rnd() - 0.5) * 3;
      const y1 = 2 + rnd() * 2;
      const y2 = h - 2 - rnd() * 2;
      lines.push({ d: `M${x.toFixed(1)} ${y1.toFixed(1)} Q${(x + tilt).toFixed(1)} ${(h / 2).toFixed(1)} ${(x + tilt * 0.6).toFixed(1)} ${y2.toFixed(1)}`, idx, len: h });
    }
    const idx = g * 5 + 5;
    const sy = h - 6 + (rnd() - 0.5) * 3;
    const ey = 6 + (rnd() - 0.5) * 3;
    lines.push({ d: `M${(x0 - 1).toFixed(1)} ${sy.toFixed(1)} Q${(x0 + groupW / 2).toFixed(1)} ${(h / 2 + (rnd() - 0.5) * 4).toFixed(1)} ${(x0 + groupW - 2).toFixed(1)} ${ey.toFixed(1)}`, idx, len: 40 });
  }
  const plates = [7, 14, 21].filter((m) => strokes >= m);
  return (
    <div className={className}>
      <svg viewBox={`-2 0 ${width + 4} ${h}`} className="block h-[30px] w-full max-w-[264px]" role="img" aria-label={`${strokes} of 30 days kept`}>
        {lines.map((l) =>
          l.idx <= strokes ? (
            <path
              key={l.idx}
              d={l.d}
              fill="none"
              stroke="var(--text)"
              strokeOpacity={0.85}
              strokeWidth={3}
              strokeLinecap="round"
              style={
                !reducedMotion && animateFrom !== undefined && l.idx >= animateFrom
                  ? { strokeDasharray: l.len + 4, strokeDashoffset: l.len + 4, animation: "draw 260ms var(--ease-mech) forwards" }
                  : undefined
              }
            />
          ) : (
            <path key={l.idx} d={l.d} fill="none" stroke="var(--text)" strokeOpacity={0.07} strokeWidth={3} strokeLinecap="round" />
          ),
        )}
      </svg>
      {(plates.length > 0 || strokes >= 30) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {plates.map((m) => (
            <MilestonePlate key={m} n={m} stamp={!reducedMotion && animateFrom === m} />
          ))}
          {strokes >= 30 && <BeltPlate name={beltName ?? "30 days"} stamp={!reducedMotion && animateFrom === 30} />}
        </div>
      )}
    </div>
  );
}

export function MilestonePlate({ n, stamp = false }: { n: number; stamp?: boolean }) {
  return (
    <span
      className={`display inline-flex h-7 min-w-9 items-center justify-center rounded-plate bg-brass px-2 text-[20px] leading-none text-ink ${stamp ? "stamp" : ""}`}
      aria-label={`Day ${n} plate`}
    >
      {n}
    </span>
  );
}

export function BeltPlate({ name, stamp = false }: { name: string; stamp?: boolean }) {
  return (
    <span className={`inline-flex h-9 items-center gap-2 rounded-plate bg-brass px-3 text-ink ${stamp ? "stamp" : ""}`} aria-label={`30 day belt: ${name}`}>
      <span className="display text-[28px] leading-none">30</span>
      <span className="text-[13px] leading-[18px] font-semibold">{name}</span>
    </span>
  );
}
