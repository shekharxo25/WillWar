/** The one SVG filter in the product: a slightly bitten letterpress edge for poster headlines only. */
export function LetterpressFilter() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <filter id="letterpress" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="bitten" />
        <feComposite in="bitten" in2="SourceGraphic" operator="in" />
      </filter>
    </svg>
  );
}
