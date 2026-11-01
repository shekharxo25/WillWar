"use client";
/**
 * Pro paywall contract. STUB: the monetization workstream implements it.
 * Always shows an equally clear "Continue with Free". No fake timers, nothing pre-selected.
 */
export function Paywall(props: { source: "onboarding" | "feature"; onContinueFree: () => void; onPro?: () => void }) {
  return (
    <button type="button" onClick={props.onContinueFree}>
      Continue with Free
    </button>
  );
}
