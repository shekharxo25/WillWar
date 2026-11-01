/**
 * Avatar pebble generated from `avatar_seed`: a soft irregular shape in two tones of
 * the active water theme. No photo uploads anywhere in the product.
 */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

export function pebblePath(seed: string, size = 32): string {
  const r = rng(seed);
  const n = 7;
  const cx = size / 2;
  const cy = size / 2;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + r() * 0.3;
    const rad = size * (0.36 + r() * 0.1);
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * (0.86 + r() * 0.1)] as const;
  });
  // Closed Catmull-Rom → cubic Bézier for a smooth pebble outline.
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

export function Pebble({
  seed,
  size = 32,
  label,
  tones,
}: {
  seed: string;
  size?: number;
  label?: string;
  /** Two CSS colours; defaults to the active water theme. */
  tones?: [string, string];
}) {
  const tilt = (hash(seed) % 40) - 20;
  const id = `pb-${hash(seed + (tones?.join() ?? "")).toString(36)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1" gradientTransform={`rotate(${tilt} .5 .5)`}>
          <stop offset="0" stopColor={tones?.[0] ?? "var(--tide)"} />
          <stop offset="1" stopColor={tones?.[1] ?? "var(--tide-deep)"} />
        </linearGradient>
      </defs>
      <path d={pebblePath(seed)} fill={`url(#${id})`} />
    </svg>
  );
}
