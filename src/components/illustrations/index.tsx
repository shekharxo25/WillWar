/** Hand-coded 2px line drawings of gym objects. currentColor; set color on the parent (--text-2). */
type P = { size?: number; className?: string };
const svg = (size: number, className: string | undefined, children: React.ReactNode, vb = "0 0 96 96") => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
);

export function GlovesOnHook({ size = 96, className }: P) {
  return svg(size, className, <>
    <path d="M48 6v8M42 14h12M48 14c0 4-3 6-3 9" />
    <path d="M45 23c-6 2-10 2-14 6" /><path d="M45 23c6 2 10 2 14 6" />
    <path d="M26 34c-6 0-10 5-10 12v14c0 9 6 16 15 16h3c6 0 10-4 10-10V44c0-6-5-10-11-10z" />
    <path d="M18 50c4-2 8-1 10 2" /><path d="M24 76v10h14V76" />
    <path d="M70 34c6 0 10 5 10 12v14c0 9-6 16-15 16h-3c-6 0-10-4-10-10V44c0-6 5-10 11-10z" />
    <path d="M78 50c-4-2-8-1-10 2" /><path d="M72 76v10H58V76" />
  </>);
}

export function HeavyBag({ size = 96, className, swing = 0 }: P & { swing?: number }) {
  return svg(size, className, <g style={{ transformOrigin: "48px 4px", transform: `rotate(${swing}deg)` }}>
    <path d="M48 2v6" /><path d="M48 8l-8 12M48 8l8 12M48 8v12" />
    <rect x="34" y="20" width="28" height="64" rx="10" />
    <path d="M34 32h28M34 72h28" />
  </g>, "0 0 96 96");
}

export function Bell({ size = 96, className }: P) {
  return svg(size, className, <>
    <path d="M20 22h56" /><path d="M48 22v10" />
    <path d="M24 62a24 24 0 0 1 48 0z" /><path d="M20 62h56" />
    <circle cx="48" cy="68" r="3" /><path d="M30 78h36" /><path d="M48 70v8" />
  </>);
}

export function Wraps({ size = 96, className }: P) {
  return svg(size, className, <>
    <circle cx="36" cy="54" r="18" /><circle cx="36" cy="54" r="7" />
    <path d="M36 36h34c6 0 10 4 10 10v0" /><path d="M54 54h20c4 0 6 3 6 7v15H58" />
  </>);
}

export function TapedCorner({ size = 96, className }: P) {
  return svg(size, className, <>
    <path d="M10 30h76v58H10z" /><path d="M4 22l22 14M92 22L70 36" strokeWidth={6} strokeOpacity={0.5} />
  </>);
}

export function BoxingGlove({ size = 24, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M8.5 3C5.5 3 4 5.4 4 8v4.2c0 2.3 1.2 4.3 3 5.3V20a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1v-2.2c2-1.1 3.5-3.3 3.5-6V9.5C20 7 18.3 5 16 5h-1.2C14 3.8 12.6 3 11 3zm-1.8 7.3c1.4-.5 3-.3 4.1.7l-1 1.1c-.7-.6-1.7-.7-2.6-.4z" />
    </svg>
  );
}

export function FocusMitt({ size = 24, className }: P) {
  return svg(size, className, <><ellipse cx="12" cy="11" rx="8" ry="9" /><circle cx="12" cy="10" r="3.5" /><path d="M8 20h8" /></>, "0 0 24 24");
}

export function KitbagIcon({ size = 24, className }: P) {
  return svg(size, className, <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a4 4 0 0 1 8 0v2M3 13h18M9 8v12M15 8v12" /></>, "0 0 24 24");
}
