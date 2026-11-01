/** Empty-state line drawing: a training log, open. 2px strokes in currentColor. */
export function BookOpenIllustration({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M48 26c-8-6-20-8-34-6v52c14-2 26 0 34 6 8-6 20-8 34-6V20c-14-2-26 0-34 6z" />
      <path d="M48 26v52" />
      <path d="M22 34h16M22 42h16M22 50h12M58 34h4M64 34h4M70 34h4M58 34l18 6" />
    </svg>
  );
}
