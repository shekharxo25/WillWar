"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Waves,
  Lock,
  Users,
  BookOpen,
  Check,
  Moon,
  Sun,
  CaretDown,
  Sparkle,
  Wind,
  SquaresFour,
  Heart,
  EyeSlash,
  Trash,
  Fingerprint,
  DeviceMobile,
  CheckCircle,
  Clock,
  ArrowCounterClockwise
} from "@phosphor-icons/react";
import { Mark, Wordmark } from "@/components/brand/Mark";
import { Tide } from "@/components/tide/Tide";
import { Pebble } from "@/components/ui/Pebble";

interface PactMember {
  rank: number;
  handle: string;
  seed: string;
  note: string;
  score: string;
  isYou?: boolean;
  isBrass?: boolean;
  isPaused?: boolean;
}

export function InteractiveLandingPage() {
  // Appearance theme: follows system or explicit toggle
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      const explicit = document.documentElement.dataset.theme;
      if (explicit === "dark" || explicit === "light") return explicit;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    }
    return "light";
  });

  // Telemetry chronometer (seconds since opening the page)
  const [elapsedSecs, setElapsedSecs] = useState(84);

  // 30-Day Scrubber state
  const [scrubDay, setScrubDay] = useState(12);

  // Interactive device preview state (Hero)
  const [heroCheckedIn, setHeroCheckedIn] = useState(false);

  // Urge Chamber state
  const [urgeTool, setUrgeTool] = useState<"surf" | "swell" | "drift">("surf");
  const [isHoldingWave, setIsHoldingWave] = useState(false);
  const [waveProgress, setWaveProgress] = useState(65);
  const [wavePassed, setWavePassed] = useState(false);

  // Breathing pacer state (Swell)
  const [inhale, setInhale] = useState(true);
  const [breathCount, setBreathCount] = useState(4);

  // Drift spatial tile state
  const [driftTiles, setDriftTiles] = useState<number[]>([1, 2, 3, 4, 5, 0, 6, 7, 8]);

  // Pact leaderboard tab
  const [pactTab, setPactTab] = useState<"current" | "best" | "days">("current");

  // War Chest state
  const [chestAmount, setChestAmount] = useState<number>(499);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [selectedCause, setSelectedCause] = useState("The Ocean Cleanup");
  const [isPromiseMode, setIsPromiseMode] = useState(false);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Free Pledge Modal
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [pledgeHandle, setPledgeHandle] = useState("@quietmile");
  const [pledgeHoldProgress, setPledgeHoldProgress] = useState(0);
  const [isPledgeSigned, setIsPledgeSigned] = useState(false);

  // Floating HUD notification
  const [hudMessage, setHudMessage] = useState<{ id: number; text: string } | null>(null);

  const waveHoldTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pledgeHoldTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerHud = useCallback((text: string) => {
    const id = Date.now();
    setHudMessage({ id, text });
    setTimeout(() => {
      setHudMessage((curr) => (curr?.id === id ? null : curr));
    }, 2400);
  }, []);

  // Listen to system appearance changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!document.documentElement.dataset.theme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ww-theme", next);
    } catch {}
    triggerHud(`Switched to ${next} appearance.`);
  };

  // Clock telemetry ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatChronometer = (totalSecs: number) => {
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  };

  // Breathing pacer loop (4s Inhale / 6s Exhale)
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick = (tick + 1) % 10;
      if (tick < 4) {
        setInhale(true);
        setBreathCount(4 - tick);
      } else {
        setInhale(false);
        setBreathCount(10 - tick);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hold-to-ride wave logic
  const startHoldWave = () => {
    if (wavePassed) {
      setWavePassed(false);
      setWaveProgress(65);
    }
    setIsHoldingWave(true);
    waveHoldTimer.current = setInterval(() => {
      setWaveProgress((prev) => {
        if (prev > 3) {
          return prev - 2.5;
        } else {
          if (waveHoldTimer.current) clearInterval(waveHoldTimer.current);
          setWavePassed(true);
          setIsHoldingWave(false);
          triggerHud("Wave passed. Steady horizon held.");
          return 0;
        }
      });
    }, 50);
  };

  const stopHoldWave = () => {
    if (waveHoldTimer.current) clearInterval(waveHoldTimer.current);
    setIsHoldingWave(false);
    if (!wavePassed) {
      setWaveProgress(65);
    }
  };

  // Drift puzzle tile swap
  const moveDriftTile = (index: number) => {
    const emptyIndex = driftTiles.indexOf(0);
    const validMoves = [
      emptyIndex - 1 >= 0 && emptyIndex % 3 !== 0 ? emptyIndex - 1 : -1,
      emptyIndex + 1 < 9 && emptyIndex % 3 !== 2 ? emptyIndex + 1 : -1,
      emptyIndex - 3 >= 0 ? emptyIndex - 3 : -1,
      emptyIndex + 3 < 9 ? emptyIndex + 3 : -1
    ];
    if (validMoves.includes(index)) {
      const next = [...driftTiles];
      next[emptyIndex] = next[index];
      next[index] = 0;
      setDriftTiles(next);
      const isComplete = next.slice(0, 8).every((val, idx) => val === idx + 1);
      if (isComplete) {
        triggerHud("Loop interrupted. Visual attention reset.");
      }
    }
  };

  // Hold-to-sign pledge logic
  const startHoldPledge = useCallback(() => {
    if (isPledgeSigned) return;
    pledgeHoldTimer.current = setInterval(() => {
      setPledgeHoldProgress((p) => {
        if (p < 100) {
          return p + 4;
        } else {
          if (pledgeHoldTimer.current) clearInterval(pledgeHoldTimer.current);
          setIsPledgeSigned(true);
          triggerHud("Pledge signed. Your clock is running.");
          setTimeout(() => setIsPledgeModalOpen(false), 2200);
          return 100;
        }
      });
    }, 50);
  }, [isPledgeSigned, triggerHud]);

  const stopHoldPledge = useCallback(() => {
    if (pledgeHoldTimer.current) clearInterval(pledgeHoldTimer.current);
    if (!isPledgeSigned) {
      setPledgeHoldProgress(0);
    }
  }, [isPledgeSigned]);

  // Spacebar hold support for pledge
  useEffect(() => {
    if (!isPledgeModalOpen || isPledgeSigned) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && pledgeHoldTimer.current === null) {
        e.preventDefault();
        startHoldPledge();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        stopHoldPledge();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPledgeModalOpen, isPledgeSigned, startHoldPledge, stopHoldPledge]);

  // Scrubbed day calculations
  const getScrubbedInfo = (day: number) => {
    const pct = Math.min(100, Math.round((day / 30) * 100));
    let phase = "Week 1 · Breaking momentum";
    let milestoneName = "";
    let isBrass = false;

    if (day >= 30) {
      phase = "Day 30 · The full horizon";
      milestoneName = "30-day milestone";
      isBrass = true;
    } else if (day >= 21) {
      phase = "Week 4 · Routine takes over";
      milestoneName = "Day 21 milestone";
      isBrass = true;
    } else if (day >= 14) {
      phase = "Week 3 · Pattern recognition";
      milestoneName = "Day 14 milestone";
      isBrass = true;
    } else if (day >= 7) {
      phase = "Week 2 · Habit locks in";
      milestoneName = "Day 7 milestone";
      isBrass = true;
    } else if (day >= 3) {
      phase = "Week 1 · Boredom plan";
    }

    return { pct, phase, milestoneName, isBrass };
  };

  const scrubInfo = getScrubbedInfo(scrubDay);

  // Pact mock members
  const pactMembers: Record<"current" | "best" | "days", PactMember[]> = {
    current: [
      { rank: 1, handle: "@dev.s", seed: "dev.s", note: "Day 14 milestone held", score: "14d 08h", isBrass: true },
      { rank: 2, handle: "@quietmile", seed: "quietmile", note: "War Chest: ₹499 locked", score: "12d 04h", isYou: true },
      { rank: 3, handle: "@rohan_k", seed: "rohan_k", note: "Checked in today at 08:30", score: "06d 19h" },
      { rank: 4, handle: "@arjun_m", seed: "arjun_m", note: "Clock paused", score: "—", isPaused: true }
    ],
    best: [
      { rank: 1, handle: "@dev.s", seed: "dev.s", note: "Previous record: Oct 2026", score: "22d 12h", isBrass: true },
      { rank: 2, handle: "@quietmile", seed: "quietmile", note: "Previous record: Sep 2026", score: "19d 04h", isYou: true },
      { rank: 3, handle: "@rohan_k", seed: "rohan_k", note: "Previous record: Aug 2026", score: "12d 18h" },
      { rank: 4, handle: "@arjun_m", seed: "arjun_m", note: "Previous record: Jul 2026", score: "08d 06h" }
    ],
    days: [
      { rank: 1, handle: "@quietmile", seed: "quietmile", note: "Total challenge days logged", score: "28 days", isYou: true, isBrass: true },
      { rank: 2, handle: "@dev.s", seed: "dev.s", note: "Total challenge days logged", score: "26 days" },
      { rank: 3, handle: "@rohan_k", seed: "rohan_k", note: "Total challenge days logged", score: "18 days" },
      { rank: 4, handle: "@arjun_m", seed: "arjun_m", note: "Total challenge days logged", score: "14 days" }
    ]
  };

  const faqs = [
    {
      q: "Why is WillWar strictly 18+?",
      a: "WillWar is built for mature adults practicing digital sobriety and sexual self-regulation. We maintain this clear boundary so that our evidence summaries, microcopy, and tools remain frank, clinical, and intended solely for independent adults. We never collect or store your date of birth."
    },
    {
      q: "How does it install from Safari without an App Store?",
      a: "WillWar is an engineered Progressive Web App (PWA). In Safari on your iPhone, tap Share and select 'Add to Home Screen'. It runs in its own full-screen container with zero App Store surveillance, hardware epoch time, and full offline support."
    },
    {
      q: "What happens if I slip and reset my streak?",
      a: "There is zero shame or penalty. The app offers fixed, optional trigger tags (like 'Late night screen' or 'Exhaustion') to help you spot patterns. Your pact members see your number return to Day 1, but never the cause, notes, or time. Your historical days logged remain permanently."
    },
    {
      q: "Can anyone in my pact see my private journal notes?",
      a: "Never. Pacts only broadcast two data points: your anonymized handle and your current streak duration. Journals, urge timestamps, and reflections stay on your device in IndexedDB. Encrypted cloud backup is strictly opt-in."
    },
    {
      q: "Does the clock work offline on airplanes or without data?",
      a: "Yes. The chronometer derives its state directly from hardware epoch time. You can play Drift and Swell completely offline. Pact synchronization occurs silently the moment your device reconnects."
    },
    {
      q: "How does the War Chest handle payments and charity transfers?",
      a: "Collateral is held in segregated trust via our payment partner. If a reset occurs, a quarter of the stake is sent directly to your chosen verified 501(c)(3) or charitable trust. On December 1st, whatever is still yours returns 100% to your original payment method. WillWar charges zero brokerage fees."
    }
  ];

  const currencySymbol = currency === "INR" ? "₹" : "$";
  const presetAmounts = currency === "INR" ? [99, 199, 499, 999] : [5, 10, 20, 50];
  const retainedFraction = 0.75;
  const retainedAmount = Math.round(chestAmount * retainedFraction);
  const donatedAmount = chestAmount - retainedAmount;

  return (
    <div className="min-h-screen bg-[var(--bg-grouped)] text-[var(--label)] selection:bg-[var(--tide-wash)] selection:text-[var(--tide)] font-sans">
      
      {/* Floating HUD Toast (DESIGN.md section 4) */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-6 inset-x-0 z-[70] flex justify-center pointer-events-none px-4"
          >
            <div className="glass pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full shadow-[var(--shadow-float)] border border-[var(--separator)] text-sm font-semibold text-[var(--label)]">
              <Waves size={16} className="text-[var(--tide)] shrink-0" weight="bold" />
              <span>{hudMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Navigation Bar (Liquid Glass chrome) */}
      <header className="fixed top-0 inset-x-0 z-50 pt-3 pb-2 transition-all">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <nav
            aria-label="Main Navigation"
            className="glass rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between border border-[var(--separator)] shadow-[var(--shadow-float)]"
          >
            {/* Wordmark */}
            <div className="flex items-center gap-3">
              <a href="#" className="flex items-center gap-2 pressable" aria-label="WillWar Home">
                <Mark size={24} tile />
                <span className="font-semibold text-base sm:text-lg tracking-tight">WillWar</span>
              </a>
              <span className="hidden sm:inline-block text-xs text-[var(--label-2)] px-2.5 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
                30-day reset
              </span>
            </div>

            {/* In-page navigation */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--label-2)]">
              <a href="#timeline" className="hover:text-[var(--label)] transition-colors">30 days</a>
              <a href="#ride-it-out" className="hover:text-[var(--label)] transition-colors">Ride it out</a>
              <a href="#pacts" className="hover:text-[var(--label)] transition-colors">Pacts</a>
              <a href="#war-chest" className="hover:text-[var(--label)] transition-colors">War chest</a>
              <a href="#evidence" className="hover:text-[var(--label)] transition-colors">Evidence</a>
              <a href="#access" className="hover:text-[var(--label)] transition-colors">Access</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle appearance"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--label-2)] hover:text-[var(--label)] hover:bg-[var(--bg-tertiary)] pressable"
              >
                {theme === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
              </button>

              <button
                type="button"
                onClick={() => setIsPledgeModalOpen(true)}
                className="h-[42px] rounded-btn bg-[var(--tide)] px-4 text-sm font-semibold text-white pressable shadow-xs"
              >
                Start my 30 days
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION (DESIGN.md section 5: Desktop 2-column, Mobile 1-column)   */}
      {/* ========================================================================= */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-[var(--separator)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Thesis & Chronometer */}
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--separator)] mb-6 text-xs text-[var(--label-2)]">
                <span className="w-2 h-2 rounded-full bg-[var(--tide)]" />
                <span>Off-season challenge</span>
                <span className="text-[var(--separator)]">·</span>
                <span>November 1 – December 1</span>
              </div>

              <h1 className="text-[clamp(44px,7vw,80px)] font-bold tracking-tight leading-[1.04] text-[var(--label)] mb-5">
                Make it to December.
              </h1>

              <p className="text-lg sm:text-[21px] leading-[1.45] text-[var(--label-2)] max-w-[620px] mb-8 font-normal">
                A streak clock that counts every second, a three-minute game for when the urge hits, and a private leaderboard with the friends you trust.
              </p>

              {/* The Live Tabular Chronometer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg)] border border-[var(--separator)] inline-flex flex-col gap-1.5 mb-8 max-w-full">
                <div className="flex items-center justify-between gap-6 pb-2 border-b border-[var(--separator)] text-xs text-[var(--label-2)]">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[var(--tide)]" weight="bold" />
                    <span>Session chronometer</span>
                  </span>
                  <span className="num font-semibold text-[var(--tide)]">Running</span>
                </div>
                <div className="num text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--label)] pt-1">
                  {formatChronometer(elapsedSecs)}
                </div>
                <span className="text-xs text-[var(--label-3)]">
                  This clock started when you opened the page.
                </span>
              </div>

              {/* Action row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setIsPledgeModalOpen(true)}
                  className="h-[50px] px-6 rounded-btn bg-[var(--tide)] text-white text-[17px] font-semibold pressable shadow-sm"
                >
                  Start my 30 days
                </button>
                <span className="text-sm text-[var(--label-2)]">
                  Free. 18+. No app store needed.
                </span>
              </div>

              {/* Reassurance points */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--label-3)] pt-2 border-t border-[var(--separator)]">
                <span className="flex items-center gap-1.5">
                  <DeviceMobile size={14} />
                  <span>Safari PWA: installs to home screen in 10s</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeSlash size={14} />
                  <span>Device-local: zero tracking pixels</span>
                </span>
              </div>
            </div>

            {/* Right Column: Physical Viewport Preview of the Tide Screen */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[390px] rounded-[36px] p-3 bg-[var(--bg-tertiary)] border border-[var(--separator)] shadow-2xl">
                <div className="bg-[var(--bg-grouped)] rounded-[28px] p-4 flex flex-col justify-between overflow-hidden relative border border-[var(--separator)]">
                  
                  {/* Mock status bar */}
                  <div className="flex items-center justify-between text-xs text-[var(--label-2)] px-1 mb-3">
                    <span className="font-semibold text-sm">Today</span>
                    <div className="flex items-center gap-1.5">
                      <Pebble seed="quietmile" size={24} label="@quietmile" />
                    </div>
                  </div>

                  {/* The Tide Card (DESIGN.md section 4: 320pt tall, radius 22, living waves) */}
                  <div className="relative h-[280px] rounded-[22px] overflow-hidden bg-[var(--bg)] border border-[var(--separator)] flex flex-col justify-between p-4 mb-3">
                    {/* Living canvas waves */}
                    <div className="absolute inset-0 z-0">
                      <Tide level={heroCheckedIn ? 0.43 : 0.40} settleAfterMs={20000} />
                    </div>

                    {/* Milestone ticks on the right edge (Day 7 brass, 14, 21, 30) */}
                    <div className="absolute right-2 top-3 bottom-3 flex flex-col justify-between items-end z-10 pointer-events-none text-[10px]">
                      <span className="num font-semibold text-[var(--label-3)]">30d</span>
                      <span className="num font-semibold text-[var(--label-3)]">21d</span>
                      <span className="num font-semibold text-[var(--label-3)]">14d</span>
                      <span className="num font-semibold text-[var(--brass-ink)] flex items-center gap-0.5">
                        <Sparkle size={10} weight="fill" className="text-[var(--brass)]" />
                        7d
                      </span>
                    </div>

                    {/* Clock overlay */}
                    <div className="relative z-10">
                      <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                        Streak chronometer
                      </span>
                      <div className="num text-2xl sm:text-3xl font-semibold text-white tracking-tight drop-shadow-sm">
                        {heroCheckedIn ? "12d 04h 31m 09s" : "12d 04h 31m 08s"}
                      </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-end text-xs text-white/90">
                      <span>Started Sun 1 Nov</span>
                      <span className="num font-semibold">Best: 19 days</span>
                    </div>
                  </div>

                  {/* Check-in button */}
                  <button
                    type="button"
                    onClick={() => {
                      setHeroCheckedIn(true);
                      triggerHud("Day 12 held. Streak updated.");
                    }}
                    className={`h-[46px] rounded-btn font-semibold text-sm flex items-center justify-center gap-2 mb-3 pressable transition-all ${
                      heroCheckedIn
                        ? "bg-[var(--bg-tertiary)] text-[var(--label-2)] border border-[var(--separator)]"
                        : "bg-[var(--tide)] text-white shadow-xs"
                    }`}
                  >
                    {heroCheckedIn ? (
                      <>
                        <Check size={16} weight="bold" className="text-[var(--tide)]" />
                        <span>Day 12 held</span>
                      </>
                    ) : (
                      <span>I held today</span>
                    )}
                  </button>

                  {/* Morning line card */}
                  <div className="p-3.5 rounded-card bg-[var(--bg)] border border-[var(--separator)] mb-3">
                    <span className="text-[11px] font-semibold text-[var(--label-2)] block mb-1">
                      Morning line · Steady
                    </span>
                    <p className="text-xs text-[var(--label)] leading-relaxed italic">
                      &ldquo;Day 12. You&apos;ve already handled twelve evenings like this one. Handle tonight the same way.&rdquo;
                    </p>
                  </div>

                  {/* Ride it out persistent capsule pill */}
                  <div className="flex justify-center mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("ride-it-out");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="h-[44px] px-5 rounded-full bg-[var(--tide)] text-white text-xs font-semibold flex items-center gap-2 shadow-sm pressable"
                    >
                      <Waves size={16} weight="bold" />
                      <span>Ride it out (3 min)</span>
                    </button>
                  </div>

                  {/* Glass Tab Bar */}
                  <div className="glass rounded-full px-4 py-2 flex justify-around text-[11px] font-medium text-[var(--label-2)] border border-[var(--separator)]">
                    <span className="text-[var(--tide)] font-semibold">Today</span>
                    <span>Pact</span>
                    <span>Learn</span>
                    <span>Me</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: THE 30-DAY RISE (INTERACTIVE TIMELINE SCRUBBER)               */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[var(--bg)] border-b border-[var(--separator)]" id="timeline">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-12">
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-4">
              Scroll through your thirty days.
            </h2>
            <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
              Waterlines rise silently. Day 1 is quiet resolve; Day 7 brings your first brass mark. See how the terrain changes before you step onto it.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Scrubber Controls & Milestones */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Slider card */}
              <div className="p-5 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)]">
                <div className="flex justify-between items-center text-sm font-semibold mb-3">
                  <span className="text-[var(--label)]">
                    Scrubbing to: <strong className="text-[var(--tide)] font-bold">Day {scrubDay}</strong>
                  </span>
                  <span className="num text-xs text-[var(--label-2)]">
                    {scrubInfo.pct}% water level
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={30}
                  value={scrubDay}
                  onChange={(e) => setScrubDay(Number(e.target.value))}
                  aria-label="Timeline day scrubber"
                  className="w-full h-2 rounded-lg bg-[var(--bg-tertiary)] accent-[var(--tide)] cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-[var(--label-3)] num font-medium mt-2">
                  <span>Day 1</span>
                  <span>Day 7 (Brass I)</span>
                  <span>Day 14 (Halfway)</span>
                  <span>Day 21 (Brass III)</span>
                  <span>Day 30</span>
                </div>
              </div>

              {/* 4 Real Temporal Phases (DESIGN.md principle: real sequences only) */}
              <div className="space-y-3">
                {[
                  {
                    range: "Days 1–7",
                    dayStart: 1,
                    dayEnd: 7,
                    title: "The break from momentum",
                    desc: "Adrenaline is high on Day 1; boredom arrives by Day 3. Drift puzzles break automatic finger patterns before loops re-form. Day 7 earns your first brass tick and notifies your pact.",
                    badge: "Milestone I (Day 7)",
                    isBrass: true
                  },
                  {
                    range: "Days 8–14",
                    dayStart: 8,
                    dayEnd: 14,
                    title: "Pattern recognition",
                    desc: "You start predicting your vulnerable hours: 11:30 PM on screens or Sunday afternoons alone. Logging triggers reveals the habit before it becomes an impulse. Day 14 marks halfway.",
                    badge: "Milestone II (Day 14)",
                    isBrass: true
                  },
                  {
                    range: "Days 15–21",
                    dayStart: 15,
                    dayEnd: 21,
                    title: "Routine does the heavy lifting",
                    desc: "The friction of breaking a three-week streak exceeds the transient pull of old loops. Habit takes over from raw willpower. Day 21 locks in your third brass tick.",
                    badge: "Milestone III (Day 21)",
                    isBrass: true
                  },
                  {
                    range: "Days 22–30",
                    dayStart: 22,
                    dayEnd: 30,
                    title: "The horizon seals",
                    desc: "On December 1st, the full chronometer locks. The pledge is completed, your War Chest returns in full, and the proof remains on your device hardware forever.",
                    badge: "Full Brass Horizon (Day 30)",
                    isBrass: true
                  }
                ].map((phase, idx) => {
                  const isActive = scrubDay >= phase.dayStart && scrubDay <= phase.dayEnd;
                  return (
                    <div
                      key={idx}
                      onClick={() => setScrubDay(phase.dayStart)}
                      className={`p-5 rounded-card border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[var(--bg)] border-[var(--tide)] shadow-sm"
                          : "bg-[var(--bg)] border-[var(--separator)] hover:border-[var(--label-3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="num text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--tide-wash)] text-[var(--tide)]">
                            {phase.range}
                          </span>
                          <span className="font-semibold text-sm sm:text-base text-[var(--label)]">
                            {phase.title}
                          </span>
                        </div>
                        {phase.isBrass && (
                          <span className="text-[11px] font-semibold text-[var(--brass-ink)] hidden sm:flex items-center gap-1">
                            <Sparkle size={12} weight="fill" className="text-[var(--brass)]" />
                            {phase.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[var(--label-2)] leading-relaxed">
                        {phase.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right: Live Responsive Tide Card for Scrubbed Day */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="p-6 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] shadow-md">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--separator)]">
                  <div>
                    <span className="text-xs text-[var(--label-2)] block">Simulated state</span>
                    <span className="font-semibold text-base text-[var(--label)]">{scrubInfo.phase}</span>
                  </div>
                  <span className="num text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--tide)] text-white">
                    Day {scrubDay} / 30
                  </span>
                </div>

                {/* Tide Canvas */}
                <div className="relative h-[260px] rounded-[18px] overflow-hidden bg-[var(--bg)] border border-[var(--separator)] flex flex-col justify-between p-4 mb-4">
                  <div className="absolute inset-0 z-0">
                    <Tide level={scrubInfo.pct / 100} settleAfterMs={20000} />
                  </div>

                  {/* Milestone ticks */}
                  <div className="absolute right-2 top-3 bottom-3 flex flex-col justify-between items-end z-10 pointer-events-none text-[10px]">
                    <span className={`num font-semibold ${scrubDay >= 30 ? "text-[var(--brass-ink)]" : "text-[var(--label-3)]"}`}>
                      30d
                    </span>
                    <span className={`num font-semibold ${scrubDay >= 21 ? "text-[var(--brass-ink)]" : "text-[var(--label-3)]"}`}>
                      21d
                    </span>
                    <span className={`num font-semibold ${scrubDay >= 14 ? "text-[var(--brass-ink)]" : "text-[var(--label-3)]"}`}>
                      14d
                    </span>
                    <span className={`num font-semibold ${scrubDay >= 7 ? "text-[var(--brass-ink)]" : "text-[var(--label-3)]"}`}>
                      7d
                    </span>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[11px] text-white/80 font-medium">Tide water level</span>
                    <div className="num text-3xl font-semibold text-white tracking-tight">
                      {String(scrubDay).padStart(2, "0")}d 00h 00m
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-between text-xs text-white/90">
                    <span>{scrubInfo.pct}% completed</span>
                    <span className="num">Goal: 30 days</span>
                  </div>
                </div>

                <div className="text-xs text-[var(--label-2)] flex justify-between">
                  <span>Milestone status:</span>
                  <span className="font-semibold text-[var(--tide)]">
                    {scrubInfo.milestoneName || "Holding steady toward Day 7"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: "RIDE IT OUT" (URGES CREST, THEN THEY FALL)                   */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-[var(--separator)]" id="ride-it-out">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Scientific grounding */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block">
                The 3-minute game
              </span>

              <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)]">
                Urges crest. Then they fall.
              </h2>

              <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
                You don&apos;t fight a wave head-on. You ride it out. In a week-long study at the University of Plymouth, three minutes of a visual block puzzle made cravings noticeably weaker—for food, drink, and compulsive habits alike.
              </p>

              {/* Research Citation Card */}
              <div className="p-4 rounded-card bg-[var(--bg)] border border-[var(--separator)] flex gap-3 items-start">
                <BookOpen size={20} className="text-[var(--tide)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--label-2)] leading-relaxed">
                  <strong className="text-[var(--label)] font-semibold block mb-0.5">
                    Skorka-Brown et al., <em>Addictive Behaviors</em>, 2015.
                  </strong>
                  Visual-spatial working memory tasks compete directly with the mental imagery that sustains craving states.
                </div>
              </div>

              {/* Tool switch chips */}
              <div>
                <span className="text-xs font-medium text-[var(--label-3)] block mb-2">
                  Test the three urge tools:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "surf", label: "Wave hold", icon: Waves, sub: "Surfing tactile" },
                    { id: "swell", label: "Swell", icon: Wind, sub: "4s / 6s breath" },
                    { id: "drift", label: "Drift", icon: SquaresFour, sub: "Spatial raft" }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = urgeTool === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setUrgeTool(t.id as "surf" | "swell" | "drift")}
                        className={`p-3 rounded-card text-left border pressable transition-all ${
                          isSelected
                            ? "bg-[var(--bg)] border-[var(--tide)] shadow-xs"
                            : "bg-[var(--bg)] border-[var(--separator)]"
                        }`}
                      >
                        <Icon size={18} className="text-[var(--tide)] mb-1" />
                        <div className="font-semibold text-xs text-[var(--label)]">{t.label}</div>
                        <div className="text-[10px] text-[var(--label-3)]">{t.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Tactile Interactive Simulation */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-sheet bg-[var(--bg)] border border-[var(--separator)] shadow-lg">
                
                {/* Mode 1: Wave Surfing Hold */}
                {urgeTool === "surf" && (
                  <div>
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--separator)]">
                      <div>
                        <span className="text-xs text-[var(--label-2)] block">Urge buffer</span>
                        <h3 className="font-semibold text-base text-[var(--label)]">Surfing the crest</h3>
                      </div>
                      <span className="num text-xs font-semibold px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--label)]">
                        {wavePassed ? "Subsided" : "3 min countdown"}
                      </span>
                    </div>

                    <div className="h-44 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] relative overflow-hidden flex flex-col justify-end mb-6">
                      <motion.div
                        className="w-full bg-gradient-to-t from-[var(--tide-deep)] to-[var(--tide)] relative"
                        animate={{ height: `${waveProgress}%` }}
                        transition={{ duration: 0.1 }}
                      >
                        <div className="w-full h-1 bg-white/70 absolute top-0" />
                      </motion.div>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                        <span className={`font-semibold text-base sm:text-lg ${wavePassed ? "text-[var(--tide)]" : "text-[var(--label)]"}`}>
                          {wavePassed ? "Wave passed." : isHoldingWave ? "Holding the line..." : "Wave active"}
                        </span>
                        <span className="text-xs text-[var(--label-2)] mt-1">
                          {wavePassed ? "Horizon calm. Take a slow breath." : "Press and hold until water calms"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onMouseDown={startHoldWave}
                      onMouseUp={stopHoldWave}
                      onMouseLeave={stopHoldWave}
                      onTouchStart={startHoldWave}
                      onTouchEnd={stopHoldWave}
                      className="w-full h-[52px] rounded-btn bg-[var(--tide)] text-white font-semibold text-base flex items-center justify-center gap-2 select-none pressable shadow-sm"
                    >
                      <Fingerprint size={22} />
                      <span>{wavePassed ? "Hold to ride another wave" : isHoldingWave ? "Holding steady..." : "Hold to ride it out"}</span>
                    </button>
                    <p className="text-xs text-[var(--label-3)] text-center mt-3">
                      Sustain contact. Releasing early resets the wave.
                    </p>
                  </div>
                )}

                {/* Mode 2: Swell Breathing Pacer */}
                {urgeTool === "swell" && (
                  <div>
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--separator)]">
                      <div>
                        <span className="text-xs text-[var(--label-2)] block">Parasympathetic pacing</span>
                        <h3 className="font-semibold text-base text-[var(--label)]">Swell breathing</h3>
                      </div>
                      <span className="num text-xs font-semibold px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--label)]">
                        4s in / 6s out
                      </span>
                    </div>

                    <div className="h-44 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] flex items-center justify-center relative mb-6">
                      <motion.div
                        className="rounded-full bg-[var(--tide-wash)] border border-[var(--tide)]/40 flex items-center justify-center"
                        animate={{ scale: inhale ? 1.3 : 0.85 }}
                        transition={{ duration: inhale ? 4 : 6, ease: "easeInOut" }}
                        style={{ width: 110, height: 110 }}
                      >
                        <div className="text-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--tide)] block">
                            {inhale ? "Inhale" : "Exhale"}
                          </span>
                          <span className="num text-2xl font-bold text-[var(--label)]">
                            {breathCount}s
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    <p className="text-xs text-[var(--label-2)] text-center">
                      Extended exhale stimulates vagal parasympathetic tone, slowing heart rate within 90 seconds.
                    </p>
                  </div>
                )}

                {/* Mode 3: Drift Spatial Raft */}
                {urgeTool === "drift" && (
                  <div>
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--separator)]">
                      <div>
                        <span className="text-xs text-[var(--label-2)] block">Visual-spatial distraction</span>
                        <h3 className="font-semibold text-base text-[var(--label)]">Drift tile unblock</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDriftTiles([1, 2, 3, 4, 5, 0, 6, 7, 8]);
                        }}
                        className="text-xs text-[var(--tide)] hover:underline flex items-center gap-1"
                      >
                        <ArrowCounterClockwise size={12} />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="w-56 h-56 mx-auto grid grid-cols-3 gap-2 p-2 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] mb-4">
                      {driftTiles.map((val, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => moveDriftTile(idx)}
                          className={`rounded-lg num font-semibold text-sm flex items-center justify-center transition-all ${
                            val === 0
                              ? "bg-transparent cursor-default"
                              : "bg-[var(--bg)] border border-[var(--separator)] text-[var(--label)] hover:border-[var(--tide)] pressable shadow-2xs"
                          }`}
                        >
                          {val !== 0 && val}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-[var(--label-3)] text-center">
                      Tap adjacent numbers to slide into the space. Visual load interrupts cognitive cravings.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: PACTS (QUIET ACCOUNTABILITY WITH FRIENDS YOU TRUST)           */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[var(--bg)] border-b border-[var(--separator)]" id="pacts">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mx-auto text-center mb-12">
            <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block mb-3">
              Quiet accountability
            </span>
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-4">
              Bring the friends who&apos;ll actually check.
            </h2>
            <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
              Handles, not names. Your pact sees your number, never why it reset. No public feeds, no commentary threads, no likes.
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-sheet bg-[var(--bg)] border border-[var(--separator)] shadow-lg p-5 sm:p-7">
            
            {/* Header with Segmented Control (DESIGN.md section 4) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-2 border-b border-[var(--separator)]">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-[var(--tide)]" />
                  <h3 className="font-semibold text-base text-[var(--label)]">The Dawn Crew</h3>
                </div>
                <p className="text-xs text-[var(--label-2)]">4 members · Private circle</p>
              </div>

              {/* Segmented Control */}
              <div className="inline-flex p-1 rounded-full bg-[var(--bg-tertiary)] self-start sm:self-auto text-xs font-medium">
                {(["current", "best", "days"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPactTab(tab)}
                    className={`px-3 py-1 rounded-full capitalize transition-all pressable ${
                      pactTab === tab
                        ? "bg-[var(--bg)] text-[var(--label)] font-semibold shadow-2xs"
                        : "text-[var(--label-2)]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Inset Grouped Rows */}
            <div className="divide-y divide-[var(--separator)]">
              {pactMembers[pactTab].map((m) => (
                <div
                  key={m.handle}
                  className={`py-3.5 px-3 flex items-center justify-between gap-3 rounded-cell transition-colors ${
                    m.isYou ? "bg-[var(--tide-wash)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="num text-xs font-semibold text-[var(--label-2)] w-4 text-center">
                      {m.rank}
                    </span>
                    <Pebble seed={m.seed} size={32} label={m.handle} />
                    <div>
                      <div className="font-semibold text-sm text-[var(--label)] flex items-center gap-1.5">
                        <span>{m.handle}</span>
                        {m.isYou && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--tide)] text-white">
                            YOU
                          </span>
                        )}
                        {m.isBrass && (
                          <Sparkle size={12} weight="fill" className="text-[var(--brass)]" />
                        )}
                        {m.isPaused && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-tertiary)] text-[var(--label-3)]">
                            Paused
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--label-2)] block">{m.note}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="num text-sm font-semibold text-[var(--label)]">
                      {m.score}
                    </span>
                    {!m.isYou && !m.isPaused && (
                      <button
                        type="button"
                        onClick={() => triggerHud(`Nudge sent to ${m.handle}.`)}
                        className="h-[30px] px-3 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--separator)] text-xs font-semibold text-[var(--label)] pressable"
                      >
                        Nudge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--separator)] flex justify-between items-center text-xs text-[var(--label-3)]">
              <span>Encrypted broadcast. No chat feeds.</span>
              <button
                type="button"
                onClick={() => triggerHud("Pact invite link copied.")}
                className="text-[var(--tide)] font-semibold hover:underline"
              >
                + Invite fifth friend
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: WAR CHEST (SKIN IN THE GAME)                                  */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-[var(--separator)]" id="war-chest">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* The Chest Card (DESIGN.md section 4: never red, never lost) */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-sheet bg-[var(--bg)] border border-[var(--separator)] shadow-lg">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--separator)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-card bg-[var(--tide-wash)] text-[var(--tide)] flex items-center justify-center">
                      <Lock size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[var(--label)]">War Chest Commitment</h3>
                      <span className="text-xs text-[var(--label-3)]">Offered once · Optional</span>
                    </div>
                  </div>
                  
                  {/* Currency selector */}
                  <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-tertiary)] text-xs">
                    <button
                      type="button"
                      onClick={() => { setCurrency("INR"); setChestAmount(499); }}
                      className={`px-2 py-0.5 rounded-full font-semibold ${currency === "INR" ? "bg-[var(--bg)] text-[var(--label)]" : "text-[var(--label-2)]"}`}
                    >
                      ₹ INR
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCurrency("USD"); setChestAmount(20); }}
                      className={`px-2 py-0.5 rounded-full font-semibold ${currency === "USD" ? "bg-[var(--bg)] text-[var(--label)]" : "text-[var(--label-2)]"}`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>

                {/* Amount selection chips (nothing preselected by default on first visit) */}
                <div className="mb-5">
                  <span className="text-xs font-semibold text-[var(--label-2)] block mb-2">
                    Select commitment amount:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setChestAmount(amt)}
                        className={`num h-9 px-3.5 rounded-full text-xs font-semibold pressable transition-all ${
                          chestAmount === amt
                            ? "bg-[var(--tide)] text-white shadow-2xs"
                            : "bg-[var(--bg-tertiary)] text-[var(--label)] hover:bg-[var(--separator)]"
                        }`}
                      >
                        {currencySymbol}{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total amount display */}
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm text-[var(--label-2)]">Amount committed</span>
                  <span className="num text-3xl font-bold text-[var(--label)]">
                    {currencySymbol}{chestAmount}
                  </span>
                </div>

                {/* Two-part bar (DESIGN.md section 4: still yours in --tide, given to cause in --label-3 with heart. Never red.) */}
                <div className="h-3 w-full rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex mb-2">
                  <div className="h-full bg-[var(--tide)] rounded-l-full transition-all" style={{ width: "75%" }} />
                  <div className="h-full bg-[var(--label-3)] rounded-r-full transition-all" style={{ width: "25%" }} />
                </div>

                <div className="flex justify-between text-xs font-medium mb-6">
                  <span className="text-[var(--tide)] font-semibold flex items-center gap-1">
                    <span>{currencySymbol}{retainedAmount} still yours if you keep going (75%)</span>
                  </span>
                  <span className="text-[var(--label-2)] flex items-center gap-1">
                    <Heart size={12} weight="fill" className="text-[var(--label-3)]" />
                    <span>{currencySymbol}{donatedAmount} to cause if reset (25%)</span>
                  </span>
                </div>

                {/* Designated Cause */}
                <div className="p-3.5 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] mb-4">
                  <label className="text-xs font-medium text-[var(--label-2)] block mb-1">
                    Designated cause:
                  </label>
                  <select
                    value={selectedCause}
                    onChange={(e) => setSelectedCause(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--separator)] text-[var(--label)] outline-none focus:border-[var(--tide)]"
                  >
                    <option value="The Ocean Cleanup">The Ocean Cleanup (Marine conservation)</option>
                    <option value="GiveDirectly Poverty Fund">GiveDirectly (Direct unconditional transfers)</option>
                    <option value="Tele-MANAS Crisis Support">Tele-MANAS (Mental health helpline)</option>
                  </select>
                </div>

                {/* Promise mode checkbox */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--separator)] text-xs text-[var(--label-2)]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPromiseMode}
                      onChange={(e) => setIsPromiseMode(e.target.checked)}
                      className="accent-[var(--tide)] w-4 h-4 rounded"
                    />
                    <span>Promise mode (honor system, donate directly if you slip)</span>
                  </label>
                </div>

              </div>
            </div>

            {/* Right: Copy & Evidence */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block">
                Skin in the game
              </span>

              <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)]">
                Put something on it.
              </h2>

              <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
                Pick an amount and a cause you care about. Each reset sends a quarter of it to that cause. Make it to December 1st, and whatever is left returns to your account. WillWar never keeps any of it.
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--label-2)]">
                <span className="px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--separator)]">
                  Optional. Free to skip.
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--separator)]">
                  Zero platform take.
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--separator)]">
                  Funds return on Dec 1.
                </span>
              </div>

              <div className="p-4 rounded-card bg-[var(--bg)] border border-[var(--separator)]">
                <p className="text-xs text-[var(--label-2)] leading-relaxed">
                  <strong className="text-[var(--label)] font-semibold">Behavioral economics foundation:</strong> &ldquo;In a field study, smokers offered a commitment contract with their own money returned on success and given to charity otherwise were substantially more likely to quit.&rdquo;
                  <span className="block text-[var(--tide)] font-medium mt-1">
                    Giné, Karlan and Zinman, <em>American Economic Review</em>, 2010.
                  </span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: STRAIGHT ANSWERS, GRADED (EVIDENCE LIBRARY)                    */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[var(--bg)] border-b border-[var(--separator)]" id="evidence">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-12">
            <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block mb-3">
              Research library
            </span>
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-4">
              Straight answers, graded.
            </h2>
            <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
              When the internet makes claims about testosterone, superpowers, or brain chemistry, we check the actual published papers. Every article shows its evidence grade, sources, and limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Article 1: Day 7 Myth */}
            <article className="p-6 rounded-sheet bg-[var(--bg-grouped)] border border-[var(--separator)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--separator)] text-[var(--label-2)]">
                    Myth
                  </span>
                  <span className="text-xs text-[var(--label-3)]">4 min read</span>
                </div>
                <h3 className="font-semibold text-base text-[var(--label)] mb-2 leading-snug">
                  The day-7 testosterone claim, traced to its source
                </h3>
                <p className="text-xs sm:text-sm text-[var(--label-2)] leading-relaxed">
                  A 2003 study of 28 men showed a brief spike on day 7 that returned to baseline. The paper was retracted for duplicating earlier work. No research since has shown lasting hormonal changes.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--separator)] text-xs text-[var(--label-3)]">
                Source: Jiang et al. 2003 (retracted)
              </div>
            </article>

            {/* Article 2: Three minutes puzzle */}
            <article className="p-6 rounded-sheet bg-[var(--bg-grouped)] border border-[var(--separator)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--tide-wash)] text-[var(--tide)]">
                    Moderate
                  </span>
                  <span className="text-xs text-[var(--label-3)]">5 min read</span>
                </div>
                <h3 className="font-semibold text-base text-[var(--label)] mb-2 leading-snug">
                  Three minutes of a puzzle versus a craving
                </h3>
                <p className="text-xs sm:text-sm text-[var(--label-2)] leading-relaxed">
                  Plymouth laboratory and field trials showed an approximate 20% drop in craving intensity after three minutes of a block puzzle. Visual tasks compete directly with craving mental imagery.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--separator)] text-xs text-[var(--label-3)]">
                Source: Skorka-Brown et al. 2015
              </div>
            </article>

            {/* Article 3: Abstinence Violation Effect */}
            <article className="p-6 rounded-sheet bg-[var(--bg-grouped)] border border-[var(--separator)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--tide-wash)] text-[var(--tide)]">
                    Moderate
                  </span>
                  <span className="text-xs text-[var(--label-3)]">6 min read</span>
                </div>
                <h3 className="font-semibold text-base text-[var(--label)] mb-2 leading-snug">
                  Why one slip turns into a week, and how to stop it
                </h3>
                <p className="text-xs sm:text-sm text-[var(--label-2)] leading-relaxed">
                  The Abstinence Violation Effect: the cognitive trap where people decide that because perfection broke, total collapse is justified. Fast, shame-free resets prevent a slip from becoming a month.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--separator)] text-xs text-[var(--label-3)]">
                Source: Marlatt & Gordon, Relapse Prevention
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: DISCREET & PRIVATE BY DEFAULT                                 */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-[var(--separator)]" id="privacy">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-12">
            <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block mb-3">
              Privacy architecture
            </span>
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-4">
              Your streak is yours.
            </h2>
            <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
              We designed WillWar around the premise that vulnerability requires zero audience. What happens on your device stays on your physical hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Users,
                title: "We never ask for your real name.",
                desc: "Pick any handle you want for pacts. No contacts book scraping, no email directory searches, and zero automated social linking."
              },
              {
                icon: Lock,
                title: "Your journal stays on your phone.",
                desc: "Urge triggers and notes are saved directly in local IndexedDB. Unless you opt into encrypted cloud backup, notes never leave your browser."
              },
              {
                icon: EyeSlash,
                title: "Discreet notifications by default.",
                desc: "Lock screens say: 'WillWar · Day 12. Tap to check in.' They never mention challenges, streaks, or sexual habits."
              },
              {
                icon: Trash,
                title: "Delete everything in one tap.",
                desc: "A single clean button in Settings clears your local database, cookies, and removes your handle from pacts immediately."
              }
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="p-6 rounded-card bg-[var(--bg)] border border-[var(--separator)] flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-cell bg-[var(--tide-wash)] text-[var(--tide)] flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[var(--label)] mb-1">{p.title}</h3>
                    <p className="text-xs sm:text-sm text-[var(--label-2)] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: ACCESS & PRICING                                              */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[var(--bg)] border-b border-[var(--separator)]" id="access">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mx-auto text-center mb-12">
            <span className="text-xs font-semibold text-[var(--tide)] px-2.5 py-1 rounded-full bg-[var(--tide-wash)] inline-block mb-3">
              Clear terms
            </span>
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-4">
              Transparent access. No dark patterns.
            </h2>
            <p className="text-base sm:text-lg text-[var(--label-2)] leading-relaxed">
              Free is completely functional for 30 days. Pro adds deep ergonomics, audio coaching, and zero commercial interruptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* Free */}
            <div className="p-7 sm:p-8 rounded-sheet bg-[var(--bg-grouped)] border border-[var(--separator)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl text-[var(--label)]">Free</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg)] text-[var(--label-2)]">
                    Standard
                  </span>
                </div>
                <div className="num text-3xl font-bold text-[var(--label)] mb-4">
                  ₹0 <span className="text-sm font-normal text-[var(--label-2)]">/ always free</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--label-2)] pb-4 mb-4 border-b border-[var(--separator)]">
                  The complete navigational toolkit to hold the line to December 1st without financial obligation.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--label)] mb-8">
                  {[
                    "Streak clock counting down to second",
                    "Daily check-in & morning line",
                    "Two urge games (Drift & Swell)",
                    "One pact circle (up to 5 friends)",
                    "All research & evidence articles",
                    "Includes non-personalized static ads"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={16} className="text-[var(--tide)] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsPledgeModalOpen(true)}
                className="w-full h-[48px] rounded-btn bg-[var(--bg)] hover:bg-[var(--bg-tertiary)] text-[var(--label)] font-semibold text-sm border border-[var(--separator)] pressable"
              >
                Start free
              </button>
            </div>

            {/* Pro Pass */}
            <div className="p-7 sm:p-8 rounded-sheet bg-[var(--bg-grouped)] border-2 border-[var(--tide)] flex flex-col justify-between relative shadow-md">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl text-[var(--label)]">Pro Pass</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--tide)] text-white">
                    Season pass
                  </span>
                </div>
                <div className="num text-3xl font-bold text-[var(--label)] mb-4">
                  ₹149 <span className="text-sm font-normal text-[var(--label-2)]">or $3.99 / season</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--label-2)] pb-4 mb-4 border-b border-[var(--separator)]">
                  For adults seeking deeper telemetry, guided audio coaching sessions, and zero commercial noise.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--label)] mb-8">
                  <li className="flex items-center gap-2 font-semibold text-[var(--tide)]">
                    <CheckCircle size={16} weight="fill" className="shrink-0" />
                    <span>Everything in Free</span>
                  </li>
                  {[
                    "Third urge game (Knots)",
                    "Audio urge sessions with coach",
                    "Unlimited pacts up to 50 members",
                    "Hour-by-hour trigger analytics",
                    "2 streak shields per month",
                    "Encrypted private journal backup",
                    "Zero advertisements ever"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={16} className="text-[var(--tide)] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsPledgeModalOpen(true)}
                className="w-full h-[48px] rounded-btn bg-[var(--tide)] text-white font-semibold text-sm pressable shadow-xs"
              >
                Get Pro Pass
              </button>
            </div>

          </div>

          <p className="text-center text-xs text-[var(--label-3)] mt-8 max-w-md mx-auto">
            The War Chest is separate, completely optional and available on Free and Pro alike. Safety features—Ride it out, resets, data export, and crisis helplines—are never paywalled.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: FREQUENTLY ASKED QUESTIONS                                    */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-[var(--separator)]" id="faq">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight leading-[1.08] text-[var(--label)] mb-3">
              Frequently asked questions.
            </h2>
            <p className="text-base text-[var(--label-2)]">
              Clear, unvarnished policies on installation, age restrictions, and streak resets.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-card bg-[var(--bg)] border border-[var(--separator)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-semibold text-sm sm:text-base text-[var(--label)] flex justify-between items-center gap-4 pressable"
                  >
                    <span>{faq.q}</span>
                    <CaretDown
                      size={18}
                      className={`text-[var(--tide)] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[var(--label-2)] leading-relaxed border-t border-[var(--separator)]/50 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION BANNER                                              */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-24 text-center">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-5">
            <Mark size={36} tile />
          </div>
          <h2 className="text-[clamp(32px,4.5vw,48px)] font-bold tracking-tight text-[var(--label)] mb-4 leading-tight">
            The clock starts when you say it does.
          </h2>
          <p className="text-base sm:text-lg text-[var(--label-2)] mb-8">
            No email verification bottlenecks. No App Store gatekeepers. Install to your home screen in 10 seconds.
          </p>
          <button
            type="button"
            onClick={() => setIsPledgeModalOpen(true)}
            className="h-[52px] px-8 rounded-btn bg-[var(--tide)] text-white text-base font-semibold pressable shadow-sm"
          >
            Start my 30 days
          </button>
          <span className="block text-xs text-[var(--label-3)] mt-3">
            Off-season target: 30 days through December 1st.
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                   */}
      {/* ========================================================================= */}
      <footer className="bg-[var(--bg)] border-t border-[var(--separator)] pt-16 pb-12 text-sm text-[var(--label-2)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[var(--separator)]">
            <div className="md:col-span-2 space-y-3">
              <Wordmark />
              <p className="text-xs text-[var(--label-2)] max-w-xs leading-relaxed">
                A 30-day streak tracker for adults. Built on cognitive load theory, quiet accountability, and zero hyperbole.
              </p>
              <div className="text-[11px] text-[var(--label-3)]">
                Built for mobile Safari PWA.
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--label)] mb-3">Product</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#timeline" className="hover:text-[var(--tide)]">30-day timeline</a></li>
                <li><a href="#ride-it-out" className="hover:text-[var(--tide)]">Ride it out</a></li>
                <li><a href="#pacts" className="hover:text-[var(--tide)]">Private pacts</a></li>
                <li><a href="#war-chest" className="hover:text-[var(--tide)]">War chest</a></li>
                <li><a href="#access" className="hover:text-[var(--tide)]">Pro pass</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--label)] mb-3">Evidence</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#evidence" className="hover:text-[var(--tide)]">Evidence library</a></li>
                <li><a href="#evidence" className="hover:text-[var(--tide)]">Cognitive load study</a></li>
                <li><a href="#evidence" className="hover:text-[var(--tide)]">Testosterone myth</a></li>
                <li><a href="#evidence" className="hover:text-[var(--tide)]">Relapse prevention</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--label)] mb-3">Legal & Safety</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#privacy" className="hover:text-[var(--tide)]">Privacy architecture</a></li>
                <li><a href="#" className="hover:text-[var(--tide)]">18+ verification policy</a></li>
                <li><a href="#" className="hover:text-[var(--tide)]">Terms of service</a></li>
                <li><a href="#" className="hover:text-[var(--tide)]">Tele-MANAS (14416)</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--label-3)]">
            <div>18+ only. Not medical advice. © WillWar. All rights reserved.</div>
            <div className="flex items-center gap-3 num">
              <span>Local device storage</span>
              <span>·</span>
              <span className="text-[var(--tide)] font-semibold">Tide Engine v2.4</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* FREE PLEDGE COMMITMENT DRAWER (DESIGN.md section 4: Hold to sign)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPledgeModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-[var(--bg)] w-full max-w-md rounded-sheet p-6 sm:p-7 border border-[var(--separator)] shadow-2xl relative"
            >
              <div className="w-9 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[var(--tide)]">Free commitment</span>
                <button
                  type="button"
                  onClick={() => setIsPledgeModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--label-2)] hover:text-[var(--label)] pressable"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-bold text-[var(--label)] mb-2">
                I hold the line until December 1st.
              </h3>
              <p className="text-xs text-[var(--label-2)] leading-relaxed mb-5">
                Thirty days of clean wakeups, three minutes when urges crest, and real accountability with friends I trust.
              </p>

              <div className="mb-5">
                <label className="text-xs font-medium text-[var(--label-2)] block mb-1">
                  Choose your pact handle (never your real name):
                </label>
                <input
                  type="text"
                  value={pledgeHandle}
                  onChange={(e) => setPledgeHandle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-card bg-[var(--bg-grouped)] border border-[var(--separator)] text-sm font-semibold text-[var(--label)] outline-none focus:border-[var(--tide)]"
                />
              </div>

              {!isPledgeSigned ? (
                <div className="relative h-14 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-3">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--tide)] transition-all"
                    style={{ width: `${pledgeHoldProgress}%` }}
                  />
                  <button
                    type="button"
                    onMouseDown={startHoldPledge}
                    onMouseUp={stopHoldPledge}
                    onMouseLeave={stopHoldPledge}
                    onTouchStart={startHoldPledge}
                    onTouchEnd={stopHoldPledge}
                    className="absolute inset-0 w-full h-full flex items-center justify-center gap-2 text-sm font-semibold text-[var(--label)] z-10 select-none pressable"
                  >
                    <Fingerprint size={20} />
                    <span>Hold to sign pledge (or Space)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-card bg-[var(--brass)]/10 border border-[var(--brass)] text-center mb-3">
                  <span className="text-xs font-semibold text-white bg-[var(--brass)] px-2.5 py-0.5 rounded-full inline-block mb-1">
                    PLEDGE SEALED
                  </span>
                  <div className="font-bold text-sm text-[var(--label)]">{pledgeHandle}</div>
                  <div className="text-xs text-[var(--label-2)]">Your clock is active. Off-season begins now.</div>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsPledgeModalOpen(false)}
                  className="text-xs text-[var(--label-3)] hover:text-[var(--label-2)] pressable"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
