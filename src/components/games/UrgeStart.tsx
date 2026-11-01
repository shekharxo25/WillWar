"use client";

import { CheckCircle, Lock, Play, SquaresFour, Graph, Waves, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IntensityScale } from "@/components/ui/Controls";
import { Sheet } from "@/components/ui/Sheet";
import { GAMES, type Game, PRO_GAMES } from "@/lib/domain/constants";
import { useWillWar } from "@/lib/store/provider";
import { GAME_INFO, useUrgeFlow } from "./UrgeFlow";

const ICONS: Record<Game, ReactNode> = {
  drift: <SquaresFour size={24} aria-hidden />,
  swell: <Waves size={24} aria-hidden />,
  knots: <Graph size={24} aria-hidden />,
};

/** U1 + U2: "How strong is it right now?" then pick a 3-minute game. */
export function UrgeStart() {
  const router = useRouter();
  const flow = useUrgeFlow();
  const { isPro } = useWillWar();
  const [game, setGame] = useState<Game>("swell");
  const [proOpen, setProOpen] = useState(false);

  const start = () => {
    if (PRO_GAMES.includes(game) && !isPro) return setProOpen(true);
    flow.set({ game, playedS: 0, completed: false, after: null, saved: false });
    const go = () => router.push(`/app/urge/${game}`);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(go);
    else go();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="flex h-11 items-center justify-between">
        <Link href="/app/today" aria-label="Close" className="pressable -ml-1 flex size-11 items-center justify-center rounded-full bg-white/10">
          <X size={20} aria-hidden />
        </Link>
        <span className="text-headline">Ride it out</span>
        <span className="size-11" />
      </div>

      <h1 className="mt-6 text-large-title font-bold text-balance">How strong is it right now?</h1>
      <p className="mt-1 text-body text-white/70">Rating it takes a moment of distance.</p>
      <div className="mt-5 rounded-sheet bg-white/[0.06] p-4">
        <IntensityScale value={flow.before} onChange={(v) => flow.set({ before: v })} label="Urge strength now" inverted />
        <p className="mt-2 text-center text-footnote text-white/60">Optional. You can start a game without rating it.</p>
      </div>

      <h2 className="mt-8 text-title-2 font-bold">Pick a game.</h2>
      <div className="mt-3 grid gap-2.5" role="radiogroup" aria-label="Game">
        {GAMES.map((g) => {
          const selected = game === g;
          const locked = PRO_GAMES.includes(g) && !isPro;
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setGame(g)}
              className={`pressable flex items-center gap-3 rounded-card p-4 text-left ${selected ? "bg-white/15 ring-2 ring-white/70" : "bg-white/[0.06]"}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">{ICONS[g]}</span>
              <span className="flex-1">
                <span className="flex items-center gap-2 text-headline">
                  {GAME_INFO[g].name}
                  <span className="text-footnote text-white/60">3 min</span>
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-footnote">
                      <Lock size={12} aria-hidden /> Pro
                    </span>
                  )}
                </span>
                <span className="block text-subhead text-white/70">{GAME_INFO[g].line}</span>
              </span>
              {selected && <CheckCircle size={24} weight="fill" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={start}
          className="pressable flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-white text-headline font-semibold text-tide-deep"
        >
          <Play size={18} weight="fill" aria-hidden />
          Start {GAME_INFO[game].name} (3 min)
        </button>
      </div>

      <Sheet open={proOpen} onOpenChange={setProOpen} title="Knots is part of Pro." description="Drift and Swell are always free. Pro adds Knots, the coach and more.">
        <div className="grid gap-2">
          <Link href="/app/pro" className="pressable flex h-[50px] items-center justify-center rounded-btn bg-tide text-headline font-semibold text-on-tide">
            See Pro
          </Link>
          <Button variant="secondary" full onClick={() => (setProOpen(false), setGame("swell"))}>
            Play Swell instead
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
