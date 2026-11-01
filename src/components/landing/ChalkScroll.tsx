"use client";
import { useEffect, useRef, useState } from "react";
import { Housing } from "@/components/clock/Housing";
import { Lamps } from "@/components/clock/Lamps";
import { LedReadout } from "@/components/clock/LedReadout";
import { Tally } from "@/components/clock/Tally";

const CAPTIONS: { day: number; text: string }[] = [
  { day: 1, text: "The easy one. Pick your reason and tell one friend." },
  { day: 3, text: "Boredom shows up swinging. Have a three-minute plan." },
  { day: 7, text: "First plate on the wall. Your camp sees it." },
  { day: 14, text: "Halfway. Your log shows what sets you off." },
  { day: 21, text: "Now the routine does the work." },
  { day: 30, text: "December 1st. The record stays, even if you go again." },
];

function PhoneFrame({ day, animate, reduced, large = false }: { day: number; animate: boolean; reduced: boolean; large?: boolean }) {
  return (
    <div className={`w-full rounded-[28px] bg-bg shadow-[0_0_0_8px_var(--housing)] ${large ? "max-w-[380px] p-6" : "max-w-[300px] p-4"}`}>
      <p className="display text-[40px] leading-[40px]">DAY {Math.max(day, 0)}</p>
      <p className="mt-1 text-[13px] leading-[18px] text-text-2">of 30, ends Mon 30 Nov</p>
      <Housing className="mt-3 flex items-center gap-3 px-3 pb-3 pt-5">
        <Lamps go={day > 0} warn={day === 0} size={8} />
        <LedReadout groups={[day, 0, 0, 0]} labels={["d", "h", "m", "s"]} size={large ? 28 : 22} ariaLabel={`Day ${day}`} />
      </Housing>
      <Tally
        key={animate ? day : "still"}
        className="mt-4"
        strokes={day}
        seed="landing"
        animateFrom={animate ? day : undefined}
        reducedMotion={reduced}
        beltName="No Nut November 2026"
      />
    </div>
  );
}

/**
 * Thirty days, chalked: the landing page's one orchestrated motion moment.
 * Static (no JS, mobile, reduced motion): six captioned still frames.
 * Enhanced (desktop with motion): a sticky phone; scrolling draws strokes from Day 0 to 30.
 */
export function ChalkScroll() {
  const [enhanced, setEnhanced] = useState(false);
  const [day, setDay] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnhanced(wide.matches && !reduced.matches);
    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enhanced) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = track.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        setDay(Math.round(p * 30));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [enhanced]);

  const caption = [...CAPTIONS].reverse().find((c) => day >= c.day);

  return (
    <section className="l-section" aria-labelledby="chalk-h">
      <div className="l-wrap">
        <h2 id="chalk-h" className="l-h2 l-col">Thirty days, chalked on the wall.</h2>
      </div>

      <div ref={track} className="chalk-sticky relative h-[320vh]" data-enhanced={enhanced}>
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="l-wrap grid grid-cols-2 items-center gap-10">
            <div className="flex justify-center">
              <PhoneFrame day={day} animate reduced={false} large />
            </div>
            <div aria-live="polite" className="l-col">
              <p className="display text-[64px] leading-[56px]">DAY {caption?.day ?? 0}</p>
              <p className="l-lead mt-4 text-text-2">{caption?.text ?? "Day 0. The clock starts when you do."}</p>
            </div>
          </div>
        </div>
      </div>

      <ol className="chalk-static l-wrap mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3" data-enhanced={enhanced}>
        {CAPTIONS.map((c) => (
          <li key={c.day}>
            <PhoneFrame day={c.day} animate={false} reduced />
            <p className="l-body mt-4 max-w-[300px] text-text-2">{c.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
