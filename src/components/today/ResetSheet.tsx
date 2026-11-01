"use client";
import { useState } from "react";
import { useApp, useNow } from "@/components/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { RESET_TAGS, type ResetTag } from "@/lib/store/types";
import { CAUSES, formatMoney } from "@/lib/config/causes";
import { forfeitFor } from "@/lib/store/engine";

const SUGGESTIONS = ["Phone out of the bedroom", "Go a round earlier", "Tell your camp"];

/** X1 confirm + X2 "Down isn't out." Reset is never red. */
export function ResetSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { snap, store, refresh, toast } = useApp();
  const [tags, setTags] = useState<ResetTag[]>([]);
  const [after, setAfter] = useState<{ bestDays: number; forfeit: number } | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const now = useNow(60_000);
  if (!snap || !now) return null;
  const nowMs = now.getTime();

  const open_ = snap.streaks.find((s) => !s.endedAt);
  const curDays = open_ ? Math.floor((nowMs - new Date(open_.startedAt).getTime()) / 86400_000) : 0;
  const bestDays = Math.max(curDays, ...snap.streaks.map((s) => Math.floor(((s.endedAt ? new Date(s.endedAt).getTime() : nowMs) - new Date(s.startedAt).getTime()) / 86400_000)));
  const chest = snap.warChest?.status === "active" ? snap.warChest : null;
  const cause = chest ? CAUSES.find((c) => c.id === chest.causeId)?.name ?? "your cause" : "";
  const nextForfeit = chest ? forfeitFor(chest) : 0;

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setTimeout(() => {
        setAfter(null);
        setTags([]);
        setPick(null);
      }, 200);
    }
  };

  const doReset = async () => {
    setBusy(true);
    try {
      const forfeit = await store.logReset(tags);
      setAfter({ bestDays, forfeit });
      toast("Down isn't out. Day 1 starts now.");
      await refresh();
    } catch {
      toast("Couldn't reset. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (after)
    return (
      <Sheet open={open} onOpenChange={close} title="DOWN ISN'T OUT." description="Day 1 starts now." detent="large">
        <div className="rounded-card bg-bg p-5">
          <p className="text-[17px] leading-[22px]">
            One reset doesn&apos;t erase {after.bestDays} {after.bestDays === 1 ? "day" : "days"}. Pick one thing to change tonight.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Chip key={s} selected={pick === s} onClick={() => setPick(s)}>{s}</Chip>
            ))}
          </div>
        </div>
        {chest && after.forfeit > 0 && (
          <p className="mt-4 text-[15px] leading-5 text-text-2">
            {chest.mode === "promise"
              ? `You promised ${formatMoney(after.forfeit, chest.currency)} to ${cause} for this reset.`
              : `${formatMoney(after.forfeit, chest.currency)} goes to ${cause}.`}{" "}
            {chest.amountMinor - chest.forfeitedMinor - after.forfeit > 0 &&
              `${formatMoney(chest.amountMinor - chest.forfeitedMinor - after.forfeit, chest.currency)} is still yours if you keep going.`}
          </p>
        )}
        <Button className="mt-6" onClick={() => close(false)}>Back to Today</Button>
      </Sheet>
    );

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title="RESET YOUR STREAK?"
      description={`Your best streak (${bestDays} ${bestDays === 1 ? "day" : "days"}) and your tally stay on the wall. Your camp sees a new count, never the reason.`}
      detent="large"
    >
      {chest && nextForfeit > 0 && (
        <p className="mb-5 rounded-card bg-bg p-4 text-[15px] leading-5">
          {chest.forfeitRule === "strict"
            ? `Your ${formatMoney(nextForfeit, chest.currency)} goes to ${cause}.`
            : `${formatMoney(nextForfeit, chest.currency)} goes to ${cause}. ${formatMoney(chest.amountMinor - chest.forfeitedMinor - nextForfeit, chest.currency)} is still yours if you keep going.`}
        </p>
      )}
      <h3 className="text-[13px] leading-[18px] text-text-2">What was going on?</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {RESET_TAGS.map((t) => {
          const on = tags.includes(t.key);
          return (
            <Chip key={t.key} selected={on} onClick={() => setTags(on ? tags.filter((x) => x !== t.key) : [...tags, t.key])}>
              {t.label}
            </Chip>
          );
        })}
      </div>
      <p className="mt-2 text-[13px] leading-[18px] text-text-3">Optional. Only you see this.</p>
      <div className="mt-6 space-y-2">
        <Button variant="secondary" onClick={doReset} disabled={busy}>Reset streak</Button>
        <Button variant="plain" className="w-full" onClick={() => close(false)}>Cancel</Button>
      </div>
    </Sheet>
  );
}
