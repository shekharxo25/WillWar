"use client";
import { useState } from "react";
import { useMounted } from "./useMounted";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, LockSimple } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Paywall } from "@/components/pro/Paywall";
import { FocusMitt, HeavyBag, KitbagIcon } from "@/components/illustrations";
import { isPro } from "@/lib/store/engine";
import type { Game } from "@/lib/store/types";
import { GAMES } from "./types";
import { readRound, writeRound } from "./roundState";
import { IntensityStep } from "./IntensityStep";

const ICONS: Record<Game, React.ReactNode> = {
  kitbag: <KitbagIcon size={32} />,
  bag: <HeavyBag size={32} />,
  combos: <FocusMitt size={32} />,
};

/** R1 "HOW STRONG IS IT?" then R2 "PICK YOUR ROUND." */
export function RoundStart() {
  const { snap } = useApp();
  const router = useRouter();
  const mounted = useMounted();
  const [chosenStep, setStep] = useState<"r1" | "r2" | null>(null);
  const [paywall, setPaywall] = useState(false);
  const pro = mounted && !!snap && isPro(snap.entitlement, new Date());
  // "Go another round" lands straight on R2 with the last score kept.
  const again = mounted && new URLSearchParams(window.location.search).get("again") === "1" && !!readRound();
  const step = chosenStep ?? (again ? "r2" : "r1");

  if (step === "r1")
    return (
      <IntensityStep
        title="HOW STRONG IS IT?"
        closeHref="/app/today"
        onPick={(n) => {
          writeRound({ before: n });
          setStep("r2");
        }}
      />
    );

  const choose = (g: Game, locked: boolean) => {
    if (locked) return setPaywall(true);
    writeRound({ before: readRound()?.before ?? null, game: g });
    const fast = process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("dev_fast");
    router.push(`/app/round/${g}${fast ? "?dev_fast=1" : ""}`);
  };

  return (
    <div className="pt-safe flex min-h-dvh flex-col px-4 pb-safe min-[414px]:px-5">
      <div className="flex h-11 items-center">
        <button type="button" onClick={() => setStep("r1")} aria-label="Back" className="press -ml-2 flex h-11 w-11 items-center justify-center">
          <CaretLeft weight="bold" size={22} />
        </button>
      </div>
      <h1 className="display text-[40px] leading-[40px]">PICK YOUR ROUND.</h1>
      <ul className="mt-6 space-y-3">
        {GAMES.map((g) => {
          const locked = g.pro && !pro;
          return (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => choose(g.id, locked)}
                className="press flex w-full items-center gap-4 rounded-card bg-raised p-5 text-left"
              >
                <span className="shrink-0 text-text-2">{ICONS[g.id]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] leading-[22px] font-semibold">{g.name}</span>
                  <span className="block text-[15px] leading-5 text-text-2">{g.line}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-[13px] leading-[18px] text-text-2">
                  <span>3 min</span>
                  <span className="flex items-center gap-1">
                    {locked && <LockSimple size={13} weight="bold" aria-hidden />}
                    {g.pro ? "Pro" : "Free"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[13px] leading-[18px] text-text-2">
        Three minutes, the length of a pro boxing round. You don&apos;t have to knock it out. You have to last it.
      </p>
      <div className="mt-auto pb-6 pt-6">
        <Link href="/app/today" className="press flex min-h-[44px] items-center justify-center text-[17px]">
          Back to Today
        </Link>
      </div>
      <Sheet open={paywall} onOpenChange={setPaywall} title="WILLWAR PRO" description="Combos is part of Pro. Kitbag and Bag stay free." detent="large">
        <Paywall source="feature" onContinueFree={() => setPaywall(false)} onPro={() => setPaywall(false)} />
      </Sheet>
    </div>
  );
}
