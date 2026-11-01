"use client";

import { ArrowCounterClockwise, ChartLineDown, GearSix, Lock, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Gate } from "@/components/app/Gate";
import { CircleButton, LargeTitle } from "@/components/app/AppChrome";
import { ResetSheet, ShieldSheet } from "@/components/today/Sheets";
import { Cell, InsetGroup } from "@/components/ui/List";
import { Pebble } from "@/components/ui/Pebble";
import { publicEnv } from "@/env";
import { CURRENT_SEASON, RESET_TAG_LABELS, type ResetTag } from "@/lib/domain/constants";
import { averageDrop, bestStreakMs, formatMoney } from "@/lib/domain/rules";
import type { Snapshot } from "@/lib/domain/types";
import { useNow, useWillWar } from "@/lib/store/provider";
import { activeChest, availableShields, chestRemaining, dayNumber, returnDate, streakStart, today, wavesRidden } from "@/lib/store/snapshot";
import { addDays, diffDays, formatDaysHours, formatShortDay, localDate, localHour, MS_DAY, parseLocalDate } from "@/lib/time";

export function MeScreen() {
  return <Gate>{(s) => <Me snapshot={s} />}</Gate>;
}

function Me({ snapshot }: { snapshot: Snapshot }) {
  const now = useNow(60_000);
  const { isPro } = useWillWar();
  const [resetOpen, setResetOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);
  const start = streakStart(snapshot);
  const current = start && start <= now ? now.getTime() - start.getTime() : 0;
  const best = bestStreakMs(snapshot.streaks, now);
  const drop = averageDrop(snapshot.urgeSessions);
  const chest = activeChest(snapshot);
  const since = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(snapshot.profile.createdAt));
  const closed = snapshot.streaks.filter((s) => s.endedAt);

  return (
    <main>
      <LargeTitle
        title="Me"
        trailing={
          <CircleButton href="/app/settings" label="Settings">
            <GearSix size={22} aria-hidden />
          </CircleButton>
        }
      />
      <div className="space-y-6 px-4">
        <section className="flex items-center gap-4 rounded-sheet bg-surface p-5">
          <Pebble seed={snapshot.profile.avatarSeed} size={56} label="Your pebble" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-title-2 font-bold">@{snapshot.profile.handle}</p>
            <p className="text-subhead text-label-2">
              Member since {since}
              {snapshot.mode === "device" ? ". Saved on this device." : snapshot.email ? "" : ""}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3" aria-label="Stats">
          <Stat value={formatDaysHours(current)} label="Current streak" />
          <Stat value={formatDaysHours(best)} label="Best streak" brass={best > 0 && best === current && current > 7 * MS_DAY} />
          <Stat value={String(wavesRidden(snapshot))} label="Waves ridden" />
          <Stat
            value={drop === null ? "—" : drop > 0 ? `−${drop}` : String(drop)}
            label={drop === null ? "Average drop, after 3 games" : "Average drop after a game"}
            icon={<ChartLineDown size={16} aria-hidden />}
          />
        </section>

        <ChallengeCalendar snapshot={snapshot} now={now} />

        <TriggerInsights snapshot={snapshot} isPro={isPro} />

        <InsetGroup header="Your instruments">
          {chest ? (
            <Cell
              icon={<Lock size={18} aria-hidden />}
              title={`War Chest · ${formatMoney(chestRemaining(snapshot), chest.currency)} ${chest.mode === "promise" ? "promised" : "still yours"}`}
              subtitle={returnDate(snapshot) ? `Comes back on ${formatShortDay(returnDate(snapshot) as string)}` : undefined}
              href="/app/war-chest"
            />
          ) : (
            publicEnv.NEXT_PUBLIC_WAR_CHEST_MODE !== "off" &&
            snapshot.goal && <Cell icon={<Lock size={18} aria-hidden />} title="Back your pledge" subtitle="Optional. A promise with something on it." href="/app/war-chest" />
          )}
          <Cell
            icon={<ShieldCheck size={18} aria-hidden />}
            title="Streak shields"
            subtitle="Covers one missed check-in"
            value={<span className="num">{availableShields(snapshot)}</span>}
            onClick={() => setShieldOpen(true)}
          />
          <Cell icon={<ArrowCounterClockwise size={18} aria-hidden />} title="Reset streak" subtitle="Your best stays on your record" onClick={() => setResetOpen(true)} />
        </InsetGroup>

        {closed.length > 0 && (
          <InsetGroup header="History">
            {closed.slice(0, 10).map((s) => {
              const days = Math.floor((new Date(s.endedAt as string).getTime() - new Date(s.startedAt).getTime()) / MS_DAY);
              return (
                <Cell
                  key={s.id}
                  title={`${days} ${days === 1 ? "day" : "days"}`}
                  subtitle={`Ended ${formatShortDay(localDate(new Date(s.endedAt as string), snapshot.profile.timezone))}`}
                  chevron={false}
                />
              );
            })}
          </InsetGroup>
        )}
        <p className="px-4 pb-4 text-center text-footnote text-label-2">Tides go in and out. Your record stays.</p>
      </div>
      <ResetSheet open={resetOpen} onOpenChange={setResetOpen} snapshot={snapshot} onReset={() => undefined} />
      <ShieldSheet open={shieldOpen} onOpenChange={setShieldOpen} snapshot={snapshot} />
    </main>
  );
}

function Stat({ value, label, icon, brass }: { value: string; label: string; icon?: React.ReactNode; brass?: boolean }) {
  return (
    <div className="rounded-card bg-surface p-4">
      <p className={`num text-[1.75rem] leading-tight font-semibold ${brass ? "text-brass-ink" : "text-label"}`}>{value}</p>
      <p className="mt-1 flex items-center gap-1 text-footnote text-label-2">
        {icon}
        {label}
      </p>
    </div>
  );
}

/** The challenge window as a calendar: held = Tide, shielded = outline, reset = neutral dot. Never red. */
function ChallengeCalendar({ snapshot, now }: { snapshot: Snapshot; now: Date }) {
  if (!snapshot.goal) return null;
  const tz = snapshot.profile.timezone;
  const first =
    snapshot.goal.seasonId === CURRENT_SEASON.id
      ? CURRENT_SEASON.startsOn
      : localDate(new Date(snapshot.streaks[snapshot.streaks.length - 1]?.startedAt ?? snapshot.goal.createdAt), tz);
  const last = snapshot.goal.endsOn;
  const total = Math.min(62, diffDays(first, last) + 1);
  const t = today(snapshot, now);
  const status = new Map(snapshot.checkins.map((c) => [c.localDate, c.status]));
  const { y, m, d } = parseLocalDate(first);
  const lead = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Monday first
  const title =
    snapshot.goal.seasonId === CURRENT_SEASON.id
      ? CURRENT_SEASON.name
      : `${formatShortDay(first)} to ${formatShortDay(last)}`;

  return (
    <section className="rounded-sheet bg-surface p-5" aria-label="Your challenge calendar">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-headline">{title}</h2>
        <span className="rounded-full bg-tide-wash px-2.5 py-1 text-footnote font-semibold text-tide">
          Day {Math.max(0, dayNumber(snapshot, now))}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-footnote text-label-2" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <ol className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, i) => (
          <li key={`pad-${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const date = addDays(first, i);
          const s = status.get(date);
          const isToday = date === t;
          const future = date > t;
          const label = `${formatShortDay(date)}: ${s === "held" ? "held" : s === "shielded" ? "shielded" : s === "reset" ? "reset" : future ? "ahead" : "no check-in"}`;
          return (
            <li
              key={date}
              aria-label={label}
              className={`num relative flex aspect-square items-center justify-center rounded-full text-footnote ${
                s === "held"
                  ? "bg-tide text-on-tide"
                  : s === "shielded"
                    ? "text-tide ring-2 ring-tide ring-inset"
                    : future
                      ? "text-label-3"
                      : "text-label-2"
              } ${isToday && s !== "held" ? "ring-2 ring-label-2 ring-inset" : ""}`}
            >
              {parseLocalDate(date).d}
              {s === "reset" && <span className="absolute bottom-1 size-1 rounded-full bg-label-2" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex gap-4 text-footnote text-label-2" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-tide" />Held</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-tide ring-inset" />Shielded</span>
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-label-2" />Reset</span>
      </div>
    </section>
  );
}

/** Trigger insights (Pro): what tends to be going on, from your own tags. Only you see this. */
function TriggerInsights({ snapshot, isPro }: { snapshot: Snapshot; isPro: boolean }) {
  if (!isPro) {
    return (
      <Link href="/app/pro" className="pressable flex items-center gap-3 rounded-sheet bg-surface p-5">
        <Sparkle size={22} className="text-tide" aria-hidden />
        <div className="flex-1">
          <p className="text-headline">Trigger insights</p>
          <p className="text-subhead text-label-2">See what sets you off. Pro</p>
        </div>
        <Lock size={18} className="text-label-3" aria-hidden />
      </Link>
    );
  }
  const tagged = snapshot.resets.filter((r) => r.tags.length > 0);
  if (snapshot.resets.length < 2) {
    return (
      <section className="rounded-sheet bg-surface p-5">
        <p className="text-headline">Trigger insights</p>
        <p className="mt-1 text-subhead text-label-2">Patterns appear after a couple of resets. Until then, keep riding it out.</p>
      </section>
    );
  }
  const counts = new Map<ResetTag, number>();
  for (const r of tagged) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const hours = snapshot.resets.map((r) => localHour(new Date(r.occurredAt), snapshot.profile.timezone));
  const buckets = { "late at night": 0, "in the evening": 0, "in the afternoon": 0, "in the morning": 0 };
  for (const h of hours) {
    if (h >= 22 || h < 4) buckets["late at night"]++;
    else if (h >= 17) buckets["in the evening"]++;
    else if (h >= 12) buckets["in the afternoon"]++;
    else buckets["in the morning"]++;
  }
  const when = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];
  return (
    <section className="rounded-sheet bg-surface p-5">
      <p className="text-headline">Trigger insights</p>
      <p className="mt-1 text-body">Most of your resets happen {when}.</p>
      {top.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {top.map(([tag, n]) => (
            <li key={tag} className="flex items-center gap-3">
              <span className="w-28 text-subhead">{RESET_TAG_LABELS[tag]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-tertiary">
                <span className="block h-full rounded-full bg-tide" style={{ width: `${(n / tagged.length) * 100}%` }} />
              </span>
              <span className="num w-6 text-right text-subhead text-label-2">{n}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-footnote text-label-2">Only you see this.</p>
    </section>
  );
}
