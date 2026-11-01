"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Controls";
import { Cell, InsetGroup } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { useHud } from "@/components/ui/Hud";
import { RESET_TAG_LABELS, RESET_TAGS, type ResetTag } from "@/lib/domain/constants";
import { bestStreakMs, forfeitFor, formatMoney, remainingMinor, shieldableDays } from "@/lib/domain/rules";
import type { Snapshot } from "@/lib/domain/types";
import { activeChest, availableShields, causeFor, returnDate, today } from "@/lib/store/snapshot";
import { useAction } from "@/lib/store/use-action";
import { useWillWar } from "@/lib/store/provider";
import { formatLongDay, formatShortDay, MS_DAY } from "@/lib/time";

export interface ResetOutcome {
  forfeitMinor: number;
  bestDays: number;
}

/** R1: "Reset your streak?" — calm, no shame; the best streak stays on the record. */
export function ResetSheet({
  open,
  onOpenChange,
  snapshot,
  onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshot: Snapshot;
  onReset: (o: ResetOutcome) => void;
}) {
  const { store } = useWillWar();
  const { run, busy } = useAction();
  const [tags, setTags] = useState<ResetTag[]>([]);
  const bestDays = Math.floor(bestStreakMs(snapshot.streaks, new Date()) / MS_DAY);
  const chest = activeChest(snapshot);
  const cause = causeFor(chest?.causeId);
  const forfeit = chest && chest.status === "active" ? forfeitFor(chest) : 0;
  const after = chest ? remainingMinor(chest) - forfeit : 0;

  const toggle = (t: ResetTag) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const confirm = async () => {
    const result = await run(() => store.logReset(tags), { success: "Streak reset. Day 1 starts now." });
    if (result) {
      setTags([]);
      onOpenChange(false);
      onReset({ forfeitMinor: result.forfeitMinor, bestDays });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reset your streak?"
      description={
        bestDays > 0
          ? `Your best streak (${bestDays} ${bestDays === 1 ? "day" : "days"}) stays on your record. Your pact sees a new count, never the reason.`
          : "Your pact sees a new count, never the reason."
      }
    >
      {chest && forfeit > 0 && cause && (
        <p className="mb-4 text-body">
          {chest.forfeitRule === "strict" || after <= 0
            ? `Your ${formatMoney(forfeit, chest.currency)} goes to ${cause.name}.`
            : `${formatMoney(forfeit, chest.currency)} goes to ${cause.name}. ${formatMoney(after, chest.currency)} is still yours if you keep going.`}
        </p>
      )}
      <p className="mb-2 text-footnote text-label-2">What was going on? Optional, and only you see it.</p>
      <div className="flex flex-wrap gap-2">
        {RESET_TAGS.map((t) => (
          <Chip key={t} selected={tags.includes(t)} onClick={() => toggle(t)}>
            {RESET_TAG_LABELS[t]}
          </Chip>
        ))}
      </div>
      <div className="mt-6 grid gap-2">
        <Button variant="destructive" full busy={busy} onClick={confirm}>
          Reset streak
        </Button>
        <Button variant="plain" full onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}

/** R2 + W8: shown on Today right after a reset. */
export function AfterReset({ outcome, snapshot }: { outcome: ResetOutcome; snapshot: Snapshot }) {
  const [picked, setPicked] = useState<string | null>(null);
  const chest = activeChest(snapshot);
  const cause = causeFor(chest?.causeId);
  const back = returnDate(snapshot);
  const ideas = ["Phone out of the bedroom", "Ride it out earlier", "Tell your ally"];
  return (
    <div className="rounded-sheet bg-surface p-6">
      <h2 className="text-title-2 font-bold">Day 1 starts now.</h2>
      <p className="mt-2 text-body text-label-2">
        {outcome.bestDays > 0
          ? `One reset doesn't erase ${outcome.bestDays} ${outcome.bestDays === 1 ? "day" : "days"}. Pick one thing to change tonight.`
          : "Pick one thing to change tonight."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ideas.map((i) => (
          <Chip key={i} selected={picked === i} onClick={() => setPicked(i)}>
            {i}
          </Chip>
        ))}
      </div>
      {chest && cause && outcome.forfeitMinor > 0 && (
        <div className="mt-5 border-t-[0.5px] border-separator pt-4 text-body">
          {chest.mode === "promise" ? (
            <>
              <p>
                You promised {formatMoney(outcome.forfeitMinor, chest.currency)} to {cause.name} for this reset.
              </p>
              <a href={cause.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center text-tide">
                Donate now
              </a>
            </>
          ) : remainingMinor(chest) > 0 && back ? (
            <p>
              {formatMoney(remainingMinor(chest), chest.currency)} is still yours. Keep going and it comes back on{" "}
              {formatShortDay(back)}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Use a shield for a missed day in the last three days. Never covers a reset. */
export function ShieldSheet({
  open,
  onOpenChange,
  snapshot,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshot: Snapshot;
}) {
  const { store } = useWillWar();
  const { run, busy } = useAction();
  const hud = useHud();
  const count = availableShields(snapshot);
  const days = shieldableDays(today(snapshot), snapshot.openStreak, snapshot.checkins, snapshot.profile.timezone);

  const use = async (d: string) => {
    const ok = await run(() => store.useShield(d).then(() => true));
    if (ok) {
      hud(`Shield used for ${formatShortDay(d)}.`, <ShieldCheck size={18} weight="fill" />);
      onOpenChange(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Streak shields"
      description="A shield covers a missed check-in from the last three days, inside an unbroken streak. It never covers a reset."
    >
      <p className="mb-4 text-headline">
        {count === 0 ? "You have no shields right now." : `You have ${count} ${count === 1 ? "shield" : "shields"}.`}
      </p>
      {count > 0 && days.length > 0 && (
        <InsetGroup header="Missed days you can cover">
          {days.map((d) => (
            <Cell key={d} title={formatLongDay(d)} trailing={<span className="text-tide">{busy ? "…" : "Use a shield"}</span>} chevron={false} onClick={() => use(d)} />
          ))}
        </InsetGroup>
      )}
      {count > 0 && days.length === 0 && <p className="text-body text-label-2">No missed days to cover. Nice.</p>}
      {count === 0 && (
        <p className="text-body text-label-2">
          Earn one after a Ride it out game, or get two a month with{" "}
          <Link href="/app/pro" className="text-tide">
            Pro
          </Link>
          .
        </p>
      )}
    </Sheet>
  );
}

/** W1: the War Chest offer. Shown once ever, only from the first-held-day trigger. */
export function WarChestOfferSheet({
  open,
  onOpenChange,
  snapshot,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshot: Snapshot;
}) {
  const end = snapshot.goal ? formatLongDay(snapshot.goal.endsOn) : "the end";
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Back your pledge?"
      description={`Put an amount behind it. Each reset sends a quarter to a cause you pick. Make it to ${end} and whatever's left comes back to you.`}
    >
      <p className="text-headline text-tide">WillWar never keeps any of it.</p>
      <div className="mt-6 grid gap-2">
        <Link href="/app/war-chest" className="pressable flex h-[50px] items-center justify-center rounded-btn bg-tide text-headline font-semibold text-on-tide">
          Set up my War Chest
        </Link>
        <Button variant="secondary" full onClick={() => onOpenChange(false)}>
          Not now
        </Button>
      </div>
      <p className="mt-4 text-footnote text-label-2">We&apos;ll only ask once. You&apos;ll find it in Me if you change your mind.</p>
    </Sheet>
  );
}
