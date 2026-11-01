"use client";
import Link from "next/link";
import { GearSix, LockSimple, ShieldCheck, Vault } from "@phosphor-icons/react";
import { useApp, useNow } from "@/components/AppProvider";
import { Screen } from "@/components/ui/Screen";
import { Cell, CellGroup } from "@/components/ui/Cell";
import { LockerPlate } from "@/components/ui/LockerPlate";
import { AdSlot } from "@/components/ads/AdSlot";
import { averageDrop, roundsLasted, todayView, triggerCounts } from "@/lib/store/derive";
import { RESET_TAGS } from "@/lib/store/types";
import { CAUSES, formatMoney } from "@/lib/config/causes";
import { warChestMode } from "@/lib/config/flags";
import { addDays, shortDate } from "@/lib/time";

export function Me() {
  const { snap, store, refresh, toast } = useApp();
  const now = useNow(60_000);
  if (!snap || !now) return <Screen title="ME"><div className="skeleton h-40 w-full" /></Screen>;
  const v = todayView(snap, now);
  const open = snap.streaks.find((s) => !s.endedAt);
  const curDays = open && !v.preseason ? Math.floor((now.getTime() - new Date(open.startedAt).getTime()) / 86400_000) : 0;
  const drop = averageDrop(snap);
  const chest = snap.warChest && snap.warChest.status === "active" ? snap.warChest : null;
  const triggers = triggerCounts(snap);

  return (
    <Screen
      title="ME"
      trailing={<Link href="/app/settings" aria-label="Settings" className="press flex h-11 w-11 items-center justify-center"><GearSix size={24} weight="bold" /></Link>}
    >
      <div className="flex items-center gap-3">
        <LockerPlate seed={snap.profile.avatarSeed} size={52} />
        <div>
          <div className="text-[17px] leading-[22px] font-semibold">{snap.profile.handle}</div>
          <div className="text-[13px] leading-[18px] text-text-2">{v.pro ? "Pro" : "Free"}{store.mode === "device" ? ", saved on this phone" : ""}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Stat value={`${curDays}`} unit="d" label="Current streak" />
        <Stat value={`${Math.floor(v.bestS / 86400)}`} unit="d" label="Best streak" />
        <Stat value={`${roundsLasted(snap)}`} label="Rounds lasted" />
        <Stat value={drop === null ? "–" : drop.toFixed(1)} label="Average drop after a round" />
      </div>

      <Calendar snap={snap} today={v.today} />

      <CellGroup header="Trigger insights">
        {v.pro ? (
          triggers.length ? (
            triggers.map((t) => <Cell key={t.tag} title={RESET_TAGS.find((x) => x.key === t.tag)?.label ?? t.tag} value={`${t.count}`} />)
          ) : (
            <Cell title="No patterns yet" subtitle="Tags you add on a reset show up here. Only you see them." />
          )
        ) : (
          <Cell icon={<LockSimple size={20} weight="bold" />} title="See what sets you off" subtitle="Pro shows which moments lead to a reset." href="/app/pro" />
        )}
      </CellGroup>

      <CellGroup header="Streak history">
        {[...snap.streaks].reverse().slice(0, 8).map((s) => {
          const end = s.endedAt ? new Date(s.endedAt) : now;
          const days = Math.max(0, Math.floor((end.getTime() - new Date(s.startedAt).getTime()) / 86400_000));
          return <Cell key={s.id} title={`${days} ${days === 1 ? "day" : "days"}`} subtitle={`${shortDate(s.startedAt.slice(0, 10))}${s.endedAt ? ` to ${shortDate(s.endedAt.slice(0, 10))}` : ", running"}`} />;
        })}
      </CellGroup>

      <CellGroup header="Shields" footer="Shields cover a day you held but didn't check in. Never a reset.">
        <Cell icon={<ShieldCheck size={20} weight="bold" />} title="Streak shields" value={`${v.shieldsLeft}`} />
        {!v.pro && (
          <div className="px-4 py-3">
            <AdSlot
              placement="rewarded_shield"
              onReward={async () => {
                try {
                  await store.grantShield("rewarded_ad");
                  await refresh();
                  toast("Shield earned.");
                } catch {
                  toast("That's the most shields for this week.");
                }
              }}
            />
          </div>
        )}
      </CellGroup>

      {warChestMode() !== "off" && (
        <CellGroup>
          {chest ? (
            <Cell icon={<Vault size={20} weight="bold" />} title="War Chest" subtitle={`${formatMoney(chest.amountMinor - chest.forfeitedMinor, chest.currency)} still yours, ${CAUSES.find((c) => c.id === chest.causeId)?.name ?? ""}`} href="/app/war-chest" />
          ) : (
            <Cell icon={<Vault size={20} weight="bold" />} title="Back your pledge" subtitle="Optional. Put an amount behind it." href="/app/war-chest" />
          )}
        </CellGroup>
      )}
    </Screen>
  );
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-card bg-raised p-4">
      <div className="flex items-baseline gap-1">
        <span className="display text-[44px] leading-[44px]">{value}</span>
        {unit && <span className="text-[13px] leading-[18px] text-text-2">{unit}</span>}
      </div>
      <div className="mt-1 text-[13px] leading-[18px] text-text-2">{label}</div>
    </div>
  );
}

/** 30-day calendar: held tape square, shielded outlined, reset small neutral dot, empty blank. Never red. */
function Calendar({ snap, today }: { snap: NonNullable<ReturnType<typeof useApp>["snap"]>; today: string }) {
  const start = snap.goal?.startDate ?? addDays(today, -29);
  const days = Array.from({ length: 30 }, (_, i) => addDays(start, i));
  const map = new Map(snap.checkins.map((c) => [c.localDate, c.status]));
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-4 text-[13px] leading-[18px] text-text-2">Last 30 days</h2>
      <div className="rounded-card bg-raised p-4">
        <div className="grid grid-cols-7 gap-2" role="list" aria-label="Calendar">
          {days.map((d) => {
            const s = map.get(d);
            const label = `${shortDate(d)}: ${s === "held" ? "held" : s === "shielded" ? "shielded" : s === "reset" ? "reset" : d > today ? "upcoming" : "no check-in"}`;
            return (
              <div key={d} role="listitem" aria-label={label} className={`flex aspect-square items-center justify-center rounded-[4px] ${d === today ? "shadow-[inset_0_0_0_1px_var(--text-3)]" : ""}`}>
                {s === "held" && <span className="h-[70%] w-[70%] rounded-[3px] bg-primary" />}
                {s === "shielded" && <span className="h-[70%] w-[70%] rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--text)]" />}
                {s === "reset" && <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-2)]" />}
                {!s && <span className="text-[11px] leading-[13px] text-text-3">{Number(d.slice(8))}</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-[18px] text-text-2">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] bg-primary" />Held</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] shadow-[inset_0_0_0_1.5px_var(--text)]" />Shielded</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--text-2)]" />Reset</span>
        </div>
      </div>
    </section>
  );
}
