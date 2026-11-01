/** A strip of athletic tape holding the poster to the wall. */
export function TapeStrip({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`absolute z-10 h-7 w-24 bg-[var(--tape)] opacity-90 ${className}`} />;
}
