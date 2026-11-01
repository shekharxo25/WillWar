"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Vault } from "@phosphor-icons/react";
import { useApp, useNow } from "@/components/AppProvider";
import { Screen } from "@/components/ui/Screen";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Cell, CellGroup } from "@/components/ui/Cell";
import { LockerPlate } from "@/components/ui/LockerPlate";
import { Clock } from "@/components/clock/Clock";
import { Tally } from "@/components/clock/Tally";
import { CornerTalk } from "@/components/corner/CornerTalk";
import { ResetSheet } from "./ResetSheet";
import { ShieldSheet } from "./ShieldSheet";
import { WarChestOffer } from "@/components/war-chest/WarChestOffer";
import { todayView } from "@/lib/store/derive";
import { SEASON } from "@/lib/config/season";
import { warChestMode } from "@/lib/config/flags";
import { formatMoney, CAUSES } from "@/lib/config/causes";
import { addDays, milestoneAt, shortDate, weekday } from "@/lib/time";
import { setBadge, persistStorage } from "@/lib/pwa";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { StoreError } from "@/lib/store/types";

export function Today() {
  const { snap, store, refresh, toast, loading } = useApp();
  const now = useNow(1000);
  const reduced = useReducedMotion();
  const [resetOpen, setResetOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [justHeld, setJustHeld] = useState(false);
  const [animateFrom, setAnimateFrom] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [campLine, setCampLine] = useState<string | null>(null);
  const stampedToday = useRef(false);

  const v = snap && now ? todayView(snap, now) : null;

  useEffect(() => {
    if (v) setBadge(!v.checkedIn && !v.preseason);
  }, [v?.checkedIn, v?.preseason]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => persistStorage(), []);

  // Camp summary row: "Camp: 3 of 4 checked in"
  useEffect(() => {
    if (!snap) return;
    let alive = true;
    (async () => {
      try {
        const camps = await store.listCamps();
        if (!camps.length) return alive && setCampLine(null);
        const rows = await store.campLeaderboard(camps[0].id);
        const t = v?.today;
        const done = rows.filter((r) => r.lastCheckin === t).length;
        if (alive) setCampLine(`${camps[0].name}: ${done} of ${rows.length} checked in`);
      } catch {
        if (alive) setCampLine(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [snap, store, v?.today]);

  if (loading || !snap) return <TodaySkeleton />;

  const checkIn = async () => {
    if (!v) return;
    setBusy(true);
    try {
      await store.checkIn();
      const strokes = v.strokes + 1;
      setAnimateFrom(strokes);
      setJustHeld(true);
      toast(`Day ${v.day} held.`);
      if (milestoneAt(strokes) && !stampedToday.current) stampedToday.current = true;
      await refresh();
      // The one-time War Chest offer, only after the first held day toast and only if eligible.
      if (warChestMode() !== "off") {
        setTimeout(async () => {
          try {
            if (await store.warChestOfferEligible()) {
              await store.markWarChestOffered();
              setOfferOpen(true);
            }
          } catch {}
        }, 2600);
      }
    } catch (e) {
      toast(e instanceof StoreError && e.code === "no_open_streak" ? "Your clock hasn't started yet." : "Couldn't check in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const chest = snap.warChest && snap.warChest.status === "active" ? snap.warChest : null;
  const cause = chest ? CAUSES.find((c) => c.id === chest.causeId) : null;
  const pastGoal = v?.goalOver;
  const beltName = snap.goal?.seasonId ? SEASON.name.replace(" 2026", "") : "30 days";

  return (
    <Screen
      title="TODAY"
      trailing={
        <Link href="/app/me" aria-label="Me" className="press flex h-11 w-11 items-center justify-center">
          <LockerPlate seed={snap.profile.avatarSeed} />
        </Link>
      }
    >
      <div style={{ viewTransitionName: "clock" }}>
        <Clock
          start={v?.streakStart ?? null}
          now={now}
          day={v?.day ?? 1}
          goalDays={v?.goalDays ?? 30}
          endsOn={v?.endsOn ?? null}
          checkedIn={!!v?.checkedIn}
          preseason={!!v?.preseason}
        />
      </div>
      <Tally strokes={v?.strokes ?? 0} seed={snap.profile.avatarSeed} animateFrom={animateFrom} reducedMotion={reduced} beltName={beltName} className="mt-4" />

      {v?.paused && !v.checkedIn && <p className="mt-3 text-[15px] leading-5 text-text-2">Check in to show on your camp&apos;s board again.</p>}

      <div className="mt-6">
        {v?.preseason ? (
          <p className="rounded-card bg-raised p-4 text-[15px] leading-5 text-text-2">Your clock starts {shortDate(SEASON.startsOn)} at midnight. Check-ins open then.</p>
        ) : pastGoal ? (
          <ButtonLink href="/app/settings#challenge">Start another 30 days</ButtonLink>
        ) : (
          <Button onClick={checkIn} disabled={busy || !!v?.checkedIn}>
            {v?.checkedIn ? (justHeld ? `Day ${v.day} held.` : "Held today") : "I held today"}
          </Button>
        )}
      </div>

      <div className="mt-6">
        {v && <CornerTalk
          day={v.day}
          goalDays={v.goalDays}
          seasonName={snap.goal?.seasonId ? SEASON.name : null}
          tone={snap.profile.tone}
          why={snap.profile.whyTags}
          checkins7={snap.checkins.filter((c) => c.status !== "reset" && c.localDate > addDays(v.today, -7)).length}
          rounds7={snap.urgeSessions.filter((u) => u.completed && (now?.getTime() ?? 0) - new Date(u.startedAt).getTime() < 7 * 86400_000).length}
          weekday={now ? weekday(now, snap.profile.timezone) : "Today"}
        />}
      </div>

      <CellGroup>
        {campLine ? <Cell title={campLine} href="/app/camp" /> : <Cell title="Start a camp" subtitle="A few friends who see each other's streaks" href="/app/camp" />}
        {chest && cause && (
          <Cell
            icon={<Vault size={22} weight="bold" />}
            title={`War Chest: ${formatMoney(chest.amountMinor - chest.forfeitedMinor, chest.currency)} still yours`}
            href="/app/war-chest"
          />
        )}
        {v && v.missedDays.length > 0 && v.shieldsLeft > 0 && (
          <Cell title={`Use a shield for ${shortDate(v.missedDays[0])}`} subtitle={`${v.shieldsLeft} left`} onClick={() => setShieldOpen(true)} />
        )}
        <Cell title="Reset streak" onClick={() => setResetOpen(true)} />
      </CellGroup>

      <ResetSheet open={resetOpen} onOpenChange={setResetOpen} />
      {v && <ShieldSheet open={shieldOpen} onOpenChange={setShieldOpen} days={v.missedDays} />}
      <WarChestOffer open={offerOpen} onOpenChange={setOfferOpen} />
    </Screen>
  );
}

function TodaySkeleton() {
  return (
    <div className="pt-safe px-4">
      <div className="h-11" />
      <div className="skeleton h-10 w-40" />
      <div className="skeleton mt-6 h-14 w-48" />
      <div className="mt-3 h-[104px] rounded-housing bg-housing" />
      <div className="skeleton mt-4 h-8 w-64" />
      <div className="skeleton mt-6 h-[52px] w-full" />
    </div>
  );
}
