"use client";

import {
  Anchor,
  ArrowCounterClockwise,
  Flag,
  Graph,
  HandWaving,
  Heart,
  Lock,
  Sailboat,
  Shield,
  SquaresFour,
  Trophy,
  Waves,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/Mark";
import { Tide } from "@/components/tide/Tide";
import { Pebble } from "@/components/ui/Pebble";
import { TONE_LABELS, TONE_SAMPLES, TONES, type Tone } from "@/lib/domain/constants";

const pad = (n: number) => String(n).padStart(2, "0");

const REDUCED = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

// ------------------------------------------------------------------ Sky
/** The page's sky: night at the top, dawn at the bottom. Scroll moves you toward December. */
export function SkyBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      ref.current?.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden className="landing-sky fixed inset-0 -z-10">
      <div className="landing-stars absolute inset-0" />
    </div>
  );
}

// ------------------------------------------------------------------ Header
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowBar(window.scrollY > window.innerHeight * 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
        <div
          className={`mx-auto flex h-14 max-w-[1120px] items-center gap-4 rounded-full px-3 pl-4 transition-[background,box-shadow,backdrop-filter] duration-300 ${
            scrolled ? "bg-night/70 shadow-[0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-xl" : ""
          }`}
        >
          <Link href="/" aria-label="WillWar home" className="text-white">
            <Wordmark />
          </Link>
          <nav aria-label="Sections" className="ml-6 hidden items-center gap-6 text-subhead text-white/70 lg:flex">
            <a href="#thirty" className="hover:text-white">30 days</a>
            <a href="#ride" className="hover:text-white">Ride it out</a>
            <a href="#pacts" className="hover:text-white">Pacts</a>
            <a href="#war-chest" className="hover:text-white">War Chest</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/app/sign-in" className="pressable rounded-full px-4 py-2.5 text-subhead font-semibold text-white/85 hover:text-white">
              Sign in
            </Link>
            <Link
              href="/app/start"
              className="pressable hidden rounded-full bg-linear-to-r from-dawn to-sun px-5 py-2.5 text-subhead font-semibold text-night shadow-[0_6px_24px_rgb(200_100_74/0.45)] sm:inline-flex"
            >
              Start my 30 days
            </Link>
          </div>
        </div>
      </header>
      {/* Mobile: once the hero CTA scrolls away, a slim bar keeps the one action in reach. */}
      <div
        className={`fixed inset-x-3 bottom-3 z-50 transition-[transform,opacity] duration-300 sm:hidden ${
          showBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
        }`}
      >
        <Link
          href="/app/start"
          className="pressable flex h-13 items-center justify-center rounded-full bg-linear-to-r from-dawn to-sun text-headline font-semibold text-night shadow-[0_10px_30px_rgb(0_0_0/0.4)]"
        >
          Start my 30 days
        </Link>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Hero clock
export function HeroClock() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setS(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <div className="inline-flex flex-col">
      <p
        className="num text-[clamp(2.4rem,6.4vw,5rem)] leading-none font-semibold tracking-tight whitespace-nowrap text-white [text-shadow:0_0_40px_rgb(63_182_201/0.55)]"
        aria-label={`${m} minutes ${sec} seconds since you opened the page`}
      >
        {d}d {pad(h)}h {pad(m)}m <span className="text-sun">{pad(sec)}s</span>
      </p>
      <p className="mt-2 text-footnote text-white/60">This clock started when you opened the page.</p>
    </div>
  );
}

// ------------------------------------------------------------------ Phone
/** A generic phone (no maker's trade dress) showing the Today screen with a live Tide. */
export function Phone({ day, level, held, className }: { day: number; level: number; held?: boolean; className?: string }) {
  const milestones = [7, 14, 21, 30];
  return (
    <div className={`relative mx-auto aspect-[9/19] w-[min(78vw,300px)] rounded-[48px] bg-linear-to-b from-white/25 to-white/5 p-[10px] shadow-[0_30px_80px_rgb(0_0_0/0.55)] ${className ?? ""}`}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[39px] bg-night-2">
        <div className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-black/70" aria-hidden />
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-[22px] font-bold text-white">Today</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-harbor-bright">
            Day {Math.max(day, 0)} of 30
          </span>
        </div>
        <div className="relative mx-3 mt-3 h-[44%] overflow-hidden rounded-[22px] bg-linear-to-b from-white/[0.06] to-white/[0.02]">
          <div className="absolute inset-0">
            <Tide level={Math.max(0.06, level)} settleAfterMs={0} />
          </div>
          <p className="num absolute inset-x-0 top-[38%] text-center text-[30px] font-semibold text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.4)]">
            {pad(Math.max(day, 0))}d {pad((day * 7) % 24)}h
          </p>
          <ol className="absolute top-2 right-2 bottom-2" aria-hidden>
            {milestones.map((m) => (
              <li key={m} className="absolute right-0 flex items-center gap-1" style={{ bottom: `calc(${Math.min(0.9, m / 30) * 100}% - 6px)` }}>
                <span className={`num text-[9px] font-semibold ${day >= m ? "text-sun" : "text-white/50"}`}>{m}</span>
                <span className={`block h-[2px] w-2.5 rounded-full ${day >= m ? "bg-sun" : "bg-white/40"}`} />
              </li>
            ))}
          </ol>
        </div>
        <div className={`mx-3 mt-3 flex h-10 items-center justify-center rounded-[12px] text-[13px] font-semibold ${held ? "bg-white/10 text-harbor-bright" : "bg-harbor text-white"}`}>
          {held ? `Day ${Math.max(day, 1)} held.` : "I held today"}
        </div>
        <div className="mx-3 mt-2 rounded-[14px] bg-white/[0.07] p-3 text-[11px] leading-snug text-white/80">
          <span className="block text-[10px] font-semibold text-white/50">Morning line</span>
          Day {Math.max(day, 1)}. Phone out of the bedroom tonight. That&apos;s the whole plan.
        </div>
        <div className="mt-auto px-3 pb-4">
          <div className="mb-2 flex h-9 items-center justify-center gap-1.5 rounded-full bg-harbor text-[12px] font-semibold text-white">
            <Waves size={14} weight="bold" aria-hidden /> Ride it out
          </div>
          <div className="grid h-10 grid-cols-4 items-center rounded-full bg-white/10 text-center text-[9px] text-white/60">
            <span className="text-harbor-bright">Today</span>
            <span>Pact</span>
            <span>Learn</span>
            <span>Me</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroPhone() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <Phone day={0} level={0.06 + Math.min(0.04, s / 6000)} />;
}

// ------------------------------------------------------------------ 30 days (signature)
const CAPTIONS: { day: number; text: string }[] = [
  { day: 1, text: "The easy part. Pick your reason and tell one friend." },
  { day: 3, text: "Boredom shows up. Have a three-minute plan for it." },
  { day: 7, text: "First milestone. Your pact sees it light up." },
  { day: 14, text: "Halfway. Your urge log shows what sets you off." },
  { day: 21, text: "The routine is doing the work now." },
  { day: 30, text: "December 1st. Your record stays, even if you go again." },
];

export function ThirtyDays() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [day, setDay] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setDay(Math.round(p * 30));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div className="mx-auto grid max-w-[1120px] gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {CAPTIONS.map((c) => (
          <div key={c.day} className="rounded-sheet bg-white/[0.06] p-6">
            <p className="num text-[2.5rem] font-semibold text-white">Day {c.day}</p>
            <p className="mt-2 text-body text-white/80">{c.text}</p>
          </div>
        ))}
      </div>
    );
  }

  const caption = [...CAPTIONS].reverse().find((c) => day >= c.day) ?? CAPTIONS[0];
  const milestone = [7, 14, 21, 30].includes(day);

  return (
    <div ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-dvh items-center">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:gap-16">
          <div>
            <p className="text-subhead font-semibold text-harbor-bright">Scroll through your 30 days</p>
            <p className={`num mt-2 text-[clamp(4.5rem,16vw,10rem)] leading-[0.9] font-bold tracking-tight ${milestone ? "text-sun" : "text-white"}`}>
              Day {day}
            </p>
            <p key={caption.day} className="mt-5 max-w-[30ch] text-[clamp(1.25rem,2.6vw,1.75rem)] leading-snug font-semibold text-white motion-safe:animate-[fade-in_400ms_ease-out]">
              {caption.text}
            </p>
            {/* The tide strip: thirty days from night to dawn, milestones in brass. */}
            <ol className="mt-8 flex max-w-[520px] items-end gap-[3px]" aria-label="Thirty days">
              {Array.from({ length: 30 }, (_, i) => {
                const d = i + 1;
                const isMile = [7, 14, 21, 30].includes(d);
                const reached = day >= d;
                return (
                  <li
                    key={d}
                    aria-label={`Day ${d}${reached ? ", passed" : ""}`}
                    className={`relative flex-1 rounded-full transition-[height,background] duration-300 ${isMile ? "h-7" : "h-4"} ${
                      reached ? (isMile ? "bg-sun" : "") : "bg-white/12"
                    }`}
                    style={reached && !isMile ? { background: `color-mix(in oklab, var(--harbor-bright) ${100 - (d / 30) * 70}%, var(--dawn))` } : undefined}
                  >
                    {isMile && reached && (
                      <span aria-hidden className="absolute inset-0 overflow-hidden rounded-full">
                        <span className="absolute inset-y-0 w-2 bg-white/80 motion-safe:animate-[glint_900ms_ease-out_1]" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex gap-3">
              {[7, 14, 21, 30].map((m) => (
                <span
                  key={m}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-footnote font-semibold transition-colors duration-300 ${
                    day >= m ? "bg-sun text-night" : "bg-white/8 text-white/50"
                  }`}
                >
                  <Trophy size={14} weight={day >= m ? "fill" : "regular"} aria-hidden /> Day {m}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <Phone day={day} level={day / 30} held={day > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Ride it out demo
export function RideDemo() {
  const [t, setT] = useState(0); // 0..6 seconds of wave
  const [holding, setHolding] = useState(false);
  const [passed, setPassed] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!holding || passed) return;
    const tick = (now: number) => {
      const dt = last.current ? (now - last.current) / 1000 : 0;
      last.current = now;
      setT((v) => {
        const next = Math.min(6, v + dt);
        if (next >= 6) setPassed(true);
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [holding, passed]);

  const amp = t < 3 ? t / 3 : 1 - (t - 3) / 3;
  const crest = 80 - amp * 62;
  const path = `M0 100 L0 ${88 - amp * 10} C 70 ${88 - amp * 10}, 120 ${crest}, 200 ${crest} S 330 ${88 - amp * 8}, 400 ${90 - amp * 4} L400 100 Z`;
  const start = () => !passed && setHolding(true);
  const stop = () => setHolding(false);

  return (
    <div className="overflow-hidden rounded-[28px] bg-linear-to-b from-glacier-deep to-night p-5 ring-1 ring-white/10 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-headline text-white">{passed ? "Wave passed." : holding ? (t < 3 ? "It's rising. Stay with it." : "Cresting. Now it falls.") : t > 0 ? "Settling. Hold again when you're ready." : "A calm waterline"}</p>
        <span className="num text-footnote text-white/50">{Math.round((t / 6) * 100)}%</span>
      </div>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="mt-4 h-40 w-full sm:h-48" aria-hidden>
        <defs>
          <linearGradient id="ride-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--glacier)" />
            <stop offset="1" stopColor="var(--glacier-deep)" />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#ride-water)" />
        <path d={path.replace(/ L400 100 Z$/, "").replace(/^M0 100 L/, "M")} fill="none" stroke="var(--foam)" strokeOpacity="0.7" strokeWidth="1.5" />
      </svg>
      {passed && (
        <div aria-hidden className="relative -mt-24 h-24">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="absolute bottom-0 size-2 rounded-full bg-foam/80 motion-safe:animate-[bubble_1.6s_ease-out_forwards]"
              style={{ left: `${6 + i * 6.5}%`, animationDelay: `${(i % 5) * 90}ms` }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if (e.key === " " && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => e.key === " " && stop()}
        onClick={() => {
          if (passed) {
            setPassed(false);
            setT(0);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="no-callout pressable relative mt-5 flex h-14 w-full touch-none items-center justify-center gap-2 overflow-hidden rounded-full bg-white text-headline font-semibold text-night"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 bg-glacier/35" style={{ width: `${(t / 6) * 100}%` }} />
        <span className="relative flex items-center gap-2">
          <Waves size={20} weight="bold" aria-hidden />
          {passed ? "Ride another" : "Hold to ride a wave"}
        </span>
      </button>
      <p className="mt-3 text-center text-footnote text-white/50">Press and hold, or hold the Space key.</p>
    </div>
  );
}

export function GameChips() {
  const games: { name: string; line: string; icon: ReactNode; tint: string }[] = [
    { name: "Drift", line: "Fit pieces on a raft", icon: <SquaresFour size={22} aria-hidden />, tint: "from-harbor/60" },
    { name: "Swell", line: "Breathe 4 in, 6 out", icon: <Waves size={22} aria-hidden />, tint: "from-glacier/60" },
    { name: "Knots", line: "Untangle the lines", icon: <Graph size={22} aria-hidden />, tint: "from-dawn/60" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {games.map((g, i) => (
        <div key={g.name} className={`rounded-card bg-linear-to-b ${g.tint} to-white/[0.04] p-4 ring-1 ring-white/10`}>
          <span className="inline-flex motion-safe:animate-[float_4s_ease-in-out_infinite] text-white" style={{ animationDelay: `${i * 400}ms` }}>
            {g.icon}
          </span>
          <p className="mt-3 text-headline text-white">{g.name}</p>
          <p className="text-footnote text-white/65">{g.line}</p>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Pacts demo
type Metric = "current" | "best" | "days";
const MEMBERS = [
  { handle: "dev.s", seed: "dev-s-11", tones: ["var(--sun)", "var(--dawn)"] as [string, string], current: 14 * 24 + 8, best: 14 * 24 + 8, days: 14 },
  { handle: "quietmile", seed: "quiet-07", tones: ["var(--harbor-bright)", "var(--harbor)"] as [string, string], current: 12 * 24 + 4, best: 12 * 24 + 4, days: 12, me: true },
  { handle: "rohan_k", seed: "rohan-k-3", tones: ["var(--glacier)", "var(--glacier-deep)"] as [string, string], current: 6 * 24 + 19, best: 9 * 24 + 2, days: 11 },
  { handle: "arjun_m", seed: "arjun-m-9", tones: ["var(--dawn)", "var(--dawn-deep)"] as [string, string], current: 2 * 24 + 1, best: 8 * 24, days: 8, paused: true },
];

export function PactBoard() {
  const [metric, setMetric] = useState<Metric>("current");
  const [nudged, setNudged] = useState<string | null>(null);
  const value = (m: (typeof MEMBERS)[number]) => (metric === "current" ? m.current : metric === "best" ? m.best : m.days);
  const rows = [...MEMBERS].sort((a, b) => value(b) - value(a));
  useEffect(() => {
    if (!nudged) return;
    const t = setTimeout(() => setNudged(null), 1800);
    return () => clearTimeout(t);
  }, [nudged]);
  const fmt = (m: (typeof MEMBERS)[number]) => {
    const v = value(m);
    return metric === "days" ? `${v} d` : `${pad(Math.floor(v / 24))}d ${pad(v % 24)}h`;
  };
  return (
    <div className="relative rounded-[28px] bg-white/[0.07] p-4 ring-1 ring-white/12 backdrop-blur-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-headline text-white">The Dawn Crew</p>
          <p className="text-footnote text-white/55">Example pact, 4 people</p>
        </div>
        <div className="grid h-9 grid-cols-3 rounded-full bg-black/30 p-1 text-footnote font-semibold" role="group" aria-label="Board">
          {(["current", "best", "days"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={`rounded-full px-3 capitalize transition-colors ${metric === m ? "bg-white text-night" : "text-white/70"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-4 grid gap-1.5">
        {rows.map((m, i) => (
          <li
            key={m.handle}
            className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 transition-all duration-500 ${m.me ? "bg-harbor/35 ring-1 ring-harbor-bright/40" : "bg-white/[0.04]"}`}
          >
            <span className="num w-4 text-subhead text-white/50">{i + 1}</span>
            <Pebble seed={m.seed} size={34} tones={m.tones} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-white">
                @{m.handle} {m.me && <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[11px]">you</span>}
              </span>
              {m.paused && metric === "current" && <span className="block text-footnote text-white/40">Paused</span>}
            </span>
            <span className={`num text-headline ${m.paused && metric === "current" ? "text-white/40" : "text-white"}`}>{fmt(m)}</span>
            {!m.me && (
              <button
                type="button"
                onClick={() => setNudged(m.handle)}
                aria-label={`Nudge @${m.handle}`}
                className={`pressable flex size-10 items-center justify-center rounded-full bg-white/10 text-sun ${nudged === m.handle ? "motion-safe:animate-[wiggle_500ms_ease-in-out]" : ""}`}
              >
                <HandWaving size={18} weight="fill" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-footnote text-white/55" aria-live="polite">
        {nudged ? `Nudge sent to @${nudged}: "Ride it out, you've got this."` : "Handles, not names. Never the reason it reset."}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ War Chest demo
const PRESETS = [9900, 19900, 49900, 99900];

export function WarChestDemo() {
  const [amount, setAmount] = useState(49900);
  const [resets, setResets] = useState(0);
  const [promise, setPromise] = useState(true);
  const given = Math.min(amount, Math.floor(amount / 4) * resets);
  const left = amount - given;
  const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const reset = useCallback(() => setResets((r) => Math.min(4, r + 1)), []);
  return (
    <div className="rounded-[28px] bg-linear-to-br from-dawn-deep via-dawn-deep to-night p-5 ring-1 ring-sun/20 sm:p-7">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-headline text-white">
          <Lock size={18} aria-hidden /> War Chest
        </span>
        <button
          type="button"
          aria-pressed={promise}
          onClick={() => setPromise((p) => !p)}
          className="rounded-full bg-white/10 px-3 py-1.5 text-footnote font-semibold text-white/85"
        >
          {promise ? "Promise mode" : "Stake mode"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={amount === p}
            onClick={() => {
              setAmount(p);
              setResets(0);
            }}
            className={`pressable num h-9 rounded-full px-4 text-subhead font-semibold ${amount === p ? "bg-sun text-night" : "bg-white/10 text-white"}`}
          >
            {rupees(p)}
          </button>
        ))}
      </div>
      <p className="num mt-6 text-[3.25rem] leading-none font-semibold text-white">{rupees(left)}</p>
      <p className="mt-1 text-subhead text-white/70">{promise ? "still promised to yourself" : "still yours"}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <span className="bg-linear-to-r from-harbor-bright to-harbor transition-[width] duration-500" style={{ width: `${(left / amount) * 100}%` }} />
        <span className="bg-white/35 transition-[width] duration-500" style={{ width: `${(given / amount) * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-footnote text-white/70">
        <span>Still yours: {rupees(left)}</span>
        <span className="flex items-center gap-1">
          <Heart size={12} weight="fill" aria-hidden /> To [cause]: {rupees(given)}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={reset} disabled={resets >= 4} className="pressable flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/10 text-subhead text-white disabled:opacity-40">
          <ArrowCounterClockwise size={16} aria-hidden /> Try a reset
        </button>
        <button type="button" onClick={() => setResets(0)} className="pressable h-11 rounded-full bg-white text-subhead font-semibold text-night">
          Make it to Dec 1
        </button>
      </div>
      <p className="mt-4 text-footnote text-white/60" aria-live="polite">
        {resets === 0
          ? `Make it to the end and ${rupees(amount)} comes back to you.`
          : promise
            ? `You promised ${rupees(Math.floor(amount / 4))} to [cause] for that reset. ${rupees(left)} is still yours if you keep going.`
            : `${rupees(Math.floor(amount / 4))} goes to [cause]. ${rupees(left)} is still yours if you keep going.`}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Tone cards
const TONE_STYLE: Record<Tone, { bg: string; icon: ReactNode }> = {
  steady: { bg: "from-harbor to-night-2", icon: <Anchor size={20} aria-hidden /> },
  stoic: { bg: "from-glacier to-glacier-deep", icon: <Shield size={20} aria-hidden /> },
  coach: { bg: "from-dawn to-dawn-deep", icon: <Flag size={20} aria-hidden /> },
  playful: { bg: "from-sun to-dawn", icon: <Sailboat size={20} aria-hidden /> },
};

export function ToneCards() {
  const [active, setActive] = useState<Tone>("steady");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TONES.map((t, i) => (
        <button
          key={t}
          type="button"
          aria-pressed={active === t}
          onClick={() => setActive(t)}
          className={`pressable group relative min-h-48 rounded-[24px] bg-linear-to-br ${TONE_STYLE[t].bg} p-5 text-left text-white ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-1 ${
            active === t ? "ring-2 ring-white/80" : ""
          }`}
          style={{ rotate: `${(i - 1.5) * 1.2}deg` }}
        >
          <span className="flex items-center justify-between">
            <span className="rounded-full bg-black/20 px-2.5 py-1 text-footnote font-semibold">{TONE_LABELS[t]}</span>
            {TONE_STYLE[t].icon}
          </span>
          <span className="mt-5 block text-[1.125rem] leading-snug font-semibold">&ldquo;{TONE_SAMPLES[t]}&rdquo;</span>
          <span className="mt-4 block text-footnote text-white/70">Waiting for you at 7:00</span>
        </button>
      ))}
    </div>
  );
}
