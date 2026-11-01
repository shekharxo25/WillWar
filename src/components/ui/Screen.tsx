"use client";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

/**
 * Screen with a League Gothic 40/40 title that collapses to a system 17/600 inline
 * title in a smoked-glass nav bar on scroll.
 */
export function Screen({ title, back, trailing, children, bottomPad = true }: { title: string; back?: string; trailing?: React.ReactNode; children: React.ReactNode; bottomPad?: boolean }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className={bottomPad ? "pb-[calc(env(safe-area-inset-bottom)+168px)]" : ""}>
      <header className={`pt-safe sticky top-0 z-30 transition-colors duration-[180ms] ${collapsed ? "glass shadow-[0_0.5px_0_var(--hairline)]" : ""}`}>
        <div className="relative flex h-11 items-center justify-between px-2">
          <div className="min-w-[44px]">
            {back && (
              <Link href={back} className="press flex h-11 items-center px-2 text-text" aria-label="Back">
                <CaretLeft weight="bold" size={22} />
              </Link>
            )}
          </div>
          <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-[17px] leading-[22px] font-semibold transition-opacity duration-[180ms] ${collapsed ? "opacity-100" : "opacity-0"}`} aria-hidden={!collapsed}>
            {title.charAt(0) + title.slice(1).toLowerCase()}
          </span>
          <div className="flex min-w-[44px] justify-end">{trailing}</div>
        </div>
      </header>
      <div className="px-4 min-[414px]:px-5">
        <h1 className="display text-[40px] leading-[40px]">{title}</h1>
        <div ref={sentinel} className="h-px" />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
