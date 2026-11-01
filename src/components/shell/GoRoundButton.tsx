"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BoxingGlove } from "@/components/illustrations";

/**
 * The one persistent action: LED fill, ink label "GO A ROUND", 12pt above the tab bar.
 * Compresses to a 56x56 glove square when scrolling. Never behind a paywall, ad or sheet.
 */
export function GoRoundButton() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) setCompact(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-[480px] justify-end px-4" style={{ bottom: "calc(env(safe-area-inset-bottom) + 8px + 62px + 12px)" }}>
      <Link
        href="/app/round"
        aria-label="Go a round"
        className="press no-select pointer-events-auto flex h-14 items-center justify-center gap-2 rounded-button bg-led text-ink transition-[width] duration-[180ms] ease-[var(--ease-mech)]"
        style={{ width: compact ? 56 : "100%", viewTransitionName: "round-housing" }}
      >
        <BoxingGlove size={26} />
        {!compact && <span className="display text-[22px] leading-none">GO A ROUND</span>}
      </Link>
    </div>
  );
}
