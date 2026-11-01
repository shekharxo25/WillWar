"use client";

import { ArrowCounterClockwise, Check, Lock, SealCheck, ShieldCheck, Trophy } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Gate } from "@/components/app/Gate";
import { LargeTitle, OfflineBanner } from "@/components/app/AppChrome";
import { InstallCell } from "@/components/app/InstallCoach";
import { Button } from "@/components/ui/Button";
import { Cell, InsetGroup } from "@/components/ui/List";
import { useHud } from "@/components/ui/Hud";
import { Pebble } from "@/components/ui/Pebble";
import { publicEnv } from "@/env";
import { formatMoney, isPaused } from "@/lib/domain/rules";
import type { Snapshot } from "@/lib/domain/types";
import { useNow, useWillWar } from "@/lib/store/provider";
import {
  activeChest,
  availableShields,
  chestRemaining,
  checkedInToday,
  dayNumber,
  hasStarted,
  lastCheckin,
  today,
} from "@/lib/store/snapshot";
import { useAction } from "@/lib/store/use-action";
import { addDays, formatInstantShort, localDate } from "@/lib/time";
import { MorningLine } from "./MorningLine";
import { AfterReset, ResetSheet, type ResetOutcome, ShieldSheet, WarChestOfferSheet } from "./Sheets";
import { TideCard } from "./TideCard";

export function TodayScreen() {
  return <Gate>{(s) => <Today snapshot={s} />}</Gate>;
}

function Today({ snapshot }: { snapshot: Snapshot }) {
  const { store, online } = useWillWar();
  const now = useNow(1000);
  const hud = useHud();
  const { run, busy } = useAction();
  const [resetOpen, setResetOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [afterReset, setAfterReset] = useState<ResetOutcome | null>(null);
  const offerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const started = hasStarted(snapshot, now);
  const held = checkedInToday(snapshot, now);
  const day = dayNumber(snapshot, now);
  const chest = activeChest(snapshot);
  const shields = availableShields(snapshot);
  const t = today(snapshot, now);
  const streakStartDate = snapshot.openStreak
    ? localDate(new Date(snapshot.openStreak.startedAt), snapshot.profile.timezone)
    : null;
  const paused = started && !held && isPaused(lastCheckin(snapshot), t, streakStartDate);

  // App badge: one pending check-in.
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (started && !held) void nav.setAppBadge?.(1).catch(() => undefined);
    else void nav.clearAppBadge?.().catch(() => undefined);
  }, [started, held]);

  useEffect(() => () => void (offerTimer.current && clearTimeout(offerTimer.current)), []);

  const checkIn = async () => {
    const result = await run(() => store.checkIn());
    if (!result) return;
    hud(result.queued ? `Day ${day} held. It'll sync when you're back.` : `Day ${day} held.`, <Check size={18} weight="bold" />);
    setAfterReset(null);
    if (publicEnv.NEXT_PUBLIC_WAR_CHEST_MODE === "off" || result.queued) return;
    // After the HUD settles, offer the War Chest once — only if the server says it's eligible.
    offerTimer.current = setTimeout(async () => {
      try {
        if (await store.warChestOfferEligible()) {
          await store.markWarChestOffered();
          await store.logEvent("war_chest_offer_shown");
          setOfferOpen(true);
        }
      } catch {
        // Never block the person over an optional offer.
      }
    }, 2600);
  };

  if (!snapshot.goal) return <ChallengeComplete snapshot={snapshot} />;

  return (
    <main>
      <LargeTitle
        title="Today"
        trailing={
          <Link href="/app/me" aria-label="Me" className="pressable glass flex size-11 items-center justify-center rounded-full">
            <Pebble seed={snapshot.profile.avatarSeed} size={30} />
          </Link>
        }
      />
      {!online && <OfflineBanner />}
      <div className="space-y-4 px-4">
        <TideCard snapshot={snapshot} now={now} still={Boolean(afterReset)} />

        {!started ? (
          <p className="rounded-btn bg-tide-wash px-4 py-3.5 text-center text-headline text-tide">
            Your clock starts {snapshot.openStreak ? formatInstantShort(new Date(snapshot.openStreak.startedAt), snapshot.profile.timezone) : "soon"}.
          </p>
        ) : held ? (
          <div className="flex h-[50px] items-center justify-center gap-2 rounded-btn bg-tide-wash text-headline text-tide" role="status">
            <Check size={20} weight="bold" aria-hidden />
            Day {day} held.
          </div>
        ) : (
          <Button full busy={busy} onClick={checkIn} icon={<SealCheck size={22} weight="bold" aria-hidden />}>
            I held today
          </Button>
        )}

        {afterReset && <AfterReset outcome={afterReset} snapshot={snapshot} />}

        <MorningLine snapshot={snapshot} />

        {paused && (
          <InsetGroup>
            <Cell title="Check in to show on your pact's board again." chevron={false} />
          </InsetGroup>
        )}

        <InsetGroup>
          <Cell
            icon={<SealCheck size={18} aria-hidden />}
            title="Pact"
            subtitle={snapshot.mode === "device" ? "Friends who see your streak" : "See how your friends are doing"}
            href="/app/pact"
          />
          <Cell
            icon={<ShieldCheck size={18} aria-hidden />}
            title="Streak shields"
            value={<span className="num">{shields}</span>}
            onClick={() => setShieldOpen(true)}
          />
          {chest && (
            <Cell
              icon={<Lock size={18} aria-hidden />}
              title="War Chest"
              value={`${formatMoney(chestRemaining(snapshot), chest.currency)} ${chest.mode === "promise" ? "promised" : "still yours"}`}
              href="/app/war-chest"
            />
          )}
        </InsetGroup>

        <InstallCell />

        <div className="flex justify-center pt-2">
          <Button
            variant="plain"
            onClick={() => setResetOpen(true)}
            className="text-subhead !text-label-2"
            icon={<ArrowCounterClockwise size={16} aria-hidden />}
          >
            Reset streak
          </Button>
        </div>
      </div>

      <ResetSheet open={resetOpen} onOpenChange={setResetOpen} snapshot={snapshot} onReset={setAfterReset} />
      <ShieldSheet open={shieldOpen} onOpenChange={setShieldOpen} snapshot={snapshot} />
      <WarChestOfferSheet open={offerOpen} onOpenChange={setOfferOpen} snapshot={snapshot} />
    </main>
  );
}

/** W9: the end moment. Tide full, brass ring, then the next step. */
function ChallengeComplete({ snapshot }: { snapshot: Snapshot }) {
  const { store } = useWillWar();
  const { run, busy } = useAction();
  const t = today(snapshot);
  return (
    <main className="px-4 pt-[calc(env(safe-area-inset-top)+48px)]">
      <div className="relative overflow-hidden rounded-sheet bg-linear-to-b from-tide to-tide-deep p-8 text-center text-white ring-2 ring-brass">
        <Trophy size={44} weight="fill" className="mx-auto text-brass" aria-hidden />
        <h1 className="mt-4 text-large-title font-bold">Challenge complete.</h1>
        <p className="mt-2 text-body text-white/85">You held the line. Your record stays, whatever you do next.</p>
      </div>
      <div className="mt-6 grid gap-2">
        <Button
          full
          busy={busy}
          onClick={() => run(() => store.startGoal({ seasonId: null, endsOn: addDays(t, 29) }), { success: "Your clock is running." })}
        >
          Start another 30 days
        </Button>
        <Link href="/app/me" className="pressable flex min-h-11 items-center justify-center text-headline text-tide">
          Not now
        </Link>
      </div>
    </main>
  );
}
