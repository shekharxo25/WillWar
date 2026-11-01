"use client";

import { ChatsCircle, HandWaving, PersonSimpleWalk, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IntensityScale } from "@/components/ui/Controls";
import { useHud } from "@/components/ui/Hud";
import { useWillWar } from "@/lib/store/provider";
import { wavesRidden } from "@/lib/store/snapshot";
import { errorMessage } from "@/lib/store/types";
import { useUrgeFlow } from "./UrgeFlow";

/** U4 "How strong is it now?" then U5 "Wave passed." */
export function UrgeDone() {
  const router = useRouter();
  const flow = useUrgeFlow();
  const { store, snapshot, isPro, refresh } = useWillWar();
  const hud = useHud();
  const [phase, setPhase] = useState<"rate" | "summary">("rate");
  const saving = useRef(false);

  useEffect(() => {
    if (!flow.game) router.replace("/app/urge");
  }, [flow.game, router]);

  const save = async (after: number | null) => {
    if (saving.current || flow.saved || !flow.game) return setPhase("summary");
    saving.current = true;
    flow.set({ after, saved: true });
    try {
      await store.saveUrgeSession({
        game: flow.game,
        durationS: Math.min(1800, flow.playedS),
        intensityBefore: flow.before,
        intensityAfter: after,
        completed: flow.completed,
      });
      await refresh();
    } catch (e) {
      hud(errorMessage(e));
    }
    setPhase("summary");
    hud("Wave passed.");
  };

  if (!flow.game) return null;

  if (phase === "rate") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+56px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <h1 className="text-large-title font-bold">How strong is it now?</h1>
        <div className="mt-6 rounded-sheet bg-white/[0.06] p-4">
          <IntensityScale value={flow.after} onChange={(v) => flow.set({ after: v })} label="Urge strength now" inverted />
        </div>
        <div className="mt-auto grid gap-2 pt-8">
          <button
            type="button"
            disabled={flow.after === null}
            onClick={() => void save(flow.after)}
            className="pressable flex h-[52px] items-center justify-center rounded-btn bg-white text-headline font-semibold text-tide-deep disabled:opacity-40"
          >
            Continue
          </button>
          <button type="button" onClick={() => void save(null)} className="pressable min-h-11 text-headline text-white/80">
            Skip
          </button>
        </div>
      </main>
    );
  }

  const before = flow.before;
  const after = flow.after;
  const waves = snapshot ? wavesRidden(snapshot) : 0;
  const stillHigh = after !== null && after >= 8;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+48px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <h1 className="text-large-title font-bold">Wave passed.</h1>
      {before !== null && after !== null ? (
        <div className="mt-6 flex items-center justify-center gap-4 rounded-sheet bg-white/[0.06] p-6" aria-label={`From ${before} to ${after}`}>
          <span className="num text-[3.5rem] leading-none font-semibold">{before}</span>
          <svg viewBox="0 0 120 40" className="h-10 w-28" aria-hidden>
            <path d="M2 8 C 30 8, 40 32, 60 26 S 95 34, 118 34" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="num text-[3.5rem] leading-none font-semibold text-white">{after}</span>
        </div>
      ) : (
        <p className="mt-3 text-body text-white/75">You gave it {Math.max(1, Math.round(flow.playedS / 60))} minutes instead of giving in.</p>
      )}
      <p className="mt-4 text-body text-white/80">
        Waves ridden: <span className="num font-semibold text-white">{waves}</span>
      </p>

      {stillHigh && (
        <section className="mt-6 grid gap-2" aria-label="More support">
          <SupportRow href="/app/pact" icon={<HandWaving size={20} aria-hidden />} title="Send your ally a nudge" />
          <SupportRow href={isPro ? "/app/coach" : "/app/pro"} icon={<ChatsCircle size={20} aria-hidden />} title="Talk it through" note={isPro ? undefined : "Pro"} />
          <SupportRow icon={<PersonSimpleWalk size={20} aria-hidden />} title="Step outside or do 20 squats" />
        </section>
      )}

      <div className="mt-auto grid gap-2 pt-8">
        <Link href="/app/today" className="pressable flex h-[52px] items-center justify-center rounded-btn bg-white text-headline font-semibold text-tide-deep">
          Back to Today
        </Link>
        <button
          type="button"
          onClick={() => {
            flow.reset();
            router.replace("/app/urge");
          }}
          className="pressable flex h-[52px] items-center justify-center rounded-btn bg-white/10 text-headline"
        >
          Play another round
        </button>
        {!isPro && !stillHigh && <RewardedShield />}
      </div>
    </main>
  );
}

function SupportRow({ href, icon, title, note }: { href?: string; icon: React.ReactNode; title: string; note?: string }) {
  const inner = (
    <span className="flex min-h-[52px] items-center gap-3 rounded-card bg-white/[0.08] px-4">
      {icon}
      <span className="flex-1 text-body">{title}</span>
      {note && <span className="rounded-full bg-white/15 px-2 py-0.5 text-footnote">{note}</span>}
    </span>
  );
  return href ? (
    <Link href={href} className="pressable block">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

/**
 * Opt-in rewarded break (ads-monetization.md): free tier only, after a game, never
 * before or during one. House message in this build; H5 rewarded ads when approved.
 */
function RewardedShield() {
  const { store, refresh } = useWillWar();
  const hud = useHud();
  const [phase, setState] = useState<"idle" | "watching" | "done">("idle");
  const [left, setLeft] = useState(15);
  const state = phase === "watching" && left <= 0 ? "ready" : phase;

  useEffect(() => {
    if (phase !== "watching" || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  const collect = async () => {
    try {
      await store.grantRewardedShield();
      await refresh();
      hud("Shield earned.", <ShieldCheck size={18} weight="fill" />);
      setState("done");
    } catch (e) {
      hud(errorMessage(e));
      setState("done");
    }
  };

  if (state === "done") return null;
  if (state === "idle") {
    return (
      <button type="button" onClick={() => setState("watching")} className="pressable mt-3 flex min-h-11 items-center justify-center gap-2 text-subhead text-white/70">
        <ShieldCheck size={16} aria-hidden /> Earn a streak shield. Watch a short message.
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-card border-[0.5px] border-white/25 p-4">
      <p className="text-footnote text-white/60">Sponsored</p>
      <p className="mt-1 text-headline">Invite your ally.</p>
      <p className="text-subhead text-white/75">Pacts are small groups of friends who see each other&apos;s streaks. Free for up to five.</p>
      {state === "ready" ? (
        <button type="button" onClick={collect} className="pressable mt-3 flex h-11 w-full items-center justify-center rounded-btn bg-white text-headline text-tide-deep">
          Collect shield
        </button>
      ) : (
        <p className="num mt-3 text-center text-subhead text-white/70">Your shield is ready in {left}s</p>
      )}
    </div>
  );
}
