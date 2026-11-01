"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Wordmark left, "Sign in" right. Smoked glass after scroll. On mobile, a bottom start bar once the hero button is gone. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [heroGone, setHeroGone] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const cta = document.getElementById("hero-cta");
    let io: IntersectionObserver | null = null;
    if (cta) {
      io = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0));
      io.observe(cta);
    }
    return () => {
      window.removeEventListener("scroll", on);
      io?.disconnect();
    };
  }, []);
  return (
    <>
      <header className={`pt-safe sticky top-0 z-40 transition-colors duration-[180ms] ${scrolled ? "glass shadow-[0_0.5px_0_var(--hairline)]" : ""}`}>
        <div className="l-wrap flex h-14 items-center justify-between">
          <Link href="/" className="font-display text-[30px] leading-none" aria-label="WillWar home">
            WillWar
          </Link>
          <Link href="/app/sign-in" className="press flex min-h-[44px] items-center px-2 text-[17px] leading-[22px]">
            Sign in
          </Link>
        </div>
      </header>
      <div
        className={`pb-safe glass fixed inset-x-0 bottom-0 z-40 px-4 pt-3 shadow-[0_-0.5px_0_var(--hairline)] transition-transform duration-[180ms] md:hidden ${
          heroGone ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!heroGone}
      >
        <Link
          href="/app/start"
          tabIndex={heroGone ? 0 : -1}
          className="press mb-3 flex h-[52px] w-full items-center justify-center rounded-button bg-primary text-[17px] leading-[22px] font-semibold text-on-primary"
        >
          Start my 30 days
        </Link>
      </div>
    </>
  );
}
