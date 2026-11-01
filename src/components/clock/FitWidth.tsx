"use client";
import { useLayoutEffect, useRef, useState } from "react";

/** Scales its child down (never up) so it fits the available width. Used for LED readouts. */
export function FitWidth({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(1);
  const [h, setH] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const k = Math.min(1, o.clientWidth / i.scrollWidth);
      setS(k);
      setH(i.offsetHeight * k);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: h }}>
      <div ref={inner} className="inline-block origin-top-left" style={{ transform: `scale(${s})` }}>
        {children}
      </div>
    </div>
  );
}
